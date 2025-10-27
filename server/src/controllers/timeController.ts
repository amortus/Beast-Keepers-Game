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
    
    // Verificar se besta pertence ao usuário
    const ownershipCheck = await query(
      `SELECT b.id, b.current_action FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2`,
      [beastId, userId]
    );
    
    if (ownershipCheck.rows.length === 0) {
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
    
    // Salvar ação no banco
    const result = await query(
      `UPDATE beasts
       SET current_action = $2,
           last_update = $3
       WHERE id = $1
       RETURNING *`,
      [beastId, JSON.stringify(newAction), Date.now()]
    );
    
    console.log(`[Time] Beast ${beastId} started action: ${actionType}`);
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
    } as ApiResponse);
    
  } catch (error) {
    console.error('[Time] Start action error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start action',
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

