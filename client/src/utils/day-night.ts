/**
 * Sistema de Dia e Noite
 * Calcula hora do dia e estado (dia/noite) baseado no tempo real
 */

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  isNight: boolean; // true se for noite (18:00 - 04:59)
  timeString: string; // "HH:MM"
}

/**
 * Calcula a hora do dia atual (timezone de Brasília)
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const now = new Date();
  
  // Converter para timezone de Brasília
  const brasiliaTime = new Date(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }));
  
  const hour = brasiliaTime.getHours();
  const minute = brasiliaTime.getMinutes();
  const second = brasiliaTime.getSeconds();
  
  // Noite: 18:00 (18) até 04:59 (4)
  const isNight = hour >= 18 || hour < 5;
  
  // Formatar hora como "HH:MM"
  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  return {
    hour,
    minute,
    second,
    isNight,
    timeString,
  };
}

/**
 * Calcula o progresso do dia (0.0 = meia-noite, 1.0 = próxima meia-noite)
 */
export function getDayProgress(): number {
  const time = getCurrentTimeOfDay();
  // Converter hora + minuto + segundo em progresso (0-1)
  const totalSeconds = time.hour * 3600 + time.minute * 60 + time.second;
  const dayProgress = totalSeconds / 86400; // 86400 segundos em um dia
  return dayProgress;
}

/**
 * Calcula o progresso da transição dia/noite (0.0 = dia completo, 1.0 = noite completa)
 * Suave transição entre 17:00-19:00 e 04:00-06:00
 */
export function getDayNightBlend(): number {
  const time = getCurrentTimeOfDay();
  const hour = time.hour;
  const minute = time.minute;
  
  // Transição para noite: 17:00 - 19:00 (2 horas)
  if (hour >= 17 && hour < 19) {
    const progress = ((hour - 17) * 60 + minute) / 120; // 0-1 em 2 horas
    return Math.min(1, progress);
  }
  
  // Noite completa: 19:00 - 04:59
  if (hour >= 19 || hour < 5) {
    // Transição para dia: 04:00 - 06:00 (2 horas)
    if (hour >= 4 && hour < 6) {
      const progress = ((hour - 4) * 60 + minute) / 120; // 0-1 em 2 horas
      return 1 - Math.min(1, progress); // Inverter: 1 -> 0
    }
    return 1; // Noite completa
  }
  
  // Dia completo: 06:00 - 16:59
  return 0;
}

/**
 * Obtém a intensidade da luz ambiente (0.0 = noite escura, 1.0 = dia claro)
 */
export function getAmbientLightIntensity(): number {
  const blend = getDayNightBlend();
  // Dia: 1.0, Noite: 0.2 (mantém visibilidade mínima)
  return 1.0 - (blend * 0.8);
}

/**
 * Obtém a cor do céu (RGB) baseado na hora do dia
 */
export function getSkyColor(): { r: number; g: number; b: number } {
  const blend = getDayNightBlend();
  
  // Céu diurno (azul claro)
  const daySky = { r: 135 / 255, g: 206 / 255, b: 250 / 255 }; // Sky blue
  
  // Céu noturno (azul escuro/roxo)
  const nightSky = { r: 25 / 255, g: 25 / 255, b: 50 / 255 }; // Dark blue/purple
  
  // Interpolar entre dia e noite
  return {
    r: daySky.r + (nightSky.r - daySky.r) * blend,
    g: daySky.g + (nightSky.g - daySky.g) * blend,
    b: daySky.b + (nightSky.b - daySky.b) * blend,
  };
}

