# 🎭 4 Novas IAs Especiais - Beast Keepers

## 🆕 **NOVAS PERSONALIDADES DE IA**

Além das 4 IAs originais (Novice, Veteran, Elite, Legendary), agora temos **4 NOVAS IAs ESPECIAIS** com comportamentos únicos e extremos!

---

## 🔥 **1. BERSERKER** (Fúria Selvagem)

### **📊 Estatísticas:**
```typescript
{
  personality: 'berserker',
  strategy: 'aggressive',
  aggressiveness: 100,      // ⚔️ MÁXIMO
  defensiveness: 5,          // 🛡️ MÍNIMO
  riskTolerance: 95,         // 🎲 ALTÍSSIMO
  tacticalThinking: 15,      // 🧠 BAIXO
}
```

### **🎯 Comportamento:**

**Ataque:**
- ⚔️ **SEMPRE ataca** com a técnica de MAIOR DANO
- 💥 **Ignora custo** de essência (prefere técnicas CARAS = FORTES)
- 🔥 **Score de dano em DOBRO** na avaliação
- 🎯 **Não analisa situação** - age por instinto puro

**Defesa:**
- ❌ **NUNCA DEFENDE** (score = 0)
- ⚠️ **Exceção:** Só defende se HP < 10% (instinto de sobrevivência)

### **💡 Estratégia:**
```
PRESSÃO TOTAL → ATAQUE → ATAQUE → ATAQUE
```

### **🎮 Quando Usar:**
- ✅ Inimigos fracos que morrem rápido
- ✅ Finalizar inimigos com HP baixo
- ✅ Blitz agressivo para intimidar
- ❌ Batalhas longas (não aguenta)
- ❌ Inimigos tanques (se esgota)

### **📈 Comparação:**

| Situação                | Berserker        | Elite          |
|-------------------------|------------------|----------------|
| Enemy HP: 50%           | ⚔️ Ataque (80dmg)| 🎯 Ataque (50dmg)|
| My HP: 20%              | ⚔️ ATAQUE!       | 🛡️ DEFENDE     |
| My Essence: 10%         | ⚔️ ATAQUE!       | 🛡️ DEFENDE     |
| Enemy Defending         | ⚔️ ATAQUE!       | 🧠 Espera      |

**Filosofia:** *"A melhor defesa é o ataque!"* ⚔️🔥

---

## 🛡️ **2. TANK** (Muralha Impenetrável)

### **📊 Estatísticas:**
```typescript
{
  personality: 'tank',
  strategy: 'defensive',
  aggressiveness: 20,        // ⚔️ BAIXO
  defensiveness: 100,        // 🛡️ MÁXIMO
  riskTolerance: 5,          // 🎲 MÍNIMO
  tacticalThinking: 65,      // 🧠 ALTO
}
```

### **🎯 Comportamento:**

**Ataque:**
- 🎯 **Prefere técnicas BARATAS** (conserva essência)
- 💙 **Penalidade massiva** para técnicas caras (custo > 15)
- ⏱️ **Jogo lento e seguro** - guerra de atrito
- 🛡️ **Evita riscos** a todo custo

**Defesa:**
- 🛡️ **SEMPRE DEFENDE** (+100 score base)
- 💪 **Defende ainda mais** se inimigo tem essência alta (+50)
- 🏰 **Defende mesmo com HP alto** (+30 com HP > 50%)
- ♾️ **Estratégia:** Cansa o oponente até ele errar

### **💡 Estratégia:**
```
DEFENDE → Ataque Barato → DEFENDE → DEFENDE → Ataque Barato
```

### **🎮 Quando Usar:**
- ✅ Inimigos agressivos (Berserker vs Tank)
- ✅ Batalhas longas
- ✅ Sobrevivência em desvantagem
- ❌ Inimigos fracos (muito lento)
- ❌ Quando precisar finalizar rápido

### **📈 Comparação:**

