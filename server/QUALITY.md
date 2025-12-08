# Quality Assurance & Development Guidelines

Este documento descreve as ferramentas e processos de qualidade implementados no projeto.

## Scripts de Qualidade

O projeto agora inclui os seguintes scripts de qualidade:

```bash
# Verificação de tipos TypeScript (sem emitir arquivos)
npm run type-check

# Lint do código com ESLint
npm run lint

# Correção automática de problemas de lint
npm run lint:fix

# Build do projeto
npm run build

# Verificação completa de qualidade (type-check + lint + build)
npm run quality-check
```

## Ferramentas Configuradas

### ESLint

- **Configuração**: `.eslintrc.json`
- **Parser**: `@typescript-eslint/parser`
- **Extensões**: ESLint recommended + TypeScript recommended rules
- **Regras customizadas**:
  - `@typescript-eslint/no-explicit-any`: warn (permite `any` mas alerta)
  - `@typescript-eslint/no-unused-vars`: warn (variáveis não usadas com `_` são ignoradas)
  - `no-console`: off (permite console.log para desenvolvimento)

### TypeScript

- **Configuração**: `tsconfig.json`
- **Target**: ES2022
- **Module**: CommonJS
- **Strict mode**: Desabilitado (pode ser habilitado gradualmente)

## Checklist de Qualidade

Antes de fazer commit, certifique-se de:

- [ ] `npm run type-check` - Sem erros de tipo
- [ ] `npm run lint` - Sem erros de lint (warnings são aceitos)
- [ ] `npm run build` - Build bem-sucedido
- [ ] `npm run quality-check` - Todas as verificações passam

## Próximos Passos

1. **Habilitar strict mode gradualmente**: Atualmente desabilitado devido a muitos erros. Pode ser habilitado progressivamente corrigindo os tipos.

2. **Adicionar testes**: Estrutura de testes ainda não configurada. Recomendado:
   - Jest ou Vitest para testes unitários
   - Testes de integração para rotas API
   - Testes de serviços PVP

3. **CI/CD Integration**: Configurar GitHub Actions para rodar verificações de qualidade automaticamente.

4. **Coverage**: Configurar cobertura de testes (meta: 95%+ conforme regras do projeto).

## Conformidade com AGENTS.md

Este projeto segue as regras definidas em `/rulebook/AGENTS.md`:

- ✅ Scripts de qualidade configurados
- ✅ Linter configurado
- ✅ Type check configurado
- ✅ Build verificado
- ⏳ Testes (pendente)
- ⏳ Strict mode TypeScript (pendente - habilitar gradualmente)

