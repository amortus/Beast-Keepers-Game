-- Executar todas as novas colunas de uma vez
-- Migration 009-017 simplificadas

-- 009: Desafios Diários
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS daily_challenges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS challenge_streak JSONB DEFAULT '{"currentStreak": 0, "longestStreak": 0, "lastCompletionDate": "", "totalDaysCompleted": 0}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_game_saves_challenges ON game_saves USING GIN (daily_challenges);

-- 010: Ciclo de Vida
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS beast_memorials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS current_beast_lineage INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_game_saves_memorials ON game_saves USING GIN (beast_memorials);

-- 011: Relíquias
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS relic_history JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_game_saves_relics ON game_saves USING GIN (relic_history);

-- 013: Dungeons
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS dungeon_progress JSONB DEFAULT '{}'::jsonb;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS stamina INTEGER DEFAULT 100;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS last_stamina_regen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_game_saves_dungeons ON game_saves USING GIN (dungeon_progress);

-- 014: Equipamentos
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS beast_equipment JSONB DEFAULT '{"mask": null, "armor": null, "weapon": null, "amulet": null}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_game_saves_equipment ON game_saves USING GIN (beast_equipment);

-- 015: Customização Rancho
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS ranch_decorations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS ranch_theme VARCHAR(50) DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_game_saves_ranch ON game_saves USING GIN (ranch_decorations);

-- 017: Stats Tracker
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS stats_tracker JSONB DEFAULT '{"totalDefeats": 0, "longestStreak": 0, "totalDamageDealt": 0, "totalDamageTaken": 0, "totalHealing": 0, "criticalHits": 0, "perfectWins": 0, "comebackWins": 0, "techniqueUsage": {}, "favoriteElement": "", "totalPlayTime": 0, "lastLoginDate": "", "loginStreak": 1}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_game_saves_stats ON game_saves USING GIN (stats_tracker);

