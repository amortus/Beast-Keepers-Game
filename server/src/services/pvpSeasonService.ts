/**
 * PVP Season Service
 * Gerencia temporadas de PVP
 */

import { query, getClient } from '../db/connection';

export interface Season {
  id: number;
  number: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'ended';
  rewardsConfig: any;
  createdAt: Date;
  updatedAt: Date;
}

// Cache para temporada atual (evita múltiplas queries)
let cachedSeason: Season | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 30000; // 30 segundos

/**
 * Retorna temporada atual (com cache)
 */
export async function getCurrentSeason(): Promise<Season | null> {
  // Verificar cache primeiro
  const now = Date.now();
  if (cachedSeason && now < cacheExpiry) {
    return cachedSeason;
  }
  
  // Usar query() em vez de getClient() para gerenciar conexões automaticamente
  try {
    // Verificar qual coluna existe na tabela (number ou season_number)
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pvp_seasons' 
        AND column_name IN ('number', 'season_number')
    `);
    
    const hasNumber = columnCheck.rows.some((r: any) => r.column_name === 'number');
    const seasonColumn = hasNumber ? 'number' : 'season_number';
    
    const result = await query(
      `SELECT * FROM pvp_seasons 
       WHERE status = 'active' 
       ORDER BY ${seasonColumn} DESC 
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      // Criar primeira temporada se não existir
      try {
        const newSeason = await createNewSeason();
        if (newSeason) {
          cachedSeason = newSeason;
          cacheExpiry = now + CACHE_TTL;
        }
        return newSeason;
      } catch (createError: any) {
        console.error('[PVP Season] Error creating new season, using fallback:', createError);
        // Fallback: retornar temporada padrão temporária
        const fallbackSeason: Season = {
          id: 1,
          number: 1,
          name: 'Temporada 1 (Fallback)',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          status: 'active',
          rewardsConfig: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Não cachear fallback
        return fallbackSeason;
      }
    }
    
    const row = result.rows[0];
    // Mapear para interface Season (suportar ambas estruturas)
    const season: Season = {
      id: row.id || row.season_number || row.number,
      number: row.number || row.season_number || 1,
      name: row.name || `Temporada ${row.number || row.season_number || 1}`,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status || 'active',
      rewardsConfig: row.rewards_config || {},
      createdAt: row.created_at || new Date(),
      updatedAt: row.updated_at || new Date(),
    };
    
    // Atualizar cache
    cachedSeason = season;
    cacheExpiry = now + CACHE_TTL;
    
    return season;
  } catch (error: any) {
    // Verificar se é circuit breaker aberto (prioridade - banco está offline)
    const isCircuitOpen = error?.code === 'ECIRCUITOPEN' || 
                         error?.message?.includes('Circuit breaker is open');
    
    if (isCircuitOpen) {
      // Circuit breaker está aberto - usar cache ou fallback imediatamente
      console.warn('[PVP Season] Circuit breaker is open - using cached season or fallback');
      if (cachedSeason) {
        console.warn('[PVP Season] Using cached season (circuit breaker open)');
        return cachedSeason;
      }
      // Fallback imediato
      const fallbackSeason: Season = {
        id: 1,
        number: 1,
        name: 'Temporada 1 (Fallback - Circuit Breaker Open)',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        rewardsConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return fallbackSeason;
    }
    
    console.error('[PVP Season] Error getting current season:', error);
    
    // Se for erro de conexão/timeout, retornar cache ou fallback em vez de quebrar
    const isConnectionError = error?.message?.includes('timeout') || 
                              error?.message?.includes('ECONNREFUSED') || 
                              error?.message?.includes('connection') ||
                              error?.code === 'ETIMEDOUT' ||
                              error?.code === 'ECONNREFUSED';
    
    if (isConnectionError) {
      console.warn('[PVP Season] Database connection error detected, using cached season or fallback');
      // Retornar cache se disponível, mesmo que expirado
      if (cachedSeason) {
        console.warn('[PVP Season] Using cached season due to connection error');
        return cachedSeason;
      }
      // Fallback: retornar temporada padrão temporária para não quebrar o sistema
      const fallbackSeason: Season = {
        id: 1,
        number: 1,
        name: 'Temporada 1 (Fallback - DB Offline)',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        status: 'active',
        rewardsConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return fallbackSeason;
    }
    
    // Retornar cache se disponível, mesmo que expirado
    if (cachedSeason) {
      console.warn('[PVP Season] Using cached season due to error');
      return cachedSeason;
    }
    throw error;
  }
}

/**
 * Limpa o cache da temporada (útil quando uma nova temporada é criada)
 */
export function clearSeasonCache(): void {
  cachedSeason = null;
  cacheExpiry = 0;
}

/**
 * Cria nova temporada
 */
export async function createNewSeason(): Promise<Season> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pvp_seasons'
      )
    `);
    
    if (!tableExists.rows[0]?.exists) {
      throw new Error('Table pvp_seasons does not exist. Please run migrations first.');
    }
    
    // Verificar qual coluna existe na tabela (number ou season_number)
    // IMPORTANTE: Verificar TODAS as colunas da tabela para entender a estrutura real
    const allColumnsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pvp_seasons' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pvp_seasons' 
        AND table_schema = 'public'
        AND column_name IN ('number', 'season_number')
    `);
    
    const hasNumber = columnCheck.rows.some((r: any) => r.column_name === 'number');
    const hasSeasonNumber = columnCheck.rows.some((r: any) => r.column_name === 'season_number');
    
    // Log detalhado para debug
    console.log(`[PVP Season] Column check results:`, {
      hasNumber,
      hasSeasonNumber,
      foundColumns: columnCheck.rows.map((r: any) => r.column_name),
      allColumns: allColumnsCheck.rows.map((r: any) => `${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`)
    });
    
    // CRÍTICO: Se season_number existe, SEMPRE usar ele (pode ser PRIMARY KEY)
    // A migration 012 usa season_number como PRIMARY KEY e NÃO TEM coluna number
    const seasonColumn = hasSeasonNumber ? 'season_number' : (hasNumber ? 'number' : 'season_number');
    
    // Validação crítica: se season_number existe, NUNCA usar number
    if (hasSeasonNumber && hasNumber) {
      console.warn('[PVP Season] Both season_number and number exist! Using season_number (PRIMARY KEY takes precedence)');
    }
    
    // Validação adicional: se season_number existe mas não tem coluna number, garantir que não tentaremos usar number
    if (hasSeasonNumber && !hasNumber) {
      console.log('[PVP Season] Migration 012 structure detected (season_number only, no number column)');
    }
    
    console.log(`[PVP Season] Table structure - hasNumber: ${hasNumber}, hasSeasonNumber: ${hasSeasonNumber}, using column: ${seasonColumn}`);
    
    // Buscar última temporada usando a coluna correta
    let nextNumber = 1;
    try {
      // Usar COALESCE para lidar com diferentes estruturas
      let queryColumn = seasonColumn;
      if (hasSeasonNumber && hasNumber) {
        // Se ambas existem, usar season_number (pode ser PK)
        queryColumn = 'season_number';
      }
      
      const lastSeasonResult = await client.query(
        `SELECT ${queryColumn} FROM pvp_seasons 
         ORDER BY ${queryColumn} DESC 
         LIMIT 1`
      );
      
      // Garantir que nextNumber seja sempre um número válido
      if (lastSeasonResult.rows.length > 0) {
        const lastNumber = lastSeasonResult.rows[0][queryColumn];
        if (lastNumber !== null && lastNumber !== undefined && !isNaN(Number(lastNumber))) {
          nextNumber = Number(lastNumber) + 1;
        } else {
          console.warn(`[PVP Season] Invalid last season number: ${lastNumber}, using default 1`);
          nextNumber = 1;
        }
      }
    } catch (error: any) {
      console.warn('[PVP Season] Error fetching last season, using default number 1:', error.message);
      nextNumber = 1;
    }
    
    // Validação final crítica - garantir que seja sempre um número válido
    if (nextNumber === null || nextNumber === undefined || isNaN(nextNumber) || nextNumber < 1) {
      console.warn(`[PVP Season] Invalid nextNumber detected (${nextNumber}), resetting to 1`);
      nextNumber = 1;
    }
    
    // Conversão explícita para número inteiro
    nextNumber = Math.floor(Number(nextNumber));
    if (nextNumber < 1) {
      nextNumber = 1;
    }
    
    console.log(`[PVP Season] Final nextNumber: ${nextNumber} (type: ${typeof nextNumber})`);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mês
    
    const name = `Temporada ${nextNumber}`;
    
    // Validação final crítica antes do INSERT - garantir que nextNumber seja um inteiro válido
    const finalSeasonNumber = parseInt(String(nextNumber), 10);
    if (isNaN(finalSeasonNumber) || finalSeasonNumber < 1) {
      const errorMsg = `Invalid season number after validation: ${nextNumber} (parsed: ${finalSeasonNumber})`;
      console.error(`[PVP Season] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    console.log(`[PVP Season] Creating season with validated number: ${finalSeasonNumber}`);
    console.log(`[PVP Season] Column detection: hasNumber=${hasNumber}, hasSeasonNumber=${hasSeasonNumber}`);
    
    // Finalizar temporada anterior se existir (usar a coluna correta)
    try {
      if (hasSeasonNumber) {
        await client.query(
          `UPDATE pvp_seasons 
           SET status = 'ended' 
           WHERE status = 'active'`
        );
      } else {
        await client.query(
          `UPDATE pvp_seasons 
           SET status = 'ended' 
           WHERE status = 'active'`
        );
      }
    } catch (updateError: any) {
      console.warn('[PVP Season] Error ending previous season (may not exist):', updateError.message);
      // Continuar mesmo se falhar
    }
    
    // Criar nova temporada - usar a coluna correta
    // IMPORTANTE: Se season_number existe, SEMPRE usar ele (pode ser PRIMARY KEY e NOT NULL)
    let insertQuery: string;
    let insertValues: any[];
    
    // CRÍTICO: Se season_number existe (migration 012), SEMPRE usar ele, mesmo se number também existir
    // A migration 012 NÃO TEM colunas number ou name, apenas season_number
    if (hasSeasonNumber) {
      // Usar season_number (pode ser PRIMARY KEY, então é obrigatório)
      // Esta é a estrutura da migration 012 - NÃO TEM colunas number ou name
      insertQuery = `INSERT INTO pvp_seasons 
       (season_number, start_date, end_date, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING *`;
      insertValues = [finalSeasonNumber, startDate, endDate];
      console.log(`[PVP Season] Using season_number structure (migration 012)`);
    } else if (hasNumber) {
      // Usar number (nova estrutura, sem season_number)
      // Esta é a estrutura da migration 002 - TEM colunas number e name
      insertQuery = `INSERT INTO pvp_seasons 
       (number, name, start_date, end_date, status, rewards_config, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', '{}'::jsonb, NOW(), NOW())
       RETURNING *`;
      insertValues = [finalSeasonNumber, name, startDate, endDate];
      console.log(`[PVP Season] Using number structure (migration 002)`);
    } else {
      // Se não tem nenhuma das colunas, tentar criar com season_number (padrão)
      console.warn('[PVP Season] Neither number nor season_number found, using season_number as default');
      insertQuery = `INSERT INTO pvp_seasons 
       (season_number, start_date, end_date, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING *`;
      insertValues = [finalSeasonNumber, startDate, endDate];
      console.log(`[PVP Season] Using season_number as fallback`);
    }
    
    console.log(`[PVP Season] Final insert preparation:`);
    console.log(`  - hasNumber: ${hasNumber}`);
    console.log(`  - hasSeasonNumber: ${hasSeasonNumber}`);
    console.log(`  - seasonNumber: ${finalSeasonNumber} (type: ${typeof finalSeasonNumber})`);
    console.log(`  - Insert query: ${insertQuery}`);
    console.log(`  - Insert values:`, insertValues.map((v, i) => `${i}: ${v} (type: ${typeof v})`));
    
    // Validação final dos valores antes do INSERT
    if (insertValues[0] === null || insertValues[0] === undefined || isNaN(Number(insertValues[0]))) {
      const errorMsg = `Invalid season number in insert values at index 0: ${insertValues[0]} (type: ${typeof insertValues[0]})`;
      console.error(`[PVP Season] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    const result = await client.query(insertQuery, insertValues);
    
    await client.query('COMMIT');
    
    const row = result.rows[0];
    console.log(`[PVP Season] Created new season: ${name} (${nextNumber})`);
    
    // Mapear para interface Season (suportar ambas estruturas)
    const season: Season = {
      id: row.id || row.season_number || nextNumber,
      number: row.number || row.season_number || nextNumber,
      name: row.name || name,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status || 'active',
      rewardsConfig: row.rewards_config || {},
      createdAt: row.created_at || new Date(),
      updatedAt: row.updated_at || new Date(),
    };
    
    // Limpar cache para forçar refresh
    clearSeasonCache();
    
    return season;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PVP Season] Error creating new season:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Finaliza temporada e distribui recompensas
 */
export async function endSeason(seasonNumber: number): Promise<void> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Marcar temporada como finalizada
    await client.query(
      `UPDATE pvp_seasons 
       SET status = 'ended', updated_at = NOW()
       WHERE number = $1`,
      [seasonNumber]
    );
    
    // Calcular e distribuir recompensas
    const rewards = await calculateSeasonRewards(seasonNumber);
    
    // Salvar configuração de recompensas
    await client.query(
      `UPDATE pvp_seasons 
       SET rewards_config = $1
       WHERE number = $2`,
      [JSON.stringify(rewards), seasonNumber]
    );
    
    await client.query('COMMIT');
    
    // Limpar cache para forçar refresh
    clearSeasonCache();
    
    console.log(`[PVP Season] Ended season ${seasonNumber}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PVP Season] Error ending season:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Calcula recompensas de fim de temporada
 */
async function calculateSeasonRewards(seasonNumber: number): Promise<any> {
  const client = await getClient();
  
  try {
    // Buscar top 100 jogadores
    const topPlayers = await client.query(
      `SELECT user_id, elo, tier, division, wins, losses
       FROM pvp_rankings
       WHERE season_number = $1
       ORDER BY elo DESC, wins DESC
       LIMIT 100`,
      [seasonNumber]
    );
    
    const rewards: any = {
      top10: [],
      top50: [],
      top100: [],
    };
    
    topPlayers.rows.forEach((row, index) => {
      const rank = index + 1;
      const reward = {
        userId: row.user_id,
        rank,
        elo: row.elo,
        tier: row.tier,
        coronas: 0,
        items: [],
      };
      
      if (rank <= 10) {
        reward.coronas = 10000 - (rank * 500); // 9500 para 1º, 5000 para 10º
        rewards.top10.push(reward);
      } else if (rank <= 50) {
        reward.coronas = 4000 - ((rank - 10) * 50); // 4000 para 11º, 2000 para 50º
        rewards.top50.push(reward);
      } else {
        reward.coronas = 1500 - ((rank - 50) * 10); // 1500 para 51º, 500 para 100º
        rewards.top100.push(reward);
      }
    });
    
    return rewards;
  } catch (error) {
    console.error('[PVP Season] Error calculating season rewards:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Busca recompensas de fim de temporada para jogador
 */
export async function getSeasonRewards(
  seasonNumber: number,
  userId: number
): Promise<any | null> {
  const client = await getClient();
  
  try {
    const seasonResult = await client.query(
      `SELECT rewards_config FROM pvp_seasons WHERE number = $1`,
      [seasonNumber]
    );
    
    if (seasonResult.rows.length === 0) {
      return null;
    }
    
    const rewardsConfig = seasonResult.rows[0].rewards_config || {};
    
    // Buscar recompensa do jogador em qualquer categoria
    for (const category of ['top10', 'top50', 'top100']) {
      const rewards = rewardsConfig[category] || [];
      const playerReward = rewards.find((r: any) => r.userId === userId);
      if (playerReward) {
        return playerReward;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[PVP Season] Error getting season rewards:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifica se temporada atual expirou e cria nova se necessário
 */
export async function checkAndCreateNewSeason(): Promise<Season | null> {
  const client = await getClient();
  
  try {
    const currentSeason = await getCurrentSeason();
    
    if (!currentSeason) {
      return await createNewSeason();
    }
    
    // Verificar se temporada expirou
    if (new Date() >= currentSeason.endDate && currentSeason.status === 'active') {
      await endSeason(currentSeason.number);
      return await createNewSeason();
    }
    
    return currentSeason;
  } catch (error) {
    console.error('[PVP Season] Error checking season:', error);
    throw error;
  } finally {
    client.release();
  }
}

