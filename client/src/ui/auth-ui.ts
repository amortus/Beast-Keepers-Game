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
    const panelWidth = this.currentScreen === 'register' ? 750 : 700;
    const panelHeight = this.currentScreen === 'register' ? 750 : 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    const fieldWidth = 600;
    const fieldHeight = 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    
    // Large clickable zone (include label area - 40px above)
    const clickableHeight = fieldHeight + 40;

    if (this.currentScreen === 'login') {
      // Email field (large clickable area)
      if (isMouseOver(x, y, fieldX, panelY + 150, fieldWidth, clickableHeight)) {
        this.activeField = 'email';
      }
      // Password field (large clickable area)
      else if (isMouseOver(x, y, fieldX, panelY + 260, fieldWidth, clickableHeight)) {
        this.activeField = 'password';
      }
      else {
        this.activeField = null;
      }
    } else if (this.currentScreen === 'register') {
      // Email field
      if (isMouseOver(x, y, fieldX, panelY + 150, fieldWidth, clickableHeight)) {
        this.activeField = 'email';
      }
      // Display name field
      else if (isMouseOver(x, y, fieldX, panelY + 260, fieldWidth, clickableHeight)) {
        this.activeField = 'displayName';
      }
      // Password field
      else if (isMouseOver(x, y, fieldX, panelY + 370, fieldWidth, clickableHeight)) {
        this.activeField = 'password';
      }
      // Confirm password field
      else if (isMouseOver(x, y, fieldX, panelY + 480, fieldWidth, clickableHeight)) {
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
    const panelWidth = 700;
    const panelHeight = 650;
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

    // Description (multiple lines)
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

    // Login button (larger)
    const loginBtnY = panelY + 340;
    drawButton(this.ctx, panelX + 125, loginBtnY, 450, 60, '🔐 Entrar', {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark
    });
    this.buttons.set('login', {
      x: panelX + 125,
      y: loginBtnY,
      width: 450,
      height: 60,
      action: () => this.currentScreen = 'login'
    });

    // Register button (larger)
    const registerBtnY = panelY + 420;
    drawButton(this.ctx, panelX + 125, registerBtnY, 450, 60, '✨ Criar Conta', {
      bgColor: COLORS.primary.green,
      hoverColor: '#2d8659'
    });
    this.buttons.set('register', {
      x: panelX + 125,
      y: registerBtnY,
      width: 450,
      height: 60,
      action: () => this.currentScreen = 'register'
    });

    // Google button (larger, with note)
    const googleBtnY = panelY + 520;
    drawButton(this.ctx, panelX + 125, googleBtnY, 450, 60, '🔗 Entrar com Google', {
      bgColor: '#4285f4',
      hoverColor: '#357ae8'
    });
    this.buttons.set('google', {
      x: panelX + 125,
      y: googleBtnY,
      width: 450,
      height: 60,
      action: () => authApi.googleLogin()
    });

    // Note
    drawText(this.ctx, '(Google OAuth não configurado)', panelX + panelWidth / 2, panelY + 595, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });
  }

  private drawLoginScreen() {
    const panelWidth = 700;
    const panelHeight = 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.purple
    });
    this.ctx.shadowBlur = 0;

    // Title with icon
    drawText(this.ctx, '🔐 LOGIN', panelX + panelWidth / 2, panelY + 70, {
      font: 'bold 40px monospace',
      color: COLORS.primary.purple,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Entre com sua conta', panelX + panelWidth / 2, panelY + 110, {
      font: '16px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });

    // Email field
    this.drawInputField(panelX, panelY + 170, panelWidth, 'Email:', this.email, 'email');

    // Password field
    this.drawInputField(panelX, panelY + 280, panelWidth, 'Senha:', '*'.repeat(this.password.length), 'password');

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 390, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Login button (larger)
    const loginBtnY = panelY + 430;
    const btnText = this.isLoading ? '⏳ Entrando...' : '▶ Entrar';
    drawButton(this.ctx, panelX + 100, loginBtnY, 500, 60, btnText, {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark,
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: panelX + 100,
        y: loginBtnY,
        width: 500,
        height: 60,
        action: () => this.handleLogin()
      });
    }

    // Back button
    const backBtnY = panelY + 510;
    drawButton(this.ctx, panelX + 200, backBtnY, 300, 45, '← Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: panelX + 200,
      y: backBtnY,
      width: 300,
      height: 45,
      action: () => {
        this.currentScreen = 'welcome';
        this.clearForm();
      }
    });
  }

  private drawRegisterScreen() {
    const panelWidth = 750;
    const panelHeight = 750;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.green
    });
    this.ctx.shadowBlur = 0;

    // Title with icon
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

    // Email field (with more spacing)
    this.drawInputField(panelX, panelY + 170, panelWidth, 'Email:', this.email, 'email');

    // Display name field
    this.drawInputField(panelX, panelY + 280, panelWidth, 'Nome do Guardião:', this.displayName, 'displayName');

    // Password field
    this.drawInputField(panelX, panelY + 390, panelWidth, 'Senha (mín. 6 caracteres):', '*'.repeat(this.password.length), 'password');

    // Confirm password field
    this.drawInputField(panelX, panelY + 500, panelWidth, 'Confirmar Senha:', '*'.repeat(this.confirmPassword.length), 'confirmPassword');

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 610, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Register button (larger)
    const registerBtnY = panelY + 640;
    const btnText = this.isLoading ? '⏳ Criando conta...' : '✓ Criar Conta';
    drawButton(this.ctx, panelX + 125, registerBtnY, 500, 60, btnText, {
      bgColor: COLORS.primary.green,
      hoverColor: '#2d8659',
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: panelX + 125,
        y: registerBtnY,
        width: 500,
        height: 60,
        action: () => this.handleRegister()
      });
    }

    // Back button
    const backBtnY = panelY + 560;
    drawButton(this.ctx, panelX + 225, backBtnY, 300, 45, '← Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: panelX + 225,
      y: backBtnY,
      width: 300,
      height: 45,
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
    const fieldWidth = 600;
    const fieldHeight = 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    // Label (bigger and bolder)
    drawText(this.ctx, label, fieldX, fieldY - 20, {
      font: 'bold 18px monospace',
      color: COLORS.ui.text
    });

    const isActive = this.activeField === fieldName;
    const borderColor = this.currentScreen === 'login' ? COLORS.primary.purple : COLORS.primary.green;
    
    // Field shadow when active
    if (isActive) {
      this.ctx.shadowColor = this.currentScreen === 'login' ? 'rgba(159, 122, 234, 0.4)' : 'rgba(72, 187, 120, 0.4)';
      this.ctx.shadowBlur = 15;
    }

    // Field background (gradient)
    const gradient = this.ctx.createLinearGradient(fieldX, fieldY, fieldX, fieldY + fieldHeight);
    gradient.addColorStop(0, isActive ? '#2a2a3e' : '#1a1a2e');
    gradient.addColorStop(1, isActive ? '#1f1f2e' : '#0f0f1e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Field border (animated when active)
    this.ctx.strokeStyle = isActive ? borderColor : COLORS.ui.textDim;
    this.ctx.lineWidth = isActive ? 4 : 2;
    this.ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight);

    this.ctx.shadowBlur = 0;

    // Inner glow when active
    if (isActive) {
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = 0.3;
      this.ctx.strokeRect(fieldX + 3, fieldY + 3, fieldWidth - 6, fieldHeight - 6);
      this.ctx.globalAlpha = 1;
    }

    // Field value (larger text)
    const displayText = value || 'Clique aqui para digitar...';
    drawText(this.ctx, displayText, fieldX + 20, fieldY + 38, {
      font: value ? 'bold 20px monospace' : '18px monospace',
      color: value ? COLORS.ui.text : COLORS.ui.textDim
    });

    // Cursor (blinking, animated)
    if (isActive && Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.font = 'bold 20px monospace';
      const textWidth = this.ctx.measureText(value).width;
      this.ctx.fillStyle = borderColor;
      this.ctx.fillRect(fieldX + 20 + textWidth, fieldY + 18, 3, 30);
    }

    // Tab hint
    if (isActive) {
      const isLastField = (this.currentScreen === 'login' && fieldName === 'password') ||
                          (this.currentScreen === 'register' && fieldName === 'confirmPassword');
      const hint = isLastField ? '(Enter para enviar)' : '(Tab/Enter p/ próximo)';
      drawText(this.ctx, hint, fieldX + fieldWidth - 200, fieldY - 20, {
        font: '13px monospace',
        color: borderColor
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

