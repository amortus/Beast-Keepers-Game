/**
 * Friends API Client
 * Beast Keepers Client
 */

import { apiClient } from './client';
import type { ApiResponse, Friend, FriendRequest } from '../types';

export const friendsApi = {
  /**
   * Listar amigos aceitos
   */
  async getFriends(): Promise<ApiResponse<Friend[]>> {
    return apiClient.get<Friend[]>('/friends');
  },

  /**
   * Listar pedidos de amizade (enviados e recebidos)
   */
  async getRequests(): Promise<ApiResponse<FriendRequest[]>> {
    return apiClient.get<FriendRequest[]>('/friends/requests');
  },

  /**
   * Enviar pedido de amizade
   */
  async sendRequest(username: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/friends/request', { username });
  },

  /**
   * Aceitar pedido de amizade
   */
  async acceptRequest(friendId: number): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/friends/accept/${friendId}`, {});
  },

  /**
   * Remover amigo ou rejeitar pedido
   */
  async removeFriend(friendId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/friends/${friendId}`);
  },

  /**
   * Listar amigos online
   */
  async getOnlineFriends(): Promise<ApiResponse<Friend[]>> {
    return apiClient.get<Friend[]>('/friends/online');
  },
};

