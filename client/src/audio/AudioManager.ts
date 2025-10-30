/**
 * AudioManager - Sistema de gerenciamento de áudio do Beast Keepers
 * Gerencia música ambiente e efeitos sonoros usando Howler.js
 */

import { Howl, Howler } from 'howler';

export type AudioCategory = 'sfx';

export interface AudioConfig {
  masterVolume: number;    // 0.0 a 1.0
  sfxVolume: number;       // 0.0 a 1.0
  muted: boolean;
}

export type SoundEffect =
  // Combate
  | 'attack_physical'   // Ataque físico
  | 'attack_fire'       // Ataque de fogo
  | 'attack_water'      // Ataque de água
  | 'attack_earth'      // Ataque de terra
  | 'attack_air'        // Ataque de ar
  | 'attack_light'      // Ataque de luz
  | 'attack_dark'       // Ataque sombrio
  | 'hit'               // Acerto
  | 'miss'              // Erro
  | 'critical'          // Crítico
  | 'dodge'             // Esquiva
  | 'ko'                // Nocaute
  
  // UI
  | 'click'             // Clique em botão
  | 'hover'             // Hover em botão
  | 'open_menu'         // Abrir menu
  | 'close_menu'        // Fechar menu
  | 'error'             // Erro/inválido
  | 'success'           // Sucesso
  
  // Notificações
  | 'achievement'       // Conquista desbloqueada
  | 'level_up'          // Level up
  | 'new_message'       // Nova mensagem
  | 'quest_complete'    // Quest completa
  
  // Gameplay
  | 'collect_item'      // Coletar item
  | 'craft'             // Craft item
  | 'train'             // Treinar besta
  | 'heal'              // Curar
  | 'coin'              // Ganhar moeda
  | 'footstep';         // Passo

class AudioManagerClass {
  private config: AudioConfig;
  private soundEffects: Map<SoundEffect, Howl>;
  private initialized: boolean = false;

  constructor() {
    // Carregar configuração do localStorage ou usar padrões
    const saved = localStorage.getItem('audioConfig');
    this.config = saved ? JSON.parse(saved) : {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      muted: false
    };
    this.soundEffects = new Map();
    
    // Aplicar volume global
    this.applyVolume();
  }

  /**
   * Inicializa o AudioManager carregando os assets de áudio
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔊 Inicializando AudioManager (apenas SFX)...');

    try {
      // Carregar efeitos sonoros
      await this.loadSoundEffects();
      
      this.initialized = true;
      console.log('✅ AudioManager inicializado com sucesso (SFX pronto)!');
    } catch (error) {
      console.error('❌ Erro ao inicializar AudioManager:', error);
    }
  }

  // Música removida do jogo – apenas SFX permanecem

  /**
   * Carrega todos os efeitos sonoros
   */
  private async loadSoundEffects(): Promise<void> {
    const sfxDefinitions: Record<SoundEffect, string> = {
      // Combate
      attack_physical: '/assets/audio/sfx/attack_physical.mp3',
      attack_fire: '/assets/audio/sfx/attack_fire.mp3',
      attack_water: '/assets/audio/sfx/attack_water.mp3',
      attack_earth: '/assets/audio/sfx/attack_earth.mp3',
      attack_air: '/assets/audio/sfx/attack_air.mp3',
      attack_light: '/assets/audio/sfx/attack_light.mp3',
      attack_dark: '/assets/audio/sfx/attack_dark.mp3',
      hit: '/assets/audio/sfx/hit.mp3',
      miss: '/assets/audio/sfx/miss.mp3',
      critical: '/assets/audio/sfx/critical.mp3',
      dodge: '/assets/audio/sfx/dodge.mp3',
      ko: '/assets/audio/sfx/ko.mp3',
      
      // UI
      click: '/assets/audio/sfx/click.mp3',
      hover: '/assets/audio/sfx/hover.mp3',
      open_menu: '/assets/audio/sfx/open_menu.mp3',
      close_menu: '/assets/audio/sfx/close_menu.mp3',
      error: '/assets/audio/sfx/error.mp3',
      success: '/assets/audio/sfx/success.mp3',
      
      // Notificações
      achievement: '/assets/audio/sfx/achievement.mp3',
      level_up: '/assets/audio/sfx/level_up.mp3',
      new_message: '/assets/audio/sfx/new_message.mp3',
      quest_complete: '/assets/audio/sfx/quest_complete.mp3',
      
      // Gameplay
      collect_item: '/assets/audio/sfx/collect_item.mp3',
      craft: '/assets/audio/sfx/craft.mp3',
      train: '/assets/audio/sfx/train.mp3',
      heal: '/assets/audio/sfx/heal.mp3',
      coin: '/assets/audio/sfx/coin.mp3',
      footstep: '/assets/audio/sfx/footstep.mp3'
    };

    for (const [effect, src] of Object.entries(sfxDefinitions)) {
      this.soundEffects.set(effect as SoundEffect, new Howl({
        src: [src],
        volume: this.config.sfxVolume * this.config.masterVolume,
        preload: true,
        html5: false, // SFX são curtos, carregar na memória
        onloaderror: () => {
          // Silencioso se não encontrar
        }
      }));
    }
  }

  // Funções de música removidas

  /**
   * Toca um efeito sonoro
   * @param effect - Nome do efeito
   * @param volume - Volume override (0.0 a 1.0)
   */
  playSFX(effect: SoundEffect, volume?: number): void {
    if (this.config.muted) return;

    const sfx = this.soundEffects.get(effect);
    if (sfx) {
      const finalVolume = volume !== undefined 
        ? volume * this.config.masterVolume
        : this.config.sfxVolume * this.config.masterVolume;
      
      sfx.volume(finalVolume);
      sfx.play();
    }
  }

  /**
   * Define o volume master (afeta tudo)
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyVolume();
    this.saveConfig();
  }

  /**
   * Define o volume dos efeitos sonoros
   */
  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.applyVolume();
    this.saveConfig();
  }

  /**
   * Mute/Unmute todo o áudio
   */
  setMuted(muted: boolean): void {
    this.config.muted = muted;
    Howler.mute(muted);
    this.saveConfig();
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.setMuted(!this.config.muted);
    return this.config.muted;
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Aplica os volumes atuais
   */
  private applyVolume(): void {
    // Atualizar volume de todos os SFX
    this.soundEffects.forEach(sfx => {
      sfx.volume(this.config.sfxVolume * this.config.masterVolume);
    });
  }

  /**
   * Salva a configuração no localStorage
   */
  private saveConfig(): void {
    localStorage.setItem('audioConfig', JSON.stringify(this.config));
  }

  /**
   * Limpa recursos de áudio
   */
  dispose(): void {
    this.soundEffects.forEach(sfx => sfx.unload());
    this.soundEffects.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const AudioManager = new AudioManagerClass();

