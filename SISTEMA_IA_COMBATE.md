# 🤖 Sistema de IA de Combate Avançada - Beast Keepers

## 📋 **VISÃO GERAL**

Sistema de IA inteligente e adaptativa para combates, com 4 níveis de dificuldade e estratégias especializadas baseadas na linha da besta.

---

## 🎯 **NÍVEIS DE DIFICULDADE**

### 1. **NOVATO** (Fácil)
**Configuração:**
```typescript
{
  personality: 'novice',
  strategy: 'balanced',
  aggressiveness: 40,
  defensiveness: 30,
  riskTolerance: 60,
  tacticalThinking: 20,
}
```

**Comportamento:**
- ❌ Faz escolhas ruins ocasionalmente
- ❌ Usa técnicas aleatórias sem pensar muito
- ❌ Defende em momentos errados
- ⚠️ Aleatoriedade alta (±15 pontos nos scores)
- ✅ Perdoável para jogadores iniciantes

---

### 2. **VETERANO** (Médio)
**Configuração:**
```typescript
{
  personality: 'veteran',
  strategy: 'balanced',
  aggressiveness: 60,
  defensiveness: 50,
  riskTolerance: 40,
  tacticalThinking: 50,
}
```

**Comportamento:**
- ✅ Decisões balanceadas
- ✅ Analisa HP e essência antes de agir
- ✅ Defende quando necessário
- ⚔️ Ataca com consistência
- 🎯 Desafio justo para jogadores medianos

---

### 3. **ELITE** (Difícil)
**Configuração:**
```typescript
{
  personality: 'elite',
  strategy: 'tactical',
  aggressiveness: 70,
  defensiveness: 70,
  riskTolerance: 30,
  tacticalThinking: 80,
}
```

**Comportamento:**
- 🧠 Pensa taticamente
- 🎯 Escolhe técnicas otimizadas
- 🛡️ Defende estrategicamente para recuperar essência
- ⚡ Ataca no momento certo
- 💡 Analisa status do inimigo antes de agir
- 🔥 Desafio alto para jogadores experientes

---

### 4. **LENDÁRIO** (Muito Difícil)
**Configuração:**
```typescript
{
  personality: 'legendary',
  strategy: 'adaptive',
  aggressiveness: 85,
  defensiveness: 85,
  riskTolerance: 20,
  tacticalThinking: 95,
}
```

**Comportamento:**
- 🌟 PERFEITO - Escolhas quase ótimas
- 🔄 Estratégia adaptativa (muda baseado na situação)
- 🎯 Prioriza técnicas de alto dano + baixo custo
- 🧠 Análise profunda do contexto
- 💯 Maximiza eficiência de essência
- ⚡ Finaliza inimigos com HP baixo
- 🛡️ Defende apenas quando realmente necessário
- 🏆 Desafio extremo para mestres

---

## 🦁 **IA POR LINHA DE BESTA**

Cada linha de besta tem comportamento especializado:

| Linha        | Estratégia  | Características                           |
|--------------|-------------|-------------------------------------------|
| **Olgrim**   | Tactical    | 🧠 Muito tático (90% thinking)            |
| **Terravox** | Defensive   | 🛡️ Muito defensivo (80% defense)          |
| **Feralis**  | Aggressive  | ⚔️ Muito agressivo (85% aggression)        |
| **Brontis**  | Balanced    | ⚖️ Balanceado defensivo (70% defense)      |
| **Zephyra**  | Tactical    | ⚡ Tático agressivo (70% aggression)       |
| **Ignar**    | Aggressive  | 🔥 EXTREMAMENTE agressivo (90%)           |
| **Mirella**  | Adaptive    | 🔄 Adaptativo (75% thinking)              |
| **Umbrix**   | Tactical    | 🌑 Tático sombrio (85% thinking)          |
| **Sylphid**  | Defensive   | ✨ Defensivo tático (80% thinking)        |
| **Raukor**   | Balanced    | 🐺 Balanceado (65% aggression)            |

---

## 🎮 **COMO USAR**

### **1. IA Automática (Recomendado)**

