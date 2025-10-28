/**
 * Chat Service
 * Gerencia comunicação em tempo real via WebSocket (Socket.IO)
 * Beast Keepers Server
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Tipos de mensagem
export interface ChatMessage {
  id: string;
  channel: 'global' | 'group' | 'trade' | 'whisper' | 'system';
  sender: string;
  senderUserId: number;
  recipient?: string;
  message: string;
  timestamp: number;
  color: string;
}

interface ConnectedUser {
  userId: number;
  username: string;
  socketId: string;
  connectedAt: number;
}

// Cores de mensagem (padrão WoW)
const CHAT_COLORS = {
  global: '#FFFFFF',      // branco
  group: '#AAD372',       // verde
  trade: '#FFC864',       // laranja/amarelo
  whisper: '#FF7FD4',     // rosa
  system: '#FFFF00',      // amarelo
  error: '#FF0000',       // vermelho
};

// Usuários conectados (em memória)
const connectedUsers = new Map<string, ConnectedUser>(); // socketId -> user
const userSockets = new Map<number, Set<string>>(); // userId -> Set<socketId>

let io: SocketServer | null = null;

/**
 * Autentica socket connection via JWT token
 */
async function authenticateSocket(socket: Socket): Promise<{ userId: number; username: string } | null> {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  
  if (!token) {
    socket.emit('chat:error', { message: 'Authentication token required' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as any;
    
    // Buscar username do banco
    const userResult = await query(
      'SELECT id, display_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      socket.emit('chat:error', { message: 'User not found' });
      return null;
    }

    return {
      userId: decoded.id,
      username: userResult.rows[0].display_name,
    };
  } catch (error) {
    socket.emit('chat:error', { message: 'Invalid token' });
    return null;
  }
}

/**
 * Salva mensagem no banco de dados
 */
async function saveMessage(msg: ChatMessage): Promise<void> {
  try {
    await query(
      `INSERT INTO chat_messages (channel, sender_user_id, sender_username, recipient_username, message, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        msg.channel,
        msg.senderUserId,
        msg.sender,
        msg.recipient || null,
        msg.message,
        msg.timestamp
      ]
    );
  } catch (error) {
    console.error('[ChatService] Error saving message:', error);
  }
}

/**
 * Carrega histórico de mensagens do canal
 */
async function loadChannelHistory(channel: string, limit: number = 100): Promise<ChatMessage[]> {
  try {
    const result = await query(
      `SELECT id, channel, sender_user_id, sender_username, recipient_username, message, timestamp
       FROM chat_messages
       WHERE channel = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [channel, limit]
    );

    return result.rows.reverse().map(row => ({
      id: `msg-${row.id}`,
      channel: row.channel,
      sender: row.sender_username,
      senderUserId: row.sender_user_id,
      recipient: row.recipient_username || undefined,
      message: row.message,
      timestamp: parseInt(row.timestamp),
      color: CHAT_COLORS[row.channel as keyof typeof CHAT_COLORS] || CHAT_COLORS.global,
    }));
  } catch (error) {
    console.error('[ChatService] Error loading history:', error);
    return [];
  }
}

/**
 * Envia mensagem para usuário específico (whisper)
 */
function sendWhisperToUser(userId: number, message: ChatMessage): void {
  const socketIds = userSockets.get(userId);
  if (!socketIds || socketIds.size === 0) return;

  socketIds.forEach(socketId => {
    io?.to(socketId).emit('chat:message', message);
  });
}

/**
 * Inicializa o serviço de chat
 */
export function initializeChatService(server: HttpServer) {
    io = new SocketServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps)
          if (!origin) return callback(null, true);
          
          // Allow localhost (development)
          if (origin.includes('localhost')) {
            return callback(null, true);
          }
          
          // Allow any Vercel deployment URL
          if (origin.includes('vercel.app')) {
            return callback(null, true);
          }
          
          callback(null, true); // Permitir todas as origens por enquanto
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io/',
    });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    const user = await authenticateSocket(socket);
    if (user) {
      (socket as any).user = user;
      next();
    } else {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: Socket & { user?: { userId: number; username: string } }) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }

    const { userId, username } = socket.user;

    // Registrar usuário conectado
    connectedUsers.set(socket.id, {
      userId,
      username,
      socketId: socket.id,
      connectedAt: Date.now(),
    });

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    console.log(`[ChatService] User connected: ${username} (${socket.id})`);

    // Notificar outros usuários
    socket.broadcast.emit('chat:user-joined', {
      username,
      timestamp: Date.now(),
    });

    // Enviar mensagem de boas-vindas
    const welcomeMessage: ChatMessage = {
      id: `sys-${Date.now()}`,
      channel: 'system',
      sender: 'Sistema',
      senderUserId: 0,
      message: `Bem-vindo ao chat, ${username}!`,
      timestamp: Date.now(),
      color: CHAT_COLORS.system,
    };
    socket.emit('chat:message', welcomeMessage);

    // Event: Entrar em canal
    socket.on('chat:join', async (data: { channel: string }) => {
      const { channel } = data;
      
      // Validar canal
      const validChannels = ['global', 'group', 'trade'];
      if (!validChannels.includes(channel)) {
        socket.emit('chat:error', { message: 'Invalid channel' });
        return;
      }

      // Entrar na sala do canal
      socket.join(`channel:${channel}`);

      // Enviar histórico do canal
      const history = await loadChannelHistory(channel);
      socket.emit('chat:history', {
        channel,
        messages: history,
      });

      console.log(`[ChatService] ${username} joined channel: ${channel}`);
    });

    // Event: Enviar mensagem
    socket.on('chat:message', async (data: { channel: string; message: string }) => {
      const { channel, message } = data;

      if (!message || message.trim().length === 0) {
        return;
      }

      // Limitar tamanho da mensagem
      if (message.length > 500) {
        socket.emit('chat:error', { message: 'Message too long (max 500 characters)' });
        return;
      }

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channel: channel as ChatMessage['channel'],
        sender: username,
        senderUserId: userId,
        message: message.trim(),
        timestamp: Date.now(),
        color: CHAT_COLORS[channel as keyof typeof CHAT_COLORS] || CHAT_COLORS.global,
      };

      // Salvar no banco (exceto system)
      if (channel !== 'system') {
        await saveMessage(chatMessage);
      }

      // Enviar para sala do canal
      io?.to(`channel:${channel}`).emit('chat:message', chatMessage);

      console.log(`[ChatService] ${username} sent message to ${channel}: ${message.substring(0, 50)}...`);
    });

    // Event: Whisper (mensagem privada)
    socket.on('chat:whisper', async (data: { recipient: string; message: string }) => {
      const { recipient, message } = data;

      if (!message || message.trim().length === 0) {
        return;
      }

      // Buscar userId do destinatário
      const recipientResult = await query(
        'SELECT id, display_name FROM users WHERE display_name = $1',
        [recipient]
      );

      if (recipientResult.rows.length === 0) {
        socket.emit('chat:error', { message: `User "${recipient}" not found` });
        return;
      }

      const recipientUserId = recipientResult.rows[0].id;

      // Criar mensagem de whisper (para remetente)
      // O recipient indica para quem foi enviado
      const whisperToSender: ChatMessage = {
        id: `whisper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channel: 'whisper',
        sender: username,
        senderUserId: userId,
        recipient: recipient, // Para quem enviei
        message: message.trim(),
        timestamp: Date.now(),
        color: CHAT_COLORS.whisper,
      };

      // Criar mensagem de whisper (para destinatário)
      // O recipient indica para quem foi enviado (ele mesmo, para identificar que é para ele)
      const whisperToRecipient: ChatMessage = {
        id: `whisper-${Date.now()}-${Math.random().toString(36).substr(2, 10)}`,
        channel: 'whisper',
        sender: username, // Quem enviou (remetente)
        senderUserId: userId,
        recipient: recipient, // Para quem foi enviado (ele próprio)
        message: message.trim(),
        timestamp: Date.now(),
        color: CHAT_COLORS.whisper,
      };

      // Salvar no banco (ambas as mensagens)
      await saveMessage(whisperToSender);
      await saveMessage(whisperToRecipient);

      // Enviar para remetente
      socket.emit('chat:message', whisperToSender);

      // Enviar para destinatário
      sendWhisperToUser(recipientUserId, whisperToRecipient);

      console.log(`[ChatService] ${username} whispered to ${recipient}`);
    });

    // Event: Disconnect
    socket.on('disconnect', () => {
      console.log(`[ChatService] User disconnected: ${username} (${socket.id})`);

      // Remover de connectedUsers
      connectedUsers.delete(socket.id);

      // Remover de userSockets
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }

      // Notificar outros usuários
      socket.broadcast.emit('chat:user-left', {
        username,
        timestamp: Date.now(),
      });
    });

    // Event: Error handling
    socket.on('error', (error) => {
      console.error(`[ChatService] Socket error for ${username}:`, error);
    });
  });

  console.log('[ChatService] Chat service initialized');
}

/**
 * Função de cleanup periódico (chamada pelo event scheduler)
 */
export async function cleanupOldChatMessages() {
  try {
    await query('SELECT cleanup_old_chat_messages()');
    console.log('[ChatService] Cleaned up old chat messages');
  } catch (error) {
    console.error('[ChatService] Error cleaning up messages:', error);
  }
}

/**
 * Notifica todos os usuários online sobre eventos
 */
export function notifyOnlineUsers(message: { channel?: 'global' | 'group' | 'trade' | 'whisper' | 'system'; message: string; color?: string }) {
  if (!io) {
    console.warn('[ChatService] Socket.IO not initialized, cannot notify users');
    return;
  }

  const systemMessage: ChatMessage = {
    id: `sys-${Date.now()}`,
    channel: message.channel || 'system',
    sender: 'Sistema',
    senderUserId: 0,
    message: message.message,
    timestamp: Date.now(),
    color: message.color || CHAT_COLORS.system,
  };

  // Enviar para todos os usuários conectados
  io.emit('chat:message', systemMessage);
  console.log(`[ChatService] Notification sent to all online users: ${message.message.substring(0, 50)}...`);
}

