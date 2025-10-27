# 🐛 Debug: Tela 3D Preta

## 🔍 Problema Identificado

A área do mini viewer 3D estava aparecendo **preta/vazia** ao invés de mostrar o modelo da criatura.

---

## ✅ Correções Aplicadas

### **1. Iluminação Aumentada** 💡
- **Antes**: 3 luzes (ambiente 80%, direcional 60%, rim 30%)
- **Agora**: 4 luzes (ambiente 90%, direcional 80%, fill 40%, back 30%)
- **Resultado**: Cena muito mais brilhante e visível

### **2. Background Roxo** 🟣
- **Antes**: `#1a1a2e` (azul escuro, quase preto)
- **Agora**: `#2a1a3d` (roxo escuro, combina com o tema do jogo)
- **Resultado**: Contraste melhor com os modelos

### **3. Câmera Ajustada** 📷
- **Antes**: `position(3, 2, 4)` / `lookAt(0, 1, 0)` / FOV 45°
- **Agora**: `position(2.5, 1.5, 3)` / `lookAt(0, 0.8, 0)` / FOV 50°
- **Resultado**: Modelo mais próximo e centralizado

### **4. Escala do Modelo** 📏
- **Antes**: `2.5 / maxDim`
- **Agora**: `1.8 / maxDim`
- **Resultado**: Modelo menor, cabe melhor no viewport pequeno

### **5. Posicionamento Vertical** ⬆️
- **Antes**: `position.y = breathingOffset` (começava em 0)
- **Agora**: `position.y = 0.8 + breathingOffset`
- **Resultado**: Modelo centralizado verticalmente

### **6. Fallback Visível** 🟪
- **Antes**: Cube azul escuro (#4299e1)
- **Agora**: Cube magenta brilhante (#ff00ff) com emissão
- **Resultado**: Se falhar, você vê um cubo magenta (fácil de identificar)

### **7. Console Logs** 📝
- Adicionado: `[MiniViewer3D] Created viewer: WxH`
- Adicionado: `[MiniViewer3D] Loaded model for [name] (scale: X.XX)`
- Adicionado: `[MiniViewer3D] Using fallback cube`

---

## 🧪 Como Testar Agora

### **Passo 1: Recarregar**
```
1. Pressione F5 (ou Ctrl+Shift+R para hard reload)
2. Aguarde o jogo carregar
```

### **Passo 2: Abrir Console**
```
1. Pressione F12
2. Vá na aba "Console"
3. Procure por mensagens:
   - ✅ "[MiniViewer3D] Created viewer: XXXxYYY"
   - ✅ "[MiniViewer3D] Loaded model for mirella (scale: X.XX)"
```

### **Passo 3: Verificar Resultado**

#### **✅ Sucesso (Modelo Apareceu):**
- Você verá a **Mirella azul em 3D**
- Olhos brancos grandes
- Rotação suave
- Background roxo escuro

#### **⚠️ Fallback (Cubo Magenta):**
- Você verá um **cubo rosa/magenta brilhante**
- Isso significa que o modelo não carregou
- Mas pelo menos o 3D está funcionando!
- **Console dirá**: `[MiniViewer3D] Using fallback cube`

#### **❌ Ainda Preto:**
- O container 3D não está sendo criado corretamente
- Veja o próximo passo de debug

---

## 🔧 Debug Avançado

### **Se Ainda Estiver Preto:**

#### **1. Verificar se o Container Existe**
No console do navegador, digite:
```javascript
document.getElementById('beast-mini-viewer-3d')
```

**Resultado esperado**: Um `<div>` com estilo `position: fixed`

**Se retornar `null`**: O container não está sendo criado

#### **2. Verificar Posição do Container**
```javascript
const container = document.getElementById('beast-mini-viewer-3d');
if (container) {
  console.log('Left:', container.style.left);
  console.log('Top:', container.style.top);
  console.log('Width:', container.style.width);
  console.log('Height:', container.style.height);
  console.log('Z-Index:', container.style.zIndex);
}
```

**Resultado esperado**:
- `left`: Algum valor em pixels
- `top`: Algum valor em pixels
- `width`: ~120-180px (dependendo da escala)
- `height`: ~120-180px
- `zIndex`: `"5"`

#### **3. Verificar se Three.js Está Carregado**
```javascript
console.log(typeof THREE);
```

**Resultado esperado**: `"object"`

**Se `"undefined"`**: Three.js não foi carregado

#### **4. Verificar Canvas do Three.js**
```javascript
const container = document.getElementById('beast-mini-viewer-3d');
if (container) {
  const canvas = container.querySelector('canvas');
  console.log('Canvas found:', !!canvas);
  if (canvas) {
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
  }
}
```

**Resultado esperado**:
- `Canvas found: true`
- `Canvas size: XXX x YYY` (números positivos)

---

## 📊 O Que Você Deve Ver Agora

### **Antes (Preto):**
```
┌──────────────┐
│              │
│              │
│   [PRETO]    │
│              │
│              │
└──────────────┘
```

### **Depois (Com Modelo):**
```
┌──────────────┐
│  🟣 Roxo     │ ← Background roxo
│    🐸        │ ← Mirella 3D
│  (girando)   │ ← Rotacionando
│  💡 Bem      │ ← Bem iluminada
│   iluminado  │
└──────────────┘
```

### **Ou (Fallback):**
```
┌──────────────┐
│  🟣 Roxo     │ ← Background roxo
│    🟪        │ ← Cubo magenta
│  (girando)   │ ← Rotacionando
│  ✨ Brilha   │ ← Emissão brilhante
│              │
└──────────────┘
```

---

## 🎯 Próximos Passos

### **Se Funcionou:**
- ✅ Marque como resolvido
- 🎉 Aproveite o 3D da Mirella!
- 📸 Tire uma print para comparar

### **Se Ainda Está Preto:**
1. Cole o resultado dos comandos de debug acima
2. Cole as mensagens do console
3. Tire uma print da tela com F12 aberto

### **Se Apareceu Cubo Magenta:**
- Significa que o 3D funciona, mas o modelo não carregou
- Verifique se `BeastModels.ts` foi compilado corretamente
- Procure erros no console relacionados a `generateBeastModel`

---

## 🚨 Erros Comuns

### **Erro: "THREE is not defined"**
- **Causa**: Three.js não foi importado corretamente
- **Solução**: Verifique se o import está correto no arquivo

### **Erro: "Cannot read property 'appendChild' of null"**
- **Causa**: Container não existe no DOM
- **Solução**: Verifique se o container está sendo criado antes de usar

### **Aviso: "WebGL context lost"**
- **Causa**: GPU/driver instável
- **Solução**: Recarregue a página, atualize drivers da GPU

---

## 💡 Dica: Forçar Recriação

Se continuar com problemas, force a recriação do viewer:

1. Vá para outra tela (Vila, Inventário, etc.)
2. Volte para o Rancho
3. O mini viewer será recriado do zero

---

**Recarregue a página agora e veja se aparece!** 🎮