| Situação                | Tank             | Berserker      |
|-------------------------|------------------|----------------|
| Enemy HP: 50%           | 🛡️ DEFENDE       | ⚔️ Ataque      |
| My HP: 80%              | 🛡️ DEFENDE       | ⚔️ Ataque      |
| My Essence: 90%         | 🎯 Ataque (10💙) | ⚔️ Ataque (30💙)|
| Enemy Defending         | 🛡️ DEFENDE       | ⚔️ ATAQUE!     |

**Filosofia:** *"O tempo está do meu lado."* 🛡️⏳

---

## 🎯 **3. SNIPER** (Precision Strike)

### **📊 Estatísticas:**
```typescript
{
  personality: 'sniper',
  strategy: 'tactical',
  aggressiveness: 50,        // ⚔️ MÉDIO
  defensiveness: 40,         // 🛡️ MÉDIO-BAIXO
  riskTolerance: 25,         // 🎲 BAIXO
  tacticalThinking: 90,      // 🧠 MUITO ALTO
}
```

### **🎯 Comportamento:**

**Ataque:**
- 🎯 **Espera o momento PERFEITO** para atacar
- 💥 **Prioriza técnicas** quando inimigo HP < 50% (+50% score)
- ❌ **Reduz score** se inimigo está defendendo (-25) → ESPERA
- ⚡ **Combo letal:** Alto dano + Alta precisão (Foco > 60) → +30 score
- 🧠 **Extremamente calculista** (90% tactical thinking)

**Defesa:**
- 👀 **Defende no início** para observar (+40 se enemy HP > 70%)
- ♟️ **Jogo de paciência** - defende se inimigo defende (+35)
- 🎯 **NÃO defende** se inimigo vulnerável (HP < 30%) → -50 score
- 📊 **Estratégia:** Analisa padrões e ataca na hora certa

### **💡 Estratégia:**
```
OBSERVA → DEFENDE → ESPERA → 🎯 ONE SHOT → VITÓRIA
```

### **🎮 Quando Usar:**
- ✅ Inimigos previsíveis
- ✅ Quando tem vantagem em stats
- ✅ Batalhas técnicas
- ✅ Oneshot builds (alto dano burst)
- ❌ Inimigos aleatórios (Trickster)
- ❌ Batalhas rápidas (precisa de setup)

### **📈 Comparação:**

| Situação                | Sniper           | Berserker      | Tank           |
|-------------------------|------------------|----------------|----------------|
| Enemy HP: 100%          | 🛡️ OBSERVA       | ⚔️ ATAQUE!     | 🛡️ DEFENDE     |
| Enemy HP: 49%           | 🎯 ATAQUE (80dmg)| ⚔️ ATAQUE!     | 🛡️ DEFENDE     |
| Enemy Defending         | 🧠 ESPERA        | ⚔️ ATAQUE!     | 🛡️ DEFENDE     |
| Enemy HP: 20%           | 💥 KILLSHOT!     | ⚔️ ATAQUE!     | 🎯 Ataque      |

**Filosofia:** *"Um tiro, uma morte."* 🎯💀

---

## 🎭 **4. TRICKSTER** (Caos Controlado)

### **📊 Estatísticas:**
```typescript
{
  personality: 'trickster',
  strategy: 'balanced',
  aggressiveness: 55,        // ⚔️ VARIÁVEL
  defensiveness: 45,         // 🛡️ VARIÁVEL
  riskTolerance: 70,         // 🎲 ALTO
  tacticalThinking: 30,      // 🧠 BAIXO
}
```

### **🎯 Comportamento:**

**Ataque:**
- 🎲 **IMPREVISÍVEL** - Aleatoriedade alta (±30 score)
- 🃏 **20% chance** de escolher técnica ALEATÓRIA (score = random * 40)
- 🎭 **Confunde o oponente** - impossível prever
- 💡 **Às vezes escolhe** técnicas ruins DE PROPÓSITO
- 🔮 **Mais aleatório que tático** (30% thinking)

**Defesa:**
- 🎲 **Defende ALEATORIAMENTE** (random * 80)
- 🃏 **15% chance** de defender DO NADA (score = 100)
- 🎭 **Impossível antecipar** quando vai defender
- 🤔 **Sem padrão** - cada turno é uma surpresa

