# 🔍 Investigação de Problemas no Banco de Dados

## Problemas Identificados

1. **Timeouts frequentes**: `timeout exceeded when trying to connect`
2. **Queries lentas**: Algumas queries demoram 12-22 segundos
3. **Pool unhealthy**: Muitas conexões esperando ou em uso
4. **Circuit breaker abrindo**: Indicando problemas de conectividade

## Possíveis Causas

### 1. Múltiplos Serviços Usando o Mesmo Banco
- **Verificar no Railway**: Se há outros serviços (Guardian Grove, etc) usando o mesmo `DATABASE_URL`
- **Sintoma**: Limite de conexões do banco sendo atingido
- **Solução**: Cada projeto deve ter seu próprio banco ou aumentar limite de conexões

### 2. Queries Lentas Bloqueando Conexões
- **Verificar nos logs**: Queries que demoram >5s serão logadas com `⚠️ Slow query detected`
- **Sintoma**: Pool esgotado porque conexões ficam ocupadas por muito tempo
- **Solução**: Otimizar queries lentas ou adicionar índices

### 3. Transações Longas
- **Verificar**: Transações (BEGIN/COMMIT) que não estão sendo fechadas
- **Sintoma**: Conexões presas em transações abertas
- **Solução**: Garantir que todas as transações tenham COMMIT ou ROLLBACK

### 4. Limite de Conexões do Banco
- **Verificar no Railway**: Limite de conexões do PostgreSQL
- **Sintoma**: Pool configurado com 10 conexões, mas banco pode ter limite menor
- **Solução**: Ajustar `max` no pool ou aumentar limite no Railway

## Monitoramento Adicionado

### Logs de Pool Status
Agora cada query loga:
```javascript
{
  total: 10,      // Total de conexões no pool
  idle: 5,        // Conexões ociosas
  waiting: 2,     // Conexões esperando
  active: 5       // Conexões em uso
}
```

### Detecção de Queries Lentas
Queries que demoram >5s serão logadas com:
```
⚠️ Slow query detected: 12000ms
```

### Logs de Health do Pool
Quando pool está unhealthy, mostra detalhes:
```
Pool unhealthy: 8/10 connections in use (80%)
```

## O Que Verificar no Railway

1. **Variáveis de Ambiente**:
   - Verificar se `DATABASE_URL` está correto
   - Verificar se não há outros serviços usando o mesmo banco

2. **Métricas do Banco**:
   - Número de conexões ativas
   - CPU/Memória do banco
   - Queries lentas em execução

3. **Logs do Banco**:
   - Erros de conexão
   - Timeouts
   - Deadlocks

4. **Outros Serviços**:
   - Verificar se Guardian Grove ou outros projetos estão usando o mesmo banco
   - Cada projeto deve ter seu próprio banco PostgreSQL

## Próximos Passos

1. **Após deploy**, verificar logs para:
   - Queries lentas (>5s)
   - Status do pool em cada query
   - Padrões de quando o pool fica unhealthy

2. **No Railway**, verificar:
   - Se há outros serviços conectados ao mesmo banco
   - Limite de conexões do banco
   - Métricas de CPU/Memória do banco

3. **Se necessário**, ajustar:
   - Reduzir `max` no pool se banco tem limite menor
   - Otimizar queries lentas
   - Separar bancos por projeto

