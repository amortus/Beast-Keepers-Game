# 🐛 BUG ENCONTRADO E CORRIGIDO!

## 🎯 Problema:
O 3D aparecia no menu Vila (e possivelmente em outros menus que usam Modal).

## 🔍 Causa Raiz:

### **A Vila usa um `ModalUI`, NÃO o sistema de diálogo!**

```typescript
// client/src/main.ts linha 592
function openVillage() {
  modalUI.show({  // ← Abre um MODAL, não um diálogo!
    title: '🏘️ Vila',
    message: 'Quem você quer visitar na vila?',
    ...
  });
}
```

### **O Game Loop estava desenhando o GameUI por baixo do Modal:**

```typescript
// ANTES (ERRADO):
} else if (gameUI && gameState) {
  gameUI.draw();  // ← Desenhava SEMPRE, mesmo com modal aberto!
}

// Draw modal on top
if (modalUI && modalUI.isShowing()) {
  modalUI.draw();
}
```

**Resultado:** O `gameUI.draw()` rodava por baixo do modal, criando e atualizando o 3D viewer repetidamente!

---

## ✅ Solução Implementada:

### **1. Skip gameUI.draw() quando modal está aberto:**

```typescript
// DEPOIS (CORRETO):
} else if (gameUI && gameState) {
  if (modalUI && modalUI.isShowing()) {
    // Skip drawing GameUI when modal is open
    console.log('[Render] Skipping GAMEUI - Modal is open');
  } else {
    gameUI.draw();
  }
}
```

### **2. Esconder 3D explicitamente quando Vila abre:**

```typescript
function openVillage() {
  // Hide 3D viewer when opening Vila modal
  if (gameUI) {
    gameUI.hide3DViewer();
    console.log('[Main] Vila opened - 3D viewer hidden');
  }
  
  modalUI.show({...});
}
```

### **3. Mostrar 3D novamente quando modal fecha:**

```typescript
onCancel: () => {
  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
    console.log('[Main] Vila closed - 3D viewer shown');
  }
}
```

---

## 🧪 Como Testar:

1. **Acesse:** `http://localhost:5173`
2. **Faça login**
3. **No Rancho:** 3D deve aparecer no quadrado roxo ✅
4. **Clique em "Vila":** 3D deve SUMIR ✅
5. **Console deve mostrar:**
   ```
   [Main] Vila opened - 3D viewer hidden
   [Render] Skipping GAMEUI - Modal is open
   ```
6. **Clique em "← Voltar":** 3D deve APARECER novamente ✅
7. **Console deve mostrar:**
   ```
   [Main] Vila closed - 3D viewer shown
   [Render] Drawing GAMEUI (Ranch)
   ```

---

## 🔄 Próximos Passos:

Verificar se outros menus também usam `ModalUI` e aplicar a mesma correção se necessário:
- ❓ Inventário usa Modal?
- ❓ Craft usa Modal?
- ❓ Shop usa Modal?

---

**Commit:** `6a2bf4b` - "fix: Hide 3D viewer when Vila modal opens"

