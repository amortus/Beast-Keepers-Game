/**
 * Chat UI
 * Interface de chat retrátil no canto inferior esquerdo
 * Beast Keepers Client
 */

import type { ChatMessage, ChatTab } from '../types';
import { connect, disconnect, joinChannel, sendMessage, sendWhisper, onMessage, onHistory, onUserJoined, onUserLeft, onError, onConnect, onFriendOnline, onFriendOffline, getConnectionStatus } from '../services/chatClient';

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
  private onlineUsers: Set<string> = new Set();
  
  // Autocomplete state
  private autocompleteVisible: boolean = false;
  private autocompleteSuggestions: string[] = [];
  private autocompleteSelectedIndex: number = 0;
  private autocompleteQuery: string = '';
  
  // Friends integration
  public onFriendStatusChange?: (username: string, isOnline: boolean) => void;

  // Callbacks
  public onMessageReceived?: (msg: ChatMessage) => void;

  constructor() {
    // Adicionar estilos CSS para animações
    if (!document.getElementById('chat-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'chat-ui-styles';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .chat-username:hover {
          opacity: 0.8;
          text-decoration: underline !important;
        }
        .chat-tab {
          transition: background-color 0.2s ease;
        }
        .chat-messages {
          scrollbar-width: thin;
          scrollbar-color: #4a5568 rgba(0, 0, 0, 0.3);
        }
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 3px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #5a6578;
        }
      `;
      document.head.appendChild(style);
    }

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
      transition: height 0.3s ease, box-shadow 0.3s ease;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      max-height: calc(100vh - 100px);
    `;
    document.body.appendChild(this.container);

    // Criar abas iniciais
    this.createDefaultTabs();
    this.activeTabId = this.tabs[0].id;

    // Verificar se há mensagens não lidas para notificar
    this.checkUnreadMessages();

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

  private clickHandler = (e: MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    
    // Autocomplete item click
    if (target.classList.contains('autocomplete-item')) {
      const index = parseInt(target.getAttribute('data-index') || '0');
      this.autocompleteSelectedIndex = index;
      this.applyAutocomplete();
      return;
    }
    
    // Toggle expand/collapse - clicar no header (mas não em tabs ou input)
    const header = target.closest('.chat-header');
    if (header) {
      const isInput = target.tagName === 'INPUT' || target.classList.contains('chat-input');
      const isInTabs = target.closest('.chat-tabs-container');
      
      if (!isInput && !isInTabs) {
        this.toggleExpanded();
        return;
      }
    }

    // Toggle via botão
    if (target.classList.contains('chat-toggle-btn') || target.closest('.chat-toggle-btn')) {
      this.toggleExpanded();
      return;
    }

    // Selecionar aba (não disparar se clicou no X de fechar)
    if (target.classList.contains('chat-tab-close')) {
      const tabId = target.getAttribute('data-tab-id');
      if (tabId) {
        this.closeTab(tabId);
      }
      return;
    }

    const tabElement = target.closest('.chat-tab');
    if (tabElement && !target.classList.contains('chat-tab-close')) {
      const tabId = tabElement.getAttribute('data-tab-id');
      if (tabId) {
        this.selectTab(tabId);
      }
      return;
    }

    // Enviar mensagem
    if (target.classList.contains('chat-send-btn') || target.closest('.chat-send-btn')) {
      this.handleSendMessage();
      return;
    }
  };

  private keydownHandler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    
    // Verificar se é o input do chat
    if (target.classList.contains('chat-input') || target.tagName === 'INPUT') {
      const input = target as HTMLInputElement;
      
      // Verificar se realmente está digitando - input deve estar focado E ter valor
      const isFocused = document.activeElement === input;
      const hasValue = input.value.trim().length > 0;
      
      // Autocomplete navigation
      if (this.autocompleteVisible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          this.autocompleteSelectedIndex = 
            (this.autocompleteSelectedIndex + 1) % this.autocompleteSuggestions.length;
          this.render();
          return;
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          this.autocompleteSelectedIndex = 
            (this.autocompleteSelectedIndex - 1 + this.autocompleteSuggestions.length) 
            % this.autocompleteSuggestions.length;
          this.render();
          return;
        }
        
        if (e.key === 'Tab' || (e.key === 'Enter' && this.autocompleteSuggestions.length > 0)) {
          e.preventDefault();
          e.stopPropagation();
          this.applyAutocomplete();
          return;
        }
        
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.autocompleteVisible = false;
          this.render();
          return;
        }
      }
      
      // Send message (apenas se: autocomplete não está ativo, está focado, tem conteúdo)
      if (e.key === 'Enter' && !e.shiftKey && !this.autocompleteVisible && isFocused && hasValue) {
        e.preventDefault();
        e.stopPropagation();
        this.handleSendMessage();
        return;
      }
    }
  };

  private inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('chat-input')) {
      const input = target as HTMLInputElement;
      this.inputValue = input.value;
      
      // Detectar @ para autocomplete
      const cursorPos = input.selectionStart || 0;
      const textBeforeCursor = input.value.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Buscar apenas se não há espaço após @
        if (!query.includes(' ')) {
          this.autocompleteQuery = query;
          this.autocompleteSuggestions = this.getAvailableNicks()
            .filter(nick => nick.toLowerCase().startsWith(query.toLowerCase()));
          this.autocompleteVisible = this.autocompleteSuggestions.length > 0;
          this.autocompleteSelectedIndex = 0;
          this.render();
          
          // Focar no input novamente para manter cursor
          setTimeout(() => {
            input.focus();
            input.setSelectionRange(cursorPos, cursorPos);
          }, 0);
        } else {
          this.autocompleteVisible = false;
          this.render();
        }
      } else {
        this.autocompleteVisible = false;
        this.render();
      }
    }
  };

  private blurHandler = (e: FocusEvent) => {
    // Fechar autocomplete quando perder foco (mas não se clicou no autocomplete)
    const target = e.target as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (target.classList.contains('chat-input')) {
      // Se o foco foi para dentro do container (autocomplete), não fechar
      if (relatedTarget && this.container.contains(relatedTarget) && relatedTarget.classList.contains('autocomplete-item')) {
        return;
      }
      
      // Fechar autocomplete após um pequeno delay para permitir click no item
      setTimeout(() => {
        if (!this.container.contains(document.activeElement) || !document.activeElement?.classList.contains('chat-input')) {
          this.autocompleteVisible = false;
          this.render();
        }
      }, 150);
    }
  };

  private setupEventListeners(): void {
    // Remover listeners anteriores se existirem
    this.container.removeEventListener('click', this.clickHandler);
    this.container.removeEventListener('keydown', this.keydownHandler);
    this.container.removeEventListener('input', this.inputHandler);
    this.container.removeEventListener('blur', this.blurHandler, true);
    
    // Adicionar novos listeners com event delegation
    this.container.addEventListener('click', this.clickHandler);
    this.container.addEventListener('keydown', this.keydownHandler);
    this.container.addEventListener('input', this.inputHandler);
    this.container.addEventListener('blur', this.blurHandler, true);

    // Scroll das mensagens
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', () => {
        this.scrollPosition = messagesContainer.scrollTop;
      });
    }

    // Clique em nomes de usuário para criar whisper
    const usernameElements = this.container.querySelectorAll('.chat-username');
    usernameElements.forEach((elem) => {
      elem.addEventListener('click', (e) => {
        const username = (e.target as HTMLElement).getAttribute('data-username');
        if (username) {
          const currentUsername = localStorage.getItem('username') || '';
          if (username !== currentUsername) {
            this.createWhisperTab(username);
            // Focar no input após criar aba
            setTimeout(() => {
              const input = this.container.querySelector('.chat-input') as HTMLInputElement;
              if (input) {
                input.focus();
                input.placeholder = `Enviar whisper para ${username}...`;
              }
            }, 100);
          }
        }
      });
    });
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
        tab.messages = data.messages.reverse(); // Reverter para ordem cronológica (mais antiga primeiro)
        // Se é a aba ativa, garantir renderização e scroll
        if (tab.id === this.activeTabId) {
          this.render();
          setTimeout(() => {
            this.scrollToBottom();
          }, 50);
        } else {
          this.render();
        }
      }
    });

    // Usuário entrou - armazenar mas NÃO mostrar mensagem pública e NÃO notificar
    // Apenas armazenar para autocomplete. Notificações de amigos vêm via onFriendOnline/onFriendOffline
    onUserJoined((data) => {
      this.onlineUsers.add(data.username);
      // NÃO chamar onFriendStatusChange aqui - isso seria para TODOS os usuários
      // Apenas o servidor (via friend:online/offline) deve notificar sobre amigos
    });

    // Usuário saiu - remover mas NÃO mostrar mensagem pública e NÃO notificar
    // Apenas remover da lista de usuários online
    onUserLeft((data) => {
      this.onlineUsers.delete(data.username);
      // NÃO chamar onFriendStatusChange aqui - isso seria para TODOS os usuários
      // Apenas o servidor (via friend:online/offline) deve notificar sobre amigos
    });

    // Amigo ficou online - mostrar mensagem de sistema
    onFriendOnline((data) => {
      this.addSystemMessage(`${data.username} está online`, false);
      if (this.onFriendStatusChange) {
        this.onFriendStatusChange(data.username, true);
      }
    });

    // Amigo ficou offline - mostrar mensagem de sistema
    onFriendOffline((data) => {
      this.addSystemMessage(`${data.username} ficou offline`, false);
      if (this.onFriendStatusChange) {
        this.onFriendStatusChange(data.username, false);
      }
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
    
    // Entrar nos canais padrão após conectar
    const setupChannels = () => {
      if (getConnectionStatus()) {
        // Entrar em todos os canais padrão
        joinChannel('global');
        joinChannel('group');
        joinChannel('trade');
        
        // Carregar histórico da aba ativa imediatamente (se não for whisper)
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.channel !== 'whisper') {
          // Validar que o canal é válido antes de fazer join
          const validChannels = ['global', 'group', 'trade'];
          if (validChannels.includes(activeTab.channel)) {
            joinChannel(activeTab.channel);
          }
        }
      } else {
        // Tentar novamente em 500ms
        setTimeout(setupChannels, 500);
      }
    };
    
    // Tentar após 500ms
    setTimeout(setupChannels, 500);
    
    // Também tentar quando conectar
    onConnect(() => {
      setupChannels();
    });
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
    this.container.style.height = this.isExpanded ? '400px' : '40px';
    this.render();

    // Auto-scroll para última mensagem quando expandir
    if (this.isExpanded) {
      setTimeout(() => {
        this.scrollToBottom();
        // Focar no input quando expandir para permitir digitar imediatamente
        const input = this.container.querySelector('.chat-input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
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
      // NUNCA tentar carregar histórico para whispers via joinChannel
      // Whispers não são canais - são conexões diretas entre usuários
      if (!tab.messages.length && getConnectionStatus() && tab.channel !== 'whisper') {
        // Validar que o canal é válido antes de fazer join
        const validChannels = ['global', 'group', 'trade'];
        if (validChannels.includes(tab.channel)) {
          joinChannel(tab.channel);
        }
      }
    }
    this.render();
    this.scrollToBottom();
    
    // Focar no input após selecionar aba
    setTimeout(() => {
      const input = this.container.querySelector('.chat-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 50);
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
      // Expandir se estiver retraído
      if (!this.isExpanded) {
        this.toggleExpanded();
      }
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
    
    // Expandir se estiver retraído
    if (!this.isExpanded) {
      this.toggleExpanded();
    }
    
    // Focar no input imediatamente
    setTimeout(() => {
      const input = this.container.querySelector('.chat-input') as HTMLInputElement;
      if (input && this.activeTabId === newTab.id) {
        input.focus();
        input.placeholder = 'Digite sua mensagem... (Enter para enviar)';
      }
    }, 100);
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
        this.checkUnreadMessages();
        
        // Adicionar animação visual na aba (piscar)
        if (!this.isExpanded) {
          const header = this.container.querySelector('div:first-child') as HTMLElement;
          if (header) {
            header.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
              header.style.animation = '';
            }, 500);
          }
        }
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

    // Fechar autocomplete se estiver aberto
    if (this.autocompleteVisible) {
      this.autocompleteVisible = false;
      this.render();
    }

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
   * Coleta nicks disponíveis para autocomplete
   */
  private getAvailableNicks(): string[] {
    const nicks = new Set<string>();
    const currentUsername = localStorage.getItem('username') || '';
    
    // Adicionar usuários das mensagens recentes
    this.tabs.forEach(tab => {
      tab.messages.forEach(msg => {
        if (msg.sender !== 'Sistema' && msg.sender !== currentUsername) {
          nicks.add(msg.sender);
        }
        // Também adicionar recipient de whispers se não for o usuário atual
        if (msg.recipient && msg.recipient !== currentUsername) {
          nicks.add(msg.recipient);
        }
      });
    });
    
    // Adicionar usuários online
    this.onlineUsers.forEach(user => {
      if (user !== currentUsername) {
        nicks.add(user);
      }
    });
    
    return Array.from(nicks).sort();
  }

  /**
   * Aplica autocomplete selecionado ao input
   */
  private applyAutocomplete(): void {
    if (this.autocompleteSuggestions.length === 0) return;
    
    const input = this.container.querySelector('.chat-input') as HTMLInputElement;
    if (!input) return;
    
    const selectedNick = this.autocompleteSuggestions[this.autocompleteSelectedIndex];
    const cursorPos = input.selectionStart || 0;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const textAfterCursor = input.value.substring(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) return;
    
    // Substituir @query por @nick
    const newText = 
      textBeforeCursor.substring(0, lastAtIndex) + 
      '@' + selectedNick + ' ' + 
      textAfterCursor;
    
    input.value = newText;
    this.inputValue = newText;
    
    // Posicionar cursor após o nick
    const newCursorPos = lastAtIndex + selectedNick.length + 2;
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    this.autocompleteVisible = false;
    this.render();
    
    // Focar no input novamente
    setTimeout(() => {
      input.focus();
    }, 0);
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
        padding: 8px 10px;
        background: rgba(26, 32, 44, 0.95);
        border-bottom: 1px solid #4a5568;
        cursor: pointer;
        user-select: none;
        min-height: 40px;
      " class="chat-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #fff; font-weight: bold;">💬 Chat</span>
          ${this.isExpanded ? `<span style="color: #888; font-size: 10px;">${activeTab?.name || ''}</span>` : ''}
        </div>
        <div class="chat-toggle-btn" style="
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
          padding: 5px 10px;
          user-select: none;
        ">${this.isExpanded ? '▼' : '▲'}</div>
      </div>

      ${this.isExpanded ? `
        <!-- Tabs -->
        <div class="chat-tabs-container" style="
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
                ${!isSystem ? `<span class="chat-username" data-username="${this.escapeHtml(msg.sender)}" style="color: ${isWhisper ? CHAT_COLORS.whisper : '#4FD1C7'}; font-weight: bold; cursor: pointer; text-decoration: underline;" title="Clique para enviar whisper">${this.escapeHtml(msg.sender)}</span>: ` : ''}
                <span style="color: ${msg.color};">${this.escapeHtml(msg.message)}</span>
              </div>
            `;
          }).join('') || '<div style="color: #888; text-align: center; padding: 20px;">Nenhuma mensagem ainda</div>'}
        </div>

        <!-- Input -->
        <div style="
          position: relative;
          display: flex;
          gap: 5px;
          padding: 5px;
          border-top: 1px solid #4a5568;
        ">
          ${this.autocompleteVisible ? `
            <div style="
              position: absolute;
              bottom: 100%;
              left: 5px;
              right: 85px;
              max-height: 150px;
              overflow-y: auto;
              background: rgba(20, 20, 40, 0.98);
              border: 1px solid #4a5568;
              border-radius: 4px;
              box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
              z-index: 10001;
              margin-bottom: 2px;
            ">
              ${this.autocompleteSuggestions.map((nick, index) => `
                <div class="autocomplete-item" data-index="${index}" style="
                  padding: 8px 10px;
                  cursor: pointer;
                  background: ${index === this.autocompleteSelectedIndex ? 'rgba(74, 85, 104, 0.8)' : 'transparent'};
                  color: ${index === this.autocompleteSelectedIndex ? '#4FD1C7' : '#fff'};
                  border-left: 3px solid ${index === this.autocompleteSelectedIndex ? '#4FD1C7' : 'transparent'};
                  font-weight: ${index === this.autocompleteSelectedIndex ? 'bold' : 'normal'};
                  font-family: monospace;
                  font-size: 12px;
                ">
                  @${this.escapeHtml(nick)}
                </div>
              `).join('')}
            </div>
          ` : ''}
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
   * Verifica mensagens não lidas e atualiza badge
   */
  private checkUnreadMessages(): void {
    const totalUnread = this.tabs.reduce((sum, tab) => sum + tab.unreadCount, 0);
    
    // Atualizar título da aba do navegador se houver mensagens não lidas
    if (totalUnread > 0 && !this.isExpanded) {
      document.title = `(${totalUnread}) Beast Keepers`;
    } else {
      document.title = 'Beast Keepers';
    }
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.container.removeEventListener('click', this.clickHandler);
    this.disconnect();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    document.title = 'Beast Keepers'; // Resetar título
  }
}

