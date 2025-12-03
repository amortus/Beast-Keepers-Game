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
      const newSeason = await createNewSeason();
      if (newSeason) {
        cachedSeason = newSeason;
        cacheExpiry = now + CACHE_TTL;
      }
      return newSeason;
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
  } catch (error) {
    console.error('[PVP Season] Error getting current season:', error);
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
    
    // Verificar qual coluna existe na tabela (number ou season_number)
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pvp_seasons' 
        AND column_name IN ('number', 'season_number')
    `);
    
    const hasNumber = columnCheck.rows.some((r: any) => r.column_name === 'number');
    const hasSeasonNumber = columnCheck.rows.some((r: any) => r.column_name === 'season_number');
    const seasonColumn = hasNumber ? 'number' : 'season_number';
    
    // Buscar última temporada
    const lastSeasonResult = await client.query(
      `SELECT ${seasonColumn} FROM pvp_seasons 
       ORDER BY ${seasonColumn} DESC 
       LIMIT 1`
    );
    
    const nextNumber = lastSeasonResult.rows.length > 0 
      ? (lastSeasonResult.rows[0][seasonColumn] || 0) + 1 
      : 1;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mês
    
    const name = `Temporada ${nextNumber}`;
    
    // Finalizar temporada anterior se existir
    await client.query(
      `UPDATE pvp_seasons 
       SET status = 'ended' 
       WHERE status = 'active'`
    );
    
    // Criar nova temporada - usar a coluna correta
    let insertQuery: string;
    let insertValues: any[];
    
    if (hasNumber) {
      // Usar number (nova estrutura)
      insertQuery = `INSERT INTO pvp_seasons 
       (number, name, start_date, end_date, status, rewards_config, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', '{}'::jsonb, NOW(), NOW())
       RETURNING *`;
      insertValues = [nextNumber, name, startDate, endDate];
    } else {
      // Usar season_number (estrutura antiga)
      insertQuery = `INSERT INTO pvp_seasons 
       (season_number, start_date, end_date, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING *`;
      insertValues = [nextNumber, startDate, endDate];
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

