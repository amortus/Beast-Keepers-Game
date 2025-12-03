-- Migration 002: Sistema PVP Completo
-- Rankings, ELO, matchmaking, partidas, temporadas e desafios diretos

-- Tabela de rankings PvP (por temporada)
CREATE TABLE IF NOT EXISTS pvp_rankings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL DEFAULT 1,
  elo INTEGER NOT NULL DEFAULT 1000,
  tier VARCHAR(20) NOT NULL DEFAULT 'iron',
  division INTEGER DEFAULT 4,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  peak_elo INTEGER DEFAULT 1000,
  peak_tier VARCHAR(20) DEFAULT 'iron',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, season_number)
);

-- Tabela de partidas PvP
CREATE TABLE IF NOT EXISTS pvp_matches (
  id SERIAL PRIMARY KEY,
  season_number INTEGER NOT NULL DEFAULT 1,
  player1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player1_beast_id INTEGER NOT NULL REFERENCES beasts(id) ON DELETE SET NULL,
  player2_beast_id INTEGER NOT NULL REFERENCES beasts(id) ON DELETE SET NULL,
  match_type VARCHAR(20) NOT NULL DEFAULT 'ranked', -- ranked, casual, direct_challenge
  winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  loser_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  elo_change_player1 INTEGER,
  elo_change_player2 INTEGER,
  duration_seconds INTEGER,
  battle_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Tabela de fila de matchmaking
CREATE TABLE IF NOT EXISTS pvp_matchmaking_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beast_id INTEGER NOT NULL REFERENCES beasts(id) ON DELETE CASCADE,
  match_type VARCHAR(20) NOT NULL, -- ranked, casual
  elo INTEGER,
  tier VARCHAR(20),
  queued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes'),
  UNIQUE(user_id)
);

-- Tabela de temporadas PvP
CREATE TABLE IF NOT EXISTS pvp_seasons (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, ended
  rewards_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de desafios diretos
CREATE TABLE IF NOT EXISTS pvp_direct_challenges (
  id SERIAL PRIMARY KEY,
  challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenger_beast_id INTEGER NOT NULL REFERENCES beasts(id) ON DELETE SET NULL,
  challenged_beast_id INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired, completed
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
  accepted_at TIMESTAMP,
  match_id INTEGER REFERENCES pvp_matches(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pvp_rankings_user_season ON pvp_rankings(user_id, season_number);
CREATE INDEX IF NOT EXISTS idx_pvp_rankings_elo ON pvp_rankings(elo DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_rankings_tier ON pvp_rankings(tier, division);
CREATE INDEX IF NOT EXISTS idx_pvp_rankings_season ON pvp_rankings(season_number);

CREATE INDEX IF NOT EXISTS idx_pvp_matches_player1 ON pvp_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_player2 ON pvp_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_season ON pvp_matches(season_number);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_type ON pvp_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_created ON pvp_matches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pvp_queue_user ON pvp_matchmaking_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_queue_type ON pvp_matchmaking_queue(match_type);
CREATE INDEX IF NOT EXISTS idx_pvp_queue_elo ON pvp_matchmaking_queue(elo);
CREATE INDEX IF NOT EXISTS idx_pvp_queue_expires ON pvp_matchmaking_queue(expires_at);

CREATE INDEX IF NOT EXISTS idx_pvp_seasons_status ON pvp_seasons(status);
CREATE INDEX IF NOT EXISTS idx_pvp_seasons_number ON pvp_seasons(number);

CREATE INDEX IF NOT EXISTS idx_pvp_challenges_challenger ON pvp_direct_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_challenged ON pvp_direct_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_status ON pvp_direct_challenges(status);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_expires ON pvp_direct_challenges(expires_at);

-- Triggers para updated_at
CREATE TRIGGER update_pvp_rankings_updated_at BEFORE UPDATE ON pvp_rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pvp_seasons_updated_at BEFORE UPDATE ON pvp_seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE pvp_rankings IS 'Rankings e ELO dos jogadores por temporada';
COMMENT ON TABLE pvp_matches IS 'Histórico de todas as partidas PVP';
COMMENT ON TABLE pvp_matchmaking_queue IS 'Fila de matchmaking ativa (ranked e casual)';
COMMENT ON TABLE pvp_seasons IS 'Temporadas de PVP';
COMMENT ON TABLE pvp_direct_challenges IS 'Desafios diretos entre jogadores';

