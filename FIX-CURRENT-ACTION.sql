-- ========================================
-- FIX: Adicionar coluna current_action
-- Execute este SQL no PostgreSQL
-- ========================================

-- Adicionar coluna current_action se não existir
ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS current_action JSONB DEFAULT NULL;

-- Adicionar outras colunas de tempo real se não existirem
ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS last_exploration BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_tournament BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS birth_date BIGINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_update BIGINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_bonus_count INTEGER DEFAULT 0;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);
CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);
CREATE INDEX IF NOT EXISTS idx_beasts_last_tournament ON beasts(last_tournament);
CREATE INDEX IF NOT EXISTS idx_beasts_birth_date ON beasts(birth_date);

-- Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'beasts' 
  AND column_name IN ('current_action', 'last_exploration', 'exploration_count', 'last_tournament')
ORDER BY column_name;

