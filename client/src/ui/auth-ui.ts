/**
 * Authentication UI
 * Beast Keepers - Login and Registration
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
  
  // Form state
  private email: string = '';
  private password: string = '';
  private displayName: string = '';
  private confirmPassword: string = '';
  private activeField: 'email' | 'password' | 'displayName' | 'confirmPassword' | null = null;
  private errorMessage: string = '';
  private isLoading: boolean = false;

  // Callbacks
  public onLoginSuccess: (token: string, user: any) => void = () => {};
  public onRegisterSuccess: (token: string, user: any) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('keydown', (e) => this.handleKeyPress(e));
    
    // Prevent default tab behavior
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.activeField) {
        e.preventDefault();
      }
    });
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check buttons
    this.buttons.forEach((btn, key) => {
      if (isMouseOver(x, y, btn.x, btn.y, btn.width, btn.height)) {
        btn.action();
      }
    });

    // Check input fields
    this.checkFieldClick(x, y);
  }

  private checkFieldClick(x: number, y: number) {
    const panelWidth = 600;
    const panelHeight = 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    const fieldWidth = 500;
    const fieldHeight = 50; // Increased from 40
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    
    // Include label area in clickable zone (add 30px above for label)
    const clickableHeight = fieldHeight + 30;

    if (this.currentScreen === 'login') {
      // Email field (include label area)
      if (isMouseOver(x, y, fieldX, panelY + 120, fieldWidth, clickableHeight)) {
        this.activeField = 'email';
      }
      // Password field (include label area)
      else if (isMouseOver(x, y, fieldX, panelY + 190, fieldWidth, clickableHeight)) {
        this.activeField = 'password';
      }
      else {
        this.activeField = null;
      }
    } else if (this.currentScreen === 'register') {
      // Email field (include label area)
      if (isMouseOver(x, y, fieldX, panelY + 120, fieldWidth, clickableHeight)) {
        this.activeField = 'email';
      }
      // Display name field (include label area)
      else if (isMouseOver(x, y, fieldX, panelY + 190, fieldWidth, clickableHeight)) {
        this.activeField = 'displayName';
      }
      // Password field (include label area)
      else if (isMouseOver(x, y, fieldX, panelY + 260, fieldWidth, clickableHeight)) {
        this.activeField = 'password';
      }
      // Confirm password field (include label area)
      else if (isMouseOver(x, y, fieldX, panelY + 330, fieldWidth, clickableHeight)) {
        this.activeField = 'confirmPassword';
      }
      else {
        this.activeField = null;
      }
    }
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Tab' && this.activeField) {
      e.preventDefault();
      this.nextField();
      return;
    }

    if (!this.activeField) return;

    if (e.key === 'Escape') {
      this.activeField = null;
      return;
    }

    if (e.key === 'Enter') {
      // Try next field, or submit if on last field
      if (this.currentScreen === 'login' && this.activeField === 'password') {
        this.handleLogin();
      } else if (this.currentScreen === 'register' && this.activeField === 'confirmPassword') {
        this.handleRegister();
      } else {
        this.nextField();
      }
      return;
    }

    if (e.key === 'Backspace') {
      if (this.activeField === 'email') {
        this.email = this.email.slice(0, -1);
      } else if (this.activeField === 'password') {
        this.password = this.password.slice(0, -1);
      } else if (this.activeField === 'displayName') {
        this.displayName = this.displayName.slice(0, -1);
      } else if (this.activeField === 'confirmPassword') {
        this.confirmPassword = this.confirmPassword.slice(0, -1);
      }
      return;
    }

    if (e.key.length === 1) {
      if (this.activeField === 'email') {
        this.email += e.key;
      } else if (this.activeField === 'password') {
        this.password += e.key;
      } else if (this.activeField === 'displayName') {
        this.displayName += e.key;
      } else if (this.activeField === 'confirmPassword') {
        this.confirmPassword += e.key;
      }
    }
  }

  private nextField() {
    if (this.currentScreen === 'login') {
      if (this.activeField === 'email') {
        this.activeField = 'password';
      } else if (this.activeField === 'password') {
        this.activeField = 'email';
      }
    } else if (this.currentScreen === 'register') {
      if (this.activeField === 'email') {
        this.activeField = 'displayName';
      } else if (this.activeField === 'displayName') {
        this.activeField = 'password';
      } else if (this.activeField === 'password') {
        this.activeField = 'confirmPassword';
      } else if (this.activeField === 'confirmPassword') {
        this.activeField = 'email';
      }
    }
  }

  private async handleLogin() {
    if (this.isLoading) return;

    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    this.isLoading = true;

    try {
      const response = await authApi.login(this.email, this.password);
      
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
    }
  }

  private async handleRegister() {
    if (this.isLoading) return;

    this.errorMessage = '';

    if (!this.email || !this.password || !this.displayName) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Senha deve ter no mínimo 6 caracteres';
      return;
    }

    this.isLoading = true;

    try {
      const response = await authApi.register(this.email, this.password, this.displayName);
      
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
    }
  }

  draw() {
    this.buttons.clear();

    if (this.currentScreen === 'welcome') {
      this.drawWelcomeScreen();
    } else if (this.currentScreen === 'login') {
      this.drawLoginScreen();
    } else if (this.currentScreen === 'register') {
      this.drawRegisterScreen();
    }
  }

  private drawWelcomeScreen() {
    const panelWidth = 600;
    const panelHeight = 500;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.purple
    });

    // Title
    drawText(this.ctx, '🐉 BEAST KEEPERS', panelX + panelWidth / 2, panelY + 80, {
      font: 'bold 36px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Bem-vindo ao mundo de Aurath', panelX + panelWidth / 2, panelY + 130, {
      font: '18px monospace',
      color: COLORS.ui.text,
      align: 'center'
    });

    // Description
    const desc = 'Crie, treine e batalhe com criaturas místicas.';
    drawText(this.ctx, desc, panelX + panelWidth / 2, panelY + 160, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });

    // Login button
    const loginBtnY = panelY + 240;
    drawButton(this.ctx, panelX + 150, loginBtnY, 300, 50, 'Entrar', {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark
    });
    this.buttons.set('login', {
      x: panelX + 150,
      y: loginBtnY,
      width: 300,
      height: 50,
      action: () => this.currentScreen = 'login'
    });

    // Register button
    const registerBtnY = panelY + 310;
    drawButton(this.ctx, panelX + 150, registerBtnY, 300, 50, 'Criar Conta', {
      bgColor: COLORS.primary.green,
      hoverColor: '#2d8659'
    });
    this.buttons.set('register', {
      x: panelX + 150,
      y: registerBtnY,
      width: 300,
      height: 50,
      action: () => this.currentScreen = 'register'
    });

    // Google button
    const googleBtnY = panelY + 400;
    drawButton(this.ctx, panelX + 150, googleBtnY, 300, 50, '🔐 Entrar com Google', {
      bgColor: '#4285f4',
      hoverColor: '#357ae8'
    });
    this.buttons.set('google', {
      x: panelX + 150,
      y: googleBtnY,
      width: 300,
      height: 50,
      action: () => authApi.googleLogin()
    });
  }

  private drawLoginScreen() {
    const panelWidth = 600;
    const panelHeight = 500;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.purple
    });

    // Title
    drawText(this.ctx, 'LOGIN', panelX + panelWidth / 2, panelY + 60, {
      font: 'bold 32px monospace',
      color: COLORS.primary.purple,
      align: 'center'
    });

    // Email field
    this.drawInputField(panelX, panelY + 120, panelWidth, 'Email:', this.email, 'email');

    // Password field
    this.drawInputField(panelX, panelY + 190, panelWidth, 'Senha:', '*'.repeat(this.password.length), 'password');

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 280, {
        font: '14px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Login button
    const loginBtnY = panelY + 320;
    const btnText = this.isLoading ? 'Entrando...' : 'Entrar';
    drawButton(this.ctx, panelX + 100, loginBtnY, 400, 50, btnText, {
      bgColor: COLORS.primary.purple,
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: panelX + 100,
        y: loginBtnY,
        width: 400,
        height: 50,
        action: () => this.handleLogin()
      });
    }

    // Back button
    const backBtnY = panelY + 390;
    drawButton(this.ctx, panelX + 200, backBtnY, 200, 40, 'Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: panelX + 200,
      y: backBtnY,
      width: 200,
      height: 40,
      action: () => {
        this.currentScreen = 'welcome';
        this.clearForm();
      }
    });
  }

  private drawRegisterScreen() {
    const panelWidth = 600;
    const panelHeight = 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.green
    });

    // Title
    drawText(this.ctx, 'CRIAR CONTA', panelX + panelWidth / 2, panelY + 60, {
      font: 'bold 32px monospace',
      color: COLORS.primary.green,
      align: 'center'
    });

    // Email field
    this.drawInputField(panelX, panelY + 120, panelWidth, 'Email:', this.email, 'email');

    // Display name field
    this.drawInputField(panelX, panelY + 190, panelWidth, 'Nome do Guardião:', this.displayName, 'displayName');

    // Password field
    this.drawInputField(panelX, panelY + 260, panelWidth, 'Senha:', '*'.repeat(this.password.length), 'password');

    // Confirm password field
    this.drawInputField(panelX, panelY + 330, panelWidth, 'Confirmar Senha:', '*'.repeat(this.confirmPassword.length), 'confirmPassword');

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 400, {
        font: '14px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Register button
    const registerBtnY = panelY + 440;
    const btnText = this.isLoading ? 'Criando conta...' : 'Criar Conta';
    drawButton(this.ctx, panelX + 100, registerBtnY, 400, 50, btnText, {
      bgColor: COLORS.primary.green,
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: panelX + 100,
        y: registerBtnY,
        width: 400,
        height: 50,
        action: () => this.handleRegister()
      });
    }

    // Back button
    const backBtnY = panelY + 510;
    drawButton(this.ctx, panelX + 200, backBtnY, 200, 40, 'Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: panelX + 200,
      y: backBtnY,
      width: 200,
      height: 40,
      action: () => {
        this.currentScreen = 'welcome';
        this.clearForm();
      }
    });
  }

  private drawInputField(
    panelX: number,
    fieldY: number,
    panelWidth: number,
    label: string,
    value: string,
    fieldName: string
  ) {
    const fieldWidth = 500;
    const fieldHeight = 50; // Increased from 40
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    // Label
    drawText(this.ctx, label, fieldX, fieldY - 15, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text
    });

    // Field background
    const isActive = this.activeField === fieldName;
    this.ctx.fillStyle = isActive ? '#2a2a3e' : '#1a1a2e';
    this.ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Field border (thicker and more visible)
    this.ctx.strokeStyle = isActive ? COLORS.primary.purple : COLORS.ui.textDim;
    this.ctx.lineWidth = isActive ? 3 : 2;
    this.ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Hover effect (visual feedback)
    if (isActive) {
      this.ctx.strokeStyle = COLORS.primary.purple;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(fieldX - 2, fieldY - 2, fieldWidth + 4, fieldHeight + 4);
    }

    // Field value
    drawText(this.ctx, value || 'Clique aqui para digitar...', fieldX + 15, fieldY + 32, {
      font: '18px monospace',
      color: value ? COLORS.ui.text : COLORS.ui.textDim
    });

    // Cursor (blinking, larger)
    if (isActive && Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.font = '18px monospace';
      const textWidth = this.ctx.measureText(value).width;
      this.ctx.fillStyle = COLORS.primary.purple;
      this.ctx.fillRect(fieldX + 15 + textWidth, fieldY + 15, 3, 25);
    }

    // Tab hint
    if (isActive) {
      drawText(this.ctx, '(Tab para próximo campo)', fieldX + fieldWidth - 200, fieldY - 15, {
        font: '12px monospace',
        color: COLORS.ui.textDim
      });
    }
  }

  private clearForm() {
    this.email = '';
    this.password = '';
    this.displayName = '';
    this.confirmPassword = '';
    this.activeField = null;
    this.errorMessage = '';
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
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      this.errorMessage = 'Erro na autenticação com Google';
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
}

