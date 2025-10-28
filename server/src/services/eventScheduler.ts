/**
 * Event Scheduler Service
 * Gerencia eventos baseados em tempo (ciclo diário, eventos de calendário, etc)
 * Beast Keepers Server
 */

import { query } from '../db/connection';

// ===== UTILITÁRIOS DE TEMPO =====

/**
 * Calcula o timestamp da meia-noite de hoje (timezone de Brasília)
 * Retorna timestamp UTC da meia-noite (00:00:00) em Brasília
 */
function getMidnightTimestamp(): number {
  const now = new Date();
  
  // Obter componentes de data em Brasília
  const brasiliaFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = brasiliaFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  
  // Calcular offset de Brasília (em ms)
  const utcTime = now.getTime();
  const brasiliaTime = new Date(brasiliaFormatter.format(now)).getTime();
  const offset = utcTime - brasiliaTime;
  
  // Criar meia-noite em Brasília (em tempo local, depois converter para UTC)
  const midnightBrasiliaLocal = new Date(year, month, day, 0, 0, 0, 0);
  const midnightBrasiliaUTC = midnightBrasiliaLocal.getTime() + offset;
  
  return midnightBrasiliaUTC;
}

/**
 * Obtém a data atual em Brasília (ano, mês, dia)
 */
function getBrasiliaDate(): { year: number; month: number; day: number } {
  const now = new Date();
  const brasiliaStr = now.toLocaleString('en-CA', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [year, month, day] = brasiliaStr.split('-').map(Number);
  return { year, month, day };
}

// ===== PROCESSAMENTO DE CICLO DIÁRIO =====

/**
 * Processa o ciclo diário para todas as bestas ativas
 */
async function processDailyCycle() {
  try {
    console.log('[EventScheduler] Processing daily cycle...');
    
    // Verificar se as colunas necessárias existem
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beasts' 
      AND column_name IN ('age_in_days', 'last_day_processed', 'last_update', 'max_age_weeks')
    `);
    
    const availableColumns = columnCheck.rows.map(r => r.column_name);
    const hasAgeInDays = availableColumns.includes('age_in_days');
    const hasLastDayProcessed = availableColumns.includes('last_day_processed');
    const hasLastUpdate = availableColumns.includes('last_update');
    const hasMaxAge = availableColumns.includes('max_age_weeks');
    
    console.log('[EventScheduler] Available columns:', { hasAgeInDays, hasLastDayProcessed, hasLastUpdate, hasMaxAge });
    
    // Se não tem as colunas necessárias, pular processamento
    if (!hasAgeInDays || !hasLastDayProcessed) {
      console.log('[EventScheduler] Daily cycle columns not available, skipping...');
      return;
    }
    
    const midnightTimestamp = getMidnightTimestamp();
    const now = Date.now();
    
    // Buscar todas as bestas ativas que ainda não foram processadas hoje
    const beastsResult = await query(
      `SELECT id, age_in_days, last_day_processed, ${hasMaxAge ? 'max_age_weeks' : 'NULL as max_age_weeks'}
       FROM beasts
       WHERE is_active = true
       AND (last_day_processed IS NULL OR last_day_processed < $1)`,
      [midnightTimestamp]
    );
    
    if (beastsResult.rows.length === 0) {
      console.log('[EventScheduler] No beasts need daily cycle processing');
      return;
    }
    
    console.log(`[EventScheduler] Processing ${beastsResult.rows.length} beasts...`);
    
    let processedCount = 0;
    let diedCount = 0;
    
    for (const beast of beastsResult.rows) {
      const currentAgeInDays = beast.age_in_days || 0;
      // max_age_weeks está em semanas, converter para dias (365 dias padrão se não tiver)
      const maxAgeWeeks = beast.max_age_weeks || 52;
      const maxAgeDays = maxAgeWeeks * 7;
      const newAgeInDays = currentAgeInDays + 1;
      const isAlive = newAgeInDays < maxAgeDays;
      
      // Construir UPDATE dinamicamente
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 2;
      
      updateFields.push(`age_in_days = $${paramIndex++}`);
      updateValues.push(newAgeInDays);
      
      updateFields.push(`last_day_processed = $${paramIndex++}`);
      updateValues.push(midnightTimestamp);
      
      if (hasLastUpdate) {
        updateFields.push(`last_update = $${paramIndex++}`);
        updateValues.push(now);
      }
      
      if (!isAlive) {
        updateFields.push('is_active = false');
        console.log(`[EventScheduler] Beast ${beast.id} died at age ${newAgeInDays} (max: ${maxAgeDays})`);
        diedCount++;
      } else {
        processedCount++;
      }
      
      await query(
        `UPDATE beasts
         SET ${updateFields.join(', ')}
         WHERE id = $1`,
        [beast.id, ...updateValues]
      );
    }
    
    console.log(`[EventScheduler] Daily cycle complete: ${processedCount} aged, ${diedCount} died`);
    
  } catch (error) {
    console.error('[EventScheduler] Daily cycle error:', error);
  }
}

// ===== EVENTOS DE CALENDÁRIO =====

/**
 * Define eventos especiais do calendário
 */
interface CalendarEvent {
  name: string;
  month: number;  // 1-12
  day: number;    // 1-31
  handler: () => Promise<void>;
}

/**
 * Exemplo: Evento de Natal (25 de dezembro)
 */
async function handleChristmasEvent() {
  try {
    console.log('[EventScheduler] 🎄 Processing Christmas event...');
    const { year, month, day } = getBrasiliaDate();
    
    // Verificar se já processamos hoje
    const checkResult = await query(
      `SELECT id FROM calendar_events_log
       WHERE event_name = $1
       AND event_date = $2`,
      ['christmas', `${year}-${month}-${day}`]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('[EventScheduler] Christmas event already processed today');
      return;
    }
    
    // Buscar todos os jogadores ativos
    const playersResult = await query(
      `SELECT DISTINCT gs.user_id, gs.player_name
       FROM game_saves gs
       INNER JOIN beasts b ON b.game_save_id = gs.id
       WHERE b.is_active = true`
    );
    
    console.log(`[EventScheduler] Giving Christmas gift to ${playersResult.rows.length} players...`);
    
    // Dar presente para cada jogador (exemplo: 1000 coronas + item especial)
    for (const player of playersResult.rows) {
      // Adicionar coronas
      await query(
        `UPDATE game_saves
         SET coronas = coronas + 1000
         WHERE user_id = $1`,
        [player.user_id]
      );
      
      // Aqui você pode adicionar itens especiais ao inventário também
      console.log(`[EventScheduler] Gift given to ${player.player_name}`);
    }
    
    // Registrar evento como processado
    await query(
      `INSERT INTO calendar_events_log (event_name, event_date, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (event_name, event_date) DO NOTHING`,
      ['christmas', `${year}-${month}-${day}`]
    );
    
    console.log('[EventScheduler] 🎄 Christmas event completed!');
    
  } catch (error) {
    console.error('[EventScheduler] Christmas event error:', error);
  }
}

/**
 * Lista de eventos de calendário
 */
const calendarEvents: CalendarEvent[] = [
  {
    name: 'christmas',
    month: 12,
    day: 25,
    handler: handleChristmasEvent,
  },
  // Adicione mais eventos aqui
  // {
  //   name: 'new_year',
  //   month: 1,
  //   day: 1,
  //   handler: handleNewYearEvent,
  // },
];

/**
 * Processa eventos de calendário para a data atual
 */
async function processCalendarEvents() {
  try {
    const { year, month, day } = getBrasiliaDate();
    
    console.log(`[EventScheduler] Checking calendar events for ${day}/${month}/${year}...`);
    
    for (const event of calendarEvents) {
      if (event.month === month && event.day === day) {
        console.log(`[EventScheduler] Processing event: ${event.name}`);
        await event.handler();
      }
    }
    
  } catch (error) {
    console.error('[EventScheduler] Calendar events error:', error);
  }
}

// ===== SCHEDULER PRINCIPAL =====

let midnightTimeout: NodeJS.Timeout | null = null;
let lastProcessedMidnight: number = 0;

/**
 * Função para limpar o scheduler (útil para testes ou shutdown)
 */
export function stopEventScheduler() {
  if (midnightTimeout) {
    clearTimeout(midnightTimeout);
    midnightTimeout = null;
  }
  console.log('[EventScheduler] Event scheduler stopped');
}

/**
 * Calcula o timestamp da próxima meia-noite (Brasília)
 */
function getNextMidnightTimestamp(): number {
  const now = Date.now();
  const todayMidnight = getMidnightTimestamp();
  
  // Se já passou a meia-noite de hoje, retornar meia-noite de amanhã
  if (now >= todayMidnight) {
    // Adicionar 24 horas
    return todayMidnight + (24 * 60 * 60 * 1000);
  }
  
  return todayMidnight;
}

/**
 * Agenda o próximo processamento de ciclo diário
 */
function scheduleNextMidnight() {
  // Limpar timeout anterior se existir
  if (midnightTimeout) {
    clearTimeout(midnightTimeout);
    midnightTimeout = null;
  }
  
  const nextMidnight = getNextMidnightTimestamp();
  const now = Date.now();
  const msUntilMidnight = nextMidnight - now;
  
  console.log(`[EventScheduler] Next daily cycle scheduled in ${Math.floor(msUntilMidnight / 1000 / 60)} minutes (at ${new Date(nextMidnight).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`);
  
  midnightTimeout = setTimeout(async () => {
    try {
      const currentMidnight = getMidnightTimestamp();
      
      // Processar ciclo diário de todas as bestas
      await processDailyCycle();
      
      // Processar eventos de calendário
      await processCalendarEvents();
      
      lastProcessedMidnight = currentMidnight;
      
      // Agendar próxima meia-noite
      scheduleNextMidnight();
      
    } catch (error) {
      console.error('[EventScheduler] Midnight processing error:', error);
      // Reagendar mesmo em caso de erro
      scheduleNextMidnight();
    }
  }, msUntilMidnight);
}

/**
 * Inicia o scheduler de eventos
 * Usa alarmes baseados em timeout ao invés de polling
 */
export function startEventScheduler() {
  console.log('[EventScheduler] Starting event scheduler (alarm-based)...');
  
  // Processar imediatamente se já passou meia-noite e ainda não processamos hoje
  const now = Date.now();
  const todayMidnight = getMidnightTimestamp();
  
  if (now >= todayMidnight && lastProcessedMidnight < todayMidnight) {
    console.log('[EventScheduler] Processing missed daily cycle...');
    processDailyCycle().then(() => {
      lastProcessedMidnight = todayMidnight;
      scheduleNextMidnight();
    }).catch((error) => {
      console.error('[EventScheduler] Initial processing error:', error);
      scheduleNextMidnight();
    });
  } else {
    // Agendar próxima meia-noite
    scheduleNextMidnight();
  }
  
  // Processar eventos de calendário imediatamente ao iniciar
  processCalendarEvents().catch(error => {
    console.error('[EventScheduler] Initial calendar events error:', error);
  });
  
  console.log('[EventScheduler] Event scheduler started (alarm-based, no polling)');
}

/**
 * Processa ciclo diário manualmente (para testes ou chamadas externas)
 */
export async function triggerDailyCycle() {
  await processDailyCycle();
}

/**
 * Processa eventos de calendário manualmente (para testes)
 */
export async function triggerCalendarEvents() {
  await processCalendarEvents();
}

