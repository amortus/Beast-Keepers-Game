# 🚀 Quick Start - Beast Keepers

Começe a desenvolver em **menos de 3 minutos**!

## Passo 1: Instalar

```bash
cd Beast-Keepers
npm install
```

## Passo 2: Rodar

```bash
npm run dev
```

✅ Jogo abre automaticamente em `http://localhost:5173`

## Passo 3: Jogar!

- **WASD** ou **Setas**: Mover
- **P**: Debug mode
- **Mobile**: Touch no lado esquerdo para joystick virtual

---

## 📱 Testar PWA

### Desktop
1. Chrome → Barra de endereço → Ícone **+** → "Instalar"
2. Ou `F12` → Application → Manifest → "Install"

### Mobile
1. Abra em Chrome/Safari mobile
2. Menu → "Adicionar à tela inicial"

### Testar Offline
1. Abra o jogo uma vez
2. `F12` → Application → Service Workers → **✓ Offline**
3. Recarregue → Funciona offline!

---

## 🎨 Customizar

### Mudar cores do jogo

```typescript
// src/rendering.ts
ctx.fillStyle = '#SEU_HEX_AQUI'; // Background
```

### Mudar velocidade do player

```typescript
// src/world.ts
player.speed = 300; // Pixels por segundo (padrão: 200)
```

### Adicionar obstáculos

```typescript
// src/world.ts → createWorld()
solids: [
  { x: 100, y: 100, w: 64, h: 64 },
  { x: 300, y: 200, w: 128, h: 32 },
  // Adicione aqui ↓
  { x: 500, y: 400, w: 100, h: 50 },
]
```

---

## 🔧 Comandos Úteis

```bash
npm run dev          # Dev server com hot reload
npm run build        # Build para produção
npm run preview      # Preview do build
npm run typecheck    # Verifica tipos TypeScript
npm run lint         # Lint do código
npm run format       # Formata código
```

---

## 🐛 Problemas?

### "Cannot find module 'vite'"
```bash
npm install
```

### Canvas não aparece
- Limpe cache: `Ctrl+Shift+Delete`
- Hard reload: `Ctrl+F5`

### Service Worker não funciona
- Só funciona em HTTPS ou `localhost`
- Limpe: `F12` → Application → Clear storage

### Assets não carregam
```bash
npm run create-placeholders
```

---

## 📚 Próximos Passos

1. **Leia o README completo**: Guias detalhados
2. **Customize o jogo**: Cores, sprites, mapa
3. **Adicione features**: Inimigos, itens, som
4. **Deploy**: Netlify, Vercel, ou seu servidor
5. **Android App**: Use Bubblewrap (veja README)

---

**Divirta-se! 🎮**

