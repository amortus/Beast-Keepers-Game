/**
 * PVP Socket Client
 * Cliente WebSocket para sistema PVP
 */

import { io, Socket } from 'socket.io-client';

// Usar a mesma URL base da API (mesma do chat)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type MatchType = 'ranked' | 'casual';

export interface MatchFoundData {
  matchId: number;
  opponent: {
    userId: number;
    beastId: number;
  };
  matchType: MatchType;
}

export interface MatchStartData {
  matchId: number;
  player1Id: number;
  player2Id: number;
  matchType: MatchType;
}

export interface MatchActionData {
  matchId: number;
  action: any;
  beastState: any;
  fromPlayer: number;
}

export interface MatchStateData {
  matchId: number;
  state: any;
  fromPlayer: number;
}

export interface ChallengeReceivedData {
  challengeId: number;
  challengerId: number;
  challengerName: string;
  challengerBeastId: number;
}

class PvpSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private connected: boolean = false;

  /**
   * Conecta ao servidor WebSocket
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.warn('[PVP Socket] Already connected');
      return;
    }

    this.token = token;
    
    // Processar URL da mesma forma que o chatClient
    let fullUrl = SOCKET_URL.replace('/api', '');
    if (fullUrl.endsWith('/api')) {
      fullUrl = fullUrl.substring(0, fullUrl.length - 4);
    }
    
    this.socket = io(fullUrl, {
      path: '/socket.io/',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[PVP Socket] Connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[PVP Socket] Disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[PVP Socket] Connection error:', error);
    });

    this.socket.on('pvp:error', (data: { message: string }) => {
      console.error('[PVP Socket] Error:', data.message);
    });
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Entrar na fila de matchmaking
   */
  joinMatchmaking(beastId: number, matchType: MatchType): void {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }
    
    // Verificar se está conectado, mas não lançar erro se não estiver - apenas avisar
    if (!this.isConnected()) {
      console.warn('[PVP Socket] Socket not connected, attempting to emit anyway');
      // Tentar emitir mesmo assim - o servidor pode estar processando a conexão
    }

    this.socket.emit('pvp:matchmaking:join', {
      beastId,
      matchType,
    });
  }

  /**
   * Sair da fila de matchmaking
   */
  leaveMatchmaking(): void {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }
    
    // Verificar se está conectado, mas não lançar erro se não estiver - apenas avisar
    if (!this.isConnected()) {
      console.warn('[PVP Socket] Socket not connected, attempting to emit anyway');
    }

    this.socket.emit('pvp:matchmaking:leave');
  }

  /**
   * Enviar ação na partida
   */
  sendAction(matchId: number, action: any, beastState: any): void {
    if (!this.socket || !this.isConnected()) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('pvp:match:action', {
      matchId,
      action,
      beastState,
    });
  }

  /**
   * Atualizar estado da partida
   */
  updateState(matchId: number, state: any): void {
    if (!this.socket || !this.isConnected()) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('pvp:match:state', {
      matchId,
      state,
    });
  }

  // Event listeners

  /**
   * Callback quando match é encontrado
   */
  onMatchFound(callback: (data: MatchFoundData) => void): void {
    // Armazenar callback para re-registrar após reconexão
    this.matchFoundCallbacks.push(callback);
    
    if (!this.socket) {
      console.warn('[PVP Socket] Socket not initialized yet, callback will be registered after connection');
      return;
    }
    this.socket.on('pvp:matchmaking:found', callback);
  }

  /**
   * Callback quando partida inicia
   */
  onMatchStart(callback: (data: MatchStartData) => void): void {
    this.matchStartCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:match:start', callback);
  }

  /**
   * Callback quando recebe ação do oponente
   */
  onMatchAction(callback: (data: MatchActionData) => void): void {
    this.matchActionCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:match:action', callback);
  }

  /**
   * Callback quando recebe atualização de estado
   */
  onMatchState(callback: (data: MatchStateData) => void): void {
    this.matchStateCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:match:state', callback);
  }

  /**
   * Callback quando partida termina
   */
  onMatchEnd(callback: (data: any) => void): void {
    this.matchEndCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:match:end', callback);
  }

  /**
   * Callback quando entra na fila
   */
  onMatchmakingJoined(callback: (data: { matchType: MatchType }) => void): void {
    this.matchmakingJoinedCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:matchmaking:joined', callback);
  }

  /**
   * Callback quando sai da fila
   */
  onMatchmakingLeft(callback: () => void): void {
    this.matchmakingLeftCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:matchmaking:left', callback);
  }

  /**
   * Callback quando recebe desafio
   */
  onChallengeReceived(callback: (data: ChallengeReceivedData) => void): void {
    this.challengeReceivedCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:challenge:received', callback);
  }

  /**
   * Callback quando desafio é aceito
   */
  onChallengeAccepted(callback: (data: any) => void): void {
    this.challengeAcceptedCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:challenge:accepted', callback);
  }

  /**
   * Callback quando desafio é recusado
   */
  onChallengeDeclined(callback: (data: any) => void): void {
    this.challengeDeclinedCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:challenge:declined', callback);
  }

  /**
   * Callback de erro
   */
  onError(callback: (data: { message: string }) => void): void {
    this.errorCallbacks.push(callback);
    if (!this.socket) return;
    this.socket.on('pvp:error', callback);
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

// Singleton instance
export const pvpSocketClient = new PvpSocketClient();

