# Script para iniciar PostgreSQL e corrigir o banco
# Execute: .\iniciar-tudo.ps1

Write-Host "🚀 Iniciando Beast Keepers - Setup Completo" -ForegroundColor Green
Write-Host ""

# 1. Iniciar PostgreSQL via WSL
Write-Host "1️⃣ Iniciando PostgreSQL..." -ForegroundColor Cyan
C:\Windows\System32\wsl.exe bash -c "sudo service postgresql start"
Start-Sleep -Seconds 2

# 2. Verificar status
Write-Host "2️⃣ Verificando PostgreSQL..." -ForegroundColor Cyan
C:\Windows\System32\wsl.exe bash -c "sudo service postgresql status | head -n 3"
Start-Sleep -Seconds 1

# 3. Executar correção do banco
Write-Host "3️⃣ Corrigindo banco de dados..." -ForegroundColor Cyan
Set-Location "E:\PROJETOS\Vectorizer\vanilla-game\server"
node test-fix.js
Start-Sleep -Seconds 1

# 4. Informações finais
Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. O servidor já está rodando em http://localhost:3000" -ForegroundColor White
Write-Host "   2. Abra http://localhost:5173 no navegador" -ForegroundColor White
Write-Host "   3. Faça login e teste as ações!" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

