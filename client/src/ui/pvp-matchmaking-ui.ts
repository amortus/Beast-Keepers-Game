/**
 * PVP Matchmaking UI
 * Interface para matchmaking (ranked e casual)
 */

import { joinMatchmaking, leaveMatchmaking, getMatchmakingStatus, MatchType } from '../api/pvpApi';
import { pvpSocketClient } from '../services/pvpSocketClient';
import type { Beast } from '../types';

export class PvpMatchmakingUI {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private selectedMatchType: MatchType = 'casual';
  private isInQueue: boolean = false;
  private queueStartTime: number = 0;
  private queueInterval: number | null = null;
  private currentBeast: Beast | null = null;

  // Callbacks
  public onMatchFound: (matchId: number, opponent: { userId: number; beastId: number }, matchType: MatchType) => void = () => {};

  constructor(containerId: string = 'pvp-matchmaking-container') {
    const existing = document.getElementById(containerId);
    if (existing) {
      this.container = existing as HTMLDivElement;
    } else {
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'pvp-matchmaking-ui';
      document.body.appendChild(this.container);
    }

    this.setupUI();
    this.setupSocketListeners();
  }

  private setupUI() {
    this.container.innerHTML = `
      <div class="pvp-matchmaking-panel">
        <h2>PVP Matchmaking</h2>
        
        <div class="match-type-selection">
          <label>
            <input type="radio" name="matchType" value="casual" checked>
            <span>Casual</span>
            <small>Sem afetar ranking</small>
          </label>
          <label>
            <input type="radio" name="matchType" value="ranked">
            <span>Ranked</span>
            <small>Afeta ELO/ranking</small>
          </label>
        </div>

        <div class="queue-status" id="queue-status">
          <p>Selecione um beast e clique em "Buscar Partida"</p>
        </div>

        <div class="matchmaking-actions">
          <button id="btn-join-queue" class="btn-primary">Buscar Partida</button>
          <button id="btn-leave-queue" class="btn-secondary" style="display: none;">Cancelar Busca</button>
        </div>
      </div>
    `;

    // Event listeners
    const matchTypeInputs = this.container.querySelectorAll('input[name="matchType"]');
    matchTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.selectedMatchType = (e.target as HTMLInputElement).value as MatchType;
      });
    });

    const joinBtn = this.container.querySelector('#btn-join-queue');
    joinBtn?.addEventListener('click', () => this.handleJoinQueue());

    const leaveBtn = this.container.querySelector('#btn-leave-queue');
    leaveBtn?.addEventListener('click', () => this.handleLeaveQueue());
  }

  private setupSocketListeners() {
    pvpSocketClient.onMatchFound((data) => {
      this.handleMatchFound(data);
    });

    pvpSocketClient.onMatchmakingJoined(() => {
      this.updateQueueStatus(true);
    });

    pvpSocketClient.onMatchmakingLeft(() => {
      this.updateQueueStatus(false);
    });
  }

  private async handleJoinQueue() {
    if (!this.currentBeast) {
      alert('Selecione um beast primeiro');
      return;
    }

    if (this.isInQueue) {
      return;
    }

    try {
      await joinMatchmaking(this.currentBeast.id, this.selectedMatchType);
      pvpSocketClient.joinMatchmaking(this.currentBeast.id, this.selectedMatchType);
      
      this.isInQueue = true;
      this.queueStartTime = Date.now();
      this.updateQueueStatus(true);
      this.startQueueTimer();
    } catch (error: any) {
      console.error('[PVP Matchmaking] Error joining queue:', error);
      alert('Erro ao entrar na fila: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private async handleLeaveQueue() {
    if (!this.isInQueue) {
      return;
    }

    try {
      await leaveMatchmaking();
      pvpSocketClient.leaveMatchmaking();
      
      this.isInQueue = false;
      this.updateQueueStatus(false);
      this.stopQueueTimer();
    } catch (error: any) {
      console.error('[PVP Matchmaking] Error leaving queue:', error);
      alert('Erro ao sair da fila: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private handleMatchFound(data: { matchId: number; opponent: { userId: number; beastId: number }; matchType: MatchType }) {
    this.isInQueue = false;
    this.updateQueueStatus(false);
    this.stopQueueTimer();
    this.hide();

    this.onMatchFound(data.matchId, data.opponent, data.matchType);
  }

  private updateQueueStatus(inQueue: boolean) {
    const statusEl = this.container.querySelector('#queue-status');
    const joinBtn = this.container.querySelector('#btn-join-queue') as HTMLButtonElement;
    const leaveBtn = this.container.querySelector('#btn-leave-queue') as HTMLButtonElement;

    if (!statusEl || !joinBtn || !leaveBtn) return;

    if (inQueue) {
      statusEl.innerHTML = '<p>Buscando oponente...</p>';
      joinBtn.style.display = 'none';
      leaveBtn.style.display = 'block';
    } else {
      statusEl.innerHTML = '<p>Selecione um beast e clique em "Buscar Partida"</p>';
      joinBtn.style.display = 'block';
      leaveBtn.style.display = 'none';
    }
  }

  private startQueueTimer() {
    this.stopQueueTimer();

    this.queueInterval = window.setInterval(() => {
      if (!this.isInQueue) {
        this.stopQueueTimer();
        return;
      }

      const elapsed = Math.floor((Date.now() - this.queueStartTime) / 1000);
      const statusEl = this.container.querySelector('#queue-status');
      if (statusEl) {
        statusEl.innerHTML = `<p>Buscando oponente... (${elapsed}s)</p>`;
      }
    }, 1000);
  }

  private stopQueueTimer() {
    if (this.queueInterval !== null) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }
  }

  public show(beast: Beast) {
    this.currentBeast = beast;
    this.isVisible = true;
    this.container.style.display = 'block';
    
    // Verificar status atual
    this.checkQueueStatus();
  }

  public hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  private async checkQueueStatus() {
    try {
      const status = await getMatchmakingStatus();
      if (status.inQueue) {
        this.isInQueue = true;
        this.queueStartTime = Date.now();
        this.updateQueueStatus(true);
        this.startQueueTimer();
      }
    } catch (error) {
      console.error('[PVP Matchmaking] Error checking queue status:', error);
    }
  }
}

