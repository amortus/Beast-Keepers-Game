/**
 * PVP Socket Handlers
 * Handlers WebSocket para sistema PVP
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { processMatchmaking, findMatch } from './pvpMatchmakingService';
import { createMatch, getMatch } from './pvpMatchService';
import { getCurrentSeason } from './pvpSeasonService';
import { query } from '../db/connection';

let io: SocketServer | null = null;

/**
 * Inicializa handlers de PVP no Socket.IO
 */
export function initializePvpSocketHandlers(
  socketServer: SocketServer,
  getUserSocketsFn: (userId: number) => string[]
) {
  io = socketServer;
  
  // Store function reference
  getUserSockets = getUserSocketsFn;
  
  io.on('connection', (socket: Socket & { user?: { userId: number; username: string } }) => {
    if (!socket.user) return;
    
    const { userId } = socket.user;
    
    // Matchmaking: Entrar na fila
    socket.on('pvp:matchmaking:join', async (data: { beastId: number; matchType: 'ranked' | 'casual' }) => {
      try {
        const { beastId, matchType } = data;
        
        if (!beastId || !matchType) {
          socket.emit('pvp:error', { message: 'Beast ID and match type required' });
          return;
        }
        
        const season = await getCurrentSeason();
        if (!season) {
          socket.emit('pvp:error', { message: 'No active season' });
          return;
        }
        
        // Importar função dinamicamente para evitar dependência circular
        const { joinQueue } = await import('./pvpMatchmakingService');
        await joinQueue(userId, beastId, matchType, season.number);
        
        socket.emit('pvp:matchmaking:joined', { matchType });
        
        // Tentar encontrar match imediatamente
        const match = await findMatch(userId, matchType, season.number);
        if (match) {
          await handleMatchFound(match, season.number);
        }
      } catch (error: any) {
        console.error('[PVP Socket] Error joining matchmaking:', error);
        socket.emit('pvp:error', { message: error.message || 'Error joining matchmaking' });
      }
    });
    
    // Matchmaking: Sair da fila
    socket.on('pvp:matchmaking:leave', async () => {
      try {
        const { leaveQueue } = await import('./pvpMatchmakingService');
        await leaveQueue(userId);
        socket.emit('pvp:matchmaking:left');
      } catch (error: any) {
        console.error('[PVP Socket] Error leaving matchmaking:', error);
        socket.emit('pvp:error', { message: error.message || 'Error leaving matchmaking' });
      }
    });
    
    // Partida: Enviar ação
    socket.on('pvp:match:action', async (data: { matchId: number; action: any; beastState: any }) => {
      try {
        const { matchId, action, beastState } = data;
        
        const match = await getMatch(matchId);
        if (!match) {
          socket.emit('pvp:error', { message: 'Match not found' });
          return;
        }
        
        // Verificar se é participante
        if (match.player1Id !== userId && match.player2Id !== userId) {
          socket.emit('pvp:error', { message: 'Not a participant' });
          return;
        }
        
        // Validar ação
        const { validateAction } = await import('./pvpValidationService');
        const validation = await validateAction(matchId, userId, action, beastState);
        
        if (!validation.valid) {
          socket.emit('pvp:error', { message: validation.error || 'Invalid action' });
          return;
        }
        
        // Enviar ação para o oponente
        const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
        const opponentSockets = getUserSockets(opponentId);
        
        opponentSockets.forEach(socketId => {
          io?.to(socketId).emit('pvp:match:action', {
            matchId,
            action,
            beastState,
            fromPlayer: userId,
          });
        });
        
        socket.emit('pvp:match:action:sent', { matchId });
      } catch (error: any) {
        console.error('[PVP Socket] Error sending match action:', error);
        socket.emit('pvp:error', { message: error.message || 'Error sending action' });
      }
    });
    
    // Partida: Atualizar estado
    socket.on('pvp:match:state', async (data: { matchId: number; state: any }) => {
      try {
        const { matchId, state } = data;
        
        const match = await getMatch(matchId);
        if (!match) {
          socket.emit('pvp:error', { message: 'Match not found' });
          return;
        }
        
        // Verificar se é participante
        if (match.player1Id !== userId && match.player2Id !== userId) {
          socket.emit('pvp:error', { message: 'Not a participant' });
          return;
        }
        
        // Enviar estado para o oponente
        const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
        const opponentSockets = getUserSockets(opponentId);
        
        opponentSockets.forEach(socketId => {
          io?.to(socketId).emit('pvp:match:state', {
            matchId,
            state,
            fromPlayer: userId,
          });
        });
      } catch (error: any) {
        console.error('[PVP Socket] Error updating match state:', error);
        socket.emit('pvp:error', { message: error.message || 'Error updating state' });
      }
    });
    
    // Desafio: Recebido
    socket.on('pvp:challenge:received', async (data: { challengeId: number }) => {
      // Notificação será enviada quando desafio for criado via API
    });
  });
  
  // Processar matchmaking periodicamente (a cada 5 segundos)
  setInterval(async () => {
    try {
      const season = await getCurrentSeason();
      if (!season) return;
      
      const matches = await processMatchmaking(season.number);
      
      for (const match of matches) {
        await handleMatchFound(match, season.number);
      }
    } catch (error) {
      console.error('[PVP Socket] Error processing matchmaking:', error);
    }
  }, 5000);
}

