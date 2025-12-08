# 🔍 Guia de Verificação de Problemas no Banco de Dados

## 📋 Checklist de Verificações

### 1. ✅ Verificar Outros Serviços Usando o Mesmo Banco

#### No Railway Dashboard:

1. **Acesse o projeto no Railway**
2. **Vá para a aba "Settings"** do serviço do banco PostgreSQL
3. **Verifique a seção "Connected Services"**
   - Deve listar todos os serviços que estão usando este banco
   - Se houver outros serviços além do "web", isso pode estar causando o problema

4. **Verifique as variáveis de ambiente de cada serviço:**
   - Vá para cada serviço (web, Guardian Grove, etc)
   - Aba "Variables"
   - Verifique se `DATABASE_URL` aponta para o mesmo banco
   - **Cada projeto deve ter seu próprio banco PostgreSQL**

#### Como Corrigir:

- Se Guardian Grove ou outros projetos estão usando o mesmo banco:
  1. Crie um novo banco PostgreSQL no Railway para cada projeto
  2. Atualize a variável `DATABASE_URL` de cada serviço
  3. Execute as migrações no novo banco

---

### 2. ✅ Verificar Vazamentos de Conexões

#### Executar Script de Diagnóstico:

```bash
cd vanilla-game/server
node scripts/diagnose-db-issues.js
```

O script mostrará:
- Conexões ativas
- Queries lentas
- Bloqueios
- Limite de conexões

#### Verificar no Código:

Procurar por usos de `getClient()` sem `finally`:

```bash
# No terminal, dentro de vanilla-game/server
grep -r "getClient()" src/ --include="*.ts" | grep -v "finally"
```

**Todos os usos de `getClient()` devem ter:**
```typescript
const client = await getClient();
try {
  // código
} finally {
  client.release(); // OBRIGATÓRIO
}
```

---

### 3. ✅ Verificar Limite de Conexões no Railway

#### No Railway Dashboard:

1. **Acesse o serviço PostgreSQL**
2. **Vá para "Metrics" ou "Settings"**
3. **Verifique:**
   - Limite de conexões do plano
   - Uso atual de conexões
   - CPU/Memória do banco

#### Planos do Railway PostgreSQL:

- **Hobby**: ~20 conexões
- **Pro**: ~100 conexões
- **Team**: ~200 conexões

**Se o limite for menor que 10, reduza o pool no código para 3-4 conexões.**

---

### 4. ✅ Verificar Queries Lentas

#### Executar o Script:

```bash
cd vanilla-game/server
node scripts/diagnose-db-issues.js
```

O script mostrará queries que demoram mais de 5 segundos.

#### Queries Conhecidas como Lentas:

1. ✅ **JÁ CORRIGIDO**: `SELECT column_name FROM information_schema.columns` - agora está em cache
2. **Verificar outras queries lentas** nos logs do servidor

#### Como Otimizar:

- Adicionar índices nas colunas usadas em WHERE/ORDER BY
- Cachear resultados de queries frequentes
- Reduzir complexidade de JOINs

---

### 5. ✅ Verificar Status do Pool no Código

#### Logs do Servidor:

Procure por:
```
[DB] Pool unhealthy: X/Y connections in use (Z%)
```

**Se sempre está acima de 80%:**
- Reduzir `max` no pool (já reduzido para 5)
- Verificar se há vazamentos de conexões
- Verificar se há queries travadas

---

## 🚨 Problemas Comuns e Soluções

### Problema: Pool sempre esgotado (100%)

**Causas possíveis:**
1. Outros serviços usando o mesmo banco
2. Vazamentos de conexões (client.release() não chamado)
3. Queries travadas bloqueando conexões
4. Limite de conexões do banco muito baixo

**Soluções:**
1. Separar bancos por projeto
2. Garantir que todos os `getClient()` tenham `finally { client.release() }`
3. Adicionar timeouts mais agressivos (já feito: 10s)
4. Reduzir pool (já feito: 5 conexões)

---

### Problema: Queries lentas (22s+)

**Causas possíveis:**
1. Falta de índices
2. Queries complexas sem otimização
3. Banco sobrecarregado

**Soluções:**
1. ✅ Cachear estrutura da tabela (já feito)
2. Adicionar índices nas colunas usadas em WHERE/ORDER BY
3. Otimizar queries complexas
4. Considerar upgrade do plano do banco

---

### Problema: Circuit breaker sempre aberto

**Causas possíveis:**
1. Banco realmente offline
2. Problemas de rede
3. Limite de conexões atingido

**Soluções:**
1. Verificar status do banco no Railway
2. Verificar logs do banco
3. Verificar se há outros serviços usando o mesmo banco
4. Considerar upgrade do plano

---

## 📊 Como Interpretar os Resultados do Script

### Conexões Ativas:
- **Normal**: 1-3 conexões
- **Alerta**: 4-5 conexões (pool quase cheio)
- **Crítico**: 5+ conexões (pool esgotado)

### Queries Lentas:
- **Normal**: Nenhuma query >5s
- **Alerta**: 1-2 queries lentas
- **Crítico**: 3+ queries lentas ou queries >30s

### Bloqueios:
- **Normal**: Nenhum bloqueio
- **Alerta**: 1-2 bloqueios
- **Crítico**: 3+ bloqueios ou bloqueios >10s

### Uso de Conexões:
- **Normal**: <70% do limite
- **Alerta**: 70-80% do limite
- **Crítico**: >80% do limite

---

## 🔧 Próximos Passos Após Verificação

1. **Se encontrar outros serviços usando o mesmo banco:**
   - Criar banco separado para cada projeto
   - Atualizar DATABASE_URL de cada serviço

2. **Se encontrar vazamentos de conexões:**
   - Adicionar `finally { client.release() }` em todos os lugares
   - Testar localmente antes de fazer deploy

3. **Se encontrar queries lentas:**
   - Adicionar índices
   - Cachear resultados
   - Otimizar queries

4. **Se limite de conexões for muito baixo:**
   - Considerar upgrade do plano do Railway
   - Ou reduzir ainda mais o pool (para 3 conexões)

---

## 📝 Comandos Úteis

```bash
# Executar diagnóstico
cd vanilla-game/server
node scripts/diagnose-db-issues.js

# Verificar vazamentos de conexões
grep -r "getClient()" src/ --include="*.ts" -A 20 | grep -E "(getClient|release)" | less

# Verificar queries lentas nos logs
# (no Railway, filtrar por "Slow query detected")
```

---

## 🆘 Se Nada Funcionar

1. **Criar banco completamente novo no Railway**
2. **Executar todas as migrações no novo banco**
3. **Atualizar DATABASE_URL no serviço web**
4. **Fazer deploy e testar**

Isso garante que não há interferência de outros projetos ou dados corrompidos.

