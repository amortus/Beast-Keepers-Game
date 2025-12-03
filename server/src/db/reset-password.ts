/**
 * Script para resetar senha de usuário
 * Uso: ts-node src/db/reset-password.ts <email> <nova-senha>
 */

import { query } from './connection';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`[Reset Password] Resetando senha para: ${email}\n`);

    // Verificar se usuário existe
    const userResult = await query(
      `SELECT id, email, display_name
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuário encontrado: ${user.display_name}`);

    // Validar senha
    if (newPassword.length < 6) {
      console.log('❌ Senha deve ter pelo menos 6 caracteres!');
      return;
    }

    // Hash nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE email = $2`,
      [passwordHash, email]
    );

    console.log('✅ Senha resetada com sucesso!');
    console.log(`\nNova senha: ${newPassword}`);
    console.log('⚠️  Guarde esta senha em local seguro!');

  } catch (error) {
    console.error('[Reset Password] Erro:', error);
  } finally {
    process.exit(0);
  }
}

// Executar
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Uso: ts-node src/db/reset-password.ts <email> <nova-senha>');
  process.exit(1);
}

resetPassword(email, newPassword);