/**
 * Lida com match encontrado
 */
async function handleMatchFound(match: any, seasonNumber: number) {
  if (!io) return;
  
  try {
    // Criar partida
    const createdMatch = await createMatch(
      match.player1.userId,
      match.player2.userId,
      match.player1.beastId,
      match.player2.beastId,
      match.player1.matchType,
      seasonNumber
    );
    
    // Notificar ambos jogadores
    const player1Sockets = getUserSockets(match.player1.userId);
    const player2Sockets = getUserSockets(match.player2.userId);
    
    player1Sockets.forEach(socketId => {
      io?.to(socketId).emit('pvp:matchmaking:found', {
        matchId: createdMatch.id,
        opponent: {
          userId: match.player2.userId,
          beastId: match.player2.beastId,
        },
        matchType: match.player1.matchType,
      });
    });
    
    player2Sockets.forEach(socketId => {
      io?.to(socketId).emit('pvp:matchmaking:found', {
        matchId: createdMatch.id,
        opponent: {
          userId: match.player1.userId,
          beastId: match.player1.beastId,
        },
        matchType: match.player1.matchType,
      });
    });
    
    // Emitir evento de início de partida
    [...player1Sockets, ...player2Sockets].forEach(socketId => {
      io?.to(socketId).emit('pvp:match:start', {
        matchId: createdMatch.id,
        player1Id: match.player1.userId,
        player2Id: match.player2.userId,
        matchType: match.player1.matchType,
      });
    });
  } catch (error) {
    console.error('[PVP Socket] Error handling match found:', error);
  }
}

/**
 * Notifica jogadores sobre desafio recebido
 */
export function notifyChallengeReceived(challengedUserId: number, challengeData: any) {
  if (!io) return;
  
  const sockets = getUserSockets(challengedUserId);
  sockets.forEach(socketId => {
    io?.to(socketId).emit('pvp:challenge:received', challengeData);
  });
}

/**
 * Notifica jogadores sobre desafio aceito
 */
export function notifyChallengeAccepted(challengerUserId: number, challengeData: any) {
  if (!io) return;
  
  const sockets = getUserSockets(challengerUserId);
  sockets.forEach(socketId => {
    io?.to(socketId).emit('pvp:challenge:accepted', challengeData);
  });
}

/**
 * Notifica jogadores sobre desafio recusado
 */
export function notifyChallengeDeclined(challengerUserId: number, challengeData: any) {
  if (!io) return;
  
  const sockets = getUserSockets(challengerUserId);
  sockets.forEach(socketId => {
    io?.to(socketId).emit('pvp:challenge:declined', challengeData);
  });
}

/**
 * Busca sockets de um usuário
 */
let getUserSockets: (userId: number) => string[] = () => [];

