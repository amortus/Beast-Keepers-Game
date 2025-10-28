/**
 * Chat UI
 * Interface de chat retrátil no canto inferior esquerdo
 * Beast Keepers Client
 */

import type { ChatMessage, ChatTab } from '../types';
import { connect, disconnect, joinChannel, sendMessage, sendWhisper, onMessage, onHistory, onUserJoined, onError, getConnectionStatus } from '../services/chatClient';

// Cores de mensagem (padrão WoW)
const CHAT_COLORS = {
  global: '#FFFFFF',      // branco
  group: '#AAD372',       // verde
  trade: '#FFC864',       // laranja/amarelo
  whisper: '#FF7FD4',     // rosa
  system: '#FFFF00',      // amarelo
  error: '#FF0000',       // vermelho
};

export class ChatUI {
  private container: HTMLDivElement;
  private isExpanded: boolean = false;
  private tabs: ChatTab[] = [];
  private activeTabId: string = '';
  private inputValue: string = '';
  private scrollPosition: number = 0;
  private maxScroll: number = 0;

  // Callbacks
  public onMessageReceived?: (msg: ChatMessage) => void;

  constructor() {
    // Criar container HTML
    this.container = document.createElement('div');
    this.container.id = 'chat-ui-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 400px;
      height: 40px;
      background: rgba(15, 15, 30, 0.95);
      border: 2px solid #4a5568;
      border-radius: 8px;
      z-index: 10000;
      overflow: hidden;
      transition: height 0.3s ease;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    `;
    document.body.appendChild(this.container);

    // Criar abas iniciais
    this.createDefaultTabs();
    this.activeTabId = this.tabs[0].id;

    // Renderizar
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    // Setup chat client callbacks
    this.setupChatCallbacks();
  }

  private createDefaultTabs(): void {
    this.tabs = [
      {
        id: 'global',
        name: 'Global',
        channel: 'global',
        unreadCount: 0,
        messages: [],
      },
      {
        id: 'group',
        name: 'Grupo',
        channel: 'group',
        unreadCount: 0,
        messages: [],
      },
      {
        id: 'trade',
        name: 'Comércio',
        channel: 'trade',
        unreadCount: 0,
        messages: [],
      },
    ];
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Toggle expand/collapse
      if (target.classList.contains('chat-toggle-btn')) {
        this.toggleExpanded();
        return;
      }

      // Selecionar aba
      if (target.classList.contains('chat-tab')) {
        const tabId = target.getAttribute('data-tab-id');
        if (tabId) {
          this.selectTab(tabId);
        }
        return;
      }

      // Fechar aba
      if (target.classList.contains('chat-tab-close')) {
        const tabId = target.getAttribute('data-tab-id');
        if (tabId) {
          this.closeTab(tabId);
        }
        return;
      }

      // Enviar mensagem
      if (target.classList.contains('chat-send-btn')) {
        this.handleSendMessage();
        return;
      }
    });

    // Input de mensagem
    const input = this.container.querySelector('.chat-input') as HTMLInputElement;
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSendMessage();
        }
      });

      input.addEventListener('input', (e) => {
        this.inputValue = (e.target as HTMLInputElement).value;
      });
    }

    // Scroll das mensagens
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', () => {
        this.scrollPosition = messagesContainer.scrollTop;
      });
    }
  }

  private setupChatCallbacks(): void {
    // Mensagens recebidas
    onMessage((msg) => {
      this.addMessage(msg);
      if (this.onMessageReceived) {
        this.onMessageReceived(msg);
      }
    });

    // Histórico de canal
    onHistory((data) => {
      const tab = this.tabs.find(t => t.channel === data.channel);
      if (tab) {
        tab.messages = data.messages;
        this.render();
      }
    });

    // Usuário entrou
    onUserJoined((data) => {
      this.addSystemMessage(`${data.username} entrou no jogo`);
    });

    // Erros
    onError((error) => {
      this.addSystemMessage(`Erro: ${error.message}`, true);
    });
  }

  /**
   * Conecta ao servidor de chat
   */
  public connect(token: string): void {
    connect(token);
    
    // Entrar nos canais padrão após conectar (com delay)
    setTimeout(() => {
      if (getConnectionStatus()) {
        joinChannel('global');
        joinChannel('group');
        joinChannel('trade');
      }
    }, 500);
  }

  /**
   * Desconecta do servidor
   */
  public disconnect(): void {
    disconnect();
  }

  /**
   * Alterna entre expandido e retraído
   */
  private toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.container.style.height = this.isExpanded ? '300px' : '40px';
    this.render();

    // Auto-scroll para última mensagem quando expandir
    if (this.isExpanded) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  /**
   * Seleciona uma aba
   */
  private selectTab(tabId: string): void {
    this.activeTabId = tabId;
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.unreadCount = 0; // Limpar contador não lidas
      if (!tab.messages.length && getConnectionStatus()) {
        // Carregar histórico se ainda não carregou
        joinChannel(tab.channel);
      }
    }
    this.render();
    this.scrollToBottom();
  }

  /**
   * Fecha uma aba (exceto as padrão)
   */
  private closeTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || tab.channel !== 'whisper') {
      return; // Não pode fechar abas padrão
    }

    this.tabs = this.tabs.filter(t => t.id !== tabId);

    // Selecionar primeira aba se fechou a ativa
    if (this.activeTabId === tabId && this.tabs.length > 0) {
      this.activeTabId = this.tabs[0].id;
    }

    this.render();
  }

  /**
   * Cria uma nova aba de whisper
   */
  public createWhisperTab(targetUsername: string): void {
    // Verificar se já existe
    const existing = this.tabs.find(t => t.channel === 'whisper' && t.target === targetUsername);
    if (existing) {
      this.selectTab(existing.id);
      return;
    }

    // Criar nova aba
    const newTab: ChatTab = {
      id: `whisper-${targetUsername}-${Date.now()}`,
      name: targetUsername,
      channel: 'whisper',
      target: targetUsername,
      unreadCount: 0,
      messages: [],
    };

    this.tabs.push(newTab);
    this.selectTab(newTab.id);
  }

  /**
   * Adiciona mensagem à aba correspondente
   */
  public addMessage(msg: ChatMessage): void {
    let targetTab: ChatTab | undefined;

    if (msg.channel === 'whisper') {
      // Para whispers, encontrar aba com o sender ou recipient correto
      const currentUsername = localStorage.getItem('username') || '';
      
      // Determinar quem é o outro usuário na conversa
      // Se eu sou o sender, o outro é o recipient
      // Se eu não sou o sender, o outro é o sender
      let otherUser: string | undefined;
      if (msg.sender === currentUsername) {
        // Eu enviei, então o outro é o recipient
        otherUser = msg.recipient;
      } else {
        // Recebi, então o outro é o sender
        otherUser = msg.sender;
      }
      
      if (otherUser) {
        targetTab = this.tabs.find(t => 
          t.channel === 'whisper' && t.target === otherUser
        );

        // Criar nova aba se não existe
        if (!targetTab) {
          this.createWhisperTab(otherUser);
          targetTab = this.tabs.find(t => t.id === this.activeTabId);
        }
      }
    } else {
      // Canais normais
      targetTab = this.tabs.find(t => t.channel === msg.channel);
    }

    if (targetTab) {
      // Limitar a 100 mensagens
      targetTab.messages.push(msg);
      if (targetTab.messages.length > 100) {
        targetTab.messages.shift();
      }

      // Incrementar contador não lidas se não é a aba ativa
      if (targetTab.id !== this.activeTabId) {
        targetTab.unreadCount++;
      }

      this.render();

      // Auto-scroll se é a aba ativa
      if (targetTab.id === this.activeTabId) {
        setTimeout(() => {
          this.scrollToBottom();
        }, 10);
      }
    }
  }

  /**
   * Adiciona mensagem do sistema
   */
  private addSystemMessage(message: string, isError: boolean = false): void {
    const systemMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      channel: 'system',
      sender: 'Sistema',
      senderUserId: 0,
      message,
      timestamp: Date.now(),
      color: isError ? CHAT_COLORS.error : CHAT_COLORS.system,
    };

    // Adicionar a todas as abas
    this.tabs.forEach(tab => {
      tab.messages.push(systemMsg);
      if (tab.messages.length > 100) {
        tab.messages.shift();
      }
    });

    this.render();
    setTimeout(() => this.scrollToBottom(), 10);
  }

  /**
   * Processa comandos de chat (/w, /pm, etc)
   */
  private parseCommand(input: string): { type: string; channel?: string; target?: string; message: string } | null {
    if (!input.startsWith('/')) {
      return null;
    }

    const parts = input.substring(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Whisper commands
    if (command === 'w' || command === 'whisper' || command === 'pm') {
      if (args.length < 2) {
        this.addSystemMessage('Uso: /w <usuário> <mensagem>', true);
        return null;
      }
      return {
        type: 'whisper',
        target: args[0],
        message: args.slice(1).join(' '),
      };
    }

    // Channel shortcuts
    if (command === 'g' || command === 'global') {
      return {
        type: 'channel',
        channel: 'global',
        message: args.join(' '),
      };
    }

    if (command === 'p' || command === 'party' || command === 'grupo') {
      return {
        type: 'channel',
        channel: 'group',
        message: args.join(' '),
      };
    }

    if (command === 'trade' || command === 'comercio') {
      return {
        type: 'channel',
        channel: 'trade',
        message: args.join(' '),
      };
    }

    return null;
  }

  /**
   * Envia mensagem
   */
  private handleSendMessage(): void {
    const input = this.container.querySelector('.chat-input') as HTMLInputElement;
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // Verificar se é comando
    const command = this.parseCommand(text);
    
    if (command) {
      if (command.type === 'whisper' && command.target) {
        // Criar aba de whisper se necessário
        this.createWhisperTab(command.target);
        
        // Enviar whisper
        if (getConnectionStatus()) {
          sendWhisper(command.target, command.message);
        }
        input.value = '';
        this.inputValue = '';
        return;
      }

      if (command.type === 'channel' && command.channel) {
        // Selecionar aba do canal e enviar
        const tab = this.tabs.find(t => t.channel === command.channel);
        if (tab) {
          this.selectTab(tab.id);
        }

        if (getConnectionStatus()) {
          sendMessage(command.channel, command.message);
        }
        input.value = '';
        this.inputValue = '';
        return;
      }
    }

    // Mensagem normal - usar aba ativa
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;

    if (getConnectionStatus()) {
      if (activeTab.channel === 'whisper' && activeTab.target) {
        sendWhisper(activeTab.target, text);
      } else {
        sendMessage(activeTab.channel, text);
      }
    }

    input.value = '';
    this.inputValue = '';
  }

  /**
   * Scroll para o final
   */
  private scrollToBottom(): void {
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Formata timestamp para exibição
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Renderiza a UI
   */
  private render(): void {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);

    this.container.innerHTML = `
      <!-- Header -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;
        background: rgba(26, 32, 44, 0.9);
        border-bottom: 1px solid #4a5568;
        cursor: pointer;
        user-select: none;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #fff; font-weight: bold;">💬 Chat</span>
          ${this.isExpanded ? `<span style="color: #888; font-size: 10px;">${activeTab?.name || ''}</span>` : ''}
        </div>
        <button class="chat-toggle-btn" style="
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
          padding: 0 5px;
        ">${this.isExpanded ? '▼' : '▲'}</button>
      </div>

      ${this.isExpanded ? `
        <!-- Tabs -->
        <div style="
          display: flex;
          gap: 2px;
          padding: 5px;
          background: rgba(15, 15, 30, 0.9);
          border-bottom: 1px solid #4a5568;
          overflow-x: auto;
        ">
          ${this.tabs.map(tab => `
            <div class="chat-tab" data-tab-id="${tab.id}" style="
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 5px 10px;
              background: ${tab.id === this.activeTabId ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
              color: ${tab.unreadCount > 0 ? '#ff6b6b' : '#fff'};
              border-radius: 4px;
              cursor: pointer;
              white-space: nowrap;
              font-size: 11px;
              position: relative;
            ">
              ${tab.name}
              ${tab.unreadCount > 0 ? `<span style="
                background: #ff6b6b;
                color: #fff;
                border-radius: 10px;
                padding: 1px 5px;
                font-size: 9px;
                margin-left: 3px;
              ">${tab.unreadCount}</span>` : ''}
              ${tab.channel === 'whisper' ? `<span class="chat-tab-close" data-tab-id="${tab.id}" style="
                margin-left: 5px;
                color: #888;
                cursor: pointer;
              ">×</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Messages -->
        <div class="chat-messages" style="
          height: 180px;
          overflow-y: auto;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
        ">
          ${activeTab?.messages.map(msg => {
            const isWhisper = msg.channel === 'whisper';
            const isSystem = msg.channel === 'system';
            const time = this.formatTime(msg.timestamp);
            const currentUsername = localStorage.getItem('username') || '';
            
            // Para whispers, mostrar indicador diferente
            let whisperPrefix = '';
            if (isWhisper && msg.recipient) {
              // Se o recipient é o usuário atual, significa que recebeu
              // Se o recipient é outro, significa que enviou
              if (msg.recipient === currentUsername) {
                whisperPrefix = `<span style="color: ${CHAT_COLORS.whisper};">[De ${msg.sender}]</span> `;
              } else {
                whisperPrefix = `<span style="color: ${CHAT_COLORS.whisper};">[Para ${msg.recipient}]</span> `;
              }
            }
            
            return `
              <div style="
                margin-bottom: 5px;
                line-height: 1.4;
                word-wrap: break-word;
              ">
                ${isSystem ? '' : `<span style="color: #888; font-size: 10px;">[${time}]</span> `}
                ${whisperPrefix}
                ${!isSystem ? `<span style="color: ${isWhisper ? CHAT_COLORS.whisper : '#4FD1C7'}; font-weight: bold;">${msg.sender}:</span> ` : ''}
                <span style="color: ${msg.color};">${this.escapeHtml(msg.message)}</span>
              </div>
            `;
          }).join('') || '<div style="color: #888; text-align: center; padding: 20px;">Nenhuma mensagem ainda</div>'}
        </div>

        <!-- Input -->
        <div style="
          display: flex;
          gap: 5px;
          padding: 5px;
          border-top: 1px solid #4a5568;
        ">
          <input type="text" class="chat-input" placeholder="Digite sua mensagem... (/w usuário msg)" style="
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #4a5568;
            border-radius: 4px;
            padding: 5px 10px;
            color: #fff;
            font-family: monospace;
            font-size: 12px;
          " value="${this.inputValue}">
          <button class="chat-send-btn" style="
            background: #4299e1;
            border: none;
            border-radius: 4px;
            padding: 5px 15px;
            color: #fff;
            cursor: pointer;
            font-weight: bold;
          ">Enviar</button>
        </div>
      ` : ''}
    `;

    // Re-setup event listeners após render
    this.setupEventListeners();
  }

  /**
   * Escape HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.disconnect();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

