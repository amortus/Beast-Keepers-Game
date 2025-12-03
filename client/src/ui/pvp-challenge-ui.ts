/**
 * PVP Challenge UI
 * Interface para desafios diretos
 */

import { sendChallenge, acceptChallenge, declineChallenge, getPendingChallenges, Challenge } from '../api/pvpApi';
import { pvpSocketClient } from '../services/pvpSocketClient';
import type { Beast } from '../types';

export class PvpChallengeUI {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private currentBeast: Beast | null = null;

  // Callbacks
  public onChallengeAccepted: (matchId: number) => void = () => {};

  constructor(containerId: string = 'pvp-challenge-container') {
    const existing = document.getElementById(containerId);
    if (existing) {
      this.container = existing as HTMLDivElement;
    } else {
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'pvp-challenge-ui';
      document.body.appendChild(this.container);
    }

    this.setupUI();
    this.setupSocketListeners();
  }

  private setupUI() {
    this.container.innerHTML = `
      <div class="pvp-challenge-panel">
        <h2>Desafios PVP</h2>
        <div class="challenges-content">
          <div class="received-challenges">
            <h3>Desafios Recebidos</h3>
            <div id="received-challenges-list"></div>
          </div>
          <div class="sent-challenges">
            <h3>Desafios Enviados</h3>
            <div id="sent-challenges-list"></div>
          </div>
        </div>
        <button id="btn-close-challenges" class="btn-secondary">Fechar</button>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-challenges');
    closeBtn?.addEventListener('click', () => this.hide());
  }

  private setupSocketListeners() {
    pvpSocketClient.onChallengeReceived((data) => {
      this.loadChallenges();
    });

    pvpSocketClient.onChallengeAccepted((data) => {
      this.loadChallenges();
      if (data.matchId) {
        this.onChallengeAccepted(data.matchId);
      }
    });
  }

  public async show(beast: Beast) {
    this.currentBeast = beast;
    this.isVisible = true;
    this.container.style.display = 'block';
    await this.loadChallenges();
  }

  public hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  public async sendChallengeToUser(userId: number, userName: string) {
    if (!this.currentBeast) {
      alert('Selecione um beast primeiro');
      return;
    }

    try {
      await sendChallenge(userId, this.currentBeast.id);
      alert(`Desafio enviado para ${userName}`);
      await this.loadChallenges();
    } catch (error: any) {
      console.error('[PVP Challenge] Error sending challenge:', error);
      alert('Erro ao enviar desafio: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private async loadChallenges() {
    try {
      const { received, sent } = await getPendingChallenges();
      this.renderReceivedChallenges(received);
      this.renderSentChallenges(sent);
    } catch (error) {
      console.error('[PVP Challenge] Error loading challenges:', error);
    }
  }

  private renderReceivedChallenges(challenges: Challenge[]) {
    const list = this.container.querySelector('#received-challenges-list');
    if (!list) return;

    if (challenges.length === 0) {
      list.innerHTML = '<p>Nenhum desafio recebido.</p>';
      return;
    }

    list.innerHTML = challenges.map(challenge => `
      <div class="challenge-item">
        <div class="challenge-info">
          <strong>${challenge.challenger_name || 'Jogador'}</strong> te desafiou
        </div>
        <div class="challenge-actions">
          <button class="btn-accept" data-challenge-id="${challenge.id}">Aceitar</button>
          <button class="btn-decline" data-challenge-id="${challenge.id}">Recusar</button>
        </div>
      </div>
    `).join('');

    // Event listeners
    list.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const challengeId = parseInt((e.target as HTMLElement).getAttribute('data-challenge-id') || '0');
        await this.handleAcceptChallenge(challengeId);
      });
    });

    list.querySelectorAll('.btn-decline').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const challengeId = parseInt((e.target as HTMLElement).getAttribute('data-challenge-id') || '0');
        await this.handleDeclineChallenge(challengeId);
      });
    });
  }

  private renderSentChallenges(challenges: Challenge[]) {
    const list = this.container.querySelector('#sent-challenges-list');
    if (!list) return;

    if (challenges.length === 0) {
      list.innerHTML = '<p>Nenhum desafio enviado.</p>';
      return;
    }

    list.innerHTML = challenges.map(challenge => `
      <div class="challenge-item">
        <div class="challenge-info">
          Desafio enviado para <strong>${challenge.challenged_name || 'Jogador'}</strong>
          <small>Status: ${challenge.status}</small>
        </div>
      </div>
    `).join('');
  }

  private async handleAcceptChallenge(challengeId: number) {
    if (!this.currentBeast) {
      alert('Selecione um beast primeiro');
      return;
    }

    try {
      const { matchId } = await acceptChallenge(challengeId, this.currentBeast.id);
      this.hide();
      this.onChallengeAccepted(matchId);
    } catch (error: any) {
      console.error('[PVP Challenge] Error accepting challenge:', error);
      alert('Erro ao aceitar desafio: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private async handleDeclineChallenge(challengeId: number) {
    try {
      await declineChallenge(challengeId);
      await this.loadChallenges();
    } catch (error: any) {
      console.error('[PVP Challenge] Error declining challenge:', error);
      alert('Erro ao recusar desafio: ' + (error.message || 'Erro desconhecido'));
    }
  }
}

