#!/bin/bash

echo ""
echo "════════════════════════════════════════════════"
echo "   🎮 BEAST KEEPERS - INICIAR POSTGRESQL"
echo "════════════════════════════════════════════════"
echo ""

echo "📝 Iniciando PostgreSQL..."
sudo service postgresql start

echo ""
echo "⏳ Aguardando 2 segundos..."
sleep 2

echo ""
echo "🔍 Verificando status..."
sudo service postgresql status | head -n 5

echo ""
echo "🔧 Verificando e corrigindo banco de dados..."
cd /mnt/e/PROJETOS/Vectorizer/vanilla-game/server
node test-fix.js

echo ""
echo "✅ PRONTO!"
echo ""
echo "💡 Próximos passos:"
echo "   1. O servidor já está rodando (npm run dev em outro terminal)"
echo "   2. Abra http://localhost:5173 no navegador"
echo "   3. Faça login e teste as ações!"
echo ""
echo "════════════════════════════════════════════════"
echo ""

