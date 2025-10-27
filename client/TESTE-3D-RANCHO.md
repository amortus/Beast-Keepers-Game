# 🧪 Guia de Teste - 3D no Rancho

## 🎯 Objetivo

Verificar se a visualização 3D está funcionando corretamente na tela do rancho.

---

## ✅ Checklist de Teste

### **Passo 1: Recarregar a Página**
- [ ] Pressione `F5` ou `Ctrl+Shift+R`
- [ ] Aguarde o jogo carregar completamente
- [ ] Console do navegador sem erros (F12 → Console)

### **Passo 2: Entrar no Jogo**
- [ ] Faça login (se necessário)
- [ ] Entre na tela principal (Rancho)

### **Passo 3: Verificar Visualização 3D**
- [ ] Na área onde antes era um **quadrado azul** (120x120), agora deve aparecer:
  - ✅ Modelo 3D da Mirella (criatura azul anfíbia)
  - ✅ Olhos brancos grandes com pupilas pretas
  - ✅ Corpo arredondado azul claro
  - ✅ Pernas pequenas visíveis
  - ✅ **Rotação automática suave**
  - ✅ **Animação de respiração** (sobe e desce levemente)

### **Passo 4: Verificar Bordas**
- [ ] Borda roxa ao redor do modelo 3D
- [ ] Área de 120x120 pixels bem definida

### **Passo 5: Verificar Controles**
- [ ] Botão "🎮 Ver em 3D" ainda presente abaixo do modelo
- [ ] Clique no botão abre visualização em tela cheia
- [ ] Voltar da tela cheia retorna ao rancho com mini viewer 3D

### **Passo 6: Testar Performance**
- [ ] Animação roda em 60 FPS (suave, sem travamentos)
- [ ] Console sem erros de Three.js
- [ ] Memória estável (não cresce indefinidamente)

---

## 🐛 Possíveis Problemas e Soluções

### **Problema 1: Não vejo nada 3D, só borda roxa**

**Possíveis causas:**
- Three.js não carregou
- Modelo não foi gerado
- Container posicionado errado

**Solução:**
1. Abra o console (F12)
2. Procure por erros de Three.js
3. Verifique mensagem `[MiniViewer3D] Loaded model for mirella`
4. Recarregue com `Ctrl+Shift+R` (hard reload)

### **Problema 2: Vejo modelo mas não roda/anima**

**Possíveis causas:**
- Loop de animação não iniciou
- Container com `pointerEvents: 'none'` não definido

**Solução:**
1. Verifique console para erros
2. Recarregue a página
3. Veja se `requestAnimationFrame` está rodando

### **Problema 3: Modelo está cortado ou muito grande/pequeno**

**Possíveis causas:**
- Escala do modelo incorreta
- Câmera mal posicionada

**Solução:**
1. Isso será corrigido automaticamente pelo código
2. Se persistir, recarregue a página

### **Problema 4: Performance ruim (FPS baixo)**

**Possíveis causas:**
- Hardware limitado
- Muitos viewers 3D simultâneos

**Solução:**
1. Feche outras abas do navegador
2. Desative extensões pesadas
3. Use Chrome/Edge (melhor suporte WebGL)

---

## 📊 Testes de Diferentes Criaturas

Para testar outras criaturas:

1. **Avance semanas** até a criatura morrer
2. **Crie nova criatura** no Templo
3. **Escolha linha diferente** (Olgrim, Terravox, etc.)
4. **Volte ao rancho**
5. **Veja o novo modelo 3D** da criatura escolhida

### Criaturas para Testar:

- [ ] **Olgrim** - Olho roxo flutuante com tentáculos
- [ ] **Terravox** - Golem de pedra marrom
- [ ] **Feralis** - Felino verde com cauda
- [ ] **Brontis** - Réptil verde escuro bípede
- [ ] **Zephyra** - Ave azul celeste com asas
- [ ] **Ignar** - Fera vermelha brilhante com chifres
- [ ] **Mirella** - Anfíbio azul (atual)
- [ ] **Umbrix** - Besta sombria roxa/preta
- [ ] **Sylphid** - Espírito dourado translúcido
- [ ] **Raukor** - Lobo cinza prateado

---

## 🎥 O Que Você Deve Ver

### **Estado Inicial (Antes)**
```
┌──────────────┐
│              │
│   ███████    │  ← Quadrado azul estático
│   █  █  █    │     (olhinhos pretos)
│   ███████    │
│              │
└──────────────┘
```

### **Estado Atual (Depois)**
```
┌──────────────┐
│              │
│    🐸 3D     │  ← Modelo 3D da Mirella
│   (girando)  │     - Rotação suave
│   (respira)  │     - Animação de respiração
│              │     - Iluminado com 3 luzes
└──────────────┘
```

---

## 📝 Relatório de Teste

Use este template para reportar bugs:

```
**Navegador:** Chrome/Firefox/Edge (versão)
**Sistema:** Windows/Linux/Mac
**Problema:** Descrição clara do problema
**Passos para reproduzir:**
1. Abri o jogo
2. Fui para o rancho
3. Vi [descreva o que viu]

**Esperado:** [O que deveria acontecer]
**Atual:** [O que aconteceu]
**Console:** [Cole erros do console, se houver]
```

---

## ✅ Teste Aprovado Se:

- ✅ Modelo 3D aparece na posição correta
- ✅ Animação de rotação suave (sem travamentos)
- ✅ Animação de respiração sutil
- ✅ Borda roxa ao redor
- ✅ Botão "Ver em 3D" ainda funciona
- ✅ Performance estável (60 FPS)
- ✅ Console sem erros
- ✅ Memória não cresce indefinidamente

---

## 🎮 URL de Teste

Acesse: **http://localhost:5175/** (ou 5174, 5173)

---

## 💬 Feedback

Se tudo funcionou:
- 🎉 "Funcionou perfeitamente!"
- 🐸 "A Mirella está linda em 3D!"

Se algo deu errado:
- 🐛 "Bug encontrado: [descrição]"
- 🔧 "Preciso de ajuda: [problema]"

---

**Boa sorte nos testes!** 🚀🎮

