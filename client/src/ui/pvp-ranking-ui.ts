/**
 * PVP Ranking UI
 * Interface para ranking e leaderboard
 */

import { getRanking, LeaderboardEntry, PlayerRanking } from '../api/pvpApi';

export class PvpRankingUI {
  private container: HTMLDivElement;
  private isVisible: boolean = false;

  constructor(containerId: string = 'pvp-ranking-container') {
    const existing = document.getElementById(containerId);
    if (existing) {
      this.container = existing as HTMLDivElement;
    } else {
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'pvp-ranking-ui';
      document.body.appendChild(this.container);
    }

    this.setupUI();
  }

  private setupUI() {
    this.container.innerHTML = `
      <div class="pvp-ranking-panel">
        <h2>Ranking PVP</h2>
        <div class="ranking-content">
          <div class="player-rank-section" id="player-rank-section"></div>
          <div class="leaderboard-section">
            <h3>Leaderboard</h3>
            <div id="leaderboard-list"></div>
          </div>
        </div>
        <button id="btn-close-ranking" class="btn-secondary">Fechar</button>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-ranking');
    closeBtn?.addEventListener('click', () => this.hide());
  }

  public async show() {
    this.isVisible = true;
    this.container.style.display = 'block';
    await this.loadRanking();
  }

  public hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  private async loadRanking() {
    try {
      const data = await getRanking();
      this.renderPlayerRank(data.playerRank);
      this.renderLeaderboard(data.rankings);
    } catch (error) {
      console.error('[PVP Ranking] Error loading ranking:', error);
    }
  }

  private renderPlayerRank(rank: PlayerRanking | null) {
    const section = this.container.querySelector('#player-rank-section');
    if (!section) return;

    if (!rank) {
      section.innerHTML = '<p>Você ainda não tem ranking nesta temporada.</p>';
      return;
    }

    const winRate = rank.wins + rank.losses > 0
      ? ((rank.wins / (rank.wins + rank.losses)) * 100).toFixed(1)
      : '0.0';

    section.innerHTML = `
      <h3>Seu Ranking</h3>
      <div class="rank-info">
        <div class="tier-badge tier-${rank.tier}">
          ${rank.tier.toUpperCase()} ${rank.division ? `Divisão ${rank.division}` : ''}
        </div>
        <div class="elo">ELO: ${rank.elo}</div>
        <div class="stats">
          <span>Vitórias: ${rank.wins}</span>
          <span>Derrotas: ${rank.losses}</span>
          <span>Win Rate: ${winRate}%</span>
          <span>Streak: ${rank.winStreak}</span>
        </div>
      </div>
    `;
  }

  private renderLeaderboard(rankings: LeaderboardEntry[]) {
    const list = this.container.querySelector('#leaderboard-list');
    if (!list) return;

    if (rankings.length === 0) {
      list.innerHTML = '<p>Nenhum jogador no ranking ainda.</p>';
      return;
    }

    list.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>Tier</th>
            <th>ELO</th>
            <th>W/L</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rankings.map(entry => `
            <tr>
              <td>${entry.rank}</td>
              <td>${entry.displayName}</td>
              <td>${entry.tier.toUpperCase()} ${entry.division ? `Div ${entry.division}` : ''}</td>
              <td>${entry.elo}</td>
              <td>${entry.wins}/${entry.losses}</td>
              <td>${entry.winRate.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