### **💡 Estratégia:**
```
??? → ?!? → ??? → 🎭 → ??? → SURPRISE!
```

### **🎮 Quando Usar:**
- ✅ Confundir jogadores humanos
- ✅ Testes de adaptabilidade
- ✅ Diversão e caos
- ✅ Contra IAs previsíveis (Sniper)
- ❌ Quando precisa de consistência
- ❌ Batalhas cruciais

### **📈 Comparação:**

| Turno  | Trickster        | Sniper         | Tank           |
|--------|------------------|----------------|----------------|
| 1      | ⚔️ Ataque (??dmg)| 🛡️ OBSERVA     | 🛡️ DEFENDE     |
| 2      | 🛡️ DEFENDE?!     | 🛡️ ESPERA      | 🛡️ DEFENDE     |
| 3      | 🎭 Técnica Fraca?| 🧠 ESPERA      | 🛡️ DEFENDE     |
| 4      | ⚔️ Ataque (80dmg)| 🎯 ATAQUE!     | 🎯 Ataque      |
| 5      | ??? (SURPRISE!)  | 💥 KILLSHOT!   | 🛡️ DEFENDE     |

**Filosofia:** *"A loucura é uma forma de sanidade."* 🎭🃏

---

## 📊 **COMPARAÇÃO GERAL**

### **Tabela de Stats:**

| Personalidade | Agressão | Defesa | Risco | Tático | Previsível |
|---------------|----------|--------|-------|--------|------------|
| **Berserker** | 100      | 5      | 95    | 15     | ✅ MUITO   |
| **Tank**      | 20       | 100    | 5     | 65     | ✅ SIM     |
| **Sniper**    | 50       | 40     | 25    | 90     | ⚠️ MÉDIO   |
| **Trickster** | 55       | 45     | 70    | 30     | ❌ NÃO     |

---

## 🥊 **MATCHUPS (Quem ganha de quem?)**

### **Berserker vs:**
- ❌ **Tank** - Tank aguenta e cansa o Berserker
- ✅ **Sniper** - Mata antes do Sniper dar o tiro
- ⚖️ **Trickster** - Aleatório, 50/50

### **Tank vs:**
- ✅ **Berserker** - Aguenta a pressão e cansa
- ❌ **Sniper** - Sniper espera e dá one-shot
- ⚖️ **Trickster** - Longo, mas imprevisível

### **Sniper vs:**
- ✅ **Tank** - One-shot após observar
- ❌ **Berserker** - Morre antes de atacar
- ❌ **Trickster** - Impossível prever padrão

### **Trickster vs:**
- ⚖️ **Todos** - Imprevisível, qualquer resultado

---

## 🎮 **COMO USAR AS NOVAS IAs**

### **1. Manual (Customizado):**

```typescript
import { chooseAIAction, getAIConfig } from './systems/combat-ai';

// Escolha a IA especial
const config = getAIConfig('berserker'); // ou 'tank', 'sniper', 'trickster'

// Use no combate
const action = chooseAIAction(battle, config);
```

### **2. Atribuição Automática:**

O sistema atual usa **detecção por stats**, mas você pode forçar:

```typescript
// No seu código de criação de inimigos
const enemy = createEnemy({
  // ... stats
  aiPersonality: 'sniper', // Força IA específica
});
```

### **3. Por Linha de Besta:**

Você pode associar IAs especiais a linhas específicas:

```typescript
// Exemplo no getLineSpecificBehavior:
ignar: { personality: 'berserker' },      // Fogo = Berserker
terravox: { personality: 'tank' },        // Golem = Tank
zephyra: { personality: 'sniper' },       // Ave = Sniper
umbrix: { personality: 'trickster' },     // Sombra = Trickster
```

---

## 💡 **CASOS DE USO**

### **1. Boss Battles:**
```
- Boss Fase 1: Tank (desgasta jogador)
- Boss Fase 2: Berserker (pressão máxima)
- Boss Fase 3: Sniper (golpe final)
```

### **2. Torneios:**
```
- Bronze: Novice / Veteran
- Prata: Elite / Tank
- Ouro: Legendary / Sniper
- Mítico: Berserker / Trickster (surpresa!)
```

