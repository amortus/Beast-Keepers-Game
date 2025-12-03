/**
 * Script para verificar e diagnosticar problemas com usuário
 * Uso: ts-node src/db/check-user.ts <email>
 */

import { query } from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser(email: string) {
  try {
    console.log(`[Check User] Verificando usuário: ${email}\n`);

    // Verificar se usuário existe
    const userResult = await query(
      `SELECT id, email, display_name, password_hash, google_id, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário NÃO encontrado no banco de dados!');
      console.log('\nPossíveis causas:');
      console.log('1. Conta foi deletada');
      console.log('2. Email está incorreto');
      console.log('3. Banco de dados foi resetado');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.display_name}`);
    console.log(`   Google ID: ${user.google_id || 'N/A'}`);
    console.log(`   Tem senha: ${user.password_hash ? 'Sim' : 'Não'}`);
    console.log(`   Criado em: ${user.created_at}`);
    console.log(`   Atualizado em: ${user.updated_at}`);

    // Verificar game save
    const gameSaveResult = await query(
      `SELECT id, player_name, week, coronas, victories, current_title
       FROM game_saves
       WHERE user_id = $1`,
      [user.id]
    );

    if (gameSaveResult.rows.length === 0) {
      console.log('\n⚠️  Nenhum game save encontrado para este usuário!');
    } else {
      const gameSave = gameSaveResult.rows[0];
      console.log('\n✅ Game Save encontrado:');
      console.log(`   ID: ${gameSave.id}`);
      console.log(`   Player Name: ${gameSave.player_name}`);
      console.log(`   Week: ${gameSave.week}`);
      console.log(`   Coronas: ${gameSave.coronas}`);
      console.log(`   Victories: ${gameSave.victories}`);
      console.log(`   Current Title: ${gameSave.current_title}`);
    }

    // Verificar beasts
    const beastsResult = await query(
      `SELECT COUNT(*) as count
       FROM beasts
       WHERE game_save_id IN (SELECT id FROM game_saves WHERE user_id = $1)`,
      [user.id]
    );

    const beastCount = parseInt(beastsResult.rows[0].count);
    console.log(`\n📊 Beasts: ${beastCount}`);

    // Diagnóstico
    console.log('\n📋 Diagnóstico:');
    if (!user.password_hash && !user.google_id) {
      console.log('⚠️  Usuário não tem senha nem Google ID - não consegue fazer login!');
    } else if (!user.password_hash) {
      console.log('ℹ️  Usuário só pode fazer login via Google OAuth');
    } else {
      console.log('✅ Usuário pode fazer login com email/senha');
    }

  } catch (error) {
    console.error('[Check User] Erro:', error);
  } finally {
    process.exit(0);
  }
}

// Executar
const email = process.argv[2];
if (!email) {
  console.error('Uso: ts-node src/db/check-user.ts <email>');
  process.exit(1);
}

checkUser(email);

