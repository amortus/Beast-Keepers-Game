/**
 * Game Controller
 * Beast Keepers Server
 */

import { Response } from 'express';
import { query, getClient } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, GameSaveDTO, BeastDTO } from '../types';
import { generateRandomBeast } from '../utils/beastData';

/**
 * Initialize new game for user
 */
export async function initializeGame(req: AuthRequest, res: Response) {
  const client = await getClient();
  
  try {
    console.log('[Game] Initialize request received');
    const userId = req.user?.id;
    console.log('[Game] User ID:', userId);
    
    if (!userId) {
      console.error('[Game] No user ID found in request');
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { playerName } = req.body;
    console.log('[Game] Player name:', playerName);

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Player name is required' } as ApiResponse);
    }

    console.log('[Game] Starting transaction...');
    await client.query('BEGIN');

    // Check if user already has a game save
    const existingSave = await client.query(
      'SELECT id FROM game_saves WHERE user_id = $1',
      [userId]
    );

    if (existingSave.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        error: 'User already has a game save' 
      } as ApiResponse);
    }

    // Create game save
    const gameSaveResult = await client.query(
      `INSERT INTO game_saves (user_id, player_name)
       VALUES ($1, $2)
       RETURNING id, user_id, player_name, week, coronas, victories, current_title, created_at, updated_at`,
      [userId, playerName.trim()]
    );

    const gameSave = gameSaveResult.rows[0];

    // Generate completely random and unique beast
    const randomBeast = generateRandomBeast(playerName.trim());

    // Create initial beast with randomized stats
    const now = Date.now();
    
    // Calcular meia-noite de hoje (Brasília) para inicializar lastDayProcessed
    const brasiliaNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    brasiliaNow.setHours(0, 0, 0, 0);
    const midnightTimestamp = brasiliaNow.getTime();
    
    // Verificar se as colunas de ciclo diário existem antes de inserir
    console.log('[Game] Checking for age columns...');
    let hasAgeInDays = false;
    let hasLastDayProcessed = false;
    
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'beasts' 
        AND column_name IN ('age_in_days', 'last_day_processed')
      `);
      
      hasAgeInDays = columnCheck.rows.some(r => r.column_name === 'age_in_days');
      hasLastDayProcessed = columnCheck.rows.some(r => r.column_name === 'last_day_processed');
      console.log('[Game] Age columns check:', { hasAgeInDays, hasLastDayProcessed });
    } catch (columnError: any) {
      console.warn('[Game] Error checking columns, assuming they dont exist:', columnError.message);
      hasAgeInDays = false;
      hasLastDayProcessed = false;
    }
    
    let insertQuery: string;
    let insertValues: any[];
    
    if (hasAgeInDays && hasLastDayProcessed) {
      // Inserir com todos os campos incluindo ciclo diário
      insertQuery = `INSERT INTO beasts (
        game_save_id, name, line, blood, affinity, is_active,
        current_hp, max_hp, essence, max_essence,
        might, wit, focus, agility, ward, vitality,
        loyalty, stress, fatigue, techniques, traits, level, experience,
        birth_date, last_update, age_in_days, last_day_processed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`;
      
      insertValues = [
        gameSave.id,
        randomBeast.name,
        randomBeast.line,
        randomBeast.blood,
        randomBeast.affinity,
        true,
        randomBeast.currentHp,
        randomBeast.maxHp,
        randomBeast.essence,
        randomBeast.maxEssence,
        randomBeast.attributes.might,
        randomBeast.attributes.wit,
        randomBeast.attributes.focus,
        randomBeast.attributes.agility,
        randomBeast.attributes.ward,
        randomBeast.attributes.vitality,
        randomBeast.secondaryStats.loyalty,
        randomBeast.secondaryStats.stress,
        randomBeast.secondaryStats.fatigue,
        JSON.stringify(randomBeast.techniques),
        JSON.stringify(randomBeast.traits),
        randomBeast.level,
        randomBeast.experience,
        now,
        now,
        0,
        midnightTimestamp
      ];
    } else {
      // Inserir sem campos de ciclo diário (fallback para bancos antigos)
      console.warn('[Game] Age columns not found, using fallback INSERT');
      insertQuery = `INSERT INTO beasts (
        game_save_id, name, line, blood, affinity, is_active,
        current_hp, max_hp, essence, max_essence,
        might, wit, focus, agility, ward, vitality,
        loyalty, stress, fatigue, techniques, traits, level, experience,
        birth_date, last_update
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`;
      
      insertValues = [
        gameSave.id,
        randomBeast.name,
        randomBeast.line,
        randomBeast.blood,
        randomBeast.affinity,
        true,
        randomBeast.currentHp,
        randomBeast.maxHp,
        randomBeast.essence,
        randomBeast.maxEssence,
        randomBeast.attributes.might,
        randomBeast.attributes.wit,
        randomBeast.attributes.focus,
        randomBeast.attributes.agility,
        randomBeast.attributes.ward,
        randomBeast.attributes.vitality,
        randomBeast.secondaryStats.loyalty,
        randomBeast.secondaryStats.stress,
        randomBeast.secondaryStats.fatigue,
        JSON.stringify(randomBeast.techniques),
        JSON.stringify(randomBeast.traits),
        randomBeast.level,
        randomBeast.experience,
        now,
        now
      ];
    }
    
    console.log('[Game] Inserting beast with query:', insertQuery.substring(0, 100) + '...');
    console.log('[Game] Insert values count:', insertValues.length);
    
    const beastResult = await client.query(insertQuery, insertValues);
    console.log('[Game] Beast inserted successfully, ID:', beastResult.rows[0]?.id);

    console.log('[Game] Committing transaction...');
    await client.query('COMMIT');

    console.log(`[Game] Initialized game for user ${userId}: ${playerName} with ${randomBeast.line} (${randomBeast.blood})`);

    return res.status(201).json({
      success: true,
      data: {
        gameSave: {
          id: gameSave.id,
          userId: gameSave.user_id,
          playerName: gameSave.player_name,
          week: gameSave.week,
          coronas: gameSave.coronas,
          victories: gameSave.victories,
          currentTitle: gameSave.current_title,
          createdAt: gameSave.created_at,
          updatedAt: gameSave.updated_at
        } as GameSaveDTO,
        initialBeast: beastResult.rows[0]
      }
    } as ApiResponse);

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {
      // Ignore rollback errors
    });
    console.error('[Game] Initialize error:', error);
    console.error('[Game] Error stack:', error?.stack);
    console.error('[Game] Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize game',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    } as ApiResponse);
  } finally {
    client.release();
  }
}

/**
 * Get game save for current user
 */
export async function getGameSave(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    // Get game save
    const saveResult = await query(
      `SELECT id, user_id, player_name, week, coronas, victories, current_title,
              win_streak, lose_streak, total_trains, total_crafts, total_spent,
              created_at, updated_at
       FROM game_saves
       WHERE user_id = $1`,
      [userId]
    );

    if (saveResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No game save found' } as ApiResponse);
    }

    const gameSave = saveResult.rows[0];

    // Get beasts
    const beastsResult = await query(
      'SELECT * FROM beasts WHERE game_save_id = $1',
      [gameSave.id]
    );

    // Get inventory
    const inventoryResult = await query(
      'SELECT * FROM inventory WHERE game_save_id = $1',
      [gameSave.id]
    );

    // Get quests
    const questsResult = await query(
      'SELECT * FROM quests WHERE game_save_id = $1',
      [gameSave.id]
    );

    // Get achievements
    const achievementsResult = await query(
      'SELECT * FROM achievements WHERE game_save_id = $1',
      [gameSave.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        gameSave,
        beasts: beastsResult.rows,
        inventory: inventoryResult.rows,
        quests: questsResult.rows,
        achievements: achievementsResult.rows
      }
    } as ApiResponse);

  } catch (error) {
    console.error('[Game] Get save error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get game save' } as ApiResponse);
  }
}

/**
 * Update game save
 */
export async function updateGameSave(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { week, coronas, victories, currentTitle, winStreak, loseStreak, totalTrains, totalCrafts, totalSpent } = req.body;

    const result = await query(
      `UPDATE game_saves
       SET week = COALESCE($2, week),
           coronas = COALESCE($3, coronas),
           victories = COALESCE($4, victories),
           current_title = COALESCE($5, current_title),
           win_streak = COALESCE($6, win_streak),
           lose_streak = COALESCE($7, lose_streak),
           total_trains = COALESCE($8, total_trains),
           total_crafts = COALESCE($9, total_crafts),
           total_spent = COALESCE($10, total_spent)
       WHERE user_id = $1
       RETURNING *`,
      [userId, week, coronas, victories, currentTitle, winStreak, loseStreak, totalTrains, totalCrafts, totalSpent]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Game save not found' } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('[Game] Update save error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update game save' } as ApiResponse);
  }
}

/**
 * Update beast data
 */
export async function updateBeast(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { beastId } = req.params;
    const beastData = req.body;

    // Verify beast belongs to user's game save
    const ownershipCheck = await query(
      `SELECT b.id FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2`,
      [beastId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Beast not found' } as ApiResponse);
    }

    // Update beast with all provided data
    const result = await query(
      `UPDATE beasts
       SET 
         name = COALESCE($2, name),
         current_hp = COALESCE($3, current_hp),
         max_hp = COALESCE($4, max_hp),
         essence = COALESCE($5, essence),
         max_essence = COALESCE($6, max_essence),
         might = COALESCE($7, might),
         wit = COALESCE($8, wit),
         focus = COALESCE($9, focus),
         agility = COALESCE($10, agility),
         ward = COALESCE($11, ward),
         vitality = COALESCE($12, vitality),
         loyalty = COALESCE($13, loyalty),
         stress = COALESCE($14, stress),
         fatigue = COALESCE($15, fatigue),
         age = COALESCE($16, age),
         level = COALESCE($17, level),
         experience = COALESCE($18, experience),
         techniques = COALESCE($19, techniques),
         traits = COALESCE($20, traits),
         elixir_usage = COALESCE($21, elixir_usage),
         current_action = COALESCE($22, current_action),
         last_exploration = COALESCE($23, last_exploration),
         last_tournament = COALESCE($24, last_tournament),
         exploration_count = COALESCE($25, exploration_count),
         birth_date = COALESCE($26, birth_date),
         last_update = COALESCE($27, last_update),
         work_bonus_count = COALESCE($28, work_bonus_count),
         age_in_days = COALESCE($29, age_in_days),
         last_day_processed = COALESCE($30, last_day_processed),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        beastId,
        beastData.name,
        beastData.currentHp,
        beastData.maxHp,
        beastData.essence,
        beastData.maxEssence,
        beastData.attributes?.might,
        beastData.attributes?.wit,
        beastData.attributes?.focus,
        beastData.attributes?.agility,
        beastData.attributes?.ward,
        beastData.attributes?.vitality,
        beastData.secondaryStats?.loyalty,
        beastData.secondaryStats?.stress,
        beastData.secondaryStats?.fatigue,
        beastData.secondaryStats?.age,
        beastData.level,
        beastData.experience,
        beastData.techniques ? JSON.stringify(beastData.techniques) : null,
        beastData.traits ? JSON.stringify(beastData.traits) : null,
        beastData.elixirUsage ? JSON.stringify(beastData.elixirUsage) : null,
        beastData.currentAction ? JSON.stringify(beastData.currentAction) : null,
        beastData.lastExploration,
        beastData.lastTournament,
        beastData.explorationCount,
        beastData.birthDate,
        beastData.lastUpdate,
        beastData.workBonusCount,
        beastData.ageInDays,
        beastData.lastDayProcessed
      ]
    );

    console.log(`[Game] Beast ${beastId} updated for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('[Game] Update beast error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update beast' } as ApiResponse);
  }
}

