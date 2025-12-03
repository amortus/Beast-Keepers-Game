/**
 * Script para verificar beasts de um usuário
 * Uso: ts-node src/db/check-beasts.ts <email>
 */

import { query } from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function checkBeasts(email: string) {
  try {
    console.log(`[Check Beasts] Verificando beasts de: ${email}\n`);

    // Buscar usuário
    const userResult = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const userId = userResult.rows[0].id;

    // Buscar game save
    const gameSaveResult = await query(
      `SELECT id FROM game_saves WHERE user_id = $1`,
      [userId]
    );

    if (gameSaveResult.rows.length === 0) {
      console.log('❌ Game save não encontrado!');
      return;
    }

    const gameSaveId = gameSaveResult.rows[0].id;

    // Buscar beasts
    const beastsResult = await query(
      `SELECT id, name, line, level, current_hp, max_hp, is_active, created_at
       FROM beasts
       WHERE game_save_id = $1
       ORDER BY created_at DESC`,
      [gameSaveId]
    );

    if (beastsResult.rows.length === 0) {
      console.log('⚠️  Nenhum beast encontrado!');
      return;
    }

    console.log(`✅ Encontrados ${beastsResult.rows.length} beast(s):\n`);

    beastsResult.rows.forEach((beast, index) => {
      console.log(`${index + 1}. ${beast.name} (${beast.line})`);
      console.log(`   ID: ${beast.id}`);
      console.log(`   Level: ${beast.level}`);
      console.log(`   HP: ${beast.current_hp}/${beast.max_hp}`);
      console.log(`   Status: ${beast.is_active ? '✅ Ativo' : '💀 Inativo'}`);
      console.log(`   Criado em: ${beast.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('[Check Beasts] Erro:', error);
  } finally {
    process.exit(0);
  }
}

// Executar
const email = process.argv[2];
if (!email) {
  console.error('Uso: ts-node src/db/check-beasts.ts <email>');
  process.exit(1);
}

checkBeasts(email);

