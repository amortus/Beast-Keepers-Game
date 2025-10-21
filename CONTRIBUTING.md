# 🤝 Contribuindo

Obrigado pelo interesse em contribuir!

## Como Contribuir

### 1. Fork & Clone

```bash
git clone https://github.com/SEU_USER/Beast-Keepers.git
cd Beast-Keepers
npm install
```

### 2. Crie uma Branch

```bash
git checkout -b feature/minha-feature
```

### 3. Desenvolva

- Siga o style guide (ESLint + Prettier)
- Adicione comentários úteis
- Teste sua funcionalidade

### 4. Commit

```bash
git add .
git commit -m "feat: adiciona minha feature incrível"
```

Use convenção de commits:
- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração de código
- `test:` Testes
- `chore:` Tarefas de manutenção

### 5. Push & Pull Request

```bash
git push origin feature/minha-feature
```

Abra PR no GitHub com descrição detalhada.

---

## 📋 Checklist

Antes de abrir PR, verifique:

- [ ] `npm run typecheck` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` funciona
- [ ] Testei no Chrome e Firefox
- [ ] Testei offline (Service Worker)
- [ ] Adicionei comentários onde necessário
- [ ] Atualizei README se necessário

---

## 🎯 Ideias de Contribuição

### Features Fáceis (Good First Issue)
- [ ] Adicionar mais sprites de player
- [ ] Criar mais mapas/níveis
- [ ] Adicionar efeitos sonoros
- [ ] Melhorar UI (botões, menus)
- [ ] Adicionar animações de partículas

### Features Médias
- [ ] Sistema de inimigos com IA básica
- [ ] Sistema de itens coletáveis
- [ ] Sistema de diálogo/NPCs
- [ ] Geração procedural de mapas
- [ ] Leaderboard local

### Features Avançadas
- [ ] Multiplayer real-time (WebSocket)
- [ ] Pathfinding (A*)
- [ ] Física avançada (Box2D wasm)
- [ ] WebGL renderer
- [ ] Editor de mapas in-game

---

## 📐 Style Guide

### TypeScript

```typescript
// ✅ Bom
export function calculateDistance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ❌ Ruim
export function calc(a:any,b:any):any{
  return Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2)
}
```

### Comentários

```typescript
// ✅ Bom: Explica o "porquê"
// Normaliza diagonal para evitar movimento mais rápido (Pythagorean theorem)
const normalized = normalize(inputVec);

// ❌ Ruim: Repete o óbvio
// Normaliza vetor
const normalized = normalize(inputVec);
```

### Nomes

```typescript
// ✅ Bom: Descritivo
const hasCollision = checkAABBOverlap(playerBox, enemyBox);

// ❌ Ruim: Abreviado demais
const c = chk(p, e);
```

---

## 🐛 Reportar Bugs

Use o template de issue:

**Descrição**: O que aconteceu?
**Esperado**: O que deveria acontecer?
**Passos**: Como reproduzir?
**Ambiente**: SO, navegador, versão
**Screenshots**: Se aplicável

---

## 💬 Dúvidas?

- Abra uma **Discussion** no GitHub
- Ou crie uma **Issue** com label `question`

Obrigado! 🙏

