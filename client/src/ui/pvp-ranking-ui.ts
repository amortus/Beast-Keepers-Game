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
      // Adicionar estilos inline para garantir visibilidade
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: none;
        overflow-y: auto;
        pointer-events: auto;
      `;
      document.body.appendChild(this.container);
    }

    this.setupUI();
  }

  private setupUI() {
    this.container.innerHTML = `
      <style>
        .pvp-ranking-ui {
          font-family: monospace;
          color: #dcece6;
        }
        .pvp-ranking-panel {
          max-width: 1200px;
          margin: 40px auto;
          padding: 30px;
          background: linear-gradient(135deg, rgba(16, 52, 90, 0.9) 0%, rgba(8, 26, 48, 0.95) 100%);
          border: 1.5px solid rgba(60, 194, 255, 0.42);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .pvp-ranking-panel h2 {
          color: #3cc2ff;
          font-size: 32px;
          margin-bottom: 30px;
          text-align: center;
        }
        .pvp-ranking-panel h3 {
          color: #ffd700;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .ranking-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .player-rank-section {
          padding: 20px;
          background: rgba(16, 52, 90, 0.5);
          border: 1px solid rgba(60, 194, 255, 0.3);
          border-radius: 8px;
        }
        .rank-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .tier-badge {
          display: inline-block;
          padding: 10px 20px;
          background: rgba(60, 194, 255, 0.2);
          border: 1px solid rgba(60, 194, 255, 0.5);
          border-radius: 6px;
          font-size: 18px;
          font-weight: bold;
          color: #3cc2ff;
        }
        .elo {
          font-size: 20px;
          color: #ffd700;
        }
        .stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .stats span {
          padding: 8px 16px;
          background: rgba(26, 84, 176, 0.3);
          border-radius: 6px;
          font-size: 14px;
        }
        .leaderboard-section {
          padding: 20px;
          background: rgba(16, 52, 90, 0.5);
          border: 1px solid rgba(60, 194, 255, 0.3);
          border-radius: 8px;
        }
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .leaderboard-table th {
          background: rgba(26, 84, 176, 0.4);
          padding: 12px;
          text-align: left;
          color: #3cc2ff;
          font-weight: bold;
          border-bottom: 2px solid rgba(60, 194, 255, 0.3);
        }
        .leaderboard-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(60, 194, 255, 0.2);
          color: #dcece6;
        }
        .leaderboard-table tr:hover {
          background: rgba(60, 194, 255, 0.1);
        }
        #btn-close-ranking {
          margin-top: 30px;
          padding: 12px 30px;
          background: rgba(255, 77, 77, 0.3);
          border: 1px solid rgba(255, 77, 77, 0.5);
          border-radius: 6px;
          color: #ff4d4d;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        #btn-close-ranking:hover {
          background: rgba(255, 77, 77, 0.5);
          border-color: rgba(255, 77, 77, 0.7);
        }
      </style>
      <div class="pvp-ranking-panel">
        <h2>🏆 Ranking PVP</h2>
        <div class="ranking-content">
          <div class="player-rank-section" id="player-rank-section">
            <p>Carregando...</p>
          </div>
          <div class="leaderboard-section">
            <h3>Leaderboard</h3>
            <div id="leaderboard-list">
              <p>Carregando...</p>
            </div>
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
    try {
      await this.loadRanking();
    } catch (error) {
      console.error('[PVP Ranking] Error showing ranking:', error);
      const section = this.container.querySelector('#player-rank-section');
      if (section) {
        section.innerHTML = '<p style="color: #ff4d4d;">Erro ao carregar ranking. Tente novamente.</p>';
      }
      const list = this.container.querySelector('#leaderboard-list');
      if (list) {
        list.innerHTML = '<p style="color: #ff4d4d;">Erro ao carregar leaderboard. Tente novamente.</p>';
      }
    }
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

