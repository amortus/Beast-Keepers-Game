@echo off
chcp 65001 >nul
title Beast Keepers - Iniciar PostgreSQL

echo.
echo ════════════════════════════════════════════════
echo    🎮 BEAST KEEPERS - INICIAR POSTGRESQL
echo ════════════════════════════════════════════════
echo.

echo 📝 Iniciando PostgreSQL via WSL...
echo.

C:\Windows\System32\wsl.exe bash -c "sudo service postgresql start"

echo.
echo ⏳ Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 🔍 Verificando se PostgreSQL iniciou...
C:\Windows\System32\wsl.exe bash -c "sudo service postgresql status | grep -i 'online\|active' || echo 'PostgreSQL pode não ter iniciado'"

echo.
echo ✅ Pronto! PostgreSQL deve estar rodando agora.
echo.
echo 💡 Próximos passos:
echo    1. O servidor do jogo já está rodando (não precisa fazer nada)
echo    2. Abra http://localhost:5173 no navegador
echo    3. Faça login e teste as ações!
echo.
echo ════════════════════════════════════════════════
echo.

pause

