# Database Fixes Changelog

## 2025-10-29 - Correção de Nomes de Bestas

### Problema
Os nomes das bestas no banco de dados estavam no formato antigo:
- `"{Espécie} de {NomeDoJogador}"` 
- Exemplo: `"Mirella de Bosta"`

Isso causava exibição incorreta no frontend:
- `"Mirella de Bosta - Mirella (Criatura Anfíbia)"` ❌

### Solução
Executado script manual `fix-beast-names.js` para corrigir registros existentes:

**Bestas corrigidas:**
1. Beast ID 6: `"Mirella de Bosta"` → `"Bosta"` ✅
2. Beast ID 7: `"Zephyra de DDDDD"` → `"DDDDD"` ✅
3. Beast ID 8: `"Feralis de nevado"` → `"nevado"` ✅
4. Beast ID 9: `"Terravox de Isqueiro"` → `"Isqueiro"` ✅

**Query executada:**
```sql
UPDATE beasts 
SET name = <nome_sem_prefixo>, updated_at = NOW() 
WHERE name LIKE '% de %';
```

### Resultado
Exibição correta no frontend:
- `"{NomeEscolhidoPeloJogador} - {Espécie} ({Tipo})"`
- Exemplo: `"Bosta - Mirella (Criatura Anfíbia)"` ✅

### Código Frontend
Alterado em `client/src/ui/game-ui.ts`:
```typescript
// ANTES
const formattedName = `${beast.name} (${lineData.name})`;

// DEPOIS
const formattedName = `${beast.name} - ${lineData.name}`;
```

### Código Backend
Já estava correto desde commit `89e1333`:
```typescript
// server/src/utils/beastData.ts
const beastName = playerName; // Usa apenas nome do jogador
```

### Notas
- Correção do banco foi MANUAL (não é migration automática)
- Novas bestas já são criadas com nome correto
- Correção aplicada apenas em ambiente de desenvolvimento local
- Antes de aplicar em produção, executar o mesmo script no banco de produção

