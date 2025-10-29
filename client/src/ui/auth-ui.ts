/**
 * Authentication UI
 * Beast Keepers - Login and Registration
 * Usa inputs HTML reais para funcionalidade completa de seleção e navegação
 */

import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { authApi } from '../api/authApi';

type AuthScreen = 'welcome' | 'login' | 'register';

export class AuthUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScreen: AuthScreen = 'welcome';
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action: () => void }> = new Map();
  
  // HTML Inputs Container
  private inputsContainer: HTMLDivElement;
  private emailInput: HTMLInputElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private displayNameInput: HTMLInputElement | null = null;
  private confirmPasswordInput: HTMLInputElement | null = null;
  private errorElements: Map<string, HTMLDivElement> = new Map();
  
  // Form state
  private errorMessage: string = '';
  private isLoading: boolean = false;
  
  // Validação em tempo real
  private fieldErrors: Map<string, string> = new Map();
  private fieldValid: Map<string, boolean> = new Map();

  // Responsividade
  private scale: number = 1;
  private baseWidth: number = 800;
  private baseHeight: number = 700;
  private minScale: number = 0.6;
  private maxScale: number = 1.5;
  
  // Proteção contra loops infinitos
  private isDrawing: boolean = false;
  private isCalculatingScale: boolean = false;
  private resizeTimeout: NodeJS.Timeout | null = null;

  // Callbacks
  public onLoginSuccess: (token: string, user: any) => void = () => {};
  public onRegisterSuccess: (token: string, user: any) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Criar container para inputs HTML
    this.inputsContainer = document.createElement('div');
    this.inputsContainer.id = 'auth-inputs-container';
    this.inputsContainer.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 100;
    `;
    document.body.appendChild(this.inputsContainer);
    
    // Garantir que canvas fique acima dos inputs quando necessário
    this.canvas.style.zIndex = '99';
    
    this.setupEventListeners();
    this.calculateScale();
    
    // CORREÇÃO: Debounce no resize para evitar múltiplas chamadas
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.calculateScale();
      }, 150); // 150ms de debounce
    });
  }

  private calculateScale() {
    // CORREÇÃO: Proteção contra múltiplas chamadas simultâneas
    if (this.isCalculatingScale) {
      return;
    }
    this.isCalculatingScale = true;

    try {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const isMobile = containerWidth < 768;
      
      // Para mobile, ajustar baseWidth/baseHeight para melhor experiência
      if (isMobile) {
        this.baseWidth = 600;
        this.baseHeight = 800;
        this.minScale = 0.5;
      } else {
        this.baseWidth = 800;
        this.baseHeight = 700;
        this.minScale = 0.6;
      }
      
      // Calcular escala baseada na menor dimensão para manter proporção
      const scaleX = containerWidth / this.baseWidth;
      const scaleY = containerHeight / this.baseHeight;
      this.scale = Math.min(scaleX, scaleY);
      
      // Limitar escala entre min e max
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale));
      
      // Aplicar escala ao canvas
      this.canvas.width = this.baseWidth;
      this.canvas.height = this.baseHeight;
      this.canvas.style.width = `${this.baseWidth * this.scale}px`;
      this.canvas.style.height = `${this.baseHeight * this.scale}px`;
      
      // Centralizar canvas
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = '50%';
      this.canvas.style.top = '50%';
      this.canvas.style.transform = 'translate(-50%, -50%)';
      
      // Aplicar mesma escala e posição do canvas ao container de inputs
      // O container deve ter o mesmo tamanho visual que o canvas
      this.inputsContainer.style.width = `${this.baseWidth * this.scale}px`;
      this.inputsContainer.style.height = `${this.baseHeight * this.scale}px`;
      // Usar mesma transform do canvas para manter alinhamento
      this.inputsContainer.style.transform = 'translate(-50%, -50%)';
      
      // CORREÇÃO: NÃO chamar draw() aqui para evitar loop infinito
      // O draw() será chamado apenas quando necessário (mudança de tela, etc)
      // Se precisar redesenhar após resize, deve ser feito de forma controlada
      
      // Atualizar posições após um pequeno delay
      setTimeout(() => {
        this.updateInputPositions();
        // Redesenhar apenas se não estiver desenhando já
        if (!this.isDrawing) {
          this.draw();
        }
        this.isCalculatingScale = false;
      }, 50);
    } catch (error) {
      console.error('[AuthUI] Error in calculateScale:', error);
      this.isCalculatingScale = false;
    }
  }

  private createInputField(
    name: string,
    type: string,
    placeholder: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): HTMLInputElement {
    // Remover input existente se houver
    const existing = this.inputsContainer.querySelector(`[data-field="${name}"]`) as HTMLInputElement;
    if (existing) {
      existing.remove();
    }

    const input = document.createElement('input');
    input.type = type;
    input.dataset.field = name;
    input.placeholder = placeholder;
    input.autocomplete = type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'off';
    
    // Posicionamento absoluto no container
    input.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      height: ${height}px;
      background: linear-gradient(to bottom, #2a2a3e, #1a1a2e);
      border: 2px solid ${COLORS.ui.textDim};
      border-radius: 0;
      padding: 0 ${45 * this.scale}px 0 ${20 * this.scale}px;
      color: ${COLORS.ui.text};
      font-family: monospace;
      font-size: ${20 * this.scale}px;
      font-weight: bold;
      outline: none;
      pointer-events: all;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
      z-index: 101;
    `;

    // Event listeners para validação em tempo real
    input.addEventListener('input', () => {
      this.validateField(name, input.value);
      this.updateInputStyle(input, name);
    });

    input.addEventListener('focus', () => {
      this.updateInputStyle(input, name, true);
    });

    input.addEventListener('blur', () => {
      this.updateInputStyle(input, name, false);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleEnterKey(name);
      }
    });

    this.inputsContainer.appendChild(input);
    return input;
  }

  private createErrorElement(name: string, x: number, y: number, width: number): HTMLDivElement {
    const existing = this.errorElements.get(name);
    if (existing) {
      existing.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.dataset.field = name;
    errorDiv.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      color: ${COLORS.ui.error};
      font-family: monospace;
      font-size: 14px;
      pointer-events: none;
      display: none;
    `;

    this.inputsContainer.appendChild(errorDiv);
    this.errorElements.set(name, errorDiv);
    return errorDiv;
  }

  private updateInputStyle(input: HTMLInputElement, fieldName: string, isFocused: boolean = false) {
    const fieldError = this.fieldErrors.get(fieldName);
    const isValid = this.fieldValid.get(fieldName);
    const hasValue = input.value.length > 0;
    const borderColor = this.currentScreen === 'login' ? COLORS.primary.purple : COLORS.primary.green;

    let finalBorderColor = COLORS.ui.textDim;
    if (isFocused) {
      finalBorderColor = borderColor;
      input.style.boxShadow = `0 0 15px ${this.currentScreen === 'login' ? 'rgba(159, 122, 234, 0.4)' : 'rgba(72, 187, 120, 0.4)'}`;
    } else if (hasValue) {
      if (fieldError) {
        finalBorderColor = COLORS.ui.error;
        input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
      } else if (isValid) {
        finalBorderColor = COLORS.primary.green;
        input.style.boxShadow = '0 0 10px rgba(72, 187, 120, 0.2)';
      } else {
        input.style.boxShadow = 'none';
      }
    } else {
      input.style.boxShadow = 'none';
    }

    input.style.borderColor = finalBorderColor;
    input.style.borderWidth = isFocused ? '4px' : (hasValue && (isValid || fieldError) ? '3px' : '2px');

    // Atualizar ícone de validação
    this.updateValidationIcon(input, fieldName, isValid, fieldError, hasValue);
    
    // Atualizar mensagem de erro
    this.updateErrorMessage(fieldName, fieldError);
  }

  private updateValidationIcon(
    input: HTMLInputElement,
    fieldName: string,
    isValid: boolean | undefined,
    fieldError: string | undefined,
    hasValue: boolean
  ) {
    // Criar ou atualizar elemento de ícone
    let icon = input.parentElement?.querySelector(`[data-icon="${fieldName}"]`) as HTMLDivElement;
    
    if (!icon && hasValue && !input.matches(':focus')) {
      icon = document.createElement('div');
      icon.dataset.icon = fieldName;
      icon.style.cssText = `
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        z-index: 10;
      `;
      input.parentElement?.appendChild(icon);
    }

    if (icon) {
      if (hasValue && !input.matches(':focus')) {
        if (isValid) {
          icon.textContent = '✓';
          icon.style.color = COLORS.primary.green;
          icon.style.display = 'block';
        } else if (fieldError) {
          icon.textContent = '✗';
          icon.style.color = COLORS.ui.error;
          icon.style.display = 'block';
        } else {
          icon.style.display = 'none';
        }
      } else {
        icon.style.display = 'none';
      }
    }
  }

  private updateErrorMessage(fieldName: string, error: string | undefined) {
    const errorEl = this.errorElements.get(fieldName);
    if (errorEl) {
      if (error) {
        errorEl.textContent = error;
        errorEl.style.display = 'block';
      } else {
        errorEl.style.display = 'none';
      }
    }
  }

  private validateField(fieldName: string, value: string) {
    switch (fieldName) {
      case 'email':
        this.validateEmail(value);
        break;
      case 'password':
        this.validatePassword(value);
        break;
      case 'displayName':
        this.validateDisplayName(value);
        break;
      case 'confirmPassword':
        this.validateConfirmPassword(value);
        break;
    }
  }

  private validateEmail(email: string) {
    if (!email) {
      this.fieldErrors.delete('email');
      this.fieldValid.delete('email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.fieldErrors.set('email', 'Email inválido');
      this.fieldValid.set('email', false);
    } else {
      this.fieldErrors.delete('email');
      this.fieldValid.set('email', true);
    }

    const input = this.emailInput;
    if (input) {
      this.updateInputStyle(input, 'email', input === document.activeElement);
    }
  }

  private validatePassword(password: string) {
    if (!password) {
      this.fieldErrors.delete('password');
      this.fieldValid.delete('password');
      if (this.confirmPasswordInput && this.confirmPasswordInput.value) {
        this.validateConfirmPassword(this.confirmPasswordInput.value);
      }
      return;
    }

    if (password.length < 6) {
      this.fieldErrors.set('password', 'Senha deve ter no mínimo 6 caracteres');
      this.fieldValid.set('password', false);
      } else {
      this.fieldErrors.delete('password');
      this.fieldValid.set('password', true);
    }

    // Revalidar confirmação se existir
    if (this.confirmPasswordInput && this.confirmPasswordInput.value) {
      this.validateConfirmPassword(this.confirmPasswordInput.value);
    }

    const input = this.passwordInput;
    if (input) {
      this.updateInputStyle(input, 'password', input === document.activeElement);
    }
  }

  private validateDisplayName(displayName: string) {
    if (!displayName) {
      this.fieldErrors.delete('displayName');
      this.fieldValid.delete('displayName');
      return;
    }

    if (displayName.length < 3) {
      this.fieldErrors.set('displayName', 'Nome deve ter no mínimo 3 caracteres');
      this.fieldValid.set('displayName', false);
    } else if (displayName.length > 20) {
      this.fieldErrors.set('displayName', 'Nome deve ter no máximo 20 caracteres');
      this.fieldValid.set('displayName', false);
    } else {
      this.fieldErrors.delete('displayName');
      this.fieldValid.set('displayName', true);
    }

    const input = this.displayNameInput;
    if (input) {
      this.updateInputStyle(input, 'displayName', input === document.activeElement);
    }
  }

  private validateConfirmPassword(confirmPassword: string) {
    if (!confirmPassword) {
      this.fieldErrors.delete('confirmPassword');
      this.fieldValid.delete('confirmPassword');
      return;
    }

    const password = this.passwordInput?.value || '';
    if (confirmPassword !== password) {
      this.fieldErrors.set('confirmPassword', 'As senhas não coincidem');
      this.fieldValid.set('confirmPassword', false);
    } else {
      this.fieldErrors.delete('confirmPassword');
      this.fieldValid.set('confirmPassword', true);
    }

    const input = this.confirmPasswordInput;
    if (input) {
      this.updateInputStyle(input, 'confirmPassword', input === document.activeElement);
    }
  }

  private handleEnterKey(fieldName: string) {
    if (this.currentScreen === 'login') {
      if (fieldName === 'email') {
        this.passwordInput?.focus();
      } else if (fieldName === 'password') {
        this.handleLogin();
      }
    } else if (this.currentScreen === 'register') {
      if (fieldName === 'email') {
        this.displayNameInput?.focus();
      } else if (fieldName === 'displayName') {
        this.passwordInput?.focus();
      } else if (fieldName === 'password') {
        this.confirmPasswordInput?.focus();
      } else if (fieldName === 'confirmPassword') {
        this.handleRegister();
      }
    }
  }

  private setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleClick(e: MouseEvent) {
    // CORREÇÃO: Proteção adicional contra cliques durante operações críticas
    if (this.isDrawing || this.isCalculatingScale) {
      console.warn('[AuthUI] Click ignored - UI is updating');
      return;
    }
    
    // Ignorar cliques em inputs HTML
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('#auth-inputs-container')) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    
    // CORREÇÃO: O canvas.width/height são as dimensões internas (baseWidth/baseHeight)
    // O rect.width/height são as dimensões visuais (escaladas)
    // Para converter coordenadas de tela para coordenadas do canvas interno:
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    // Coordenadas do mouse em pixels do canvas interno
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check buttons - usar coordenadas do canvas interno
    this.buttons.forEach((btn) => {
      if (isMouseOver(x, y, btn.x, btn.y, btn.width, btn.height)) {
        // Parar propagação
        e.stopPropagation();
        e.preventDefault();
        
        // CORREÇÃO: Debounce para evitar múltiplos cliques rápidos
        if (this.isDrawing) {
          console.warn('[AuthUI] Button click ignored - already drawing');
          return;
        }
        
        // Executar ação do botão
        btn.action();
        return; // Parar após encontrar o botão clicado
      }
    });
  }

  private async handleLogin() {
    if (this.isLoading) return;

    this.errorMessage = '';

    const email = this.emailInput?.value || '';
    const password = this.passwordInput?.value || '';

    if (!email || !password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.draw();
      return;
    }

    this.isLoading = true;
    this.draw();

    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        this.onLoginSuccess(response.data.token, response.data.user);
      } else {
        this.errorMessage = response.error || 'Erro ao fazer login';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao conectar com servidor';
    } finally {
      this.isLoading = false;
      this.draw();
    }
  }

  private async handleRegister() {
    if (this.isLoading) return;

    this.errorMessage = '';

    const email = this.emailInput?.value || '';
    const password = this.passwordInput?.value || '';
    const displayName = this.displayNameInput?.value || '';
    const confirmPassword = this.confirmPasswordInput?.value || '';

    if (!email || !password || !displayName) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.draw();
      return;
    }

    if (password !== confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      this.draw();
      return;
    }

    if (password.length < 6) {
      this.errorMessage = 'Senha deve ter no mínimo 6 caracteres';
      this.draw();
      return;
    }

    this.isLoading = true;
    this.draw();

    try {
      const response = await authApi.register(email, password, displayName);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        this.onRegisterSuccess(response.data.token, response.data.user);
      } else {
        this.errorMessage = response.error || 'Erro ao registrar';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao conectar com servidor';
    } finally {
      this.isLoading = false;
      this.draw();
    }
  }

  draw() {
    // CORREÇÃO: Proteção contra chamadas recursivas que podem causar loop infinito
    if (this.isDrawing) {
      console.warn('[AuthUI] draw() called while already drawing - skipping');
      return;
    }
    
    this.isDrawing = true;
    
    try {
      // IMPORTANTE: Sempre limpar botões antes de redesenhar para evitar botões órfãos
      this.buttons.clear();

      // Limpar inputs existentes quando mudar de tela para welcome
      if (this.currentScreen === 'welcome') {
        this.clearInputs();
      }

      // Redesenhar a tela atual
      if (this.currentScreen === 'welcome') {
        this.drawWelcomeScreen();
      } else if (this.currentScreen === 'login') {
        this.drawLoginScreen();
        // Atualizar posições após desenhar
        setTimeout(() => this.updateInputPositions(), 10);
      } else if (this.currentScreen === 'register') {
        this.drawRegisterScreen();
        // Atualizar posições após desenhar
        setTimeout(() => this.updateInputPositions(), 10);
      }
    } catch (error) {
      console.error('[AuthUI] Error in draw():', error);
    } finally {
      // Sempre liberar o flag após um pequeno delay para evitar travamentos
      setTimeout(() => {
        this.isDrawing = false;
      }, 10);
    }
  }

  private clearInputs() {
    this.inputsContainer.innerHTML = '';
    this.emailInput = null;
    this.passwordInput = null;
    this.displayNameInput = null;
    this.confirmPasswordInput = null;
    this.errorElements.clear();
  }

  private updateInputPositions() {
    if (this.currentScreen === 'login') {
      this.updateLoginInputPositions();
    } else if (this.currentScreen === 'register') {
      this.updateRegisterInputPositions();
    }
  }

  private updateLoginInputPositions() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 700;
    const panelHeight = isMobile ? 700 : 650;
    const panelX = (this.baseWidth - panelWidth) / 2;
    const panelY = (this.baseHeight - panelHeight) / 2;

    const fieldWidth = isMobile ? panelWidth - 80 : 600;
    const fieldHeight = isMobile ? 50 : 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    // Escalar coordenadas para corresponder ao container escalado
    const scaledX = fieldX * this.scale;
    const scaledEmailY = (panelY + 210) * this.scale;
    let scaledPasswordY = (panelY + 330) * this.scale;
    if (this.fieldErrors.get('email')) scaledPasswordY += 25 * this.scale;
    
    const scaledWidth = fieldWidth * this.scale;
    const scaledHeight = fieldHeight * this.scale;

    // Email
    if (this.emailInput) {
      this.emailInput.style.left = `${scaledX}px`;
      this.emailInput.style.top = `${scaledEmailY}px`;
      this.emailInput.style.width = `${scaledWidth}px`;
      this.emailInput.style.height = `${scaledHeight}px`;
      this.emailInput.style.fontSize = `${20 * this.scale}px`;
      this.emailInput.style.padding = `0 ${45 * this.scale}px 0 ${20 * this.scale}px`;
      
      const errorEl = this.errorElements.get('email');
      if (errorEl) {
        errorEl.style.left = `${scaledX}px`;
        errorEl.style.top = `${scaledEmailY + scaledHeight + 5 * this.scale}px`;
        errorEl.style.width = `${scaledWidth}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
    }

    // Password
    if (this.passwordInput) {
      this.passwordInput.style.left = `${scaledX}px`;
      this.passwordInput.style.top = `${scaledPasswordY}px`;
      this.passwordInput.style.width = `${scaledWidth}px`;
      this.passwordInput.style.height = `${scaledHeight}px`;
      this.passwordInput.style.fontSize = `${20 * this.scale}px`;
      this.passwordInput.style.padding = `0 ${45 * this.scale}px 0 ${20 * this.scale}px`;
      
      const errorEl = this.errorElements.get('password');
      if (errorEl) {
        errorEl.style.left = `${scaledX}px`;
        errorEl.style.top = `${scaledPasswordY + scaledHeight + 5 * this.scale}px`;
        errorEl.style.width = `${scaledWidth}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
    }
  }

  private updateRegisterInputPositions() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 750;
    const panelHeight = isMobile ? Math.min(850, this.baseHeight - 20) : 750;
    const panelX = (this.baseWidth - panelWidth) / 2;
    const panelY = (this.baseHeight - panelHeight) / 2;

    const fieldWidth = isMobile ? panelWidth - 80 : 600;
    const fieldHeight = isMobile ? 50 : 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    // Escalar coordenadas
    const scaledX = fieldX * this.scale;
    const scaledWidth = fieldWidth * this.scale;
    const scaledHeight = fieldHeight * this.scale;

    let currentY = panelY + 170;

    // Email
    if (this.emailInput) {
      const scaledY = currentY * this.scale;
      this.emailInput.style.left = `${scaledX}px`;
      this.emailInput.style.top = `${scaledY}px`;
      this.emailInput.style.width = `${scaledWidth}px`;
      this.emailInput.style.height = `${scaledHeight}px`;
      this.emailInput.style.fontSize = `${20 * this.scale}px`;
      this.emailInput.style.padding = `0 ${45 * this.scale}px 0 ${20 * this.scale}px`;
      
      const errorEl = this.errorElements.get('email');
      if (errorEl) {
        errorEl.style.left = `${scaledX}px`;
        errorEl.style.top = `${scaledY + scaledHeight + 5 * this.scale}px`;
        errorEl.style.width = `${scaledWidth}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
      
      if (this.fieldErrors.get('email')) currentY += 25;
    }

    // Display Name
    if (this.displayNameInput) {
      currentY += 110;
      const scaledY = currentY * this.scale;
      this.displayNameInput.style.left = `${scaledX}px`;
      this.displayNameInput.style.top = `${scaledY}px`;
      this.displayNameInput.style.width = `${scaledWidth}px`;
      this.displayNameInput.style.height = `${scaledHeight}px`;
      this.displayNameInput.style.fontSize = `${20 * this.scale}px`;
      this.displayNameInput.style.padding = `0 ${45 * this.scale}px 0 ${20 * this.scale}px`;
      
      const errorEl = this.errorElements.get('displayName');
      if (errorEl) {
        errorEl.style.left = `${scaledX}px`;
        errorEl.style.top = `${scaledY + scaledHeight + 5 * this.scale}px`;
        errorEl.style.width = `${scaledWidth}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
      
      if (this.fieldErrors.get('displayName')) currentY += 25;
    }

    // Password
    if (this.passwordInput) {
      currentY += 110;
      const scaledY = currentY * this.scale;
      this.passwordInput.style.left = `${scaledX}px`;
      this.passwordInput.style.top = `${scaledY}px`;
      this.passwordInput.style.width = `${scaledWidth}px`;
      this.passwordInput.style.height = `${scaledHeight}px`;
      this.passwordInput.style.fontSize = `${20 * this.scale}px`;
      this.passwordInput.style.padding = `0 ${45 * this.scale}px 0 ${20 * this.scale}px`;
      
      const errorEl = this.errorElements.get('password');
      if (errorEl) {
        errorEl.style.left = `${scaledX}px`;
        errorEl.style.top = `${scaledY + scaledHeight + 5 * this.scale}px`;
        errorEl.style.width = `${scaledWidth}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
      
      if (this.fieldErrors.get('password')) currentY += 25;
    }

    // Confirm Password
    if (this.confirmPasswordInput) {
      currentY += 110;
      const scaledY = currentY * this.scale;
      this.confirmPasswordInput.style.left = `${scaledX}px`;
      this.confirmPasswordInput.style.top = `${scaledY}px`;
      this.confirmPasswordInput.style.width = `${scaledWidth}px`;
      this.confirmPasswordInput.style.height = `${scaledHeight}px`;
      this.confirmPasswordInput.style.fontSize = `${20 * this.scale}px`;
      this.confirmPasswordInput.style.padding = `0 ${45 * this.scale}px 0 ${20 * this.scale}px`;
      
      const errorEl = this.errorElements.get('confirmPassword');
      if (errorEl) {
        errorEl.style.left = `${scaledX}px`;
        errorEl.style.top = `${scaledY + scaledHeight + 5 * this.scale}px`;
        errorEl.style.width = `${scaledWidth}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
    }
  }

  private drawWelcomeScreen() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 700;
    const panelHeight = isMobile ? 700 : 650;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 30;
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.gold
    });
    this.ctx.shadowBlur = 0;

    // Title (larger)
    drawText(this.ctx, '🐉 BEAST KEEPERS', panelX + panelWidth / 2, panelY + 90, {
      font: 'bold 48px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Bem-vindo ao mundo de Aurath', panelX + panelWidth / 2, panelY + 150, {
      font: 'bold 22px monospace',
      color: COLORS.ui.text,
      align: 'center'
    });

    // Description
    const descriptions = [
      'Crie, treine e batalhe com criaturas místicas.',
      'Explore zonas perigosas, participe de torneios,',
      'e prove seu valor como Guardião!'
    ];
    descriptions.forEach((desc, i) => {
      drawText(this.ctx, desc, panelX + panelWidth / 2, panelY + 200 + i * 25, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
        align: 'center'
      });
    });

    // Separator line
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(panelX + 150, panelY + 300);
    this.ctx.lineTo(panelX + panelWidth - 150, panelY + 300);
    this.ctx.stroke();

    // CORREÇÃO: Ajustar tamanho dos botões para não ultrapassar o painel
    // panelWidth pode ser 700 (desktop) ou 550 (mobile)
    // Usar largura dinâmica baseada no painel
    const buttonPadding = isMobile ? 50 : 100;
    const buttonWidth = panelWidth - (buttonPadding * 2);
    const buttonX = panelX + buttonPadding;

    // Login button
    const loginBtnY = panelY + 340;
    drawButton(this.ctx, buttonX, loginBtnY, buttonWidth, 60, '🔐 Entrar', {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark
    });
    this.buttons.set('login', {
      x: buttonX,
      y: loginBtnY,
      width: buttonWidth,
      height: 60,
      action: () => {
        // CORREÇÃO: Proteção contra múltiplos cliques
        if (this.isDrawing || this.currentScreen === 'login') {
          console.warn('[AuthUI] Login button clicked while already in login screen or drawing - ignoring');
          return;
        }
        
        console.log('[AuthUI] Switching to login screen');
        this.currentScreen = 'login';
        // Limpar inputs quando mudar para login
        this.clearInputs();
        // Limpar botões e redesenhar - mas com proteção contra loops
        setTimeout(() => {
          if (!this.isDrawing) {
            this.draw();
          }
        }, 10);
      }
    });

    // Register button
    const registerBtnY = panelY + 420;
    drawButton(this.ctx, buttonX, registerBtnY, buttonWidth, 60, '✨ Criar Conta', {
      bgColor: COLORS.primary.green,
      hoverColor: '#2d8659'
    });
    this.buttons.set('register', {
      x: buttonX,
      y: registerBtnY,
      width: buttonWidth,
      height: 60,
      action: () => {
        // CORREÇÃO: Proteção contra múltiplos cliques que podem causar loop
        if (this.isDrawing || this.currentScreen === 'register') {
          console.warn('[AuthUI] Register button clicked while already in register screen or drawing - ignoring');
          return;
        }
        
        console.log('[AuthUI] Switching to register screen');
        this.currentScreen = 'register';
        // Limpar inputs quando mudar para registro
        this.clearInputs();
        // Limpar botões e redesenhar - mas com proteção contra loops
        setTimeout(() => {
          if (!this.isDrawing) {
            this.draw();
          }
        }, 10);
      }
    });

    // Google button - usar mesmo tamanho dos outros botões
    const googleBtnY = panelY + 520;
    drawButton(this.ctx, buttonX, googleBtnY, buttonWidth, 60, '🔗 Entrar com Google', {
      bgColor: '#4285f4',
      hoverColor: '#357ae8'
    });
    this.buttons.set('google', {
      x: buttonX,
      y: googleBtnY,
      width: buttonWidth,
      height: 60,
      action: () => {
        authApi.googleLogin();
      }
    });

    // Note
    drawText(this.ctx, '(Google OAuth não configurado)', panelX + panelWidth / 2, panelY + 595, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });
  }

  private drawLoginScreen() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 700;
    const panelHeight = isMobile ? 700 : 650;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 30;
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.purple
    });
    this.ctx.shadowBlur = 0;

    // Title
    drawText(this.ctx, '🔐 LOGIN', panelX + panelWidth / 2, panelY + 80, {
      font: 'bold 48px monospace',
      color: COLORS.primary.purple,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Entre com sua conta', panelX + panelWidth / 2, panelY + 140, {
      font: '18px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });

    // Labels e inputs
    const fieldWidth = isMobile ? panelWidth - 80 : 600;
    const fieldHeight = isMobile ? 50 : 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    // Email label
    drawText(this.ctx, 'Email:', fieldX, panelY + 190, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    // Email input - sempre atualizar posição
    if (!this.emailInput) {
      this.emailInput = this.createInputField('email', 'email', 'Digite seu email...', fieldX, panelY + 210, fieldWidth, fieldHeight);
      this.createErrorElement('email', fieldX, panelY + 210 + fieldHeight + 5, fieldWidth);
    } else {
      // Posição será atualizada pelo updateInputPositions()
    }

    // Password label
    let passwordY = panelY + 310;
    if (this.fieldErrors.get('email')) passwordY += 25;
    
    drawText(this.ctx, 'Senha:', fieldX, passwordY - 20, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    // Password input - sempre atualizar posição
    if (!this.passwordInput) {
      this.passwordInput = this.createInputField('password', 'password', 'Digite sua senha...', fieldX, passwordY, fieldWidth, fieldHeight);
      this.createErrorElement('password', fieldX, passwordY + fieldHeight + 5, fieldWidth);
    } else {
      // Posição será atualizada pelo updateInputPositions()
    }

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 440, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // CORREÇÃO: Botões ajustados para não ultrapassar o painel
    const buttonPadding = isMobile ? 50 : 75;
    const buttonWidth = panelWidth - (buttonPadding * 2);
    const buttonX = panelX + buttonPadding;

    // Login button
    const loginBtnY = panelY + 480;
    const btnText = this.isLoading ? '⏳ Entrando...' : '▶ Entrar';
    drawButton(this.ctx, buttonX, loginBtnY, buttonWidth, 60, btnText, {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark,
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: buttonX,
        y: loginBtnY,
        width: buttonWidth,
        height: 60,
        action: () => this.handleLogin()
      });
    }

    // Back button - centralizado e menor
    const backBtnY = panelY + 565;
    const backButtonWidth = Math.min(300, panelWidth - 100);
    const backButtonX = panelX + (panelWidth - backButtonWidth) / 2;
    drawButton(this.ctx, backButtonX, backBtnY, backButtonWidth, 50, '← Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: backButtonX,
      y: backBtnY,
      width: backButtonWidth,
      height: 50,
      action: () => {
        this.currentScreen = 'welcome';
        this.clearInputs();
        this.clearForm();
        this.draw();
      }
    });

    this.updateInputPositions();
  }

  private drawRegisterScreen() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 750;
    const panelHeight = isMobile ? Math.min(850, this.canvas.height - 20) : 750;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.green
    });
    this.ctx.shadowBlur = 0;

    // Title
    drawText(this.ctx, '✨ CRIAR CONTA', panelX + panelWidth / 2, panelY + 70, {
      font: 'bold 40px monospace',
      color: COLORS.primary.green,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Registre-se para começar sua jornada', panelX + panelWidth / 2, panelY + 110, {
      font: '16px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });

    // Labels e inputs
    const fieldWidth = isMobile ? panelWidth - 80 : 600;
    const fieldHeight = isMobile ? 50 : 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    let currentY = panelY + 170;

    // Email label
    drawText(this.ctx, 'Email:', fieldX, currentY - 20, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    // Email input
    if (!this.emailInput) {
      this.emailInput = this.createInputField('email', 'email', 'Digite seu email...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('email', fieldX, currentY + fieldHeight + 5, fieldWidth);
    }
    if (this.fieldErrors.get('email')) currentY += 25;

    // Display Name label
    currentY += 110;
    drawText(this.ctx, 'Nome do Guardião:', fieldX, currentY - 20, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    // Display Name input
    if (!this.displayNameInput) {
      this.displayNameInput = this.createInputField('displayName', 'text', 'Digite seu nome...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('displayName', fieldX, currentY + fieldHeight + 5, fieldWidth);
    }
    if (this.fieldErrors.get('displayName')) currentY += 25;

    // Password label
    currentY += 110;
    drawText(this.ctx, 'Senha (mín. 6 caracteres):', fieldX, currentY - 20, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    // Password input
    if (!this.passwordInput) {
      this.passwordInput = this.createInputField('password', 'password', 'Digite sua senha...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('password', fieldX, currentY + fieldHeight + 5, fieldWidth);
    }
    if (this.fieldErrors.get('password')) currentY += 25;

    // Confirm Password label
    currentY += 110;
    drawText(this.ctx, 'Confirmar Senha:', fieldX, currentY - 20, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    // Confirm Password input
    if (!this.confirmPasswordInput) {
      this.confirmPasswordInput = this.createInputField('confirmPassword', 'password', 'Confirme sua senha...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('confirmPassword', fieldX, currentY + fieldHeight + 5, fieldWidth);
    }

    // Error message
    if (this.errorMessage) {
      currentY += 60;
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, currentY, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // CORREÇÃO: Botões ajustados para não ultrapassar o painel
    const buttonPadding = isMobile ? 50 : 75;
    const buttonWidth = panelWidth - (buttonPadding * 2);
    const buttonX = panelX + buttonPadding;

    // Register button
    const registerBtnY = currentY + (this.errorMessage ? 80 : 50);
    const btnText = this.isLoading ? '⏳ Criando conta...' : '✓ Criar Conta';
    drawButton(this.ctx, buttonX, registerBtnY, buttonWidth, 60, btnText, {
      bgColor: COLORS.primary.green,
      hoverColor: '#2d8659',
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: buttonX,
        y: registerBtnY,
        width: buttonWidth,
        height: 60,
        action: () => this.handleRegister()
      });
    }

    // Back button - centralizado e menor
    const backBtnY = registerBtnY - 80;
    const backButtonWidth = Math.min(300, panelWidth - 100);
    const backButtonX = panelX + (panelWidth - backButtonWidth) / 2;
    drawButton(this.ctx, backButtonX, backBtnY, backButtonWidth, 45, '← Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: backButtonX,
      y: backBtnY,
      width: backButtonWidth,
      height: 45,
      action: () => {
        this.currentScreen = 'welcome';
        this.clearInputs();
        this.clearForm();
        this.draw();
      }
    });

    this.updateInputPositions();
  }

  private clearForm() {
    this.errorMessage = '';
    this.fieldErrors.clear();
    this.fieldValid.clear();
  }

  public checkOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      // Get user data
      authApi.getMe().then(response => {
        if (response.success && response.data) {
          this.onLoginSuccess(token, response.data);
        }
      }).catch(() => {
        this.errorMessage = 'Erro ao obter dados do usuário';
        this.draw();
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      let errorMsg = 'Erro na autenticação';
      switch (error) {
        case 'oauth_not_configured':
          errorMsg = 'Autenticação Google não está configurada no servidor';
          break;
        case 'auth_failed':
          errorMsg = 'Falha na autenticação com Google';
          break;
        case 'server_error':
          errorMsg = 'Erro no servidor durante autenticação';
          break;
        default:
          errorMsg = 'Erro na autenticação com Google';
      }
      this.errorMessage = errorMsg;
      this.draw();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  public destroy() {
    // Limpar inputs quando o componente for destruído
    if (this.inputsContainer && this.inputsContainer.parentElement) {
      this.inputsContainer.remove();
    }
  }
}