O sistema detecta automaticamente a dificuldade baseado nos stats da besta:

```typescript
import { executeEnemyTurn } from './systems/combat';

// IA avançada é ativada por padrão
const result = executeEnemyTurn(battle);

// Ou explicitamente:
const result = executeEnemyTurn(battle, true);
```

**Detecção de Dificuldade:**
- Stats médios < 30 → **Novato**
- Stats médios 30-50 → **Veterano**
- Stats médios 50-70 → **Elite**
- Stats médios > 70 → **Lendário**

---

### **2. IA Manual (Customizada)**

```typescript
import { chooseAIAction, getAIConfig } from './systems/combat-ai';

// Configuração customizada
const config = getAIConfig('elite');

// Escolhe ação
const action = chooseAIAction(battle, config);

// Executa ação...
```

---

### **3. IA para o Jogador (Modo Auto)**

```typescript
import { choosePlayerAutoAction } from './systems/combat-ai';

// Modo balanceado
const action = choosePlayerAutoAction(battle, false);

// Modo agressivo
const action = choosePlayerAutoAction(battle, true);
```

---

## 📊 **SISTEMA DE AVALIAÇÃO**

### **Avaliação de Técnicas**

O sistema analisa cada técnica e atribui um score baseado em:

1. **Tipo da Técnica:**
   - Física: +20 se inimigo tem defesa baixa
   - Mística: +10 se inimigo está defendendo

2. **Dano:**
   - Score += (dano / 50) * 20

3. **Custo de Essência:**
   - Alta essência: Prefere técnicas fortes
   - Baixa essência: Prefere técnicas baratas

4. **Situação:**
   - Inimigo HP baixo: +30 para alto dano
   - Meu HP baixo: Reduz técnicas caras

5. **Personalidade:**
   - Novato: ±15 aleatoriedade
   - Lendário: +25 para técnicas otimizadas

---

### **Avaliação de Defesa**

Score para defender baseado em:

1. **HP Baixo:**
   - HP < 40%: +40
   - HP < 25%: +70 total

2. **Essência Baixa:**
   - Essência < 30%: +30

3. **Inimigo Forte:**
   - Inimigo com essência alta: +20

4. **Estratégia:**
   - Defensiva: +50%
   - Agressiva: -30%

5. **Táticas Avançadas (Elite/Lendário):**
   - Inimigo sem essência: -20
   - Já defendeu: -30

---

## 🔄 **ESTRATÉGIAS**

### **1. Aggressive (Agressiva)**
- Ataque constante
- Ignora defesa
- Prioriza dano máximo
- Usado por: Feralis, Ignar

### **2. Defensive (Defensiva)**
- Defesa frequente
- Ataca com cautela
- Recupera essência
- Usado por: Terravox, Sylphid

### **3. Balanced (Balanceada)**
- Equilíbrio entre ataque e defesa
- Decisões contextuais
- Usado por: Brontis, Raukor

### **4. Tactical (Tática)**
- Analisa situação profundamente
- Técnicas estratégicas
- Usado por: Olgrim, Umbrix, Zephyra

### **5. Adaptive (Adaptativa)**
- **Muda estratégia baseado na situação:**
  - Turnos 1-3: Aggressive/Defensive baseado em stats
  - HP < 30%: Defensive
  - Vantagem: Aggressive
  - Desvantagem: Tactical
  - Equilibrado: Balanced
- Usado por: Mirella, Lendários

---

## 🎯 **ANÁLISE DE CONTEXTO**

A IA analisa constantemente:

```typescript
{
  myHpPercent: 0.75,           // 75% HP
  enemyHpPercent: 0.45,        // 45% HP (inimigo fraco!)
  myEssencePercent: 0.60,      // 60% Essência
  enemyEssencePercent: 0.30,   // 30% Essência
  turnCount: 5,                // Turno 5
  isEnemyDefending: false,     // Inimigo não está defendendo
  myIsDefending: false,        // Não estou defendendo
  availableTechniques: [...],  // Técnicas disponíveis
  myBeast: {...},              // Minha besta
  enemyBeast: {...},           // Besta inimiga
}
```

