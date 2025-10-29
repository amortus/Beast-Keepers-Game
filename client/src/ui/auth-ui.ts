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
  
  // Validação em tempo real
  private fieldErrors: Map<string, string> = new Map();
  private fieldValid: Map<string, boolean> = new Map();

  // Responsividade
  private scale: number = 1;
  private baseWidth: number = 800;
  private baseHeight: number = 700;
  private minScale: number = 0.6;
  private maxScale: number = 1.5;

  // Callbacks
  public onLoginSuccess: (token: string, user: any) => void = () => {};
  public onRegisterSuccess: (token: string, user: any) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.calculateScale();
    window.addEventListener('resize', () => this.calculateScale());
  }

  private calculateScale() {
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
    
    // Redesenhar após mudança de escala
    this.draw();
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

    // Atalhos de teclado (Ctrl/Cmd)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          this.selectAllText();
          return;
        case 'c':
          e.preventDefault();
          this.copyText();
          return;
        case 'v':
          e.preventDefault();
          this.pasteText();
          return;
        case 'x':
          e.preventDefault();
          this.cutText();
          return;
        case 'z':
          e.preventDefault();
          // Implementar undo se necessário
          return;
      }
    }

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

    // Navegação melhorada
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      // Implementar navegação de cursor se necessário
      return;
    }

    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      this.navigateToEdge(e.key === 'Home');
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      this.deleteForward();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.deleteBackward();
      return;
    }

    // Caracteres normais
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      this.insertText(e.key);
    }
  }

  private selectAllText() {
    // Implementar seleção de todo o texto no campo ativo
    // Por enquanto, apenas limpar e selecionar
    if (this.activeField === 'email') {
      this.email = '';
    } else if (this.activeField === 'password') {
      this.password = '';
    } else if (this.activeField === 'displayName') {
      this.displayName = '';
    } else if (this.activeField === 'confirmPassword') {
      this.confirmPassword = '';
    }
  }

  private copyText() {
    const text = this.getCurrentFieldText();
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback para navegadores mais antigos
        console.log('Clipboard API não suportada');
      });
    }
  }

  private pasteText() {
    navigator.clipboard.readText().then(text => {
      this.insertText(text);
    }).catch(() => {
      // Fallback ou erro
      console.log('Não foi possível colar texto');
    });
  }

  private cutText() {
    const text = this.getCurrentFieldText();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        this.clearCurrentField();
      }).catch(() => {
        console.log('Clipboard API não suportada');
      });
    }
  }

  private navigateToEdge(isHome: boolean) {
    // Implementar navegação para início/fim do texto
    // Por enquanto, apenas limpar o campo
    this.clearCurrentField();
  }

  private deleteForward() {
    // Implementar delete forward (Delete key)
    // Por enquanto, mesmo comportamento do Backspace
    this.deleteBackward();
  }

  private deleteBackward() {
    if (this.activeField === 'email') {
      this.email = this.email.slice(0, -1);
      this.validateEmail();
    } else if (this.activeField === 'password') {
      this.password = this.password.slice(0, -1);
      this.validatePassword();
    } else if (this.activeField === 'displayName') {
      this.displayName = this.displayName.slice(0, -1);
      this.validateDisplayName();
    } else if (this.activeField === 'confirmPassword') {
      this.confirmPassword = this.confirmPassword.slice(0, -1);
      this.validateConfirmPassword();
    }
  }

  private insertText(text: string) {
    if (this.activeField === 'email') {
      this.email += text;
      this.validateEmail();
    } else if (this.activeField === 'password') {
      this.password += text;
      this.validatePassword();
    } else if (this.activeField === 'displayName') {
      this.displayName += text;
      this.validateDisplayName();
    } else if (this.activeField === 'confirmPassword') {
      this.confirmPassword += text;
      this.validateConfirmPassword();
    }
  }
  
  private validateEmail() {
    if (!this.email) {
      this.fieldErrors.set('email', '');
      this.fieldValid.set('email', false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.fieldErrors.set('email', 'Email inválido');
      this.fieldValid.set('email', false);
    } else {
      this.fieldErrors.delete('email');
      this.fieldValid.set('email', true);
    }
  }
  
  private validatePassword() {
    if (!this.password) {
      this.fieldErrors.set('password', '');
      this.fieldValid.set('password', false);
      return;
    }
    
    if (this.password.length < 6) {
      this.fieldErrors.set('password', 'Senha deve ter no mínimo 6 caracteres');
      this.fieldValid.set('password', false);
    } else {
      this.fieldErrors.delete('password');
      this.fieldValid.set('password', true);
    }
    
    // Revalidar confirmação de senha se existir
    if (this.confirmPassword) {
      this.validateConfirmPassword();
    }
  }
  
  private validateDisplayName() {
    if (!this.displayName) {
      this.fieldErrors.set('displayName', '');
      this.fieldValid.set('displayName', false);
      return;
    }
    
    if (this.displayName.length < 3) {
      this.fieldErrors.set('displayName', 'Nome deve ter no mínimo 3 caracteres');
      this.fieldValid.set('displayName', false);
    } else if (this.displayName.length > 20) {
      this.fieldErrors.set('displayName', 'Nome deve ter no máximo 20 caracteres');
      this.fieldValid.set('displayName', false);
    } else {
      this.fieldErrors.delete('displayName');
      this.fieldValid.set('displayName', true);
    }
  }
  
  private validateConfirmPassword() {
    if (!this.confirmPassword) {
      this.fieldErrors.set('confirmPassword', '');
      this.fieldValid.set('confirmPassword', false);
      return;
    }
    
    if (this.confirmPassword !== this.password) {
      this.fieldErrors.set('confirmPassword', 'As senhas não coincidem');
      this.fieldValid.set('confirmPassword', false);
    } else {
      this.fieldErrors.delete('confirmPassword');
      this.fieldValid.set('confirmPassword', true);
    }
  }

  private getCurrentFieldText(): string {
    switch (this.activeField) {
      case 'email': return this.email;
      case 'password': return this.password;
      case 'displayName': return this.displayName;
      case 'confirmPassword': return this.confirmPassword;
      default: return '';
    }
  }

  private clearCurrentField() {
    if (this.activeField === 'email') {
      this.email = '';
    } else if (this.activeField === 'password') {
      this.password = '';
    } else if (this.activeField === 'displayName') {
      this.displayName = '';
    } else if (this.activeField === 'confirmPassword') {
      this.confirmPassword = '';
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
    // Ajustar tamanho do painel para mobile
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
    // Ajustar tamanho do painel para mobile
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
      borderColor: COLORS.primary.purple
    });
    this.ctx.shadowBlur = 0;

    // Title with icon (larger)
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

    // Email field (more spacing para acomodar mensagens de erro)
    this.drawInputField(panelX, panelY + 210, panelWidth, 'Email:', this.email, 'email');

    // Password field (more spacing para acomodar mensagens de erro)
    const passwordY = panelY + 340 + (this.fieldErrors.get('email') ? 25 : 0);
    this.drawInputField(panelX, passwordY, panelWidth, 'Senha:', '*'.repeat(this.password.length), 'password');

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 440, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Login button (larger)
    const loginBtnY = panelY + 480;
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
    const backBtnY = panelY + 565;
    drawButton(this.ctx, panelX + 200, backBtnY, 300, 50, '← Voltar', {
      bgColor: '#444',
      hoverColor: '#555'
    });
    this.buttons.set('back', {
      x: panelX + 200,
      y: backBtnY,
      width: 300,
      height: 50,
      action: () => {
        this.currentScreen = 'welcome';
        this.clearForm();
      }
    });
  }

  private drawRegisterScreen() {
    // Ajustar tamanho do painel para mobile
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 750;
    const panelHeight = isMobile ? Math.min(850, this.canvas.height - 20) : 750;
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

    // Email field (with more spacing para acomodar mensagens de erro)
    let currentY = panelY + 170;
    this.drawInputField(panelX, currentY, panelWidth, 'Email:', this.email, 'email');
    if (this.fieldErrors.get('email')) currentY += 25;

    // Display name field
    currentY += 110;
    this.drawInputField(panelX, currentY, panelWidth, 'Nome do Guardião:', this.displayName, 'displayName');
    if (this.fieldErrors.get('displayName')) currentY += 25;

    // Password field
    currentY += 110;
    this.drawInputField(panelX, currentY, panelWidth, 'Senha (mín. 6 caracteres):', '*'.repeat(this.password.length), 'password');
    if (this.fieldErrors.get('password')) currentY += 25;

    // Confirm password field
    currentY += 110;
    this.drawInputField(panelX, currentY, panelWidth, 'Confirmar Senha:', '*'.repeat(this.confirmPassword.length), 'confirmPassword');
    if (this.fieldErrors.get('confirmPassword')) currentY += 25;

    // Error message
    if (this.errorMessage) {
      currentY += 60;
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, currentY, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Register button (larger) - posicionar dinamicamente
    const registerBtnY = currentY + (this.errorMessage ? 80 : 50);
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
    // Ajustar tamanho dos campos para mobile
    const isMobile = window.innerWidth < 768;
    const fieldWidth = isMobile ? panelWidth - 80 : 600;
    const fieldHeight = isMobile ? 50 : 60;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    // Label (ajustar tamanho para mobile)
    drawText(this.ctx, label, fieldX, fieldY - 20, {
      font: isMobile ? 'bold 16px monospace' : 'bold 18px monospace',
      color: COLORS.ui.text
    });

    const isActive = this.activeField === fieldName;
    const borderColor = this.currentScreen === 'login' ? COLORS.primary.purple : COLORS.primary.green;
    
    // Validação do campo
    const fieldError = this.fieldErrors.get(fieldName);
    const isValid = this.fieldValid.get(fieldName);
    const hasValue = value.length > 0;
    
    // Determinar cor da borda baseada em validação
    let finalBorderColor = COLORS.ui.textDim;
    if (isActive) {
      finalBorderColor = borderColor;
    } else if (hasValue) {
      if (fieldError) {
        finalBorderColor = COLORS.ui.error;
      } else if (isValid) {
        finalBorderColor = COLORS.primary.green;
      }
    }
    
    // Field shadow when active
    if (isActive) {
      this.ctx.shadowColor = this.currentScreen === 'login' ? 'rgba(159, 122, 234, 0.4)' : 'rgba(72, 187, 120, 0.4)';
      this.ctx.shadowBlur = 15;
    } else if (hasValue && isValid) {
      this.ctx.shadowColor = 'rgba(72, 187, 120, 0.2)';
      this.ctx.shadowBlur = 10;
    } else if (fieldError) {
      this.ctx.shadowColor = 'rgba(239, 68, 68, 0.2)';
      this.ctx.shadowBlur = 10;
    }

    // Field background (gradient)
    const gradient = this.ctx.createLinearGradient(fieldX, fieldY, fieldX, fieldY + fieldHeight);
    gradient.addColorStop(0, isActive ? '#2a2a3e' : '#1a1a2e');
    gradient.addColorStop(1, isActive ? '#1f1f2e' : '#0f0f1e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Field border (animated when active or validated)
    this.ctx.strokeStyle = finalBorderColor;
    this.ctx.lineWidth = isActive ? 4 : (hasValue && (isValid || fieldError) ? 3 : 2);
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

    // Indicador de validação (ícone à direita)
    if (hasValue && !isActive) {
      const iconX = fieldX + fieldWidth - 35;
      const iconY = fieldY + 30;
      if (isValid) {
        // Check verde
        this.ctx.fillStyle = COLORS.primary.green;
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText('✓', iconX, iconY);
      } else if (fieldError) {
        // X vermelho
        this.ctx.fillStyle = COLORS.ui.error;
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText('✗', iconX, iconY);
      }
    }

    // Mensagem de erro do campo (abaixo do campo)
    if (fieldError && (isActive || hasValue)) {
      drawText(this.ctx, fieldError, fieldX, fieldY + fieldHeight + 25, {
        font: '14px monospace',
        color: COLORS.ui.error
      });
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
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
}

