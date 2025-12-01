# 🎮 BEAST KEEPERS - Game Design Document Completo

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** Em Desenvolvimento Ativo

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Lore e Ambientação](#2-lore-e-ambientação)
3. [Sistemas de Jogo](#3-sistemas-de-jogo)
4. [Criaturas (Bestas)](#4-criaturas-bestas)
5. [Sistema de Combate](#5-sistema-de-combate)
6. [Sistema PVP](#6-sistema-pvp)
7. [Progressão e Economia](#7-progressão-e-economia)
8. [Dungeons e Exploração](#8-dungeons-e-exploração)
9. [Técnicas e Habilidades](#9-técnicas-e-habilidades)
10. [Arquitetura Técnica](#10-arquitetura-técnica)
11. [Roadmap de Desenvolvimento](#11-roadmap-de-desenvolvimento)

---

## 1. Visão Geral

### 1.1 Conceito do Jogo

**Beast Keepers** é um simulador de criação e treinamento de criaturas místicas com batalhas estratégicas em tempo real pausável. O jogo combina elementos de simulação de vida, RPG tático e estratégia, criando uma experiência única onde cada criatura tem personalidade, ciclo de vida e potencial de crescimento.

### 1.2 Informações Básicas

- **Título:** Beast Keepers
- **Gênero:** Simulador de Criaturas + RPG Tático
- **Plataformas:** Web (PWA) - Desktop e Mobile
- **Estilo Visual:** Low-poly estilizado (inspiração PS1 com iluminação moderna)
- **Público-alvo:** Fãs de simulação, estratégia e jogos de criaturas colecionáveis
- **Modo de Jogo:** Single-player com elementos multiplayer (PVP, Chat, Amigos)

### 1.3 Diferenciais Principais

1. **Sistema Procedural de Geração:** Criaturas geradas via "Relíquias de Eco" a partir de entradas externas (música, texto, etc.)
2. **Ciclo de Vida Dinâmico:** Criaturas envelhecem e morrem em tempo real (baseado em dias reais)
3. **Sistema de Herança Espiritual:** Traços e técnicas passam para próximas gerações
4. **Calendário Real:** Sincronizado com horário de Brasília, eventos sazonais
5. **Sistema PVP Completo:** Matchmaking rankeado e casual, temporadas, ELO
6. **Dungeons Temáticas:** 5 dungeons com 5 andares cada, progressão desbloqueável

---

## 2. Lore e Ambientação

### 2.1 Mundo de Aurath

O mundo de **Aurath** é um continente repleto de energia arcana, onde civilizações antigas criaram as **Relíquias de Eco** — cristais que ressoam com músicas, palavras e vibrações. Quando ativadas no **Templo dos Ecos**, essas relíquias dão origem a **Bestas**, seres únicos e com personalidades próprias.

### 2.2 Localização Principal

**Vale Esmeralda** é o vilarejo onde o jogador começa sua jornada. Um lugar pacífico onde Guardiões aprendem a criar e treinar Bestas, participando de torneios e desvendando segredos das Relíquias.

### 2.3 Personagens Principais

- **Mestre Ruvian** – Ancião e ex-Guardião, orienta o jogador no início
- **Liora** – Bibliotecária do Templo, explica as Relíquias de Eco e ajuda na pesquisa
- **Dalan** – Mercador nômade, vende itens de treino, comida especial e relíquias raras
- **Alya** – Jovem rival, também Guardiã em treinamento, aparece em torneios e eventos

### 2.4 Papel do Jogador

O jogador é um **Guardião Aprendiz**, recém-chegado ao vilarejo de Vale Esmeralda. Sua missão é provar seu valor criando Bestas fortes, participando de torneios, explorando dungeons e desvendando segredos das Relíquias.

---

## 3. Sistemas de Jogo

### 3.1 Rotina do Guardião

O calendário é dividido em **semanas**. A cada semana, o jogador pode escolher uma ação para sua Besta:

#### Ações Disponíveis

**Treinamento:**
- `train_might` - Treinar Força (aumenta Might)
- `train_wit` - Treinar Astúcia (aumenta Wit)
- `train_focus` - Treinar Foco (aumenta Focus)
- `train_agility` - Treinar Agilidade (aumenta Agility)
- `train_ward` - Treinar Resistência (aumenta Ward)
- `train_vitality` - Treinar Vitalidade (aumenta Vitality)

**Trabalho:**
- `work_warehouse` - Trabalhar no Armazém (gera moedas + Might)
- `work_farm` - Trabalhar na Fazenda (gera moedas + Vitality)
- `work_guard` - Trabalhar como Guarda (gera moedas + Ward)
- `work_library` - Trabalhar na Biblioteca (gera moedas + Wit)

**Descanso:**
- `rest_sleep` - Dormir (-40 fadiga, -10 stress, +50% HP e Essência)
- `rest_freetime` - Tempo Livre (-20 fadiga, -30 stress, melhora humor)
- `rest_walk` - Passeio (-15 fadiga, -35 stress, +8 Lealdade)
- `rest_eat` - Comer Bem (-25 fadiga, -15 stress, +30% HP)

**Outras Ações:**
- `tournament` - Participar de Torneio
- `exploration` - Explorar locais (coleta itens raros)

### 3.2 Sistema de Atributos

Cada Besta possui **6 atributos principais**:

#### 1. **MIGHT (Força)** - ⚔️ Dano Físico
- **Uso:** Aumenta dano de técnicas físicas
- **Fórmula:** `baseDamage += might * 0.8`
- **Treinamento:** `train_might` ou `work_warehouse`

#### 2. **WIT (Astúcia)** - 🔮 Dano Místico + Essência
- **Uso:** Aumenta dano de técnicas místicas e pool de Essência
- **Fórmula:** 
  - Dano místico: `baseDamage += wit * 0.6 + focus * 0.4`
  - Essência máxima: `maxEssence = ((wit + focus) / 2) + 30`
- **Treinamento:** `train_wit` ou `work_library`

#### 3. **FOCUS (Foco)** - 🎯 Precisão + Crítico + Essência
- **Uso:** Aumenta precisão, chance de crítico e pool de Essência
- **Fórmulas:**
  - Precisão: `focusBonus = (focus / 100) * 0.12`
  - Crítico: `focusBonus = (focus / 100) * 0.15`
  - Multiplicador crítico: `critMultiplier = 1.5 + (focus / 200)`
- **Treinamento:** `train_focus`

#### 4. **AGILITY (Agilidade)** - 🏃 Esquiva + Crítico
- **Uso:** Aumenta esquiva e chance de crítico
- **Fórmulas:**
  - Esquiva: `agilityPenalty = (agility / 100) * 0.30`
  - Crítico: `agilityBonus = (agility / 100) * 0.10`
- **Treinamento:** `train_agility`

#### 5. **WARD (Resistência)** - 🛡️ Defesa Plana
- **Uso:** Reduz dano recebido (físico e místico)
- **Fórmula:** `defense = ward * 0.5` (subtraído do dano base)
- **Treinamento:** `train_ward` ou `work_guard`

#### 6. **VITALITY (Vitalidade)** - ❤️ HP Total
- **Uso:** Aumenta HP máximo da Besta
- **Fórmula:** `maxHp = baseHp + (vitality * 2)`
- **Treinamento:** `train_vitality` ou `work_farm`

### 3.3 Estados Secundários

Além dos atributos principais, cada Besta possui estados secundários:

- **Fadiga:** Aumenta com treinos/trabalhos, reduz com descanso
- **Stress:** Aumenta com excesso de esforço, reduz com descanso
- **Lealdade:** Determina obediência nos combates (baixa lealdade = desobediência)
- **Idade:** Bestas vivem em média 3 anos in-game (varia por linha)
- **Nível:** 1-100 (aumenta com experiência de batalhas)
- **Experiência:** Acumulada através de vitórias em batalhas

### 3.4 Sistema de Tempo Real

O jogo utiliza um **calendário real sincronizado com horário de Brasília**:

- **Dia/Noite Dinâmico:** Visual muda baseado na hora do dia
- **Envelhecimento Real:** Bestas envelhecem baseado em dias reais
- **Eventos Sazonais:** Eventos especiais em datas comemorativas
- **Cooldowns Temporais:** Algumas ações têm cooldowns em tempo real

### 3.5 Sistema de Ações em Tempo Real

Algumas ações levam tempo real para completar:

- **Treino:** 1 minuto
- **Trabalho:** 1.5 minutos
- **Descanso (Dormir):** 2 minutos
- **Descanso (Outros):** 1 minuto
- **Cooldown de Torneio:** 4 horas
- **Cooldown de Exploração:** 2 horas (reset de contador)

---

## 4. Criaturas (Bestas)

### 4.1 Sistema de Classificação

As criaturas são chamadas de **Bestas**, classificadas por:

- **Linhas:** Espécies principais (10 linhas iniciais)
- **Sangues:** Subvariações que alteram visual, atributos e longevidade
- **Afinidade Elemental:** Tipo elemental da Besta (fogo, água, terra, ar, sombra, etc.)

### 4.2 As 10 Linhas Iniciais

#### 1. **Olgrim** - Olho Ancestral
- **Descrição:** Olho flutuante com tentáculos, inteligente mas frágil
- **Atributos Base:** Might: ★☆☆, Wit: ★★★★, Focus: ★★★, Agility: ★★, Ward: ★☆, Vitality: ★★
- **Longevidade:** 2.5 anos
- **Especialidade:** Dano místico, técnicas psíquicas

#### 2. **Terravox** - Golem de Pedra
- **Descrição:** Golem de pedra, lento mas extremamente resistente
- **Atributos Base:** Might: ★★★★, Wit: ★☆, Focus: ★★, Agility: ★☆, Ward: ★★★★★, Vitality: ★★★★
- **Longevidade:** 4 anos
- **Especialidade:** Tank, defesa, resistência

#### 3. **Feralis** - Felino Ágil
- **Descrição:** Felino ágil, focado em velocidade e precisão
- **Atributos Base:** Might: ★★★, Wit: ★★, Focus: ★★★, Agility: ★★★★, Ward: ★★, Vitality: ★★★
- **Longevidade:** 3 anos
- **Especialidade:** Velocidade, esquiva, ataques rápidos

#### 4. **Brontis** - Réptil Bípede
- **Descrição:** Réptil bípede robusto, versátil e equilibrado
- **Atributos Base:** Might: ★★★★, Wit: ★★, Focus: ★★, Agility: ★★, Ward: ★★★, Vitality: ★★★★
- **Longevidade:** 3.2 anos
- **Especialidade:** Versatilidade, equilíbrio

#### 5. **Zephyra** - Ave Veloz
- **Descrição:** Ave veloz, especialista em esquiva
- **Atributos Base:** Might: ★★, Wit: ★★★, Focus: ★★★, Agility: ★★★★★, Ward: ★☆, Vitality: ★★
- **Longevidade:** 3 anos
- **Especialidade:** Velocidade máxima, esquiva, ataques aéreos

#### 6. **Ignar** - Fera Elemental de Fogo
- **Descrição:** Fera elemental de fogo, forte em poder bruto
- **Atributos Base:** Might: ★★★★★, Wit: ★★, Focus: ★★, Agility: ★★★, Ward: ★★★, Vitality: ★★★
- **Longevidade:** 2.7 anos
- **Especialidade:** Dano físico alto, técnicas de fogo

#### 7. **Mirella** - Criatura Anfíbia
- **Descrição:** Criatura anfíbia, equilibrada com afinidade aquática
- **Atributos Base:** Might: ★★★, Wit: ★★★, Focus: ★★★, Agility: ★★★, Ward: ★★★, Vitality: ★★★
- **Longevidade:** 3 anos
- **Especialidade:** Equilíbrio, técnicas aquáticas

#### 8. **Umbrix** - Besta das Sombras
- **Descrição:** Besta das sombras, astuta e traiçoeira
- **Atributos Base:** Might: ★★, Wit: ★★★★, Focus: ★★★, Agility: ★★★, Ward: ★★, Vitality: ★★★
- **Longevidade:** 3 anos
- **Especialidade:** Dano místico, técnicas sombrias, astúcia

#### 9. **Sylphid** - Espírito Etéreo
- **Descrição:** Espírito etéreo, frágil mas com alto poder mágico
- **Atributos Base:** Might: ★☆, Wit: ★★★★★, Focus: ★★★★, Agility: ★★★, Ward: ★☆, Vitality: ★★
- **Longevidade:** 2.8 anos
- **Especialidade:** Dano místico máximo, técnicas arcanas

#### 10. **Raukor** - Fera Lupina
- **Descrição:** Fera lupina, focada em lealdade e ataques críticos
- **Atributos Base:** Might: ★★★★, Wit: ★★, Focus: ★★★, Agility: ★★★, Ward: ★★★, Vitality: ★★★
- **Longevidade:** 3.5 anos
- **Especialidade:** Ataques críticos, lealdade, versatilidade

### 4.3 Sistema de Sangues

Cada Linha pode ter até **4 Sangues** (subvariações), alterando:

- **Visual:** Aparência única
- **Atributos:** Modificadores nos atributos base
- **Longevidade:** Variação na expectativa de vida
- **Técnicas Iniciais:** Técnicas que a Besta aprende ao nascer

**Exemplo:**
- Olgrim Pálido → maior inteligência, menos vitalidade
- Olgrim Carmesim → técnicas de fogo, menor foco

### 4.4 Personalidade e Traços

Cada Besta possui **traços de personalidade** que afetam comportamento:

**Traços Positivos:**
- `loyal` - Leal
- `brave` - Corajoso
- `patient` - Paciente
- `disciplined` - Disciplinado
- `curious` - Curioso

**Traços Neutros:**
- `proud` - Orgulhoso
- `solitary` - Solitário
- `eccentric` - Excêntrico

**Traços Negativos:**
- `lazy` - Preguiçoso
- `anxious` - Ansioso
- `stubborn` - Teimoso
- `fearful` - Medroso
- `aggressive` - Agressivo
- `impulsive` - Impulsivo
- `frail` - Frágil

**Humor (Mood):**
- `happy` - Feliz
- `neutral` - Neutro
- `sad` - Triste
- `angry` - Irritado
- `tired` - Cansado

### 4.5 Sistema de Nível e Experiência

- **Nível:** 1-100
- **Experiência:** Ganha através de vitórias em batalhas
- **Aprendizado de Técnicas:** Técnicas são aprendidas em níveis específicos (até nível 100)
- **Crescimento de Atributos:** Atributos crescem com treinamento e nível

---

## 5. Sistema de Combate

### 5.1 Mecânicas Principais

O combate é **por turnos**, com as seguintes características:

- **Fases:** Intro → Player Turn → Enemy Turn → Repeat → Victory/Defeat
- **Barra de Essência:** Energia que recarrega até 99, usada para técnicas
- **Ações Disponíveis:**
  - Usar Técnica (requer Essência suficiente)
  - Defender (reduz dano recebido)
  - Fugir (apenas em PVE, não disponível em PVP)

### 5.2 Sistema de Essência

- **Essência Máxima:** `maxEssence = ((wit + focus) / 2) + 30`
- **Recarga:** +10 Essência por turno
- **Custo de Técnicas:** Varia de 10 a 60 Essência
- **Estratégia:** Gerenciar Essência é crucial para vitórias

### 5.3 Sistema de Desobediência

Se a **Lealdade** da Besta estiver baixa, ela pode:

- Usar uma técnica diferente da escolhida
- Não atacar (pular turno)
- Defender automaticamente

**Fórmula de Desobediência:**
- Lealdade > 70: Sempre obedece
- Lealdade 50-70: 20% chance de desobediência
- Lealdade 30-50: 40% chance de desobediência
- Lealdade < 30: 60% chance de desobediência

### 5.4 Cálculo de Dano

#### Dano Físico:
```typescript
baseDamage = technique.damage
baseDamage += attrs.might * 0.8
// Aplicar defesa
defense = defAttrs.ward * 0.5
finalDamage = Math.max(1, baseDamage - defense)
```

#### Dano Místico:
```typescript
baseDamage = technique.damage
baseDamage += attrs.wit * 0.6 + attrs.focus * 0.4
// Aplicar defesa
defense = defAttrs.ward * 0.5
finalDamage = Math.max(1, baseDamage - defense)
```

#### Crítico:
```typescript
critChance = 0.05 + (focus / 100) * 0.15 + (agility / 100) * 0.10
critMultiplier = 1.5 + (focus / 200)
if (critical) {
  finalDamage *= critMultiplier
}
```

#### Precisão e Esquiva:
```typescript
hitChance = 0.85 + (attackerFocus / 100) * 0.12
hitChance -= (defenderAgility / 100) * 0.30
if (miss) {
  damage = 0
}
```

### 5.5 AI dos Oponentes

O sistema de AI possui diferentes personalidades:

- **Aggressive:** Prioriza ataques, usa técnicas de dano
- **Defensive:** Prioriza defesa, usa técnicas defensivas
- **Balanced:** Equilibra ataque e defesa
- **Tactical:** Analisa situação e escolhe melhor ação

### 5.6 Visualização de Batalha

O jogo oferece **duas opções de visualização**:

1. **Battle UI 2D:** Interface tradicional com sprites e barras
2. **Battle Scene 3D:** Cena 3D imersiva com modelos 3D das Bestas, câmera dinâmica e efeitos visuais

---

## 6. Sistema PVP

### 6.1 Visão Geral

O sistema PVP permite que jogadores batalhem entre si em tempo real, com matchmaking, ranking e temporadas.

### 6.2 Tipos de Partida

#### 1. **Ranked (Ranqueada)**
- Afeta ELO e ranking
- Matchmaking baseado em ELO similar (±100 inicial, expande se necessário)
- Recompensas: Coronas, XP, mudança de ELO
- Temporadas com recompensas de fim de temporada

#### 2. **Casual (Casual)**
- Não afeta ranking
- Matchmaking aleatório (qualquer oponente disponível)
- Recompensas: Coronas e XP (valores menores que ranked)
- Sem mudança de ELO

#### 3. **Direct Challenge (Desafio Direto)**
- Desafio direto entre jogadores (amigos ou chat)
- Não afeta ranking
- Recompensas: Coronas e XP
- Expira após 10 minutos se não aceito

### 6.3 Sistema de ELO e Tiers

#### Fórmula de ELO:
- **K-factor:** 32 (padrão)
- **Fórmula:** `newElo = oldElo + K * (actual - expected)`
- **Expected Score:** `expected = 1 / (1 + 10^((opponentElo - playerElo) / 400))`

#### Tiers e Divisões (estilo League of Legends):

| Tier | ELO Range | Divisões | Descrição |
|------|-----------|----------|-----------|
| **Iron** | 0-399 | IV, III, II, I | Iniciante |
| **Bronze** | 400-799 | IV, III, II, I | Básico |
| **Silver** | 800-1199 | IV, III, II, I | Intermediário |
| **Gold** | 1200-1599 | IV, III, II, I | Avançado |
| **Platinum** | 1600-1999 | IV, III, II, I | Expert |
| **Diamond** | 2000-2399 | IV, III, II, I | Elite |
| **Master** | 2400-2799 | Sem divisões | Mestre |
| **Grandmaster** | 2800-3199 | Sem divisões | Grão-Mestre |
| **Challenger** | 3200+ | Sem divisões | Top 200 |

### 6.4 Sistema de Temporadas

- **Duração:** 1 mês por temporada
- **Recompensas de Fim de Temporada:**
  - Top 10: 9500-5000 coronas
  - Top 50: 4000-2000 coronas
  - Top 100: 1500-500 coronas
- **Reset:** Rankings são resetados, mas histórico é mantido

### 6.5 Matchmaking

#### Fila de Matchmaking:
- Jogadores entram na fila escolhendo tipo (ranked/casual)
- **Ranked:** Busca oponente com ELO similar (±100, expande até ±500)
- **Casual:** Busca qualquer oponente disponível
- Timeout: 5 minutos (expira se não encontrar match)

### 6.6 Recompensas PVP

#### Partidas Rankeadas:
- **Coronas:** Baseado em tier do oponente (50-500 coronas)
- **XP:** Baseado em nível do oponente
- **ELO:** Calculado pelo sistema de ranking

#### Partidas Casuais:
- **Coronas:** Valor fixo menor (25-100 coronas)
- **XP:** Baseado em nível do oponente
- **ELO:** Não afeta (partidas casuais não alteram ranking)

### 6.7 Validação e Anti-Cheat

- **Validação Server-Side:** Todas as ações são validadas no servidor
- **Verificações:**
  - Essência suficiente
  - Técnica existe e está disponível
  - Dano calculado (tolerância para arredondamentos)
  - Timeout de ações (máximo 30 segundos por turno)

---

## 7. Progressão e Economia

### 7.1 Moeda: Coronas 💰

#### Ganhos:
- Trabalhos semanais (varia por tipo de trabalho)
- Prêmios de torneios (varia por rank)
- Vitórias em PVP (varia por tipo e tier)
- Completar dungeons (primeira vez e repetições)
- Explorações (itens vendáveis)

#### Gastos:
- Alimentação (Ração Básica, Fruta Vital, etc.)
- Itens de treino (Cristal de Eco, etc.)
- Medicina (Erva Serena, etc.)
- Taxas de torneio (Bronze: grátis, Prata: 300, Ouro: 800, Mítico: 2000)
- Itens de craft

### 7.2 Itens Comuns

- **Ração Básica** – Alimento padrão, neutro
- **Fruta Vital** – Reduz stress
- **Erva Serena** – Cura fadiga
- **Cristal de Eco** – Aumenta chance de aprender técnicas
- **Elixires de Atributo** – Aumenta atributos permanentemente (limite de usos)

### 7.3 Sistema de Torneios

#### Ranks de Torneios:

| Rank | Taxa de Entrada | Dificuldade | Recompensas |
|------|----------------|-------------|-------------|
| **Bronze** | Grátis | Iniciante | 100-300 coronas |
| **Prata** | 300💰 | Intermediário | 500-800 coronas |
| **Ouro** | 800💰 | Avançado | 1000-1500 coronas |
| **Mítico** | 2000💰 | Elite | 2000-5000 coronas |

#### Eventos Especiais:
- **Festival do Eco** – Torneio com Bestas raras
- **Noite das Sombras** – Torneio apenas para criaturas de afinidade sombria
- **Expedições** – Lutas contra Bestas selvagens gigantes (cooperativas - futuro)

### 7.4 Progressão do Guardião

| Nível | Título | Requisitos | Desbloqueios |
|-------|--------|------------|--------------|
| 1 | Guardião Iniciante | Início | 1 Besta, Torneio Bronze |
| 2 | Aprendiz Reconhecido | 1 vitória Bronze + 20 semanas | 2 Bestas, Trabalhos Especiais |
| 3 | Guardião Intermediário | 2 vitórias Prata | 3 Bestas, Mini-fazenda |
| 4 | Guardião de Ouro | 1 vitória Ouro | 4 Bestas, Laboratório |
| 5 | Guardião Mítico | 1 vitória Mítico | 5 Bestas, Arena Privada |
| 6 | Guardião Lendário | Desafio dos Mestres | Rancho Lendário, Relíquias Lendárias |

---

## 8. Dungeons e Exploração

### 8.1 Sistema de Dungeons

O jogo possui **5 dungeons temáticas**, cada uma com **5 andares**:

#### 1. **Floresta Eterna** 🌲
- **Tema:** Floresta antiga habitada por criaturas místicas
- **Desbloqueio:** Sempre disponível (0 vitórias)
- **Recompensas:** 1000 coronas + 250 XP (compleção)
- **Boss:** Sylphid Ancestral (Nível 25)

#### 2. **Caverna das Profundezas** 🗻
- **Tema:** Cavernas escuras cheias de perigos
- **Desbloqueio:** 5 vitórias
- **Recompensas:** 1500 coronas + 400 XP (compleção)
- **Boss:** Olgrim Rei das Profundezas (Nível 35)

#### 3. **Ruínas Antigas** 🏛️
- **Tema:** Restos de uma civilização perdida
- **Desbloqueio:** 15 vitórias
- **Recompensas:** 2000 coronas + 600 XP (compleção)
- **Boss:** Imperador Terravox (Nível 45)

#### 4. **Vulcão Furioso** 🌋
- **Tema:** Montanha de fogo e lava
- **Desbloqueio:** 30 vitórias
- **Recompensas:** 3000 coronas + 1000 XP (compleção)
- **Boss:** Ignar Senhor das Chamas (Nível 55)

#### 5. **Abismo Eterno** 🕳️
- **Tema:** Um vazio sem fim
- **Desbloqueio:** 50 vitórias
- **Recompensas:** 5000 coronas + 2000 XP (compleção)
- **Boss:** Umbrix Devorador de Mundos (Nível 65)

### 8.2 Mecânicas de Dungeon

- **Progressão:** Cada andar deve ser completado sequencialmente
- **Fadiga:** Dungeons consomem fadiga (10 + floor * 5)
- **Tesouros:** Cada andar possui baús com itens raros
- **Boss Final:** 5º andar sempre tem um boss poderoso
- **Primeira Compleção:** Bônus especial na primeira vez

### 8.3 Sistema de Exploração

- **Locais Exploráveis:** Diferentes áreas do mundo
- **Materiais Raros:** Coletados durante explorações
- **Eventos Aleatórios:** Encontros especiais durante exploração
- **Limite Diário:** 10 explorações por dia (reset a cada 2 horas)

---

## 9. Técnicas e Habilidades

### 9.1 Sistema de Técnicas

Cada Besta pode aprender até **12 técnicas únicas** (distribuídas até nível 100), específicas de sua linha. As técnicas são aprendidas em níveis específicos.

### 9.2 Tipos de Técnicas

#### 1. **Físicas**
- Dano baseado em **Might**
- Exemplos: Investida Selvagem, Mordida Feroz, Golpe Poderoso

#### 2. **Místicas**
- Dano baseado em **Wit + Focus**
- Exemplos: Raio Arcano, Explosão Mística, Tempestade Psíquica

#### 3. **Utilitárias**
- Efeitos especiais (cura, buffs, debuffs)
- Exemplos: Toque Curativo, Muralha de Pedra, Rugido Ancestral

### 9.3 Exemplos de Técnicas por Linha

#### Olgrim (Olho Ancestral):
- **Raio Etéreo** (Nível 1) - 18 Essência, 45 dano místico
- **Olhar Paralisante** (Nível 5) - 22 Essência, 30 dano, chance de atordoar
- **Explosão Mental** (Nível 10) - 28 Essência, 65 dano místico, reduz Foco
- **Chuva de Fragmentos** (Nível 15) - 35 Essência, 80 dano místico, múltiplos raios
- **Pulso Mental** (Nível 20) - 14 Essência, 35 dano, reduz Foco
- **Visão Penetrante** (Nível 30) - 24 Essência, 60 dano, ignora defesa parcial
- **Raio Concentrado** (Nível 40) - 32 Essência, 95 dano místico
- **Olho Onisciente** (Nível 50) - 42 Essência, 0 dano, aumenta dano crítico
- **Tempestade Psíquica** (Nível 70) - 48 Essência, 100 dano, reduz todos atributos
- **Rasgo da Realidade** (Nível 85) - 55 Essência, 120 dano, ignora defesa
- **Julgamento Cósmico** (Nível 95) - 65 Essência, 150 dano místico, efeito devastador
- **Apoteose Mental** (Nível 100) - 75 Essência, 200 dano místico, ultimate

#### Feralis (Felino Ágil):
- **Garra Rápida** (Nível 1) - 10 Essência, 30 dano físico
- **Investida Selvagem** (Nível 5) - 15 Essência, 45 dano físico alto
- **Garra Precisa** (Nível 10) - 12 Essência, 35 dano, alta chance de acerto
- **Mordida Feroz** (Nível 15) - 18 Essência, 55 dano físico
- **Espreitar** (Nível 20) - 8 Essência, 0 dano, aumenta chance de crítico
- **Grito Selvagem** (Nível 30) - 30 Essência, 0 dano, reduz Agility inimiga
- **Garra Sombria** (Nível 40) - 25 Essência, 70 dano, chance de crítico
- **Velocidade Suprema** (Nível 50) - 35 Essência, 0 dano, aumenta Agility própria
- **Fúria Felina** (Nível 70) - 45 Essência, 100 dano físico, múltiplos golpes
- **Emboscada** (Nível 85) - 50 Essência, 120 dano, ataque surpresa
- **Rugido do Predador** (Nível 95) - 60 Essência, 150 dano, reduz defesa inimiga
- **Fúria Ancestral** (Nível 100) - 70 Essência, 200 dano físico, ultimate

*(E assim por diante para todas as 10 linhas...)*

### 9.4 Aprendizado de Técnicas

- Técnicas são aprendidas automaticamente ao atingir o nível necessário
- Algumas técnicas podem ser aprendidas através de itens (Cristal de Eco)
- Técnicas especiais podem ser herdadas através do sistema de Herança Espiritual

---

## 10. Arquitetura Técnica

### 10.1 Stack Tecnológico

#### Frontend (Client):
- **TypeScript 5.3.3** - Linguagem principal
- **Vite 5.1.0** - Build tool e dev server
- **Three.js 0.180.0** - Renderização 3D
- **Canvas 2D API** - UI e renderização 2D
- **IndexedDB** - Persistência offline
- **Service Worker** - PWA e cache
- **Socket.io-client 4.8.1** - WebSocket client

#### Backend (Server):
- **Node.js 18+** - Runtime
- **Express 4.18.2** - Framework web
- **PostgreSQL** - Banco de dados
- **Socket.io 4.8.1** - WebSocket server
- **JWT 9.0.2** - Autenticação
- **Passport.js 0.7.0** - OAuth (Google)

### 10.2 Estrutura do Projeto

```
vanilla-game/
├── client/                    # Frontend
│   ├── src/
│   │   ├── 3d/               # Sistema 3D (Three.js)
│   │   │   ├── scenes/       # Cenas 3D
│   │   │   ├── models/       # Modelos 3D
│   │   │   └── materials/    # Shaders
│   │   ├── api/              # Cliente API (REST)
│   │   ├── data/             # Dados estáticos
│   │   ├── systems/          # Sistemas de jogo
│   │   ├── ui/               # Interfaces
│   │   └── main.ts           # Entry point
│   └── public/
│       └── assets/3d/         # Assets 3D (GLB)
│
├── server/                    # Backend
│   ├── src/
│   │   ├── controllers/      # Controllers REST
│   │   ├── routes/           # Rotas da API
│   │   ├── db/               # Migrations e queries
│   │   ├── services/         # Serviços (PVP, chat, etc)
│   │   └── index.ts          # Entry point
│
└── shared/                    # Código compartilhado
    └── types.ts              # Tipos TypeScript
```

### 10.3 Banco de Dados

#### Tabelas Principais:
- `users` - Usuários
- `beasts` - Bestas dos jogadores
- `pvp_rankings` - Rankings PVP
- `pvp_matches` - Partidas PVP
- `pvp_matchmaking_queue` - Fila de matchmaking
- `pvp_seasons` - Temporadas PVP
- `pvp_direct_challenges` - Desafios diretos
- `friends` - Sistema de amigos
- `chat_messages` - Mensagens de chat

### 10.4 Deploy

- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** PostgreSQL (Railway)

---

## 11. Roadmap de Desenvolvimento

### ✅ Fase 1: Core Systems (COMPLETO)
- [x] Sistema de calendário semanal
- [x] Atributos e crescimento
- [x] Estados secundários (fadiga, stress, lealdade)
- [x] UI do rancho
- [x] Sistema de trabalho e treino
- [x] Sistema de descanso com bônus especiais

### ✅ Fase 2: Combat System (COMPLETO)
- [x] Sistema de combate por turnos
- [x] Barra de Essência
- [x] 120+ técnicas implementadas (12 por linha × 10 linhas)
- [x] AI inimiga com personalidades
- [x] Sistema de torneios (4 ranks)
- [x] Geração procedural de oponentes

### ✅ Fase 3: Sistema 3D (COMPLETO)
- [x] Rancho 3D interativo
- [x] Vila 3D explorável
- [x] Batalhas 3D imersivas
- [x] Sistema de dia/noite dinâmico
- [x] 107 modelos GLB implementados

### ✅ Fase 4: Sistema PVP (COMPLETO)
- [x] Matchmaking rankeado e casual
- [x] Sistema de ELO e tiers
- [x] Temporadas PVP
- [x] Desafios diretos
- [x] Validação server-side
- [x] Recompensas e ranking

### ✅ Fase 5: Dungeons (COMPLETO)
- [x] 5 dungeons temáticas
- [x] Sistema de progressão por andares
- [x] Bosses únicos
- [x] Sistema de recompensas
- [x] Desbloqueio baseado em vitórias

### 🚧 Fase 6: Relíquias de Eco (EM DESENVOLVIMENTO)
- [ ] Sistema de geração procedural
- [ ] Templo dos Ecos
- [ ] Interface de criação
- [ ] Integração com entradas externas

### 📋 Fase 7: Ciclo de Vida Completo (PLANEJADO)
- [ ] Envelhecimento visual
- [ ] Sistema de morte
- [ ] Herança espiritual
- [ ] Cerimônia de Eco

### 📋 Fase 8: Expansão de Conteúdo (PLANEJADO)
- [ ] Mais linhas de bestas
- [ ] Mais sangues (subvariações)
- [ ] Eventos especiais
- [ ] NPCs com diálogos
- [ ] Sistema de reputação
- [ ] Quests adicionais

### 📋 Fase 9: Polimento (PLANEJADO)
- [ ] Animações melhoradas
- [ ] Efeitos sonoros
- [ ] Música de fundo
- [ ] Tutorial interativo
- [ ] Achievements adicionais
- [ ] Sistema de conquistas

---

## 12. Estatísticas do Projeto

### Código
- **Linhas de código:** ~15.000+ linhas TypeScript
- **Arquivos TypeScript:** ~134 arquivos
- **Sistemas principais:** 20+ sistemas
- **UI Components:** 29 componentes

### Assets
- **Modelos 3D:** 107 arquivos GLB
- **Criaturas:** 10 linhas × múltiplas variações
- **Ambientes:** 2 cenas principais (Ranch + Village)

### Funcionalidades
- **Sistemas de jogo:** 20+
- **Técnicas de combate:** 120+ (12 por linha)
- **Itens:** 100+
- **Dungeons:** 5 (25 andares no total)
- **Tiers PVP:** 9 (Iron a Challenger)

---

## 13. Conclusão

**Beast Keepers** é um projeto completo e bem estruturado que oferece:

✅ **Sistemas robustos e funcionais**  
✅ **Arquitetura escalável e modular**  
✅ **Assets 3D prontos para uso** (107 modelos)  
✅ **Documentação completa**  
✅ **Código TypeScript bem tipado**  
✅ **PWA completo e funcional**  
✅ **Backend REST + WebSocket**  
✅ **Sistema PVP completo**  
✅ **Dungeons temáticas**  

**Status Atual:** Em desenvolvimento ativo, com a maioria dos sistemas core implementados e funcionando.

**Próximos Passos:** Implementar Relíquias de Eco, completar ciclo de vida e expandir conteúdo.

---

**Última atualização:** Janeiro 2025  
**Versão do Documento:** 1.0  
**Mantido por:** Equipe de Desenvolvimento Beast Keepers

