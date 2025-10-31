/**
 * Game API
 * Beast Keepers Frontend
 */

import { apiClient } from './client';
import type { ApiResponse, GameSaveDTO, BeastDTO } from '../../../shared/types';

export const gameApi = {
  /**
   * Initialize new game
   */
  async initializeGame(playerName: string): Promise<ApiResponse<{ gameSave: GameSaveDTO; initialBeast: BeastDTO }>> {
    return apiClient.post('/game/initialize', { playerName });
  },

  /**
   * Get current game save
   */
  async getGameSave(): Promise<ApiResponse<{
    gameSave: GameSaveDTO;
    beasts: BeastDTO[];
    inventory: any[];
    quests: any[];
    achievements: any[];
  }>> {
    return apiClient.get('/game/save');
  },

  /**
   * Update game save
   */
  async updateGameSave(data: Partial<GameSaveDTO>): Promise<ApiResponse<GameSaveDTO>> {
    return apiClient.put('/game/save', data);
  },

  /**
   * Update beast data
   */
  async updateBeast(beastId: string, beastData: any): Promise<ApiResponse<BeastDTO>> {
    return apiClient.put(`/game/beast/${beastId}`, beastData);
  },

  /**
   * Get server time (Brasília timezone)
   */
  async getServerTime(): Promise<number> {
    const response = await apiClient.get('/game/time');
    return response.data?.timestamp || Date.now();
  },

  /**
   * Start a timed action for a beast
   */
  async startBeastAction(beastId: string, actionType: string, duration: number, completesAt: number): Promise<ApiResponse<any>> {
    return apiClient.post(`/game/beast/${beastId}/action/start`, {
      actionType,
      duration,
      completesAt,
    });
  },

  /**
   * Complete a beast action
   */
  async completeBeastAction(beastId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/game/beast/${beastId}/action/complete`, {});
  },

  /**
   * Cancel a beast action
   */
  async cancelBeastAction(beastId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/game/beast/${beastId}/action/cancel`, {});
  },

  /**
   * Process daily cycle for a beast (increment age at midnight)
   */
  async processDailyCycle(beastId: string): Promise<ApiResponse<{
    ageInDays: number;
    isAlive: boolean;
    processed: boolean;
    died?: boolean;
  }>> {
    return apiClient.post(`/game/beast/${beastId}/daily-cycle`, {});
  },

  // ===== INVENTORY API =====

  /**
   * Get player's inventory
   */
  async getInventory(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/inventory');
  },

  /**
   * Add item to inventory
   */
  async addInventoryItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient.post('/inventory/add', { itemId, quantity });
  },

  /**
   * Remove item from inventory
   */
  async removeInventoryItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient.post('/inventory/remove', { itemId, quantity });
  },
};

