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
        console.log(`[PVP Socket] pvp:matchmaking:join received: userId=${userId}, data=`, data);
        const { beastId, matchType } = data;
        
        if (!beastId || !matchType) {
          console.warn(`[PVP Socket] Invalid data: beastId=${beastId}, matchType=${matchType}`);
          socket.emit('pvp:error', { message: 'Beast ID and match type required' });
          return;
        }
        
        console.log(`[PVP Socket] Getting current season...`);
        const season = await getCurrentSeason();
        if (!season) {
          console.error('[PVP Socket] No active season');
          socket.emit('pvp:error', { message: 'No active season' });
          return;
        }
        
        console.log(`[PVP Socket] Season found: number=${season.number}, calling joinQueue...`);
        // Importar função dinamicamente para evitar dependência circular
        const { joinQueue } = await import('./pvpMatchmakingService');
        await joinQueue(userId, beastId, matchType, season.number);
        console.log(`[PVP Socket] ✅ joinQueue completed successfully for user ${userId}`);
        
        socket.emit('pvp:matchmaking:joined', { matchType });
        
        // Tentar encontrar match imediatamente
        console.log(`[PVP Socket] Trying to find immediate match...`);
        const match = await findMatch(userId, matchType, season.number);
        if (match) {
          console.log(`[PVP Socket] ✅ Immediate match found!`);
          await handleMatchFound(match, season.number);
        } else {
          console.log(`[PVP Socket] No immediate match found, player will wait in queue`);
        }
      } catch (error: any) {
        console.error(`[PVP Socket] Error joining matchmaking for user ${userId}:`, error);
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
  
  // Processar matchmaking periodicamente (a cada 10 segundos)
  // Usar variável para poder limpar o intervalo se necessário
  let matchmakingInterval: NodeJS.Timeout | null = null;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;
  let isMatchmakingPaused = false;
  let resumeTimeout: NodeJS.Timeout | null = null;
  
    const processMatchmakingLoop = async () => {
      // Se matchmaking está pausado, não fazer nada
      if (isMatchmakingPaused) {
        return;
      }
      
      try {
        const season = await getCurrentSeason();
        if (!season) {
          consecutiveErrors = 0; // Reset se não há temporada (não é erro de conexão)
          return;
        }
        
        // Tentar processar matchmaking, mas não quebrar se falhar
        try {
          const matches = await processMatchmaking(season.number);
          
          for (const match of matches) {
            try {
              await handleMatchFound(match, season.number);
            } catch (matchError: any) {
              console.error('[PVP Socket] Error handling match found:', matchError.message);
              // Continuar com próximo match mesmo se um falhar
            }
          }
        } catch (matchmakingError: any) {
          // Se processMatchmaking falhar, propagar o erro para tratamento externo
          throw matchmakingError;
        }
        
        // Reset contador de erros em caso de sucesso
        consecutiveErrors = 0;
    } catch (error: any) {
      // Verificar se é circuit breaker aberto (banco offline)
      const isCircuitOpen = error?.code === 'ECIRCUITOPEN' || 
                           error?.message?.includes('Circuit breaker is open');
      
      if (isCircuitOpen) {
        // Circuit breaker está aberto - banco está offline
        // Pausar matchmaking imediatamente sem contar erros
        if (!isMatchmakingPaused) {
          console.warn('[PVP Socket] Circuit breaker is open - database unavailable. Pausing matchmaking immediately.');
          
          isMatchmakingPaused = true;
          
          // Limpar intervalo atual
          if (matchmakingInterval) {
            clearInterval(matchmakingInterval);
            matchmakingInterval = null;
          }
          
          // Limpar qualquer timeout de retomada pendente
          if (resumeTimeout) {
            clearTimeout(resumeTimeout);
            resumeTimeout = null;
          }
          
          // Retomar após 2 minutos (circuit breaker tenta a cada 1 minuto)
          resumeTimeout = setTimeout(() => {
            console.log('[PVP Socket] Retrying matchmaking after circuit breaker pause...');
            isMatchmakingPaused = false;
            consecutiveErrors = 0;
            resumeTimeout = null;
            
            // Recriar o intervalo
            if (!matchmakingInterval) {
              matchmakingInterval = setInterval(processMatchmakingLoop, 10000);
            }
          }, 2 * 60 * 1000); // 2 minutos
        }
        return; // Não contar como erro, apenas pausar
      }
      
      consecutiveErrors++;
      
      // Verificar se é erro de conexão real (não circuit breaker)
      const isConnectionError = error?.message?.includes('timeout') || 
                                error?.message?.includes('ECONNREFUSED') || 
                                error?.message?.includes('connection') ||
                                error?.code === 'ETIMEDOUT' ||
                                error?.code === 'ECONNREFUSED';
      
      if (isConnectionError) {
        console.warn(`[PVP Socket] Database connection error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error.message);
        
        // Se houver muitos erros consecutivos de conexão, pausar o matchmaking
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !isMatchmakingPaused) {
          console.error(`[PVP Socket] Too many consecutive connection errors (${consecutiveErrors}). Pausing matchmaking for 5 minutes.`);
          
          // Marcar como pausado
          isMatchmakingPaused = true;
          
          // Limpar intervalo atual
          if (matchmakingInterval) {
            clearInterval(matchmakingInterval);
            matchmakingInterval = null;
          }
          
          // Limpar qualquer timeout de retomada pendente
          if (resumeTimeout) {
            clearTimeout(resumeTimeout);
            resumeTimeout = null;
          }
          
          // Criar apenas um timeout para retomar após 5 minutos
          resumeTimeout = setTimeout(() => {
            console.log('[PVP Socket] Retrying matchmaking after pause...');
            isMatchmakingPaused = false;
            consecutiveErrors = 0;
            resumeTimeout = null;
            
            // Recriar o intervalo
            if (!matchmakingInterval) {
              matchmakingInterval = setInterval(processMatchmakingLoop, 10000);
            }
          }, 5 * 60 * 1000); // 5 minutos
        }
      } else {
        console.error('[PVP Socket] Error processing matchmaking:', error);
        // Para erros não relacionados a conexão, apenas logar mas continuar
        // Reset contador após alguns erros não-críticos
        if (consecutiveErrors >= 10) {
          console.warn('[PVP Socket] Resetting error counter after non-connection errors');
          consecutiveErrors = 0;
        }
      }
    }
  };
  
  matchmakingInterval = setInterval(processMatchmakingLoop, 10000); // Aumentado para 10 segundos para reduzir carga
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