---

## 💡 **EXEMPLOS PRÁTICOS**

### **Exemplo 1: Inimigo com HP Crítico**
```
Contexto:
- Enemy HP: 15%
- My Essence: 80%

Decisão:
✅ Usa técnica de ALTO DANO para finalizar
❌ NÃO defende (inimigo morrendo)
```

### **Exemplo 2: Meu HP Crítico**
```
Contexto:
- My HP: 20%
- Enemy HP: 70%
- My Essence: 40%

Decisão:
✅ DEFENDE para recuperar essência
✅ Evita técnicas caras
```

### **Exemplo 3: Início da Batalha (Ignar - Agressivo)**
```
Contexto:
- Turno: 1
- Linha: Ignar (90% aggressiveness)
- My Stats: Might 75

Decisão:
✅ Ataque agressivo com técnica forte
⚔️ Pressão imediata no inimigo
```

### **Exemplo 4: Elite vs Lendário**
```
Elite:
- Pensa taticamente
- Escolhe técnicas otimizadas
- Defende estrategicamente

Lendário:
- Estratégia ADAPTATIVA
- Muda comportamento mid-battle
- Decisões quase perfeitas
- Finaliza com precisão
```

---

## 🐛 **DEBUG**

Para ver as decisões da IA:

```typescript
import { logAIDecision } from './systems/combat-ai';

const action = chooseAIAction(battle, config);
logAIDecision(action, context, config);

// Output:
// === AI DECISION ===
// Personality: elite
// Strategy: tactical
// HP: 75%
// Essence: 60%
// Action: Technique: shadow_strike
// ==================
```

---

## ⚙️ **CONFIGURAÇÕES AVANÇADAS**

### **Criar IA Customizada:**

```typescript
import { chooseAIAction } from './systems/combat-ai';

const customConfig = {
  personality: 'veteran',
  strategy: 'aggressive',
  aggressiveness: 80,     // Muito agressivo
  defensiveness: 30,      // Pouco defensivo
  riskTolerance: 70,      // Alto risco
  tacticalThinking: 40,   // Médio
};

const action = chooseAIAction(battle, customConfig);
```

### **Override de Linha:**

```typescript
import { getLineSpecificBehavior } from './systems/combat-ai';

const lineConfig = getLineSpecificBehavior('ignar');
const finalConfig = { ...baseConfig, ...lineConfig };
```

---

## 📈 **PERFORMANCE**

- ⚡ **Rápido**: Avaliação em <1ms
- 🧠 **Inteligente**: Analisa 10+ fatores
- 🎯 **Justo**: Não trapaceia, usa mesmas regras do jogador
- 🔄 **Adaptativo**: Muda estratégia dinamicamente

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ Sistema de IA implementado
2. ⏳ Integração com UI de batalha
3. ⏳ Modo de combate automático (ambos os lados)
4. ⏳ Replay de batalhas com IA
5. ⏳ Tournament AI (diferentes oponentes)

---

## 🎮 **USO NO JOGO**

No `main.ts`, o sistema já está ativo:

```typescript
// Turno do inimigo usa IA avançada automaticamente
if (battle.phase === 'enemy_turn') {
  const result = executeEnemyTurn(battle);
  // IA escolhe a melhor ação automaticamente!
}
```

**Por padrão:**
- ✅ IA avançada ativada
- ✅ Dificuldade detectada automaticamente
- ✅ Comportamento especializado por linha
- ✅ Estratégias adaptativas

---

## 🏆 **CONCLUSÃO**

O sistema de IA de combate do Beast Keepers é:

- 🤖 **Inteligente**: Decisões contextuais e táticas
- ⚖️ **Justo**: Não trapaceia, joga pelas regras
- 🎯 **Balanceado**: 4 níveis de dificuldade
- 🦁 **Personalizado**: Comportamento por linha
- 🔄 **Adaptativo**: Muda estratégia dinamicamente
- ⚡ **Eficiente**: Performance otimizada

**Resultado:** Combates desafiadores, justos e imersivos! 🎮✨