### **3. NPCs Únicos:**
```
- Ruvian (Mestre): Sniper (calculista)
- Koran (Guerreiro): Berserker (agressivo)
- Toran (Ancião): Tank (defensivo)
- Eryon (Misterioso): Trickster (imprevisível)
```

---

## 🎯 **ESTRATÉGIAS PARA VENCER CADA IA**

### **🔥 Vs Berserker:**
✅ **DEFENDA MUITO** - Aguente a pressão
✅ **Conserve essência** - Ele vai se esgotar
✅ **Técnicas defensivas** - Reduza o dano dele
❌ **NÃO tente trade** - Você perde

### **🛡️ Vs Tank:**
✅ **Técnicas de alto dano** - Precisa burst
✅ **Místicas** - Ignoram parte da defesa
✅ **Seja paciente** - Batalha longa
❌ **NÃO desperdice essência** - Ele aguenta

### **🎯 Vs Sniper:**
✅ **Seja agressivo** - Não dê tempo para setup
✅ **Pressione cedo** - Antes dele observar
✅ **Defenda quando HP baixo** - Evite one-shot
❌ **NÃO seja previsível** - Ele analisa padrões

### **🎭 Vs Trickster:**
✅ **Seja adaptável** - Mude estratégia
✅ **Jogue seguro** - Não arrisque demais
✅ **Foque em stats** - Não em padrões
❌ **NÃO tente prever** - É impossível

---

## 🏆 **RANKING DE DIFICULDADE**

**Para Jogadores:**
1. 🔴 **Sniper** - Muito difícil (one-shots)
2. 🟠 **Tank** - Difícil (batalha longa e frustrante)
3. 🟡 **Trickster** - Médio (imprevisível mas inconsistente)
4. 🟢 **Berserker** - Fácil (se defender, você ganha)

**Para IA:**
1. 🔴 **Tank** - Mais consistente (alta taxa de vitória)
2. 🟠 **Sniper** - Muito forte (se tiver tempo)
3. 🟡 **Berserker** - Arriscado (all-in)
4. 🟢 **Trickster** - Aleatório (50/50)

---

## 📚 **DOCUMENTAÇÃO TÉCNICA**

### **Arquivos Modificados:**
- ✅ `src/systems/combat-ai.ts` - Novas personalidades e comportamentos

### **Novas Funções:**
- ✅ 4 novos casos em `getAIConfig()`
- ✅ 4 novos casos em `evaluateTechniques()` (personalidade)
- ✅ 4 novos casos em `evaluateDefend()` (personalidade)

### **Compatibilidade:**
- ✅ **Retrocompatível** - Não quebra código existente
- ✅ **Plug & Play** - Usar como as outras IAs
- ✅ **TypeScript safe** - Tipos corretos

---

## 🎉 **RESULTADO FINAL**

Agora você tem **8 IAs diferentes** para usar:

### **Originais (4):**
1. 🟢 **Novice** - Fácil, iniciante
2. 🟡 **Veteran** - Médio, balanceado
3. 🟠 **Elite** - Difícil, tático
4. 🔴 **Legendary** - Muito difícil, adaptativo

### **Novas (4):**
5. 🔥 **Berserker** - Agressão pura
6. 🛡️ **Tank** - Defesa extrema
7. 🎯 **Sniper** - Precisão letal
8. 🎭 **Trickster** - Caos total

---

## 🚀 **PRÓXIMOS PASSOS**

**Teste as novas IAs:**

```typescript
// No seu código de batalha
const berserker = createEnemy({ ai: 'berserker' });
const tank = createEnemy({ ai: 'tank' });
const sniper = createEnemy({ ai: 'sniper' });
const trickster = createEnemy({ ai: 'trickster' });

// Teste cada uma e veja a diferença!
```

**Experimente matchups:**
- Berserker vs Tank
- Sniper vs Trickster
- Seu jogador vs cada IA

**Crie boss battles épicos:**
- Combine IAs em fases
- Misture comportamentos
- Desafie seus jogadores!

---

**DIVIRTA-SE COM AS NOVAS IAs!** 🎮⚔️🎭

