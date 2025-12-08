# ✅ Checklist de Verificação - Problemas no Banco

## 🎯 Objetivo
Identificar e resolver problemas de conexão e performance no banco de dados.

---

## 📝 Passo 1: Verificar Outros Serviços no Railway

### No Railway Dashboard:

1. **Acesse**: https://railway.com
2. **Vá para o projeto**: `considerate-delight` (ou o nome do seu projeto)
3. **Clique no serviço PostgreSQL** (banco de dados)
4. **Vá para a aba "Settings"**
5. **Procure por "Connected Services" ou "Dependencies"**

### O que verificar:

- [ ] **Lista de serviços conectados**
  - Deve mostrar apenas o serviço "web" do Beast Keepers
  - Se aparecer "Guardian Grove" ou outros, **isso é o problema!**

- [ ] **Se encontrar outros serviços:**
  1. Anote quais serviços estão conectados
  2. Vá para cada serviço e verifique a variável `DATABASE_URL`
  3. Cada projeto deve ter seu próprio banco PostgreSQL

### Como corrigir (se necessário):

1. **Criar novo banco para cada projeto:**
   - No Railway, clique em "+ New" → "Database" → "PostgreSQL"
   - Dê um nome: "beast-keepers-db" (ou similar)
   - Anote a nova `DATABASE_URL`

2. **Atualizar variável no serviço web:**
   - Vá para o serviço "web"
   - Aba "Variables"
   - Atualize `DATABASE_URL` com a nova URL
   - Faça deploy

3. **Executar migrações no novo banco:**
   - Use a nova `DATABASE_URL` localmente
   - Execute: `npm run migrate`

---

## 📝 Passo 2: Executar Diagnóstico do Banco

### No Terminal (local ou Railway):

```bash
cd vanilla-game/server
npm run diagnose-db
```

### O que o script mostra:

1. **Conexões ativas**
   - Quantas conexões estão abertas
   - Quais aplicações estão usando
   - Quais queries estão rodando

2. **Queries lentas**
   - Queries que demoram >5 segundos
   - PIDs das queries problemáticas

3. **Bloqueios**
   - Se há queries bloqueando outras
   - Quais queries estão causando bloqueio

4. **Limite de conexões**
   - Máximo permitido pelo banco
   - Quantas estão em uso
   - Porcentagem de uso

### O que verificar nos resultados:

- [ ] **Conexões ativas:**
  - ✅ Normal: 1-3 conexões
  - ⚠️ Alerta: 4-5 conexões
  - ❌ Crítico: 5+ conexões

- [ ] **Application names:**
  - Se aparecer "Guardian Grove" ou outros nomes → **outros serviços usando o mesmo banco!**

- [ ] **Queries lentas:**
  - ✅ Normal: Nenhuma
  - ⚠️ Alerta: 1-2 queries lentas
  - ❌ Crítico: 3+ queries lentas

- [ ] **Uso de conexões:**
  - ✅ Normal: <70%
  - ⚠️ Alerta: 70-80%
  - ❌ Crítico: >80%

---

## 📝 Passo 3: Verificar Vazamentos de Conexões no Código

### No Terminal:

```bash
cd vanilla-game/server
grep -r "getClient()" src/ --include="*.ts" -A 5 | grep -E "(getClient|release)" | less
```

### O que verificar:

- [ ] **Todos os `getClient()` têm `client.release()`**
  - Procure por padrões como:
    ```typescript
    const client = await getClient();
    try {
      // código
    } finally {
      client.release(); // ✅ DEVE TER ISSO
    }
    ```

- [ ] **Se encontrar `getClient()` sem `finally`:**
  - Anote o arquivo e linha
  - Adicione `finally { client.release() }`

### Arquivos para verificar manualmente:

- [ ] `src/services/pvpSeasonService.ts`
- [ ] `src/services/pvpMatchmakingService.ts`
- [ ] `src/services/pvpMatchService.ts`
- [ ] `src/services/pvpRankingService.ts`
- [ ] `src/controllers/gameController.ts`

---

## 📝 Passo 4: Verificar Limite de Conexões no Railway

### No Railway Dashboard:

1. **Acesse o serviço PostgreSQL**
2. **Vá para "Metrics" ou "Settings"**
3. **Procure por:**
   - Limite de conexões do plano
   - Uso atual
   - CPU/Memória

### Planos comuns:

- **Hobby (Free)**: ~20 conexões
- **Pro**: ~100 conexões
- **Team**: ~200 conexões

### O que fazer:

- [ ] **Se limite < 10:**
  - Reduzir pool no código para 3 conexões (já está em 5)
  - Ou considerar upgrade do plano

- [ ] **Se uso > 80%:**
  - Verificar se há outros serviços usando
  - Reduzir pool
  - Otimizar queries

---

## 📝 Passo 5: Verificar Queries Lentas nos Logs

### No Railway Dashboard:

1. **Vá para o serviço "web"**
2. **Aba "Logs"**
3. **Filtre por**: "Slow query detected"

### O que verificar:

- [ ] **Queries que aparecem frequentemente:**
  - Anote quais queries são lentas
  - Verifique se podem ser cacheadas
  - Verifique se precisam de índices

### Queries já otimizadas:

- ✅ `SELECT column_name FROM information_schema.columns` - **JÁ ESTÁ EM CACHE**

---

## 🔧 Ações Corretivas

### Se encontrar outros serviços usando o mesmo banco:

1. **Criar banco separado** para cada projeto
2. **Atualizar DATABASE_URL** de cada serviço
3. **Executar migrações** no novo banco
4. **Fazer deploy** e testar

### Se encontrar vazamentos de conexões:

1. **Adicionar `finally { client.release() }`** em todos os lugares
2. **Testar localmente** antes de fazer deploy
3. **Fazer commit e push**

### Se limite de conexões for muito baixo:

1. **Reduzir pool** para 3 conexões (se necessário)
2. **Ou fazer upgrade** do plano do Railway

### Se encontrar queries lentas:

1. **Adicionar índices** nas colunas usadas em WHERE/ORDER BY
2. **Cachear resultados** de queries frequentes
3. **Otimizar queries** complexas

---

## 📊 Resumo dos Resultados

Após executar todas as verificações, preencha:

- [ ] **Outros serviços usando o mesmo banco?** 
  - [ ] Sim → Criar banco separado
  - [ ] Não → OK

- [ ] **Vazamentos de conexões encontrados?**
  - [ ] Sim → Corrigir código
  - [ ] Não → OK

- [ ] **Limite de conexões:**
  - [ ] < 10 → Reduzir pool para 3
  - [ ] 10-20 → Pool de 5 está OK
  - [ ] > 20 → Pool pode ser maior

- [ ] **Queries lentas:**
  - [ ] Sim → Otimizar ou cachear
  - [ ] Não → OK

---

## 🆘 Se Nada Funcionar

**Última opção - Criar banco novo:**

1. Criar banco PostgreSQL completamente novo no Railway
2. Executar todas as migrações no novo banco
3. Atualizar `DATABASE_URL` no serviço web
4. Fazer deploy e testar

Isso garante que não há interferência de outros projetos ou dados corrompidos.

