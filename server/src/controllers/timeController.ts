/**
 * Time Controller
 * Gerencia sincronização de tempo e ações cronometradas
 */

import { Request, Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';

/**
 * Retorna o timestamp do servidor (timezone de Brasília)
 */
export async function getServerTime(req: Request, res: Response) {
  try {
    const timestamp = Date.now();
    
    // Formatar para timezone de Brasília
    const brasiliaTime = new Date(timestamp).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    return res.status(200).json({
      success: true,
      data: {
        timestamp,
        brasiliaTime,
        timezone: 'America/Sao_Paulo',
      },
    } as ApiResponse);
    
  } catch (error) {
    console.error('[Time] Get server time error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get server time',
    } as ApiResponse);
  }
}

/**
 * Inicia uma ação cronometrada para uma besta
 */
export async function startBeastAction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }
    
    const { beastId } = req.params;
    const { actionType, duration, completesAt } = req.body;
    
    console.log(`[Time] Starting action for beast ${beastId}:`, { actionType, duration, completesAt });
    
    // Validar parâmetros
    if (!actionType || !duration || !completesAt) {
      console.error('[Time] Missing required parameters:', { actionType, duration, completesAt });
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: actionType, duration, completesAt',
      } as ApiResponse);
    }
    
    // Verificar se besta pertence ao usuário
    const ownershipCheck = await query(
      `SELECT b.id, b.current_action FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2`,
      [beastId, userId]
    );
    
    if (ownershipCheck.rows.length === 0) {
      console.error(`[Time] Beast ${beastId} not found for user ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Beast not found',
      } as ApiResponse);
    }
    
    const beast = ownershipCheck.rows[0];
    
    // Verificar se já tem ação em andamento
    if (beast.current_action) {
      const action = beast.current_action;
      if (action.completesAt > Date.now()) {
        console.warn(`[Time] Beast ${beastId} already has action in progress:`, action.type);
        return res.status(400).json({
          success: false,
          error: 'Beast already has an action in progress',
        } as ApiResponse);
      }
    }
    
    // Criar nova ação
    const newAction = {
      type: actionType,
      startTime: Date.now(),
      duration,
      completesAt,
      canCancel: true,
    };
    
    console.log(`[Time] Saving action to database:`, newAction);
    
    // Salvar ação no banco
    const result = await query(
      `UPDATE beasts
       SET current_action = $2,
           last_update = $3
       WHERE id = $1
       RETURNING *`,
      [beastId, JSON.stringify(newAction), Date.now()]
    );
    
    console.log(`[Time] ✅ Beast ${beastId} started action: ${actionType} successfully`);
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
    } as ApiResponse);
    
  } catch (error: any) {
    console.error('[Time] Start action error:', error);
    console.error('[Time] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to start action',
      details: error.message,
    } as ApiResponse);
  }
}

/**
 * Completa uma ação cronometrada
 */
export async function completeBeastAction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }
    
    const { beastId } = req.params;
    
    // Buscar besta
    const beastResult = await query(
      `SELECT b.* FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2`,
      [beastId, userId]
    );
    
    if (beastResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Beast not found',
      } as ApiResponse);
    }
    
    const beast = beastResult.rows[0];
    const serverTime = Date.now();
    
    // Verificar se tem ação
    if (!beast.current_action) {
      return res.status(400).json({
        success: false,
        error: 'No action in progress',
      } as ApiResponse);
    }
    
    const action = beast.current_action;
    
    // Verificar se ação já completou
    if (action.completesAt > serverTime) {
      return res.status(400).json({
        success: false,
        error: 'Action not yet complete',
        data: {
          timeRemaining: action.completesAt - serverTime,
        },
      } as ApiResponse);
    }
    
    // Limpar ação
    await query(
      `UPDATE beasts
       SET current_action = NULL,
           last_update = $2
       WHERE id = $1`,
      [beastId, serverTime]
    );
    
    console.log(`[Time] Beast ${beastId} completed action: ${action.type}`);
    
    return res.status(200).json({
      success: true,
      data: {
        actionType: action.type,
        message: 'Action completed successfully',
      },
    } as ApiResponse);
    
  } catch (error) {
    console.error('[Time] Complete action error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete action',
    } as ApiResponse);
  }
}

/**
 * Cancela uma ação em progresso
 */
export async function cancelBeastAction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }
    
    const { beastId } = req.params;
    
    // Verificar ownership e obter ação atual
    const beastResult = await query(
      `SELECT b.current_action FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2`,
      [beastId, userId]
    );
    
    if (beastResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Beast not found',
      } as ApiResponse);
    }
    
    const beast = beastResult.rows[0];
    
    if (!beast.current_action) {
      return res.status(400).json({
        success: false,
        error: 'No action to cancel',
      } as ApiResponse);
    }
    
    const action = beast.current_action;
    const serverTime = Date.now();
    
    // Calcular progresso
    const elapsed = serverTime - action.startTime;
    const progress = Math.min(elapsed / action.duration, 1);
    
    // Cancelar ação
    await query(
      `UPDATE beasts
       SET current_action = NULL,
           last_update = $2
       WHERE id = $1`,
      [beastId, serverTime]
    );
    
    console.log(`[Time] Beast ${beastId} cancelled action: ${action.type} at ${Math.floor(progress * 100)}% progress`);
    
    return res.status(200).json({
      success: true,
      data: {
        actionType: action.type,
        progress,
        message: `Action cancelled at ${Math.floor(progress * 100)}% progress`,
      },
    } as ApiResponse);
    
  } catch (error) {
    console.error('[Time] Cancel action error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel action',
    } as ApiResponse);
  }
}

/**
 * Calcula o timestamp da meia-noite de hoje (timezone de Brasília)
 * Retorna o timestamp UTC da meia-noite (00:00:00) no timezone de Brasília
 */
function getMidnightTimestamp(): number {
  const now = new Date();
  
  // Obter data/hora atual em Brasília como string ISO-like
  const brasiliaStr = now.toLocaleString('en-CA', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // brasiliaStr está no formato "YYYY-MM-DD"
  const [year, month, day] = brasiliaStr.split('-').map(Number);
  
  // Criar string ISO para meia-noite em Brasília
  // Assumir que Brasília está UTC-3 (pode variar com horário de verão, mas funciona bem para comparar)
  // Criar data UTC assumindo meia-noite Brasília = 03:00 UTC (UTC-3)
  const midnightUtc = Date.UTC(year, month - 1, day, 3, 0, 0, 0);
  
  // Obter offset real de Brasília agora
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    timeZoneName: 'longOffset'
  });
  
  // Calcular offset atual (simplificado: usar diferença entre UTC e Brasília)
  const utcHours = now.getUTCHours();
  const brasiliaHours = parseInt(now.toLocaleString('en-US', { 
    timeZone: 'America/Sao_Paulo', 
    hour: '2-digit', 
    hour12: false 
  }));
  
  let offsetHours = brasiliaHours - utcHours;
  if (offsetHours > 12) offsetHours -= 24; // Ajustar se cruzar meia-noite
  if (offsetHours < -12) offsetHours += 24;
  
  // Ajustar meia-noite para o offset correto
  return midnightUtc - (offsetHours * 60 * 60 * 1000);
}

/**
 * Processa o ciclo diário para uma besta (incrementa idade a meia-noite)
 */
export async function processDailyCycle(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }
    
    const { beastId } = req.params;
    
    // Verificar ownership
    const beastResult = await query(
      `SELECT b.*, gs.user_id 
       FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2 AND b.is_active = true`,
      [beastId, userId]
    );
    
    if (beastResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Active beast not found',
      } as ApiResponse);
    }
    
    const beast = beastResult.rows[0];
    const now = Date.now();
    const midnightTimestamp = getMidnightTimestamp();
    
    // Pegar maxAge do banco (campo max_age)
    const maxAge = beast.max_age || 365; // padrão 1 ano
    const currentAgeInDays = beast.age_in_days || 0;
    const lastDayProcessed = beast.last_day_processed || 0;
    
    // Verificar se já processamos hoje (se lastDayProcessed >= midnightTimestamp)
    if (lastDayProcessed >= midnightTimestamp) {
      // Já processado hoje, retornar dados atuais
      return res.status(200).json({
        success: true,
        data: {
          ageInDays: currentAgeInDays,
          isAlive: currentAgeInDays < maxAge,
          processed: false, // Já estava processado
        },
      } as ApiResponse);
    }
    
    // Incrementar idade em 1 dia
    const newAgeInDays = currentAgeInDays + 1;
    const isAlive = newAgeInDays < maxAge;
    
    // Se morreu, desativar a besta
    let isActive = true;
    if (!isAlive) {
      isActive = false;
      console.log(`[DailyCycle] Beast ${beastId} died at age ${newAgeInDays} (max: ${maxAge})`);
    }
    
    // Atualizar no banco (incluindo resets diários)
    await query(
      `UPDATE beasts
       SET age_in_days = $2,
           last_day_processed = $3,
           is_active = $4,
           last_update = $5,
           daily_training_count = 0,
           daily_potion_used = false,
           exploration_count = 0
       WHERE id = $1`,
      [beastId, newAgeInDays, midnightTimestamp, isActive, now]
    );
    
    console.log(`[DailyCycle] Beast ${beastId} aged from ${currentAgeInDays} to ${newAgeInDays} days. Alive: ${isAlive}`);
    console.log(`[DailyCycle] Reset daily limits: training count, potion use, exploration count`);
    
    return res.status(200).json({
      success: true,
      data: {
        ageInDays: newAgeInDays,
        isAlive,
        processed: true, // Processado agora
        died: !isAlive, // Morreu nesta atualização
      },
    } as ApiResponse);
    
  } catch (error) {
    console.error('[Time] Process daily cycle error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process daily cycle',
    } as ApiResponse);
  }
}

