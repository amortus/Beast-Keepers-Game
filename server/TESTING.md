# Testing Guidelines

Este documento descreve a estrutura de testes do projeto conforme as regras do rulebook.

## Configuração

- **Framework**: Jest 29.7.0
- **TypeScript Support**: ts-jest
- **Coverage Target**: 95%+ (branches, functions, lines, statements)

## Scripts Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar testes em modo CI (com cobertura e sem watch)
npm run test:ci

# Verificação completa de qualidade (inclui testes)
npm run quality-check
```

## Estrutura de Testes

Os testes devem ser colocados em:
- `src/**/__tests__/**/*.test.ts`
- `src/**/*.spec.ts`

## Regras de Testes (conforme rulebook)

### ✅ REQUIRED
- Escrever testes que realmente testem comportamento
- Manter cobertura acima de 95%
- Incluir assertions em todos os testes
- Testar casos de erro e edge cases

### ❌ FORBIDDEN
- Usar `.skip()`, `.only()`, ou `.todo()` para bypassar testes
- Comentar testes que estão falhando
- Usar `@ts-ignore` ou `@ts-expect-error` para esconder erros
- Criar testes boilerplate que sempre passam
- Mockar tudo para evitar testar comportamento real

## Exemplos

### Teste Unitário

```typescript
import { describe, it, expect } from '@jest/globals';
import { calculateEloChange } from '../pvpRankingService';

describe('calculateEloChange', () => {
  it('should calculate correct ELO change', () => {
    const result = calculateEloChange(1500, 1400);
    
    expect(result.winnerChange).toBeGreaterThan(0);
    expect(result.loserChange).toBeLessThan(0);
  });
});
```

### Teste de Integração

Testes de integração devem usar setup/teardown apropriados para banco de dados e serviços externos.

## Coverage

O projeto exige 95%+ de cobertura em:
- Branches
- Functions
- Lines
- Statements

Relatórios de cobertura são gerados em `coverage/` após executar `npm run test:coverage`.

## Executando Testes

```bash
# Desenvolvimento
npm run test:watch

# Antes de commit
npm run quality-check

# CI/CD
npm run test:ci
```

## Troubleshooting

Se os testes falharem:
1. Verifique se todas as dependências estão instaladas: `npm install`
2. Verifique se o TypeScript compila: `npm run type-check`
3. Verifique logs de erro específicos nos testes
4. Certifique-se de que não está usando `.skip()` ou bypassando testes

