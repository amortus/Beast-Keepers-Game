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
};

