/**
 * PVP Season Scheduler
 * Gerencia temporadas automaticamente (verifica diariamente)
 */

import { checkAndCreateNewSeason, endSeason, getCurrentSeason } from './pvpSeasonService';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Inicia o scheduler de temporadas
 */
export function startSeasonScheduler() {
  // Verificar a cada hora se temporada expirou
  schedulerInterval = setInterval(async () => {
    try {
      await checkAndCreateNewSeason();
    } catch (error) {
      console.error('[PVP Season Scheduler] Error checking season:', error);
    }
  }, 60 * 60 * 1000); // 1 hora
  
  // Verificar imediatamente ao iniciar
  checkAndCreateNewSeason().catch(error => {
    console.error('[PVP Season Scheduler] Error on initial check:', error);
  });
  
  console.log('[PVP Season Scheduler] Started');
}

/**
 * Para o scheduler de temporadas
 */
export function stopSeasonScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[PVP Season Scheduler] Stopped');
  }
}

