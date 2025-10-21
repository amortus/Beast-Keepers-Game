# 🎮 Beast Keepers - Como Jogar

## 🚀 Primeiros Passos

### 1. Inicie o Jogo

```bash
cd Beast-Keepers  # (renomeie a pasta vanilla-game primeiro!)
npm install
npm run dev
```

O jogo abrirá em `http://localhost:5173`

---

## 🎯 Objetivo do Jogo

Você é um **Guardião Aprendiz** em Vale Esmeralda. Sua missão é:
- 🐾 Criar e treinar **Bestas** místicas
- ⚔️ Participar de **torneios**
- 🏆 Provar seu valor como Guardião
- 🧬 Gerenciar o **ciclo de vida** das suas criaturas

---

## 🎮 Como Jogar (MVP Atual)

### Interface Principal

#### Topo
- 💰 **Dinheiro** (Coronas)
- 👤 **Nome e Título** do Guardião

#### Painel Esquerdo - Sua Besta
- **Nome e Espécie**
- **Visualização** (placeholder colorido)
- **Idade** (semanas)
- **Fase de Vida** (Filhote → Idoso)
- **Humor** (😊 😐 😢 😠 😴)
- **HP** e **Essência**
- **Fadiga** (aumenta com ações)

#### Painel Direito - Atributos
- **Força** (Might) - Dano físico
- **Astúcia** (Wit) - Dano místico
- **Foco** (Focus) - Precisão
- **Agilidade** (Agility) - Esquiva
- **Resistência** (Ward) - Defesa
- **Vitalidade** (Vitality) - HP total

#### Painel Inferior - Ações Semanais

Escolha **1 ação por semana**:

##### 🏋️ Treinar (Aumenta Atributos)
- **Força** - Para Bestas físicas (Terravox, Ignar, Raukor)
- **Astúcia** - Para Bestas mágicas (Olgrim, Sylphid, Umbrix)
- **Foco** - Melhora precisão
- **Agilidade** - Aumenta velocidade e esquiva
- **Resistência** - Melhora defesa
- **Vitalidade** - Aumenta HP máximo

⚠️ **Custo:** Aumenta Fadiga e Stress

##### 💼 Trabalhar (Ganhar Dinheiro)
- **Armazém** - 300💰 (leve)
- **Fazenda** - 400💰 (médio)
- **Guarda** - 500💰 (pesado)
- **Biblioteca** - 350💰 (leve, bom para Bestas inteligentes)

⚠️ **Custo:** Aumenta bastante Fadiga e Stress

##### 😴 Descansar (Recuperar)
- **Dormir** - Reduz muita Fadiga
- **Tempo Livre** - Reduz muito Stress
- **Passeio** - Equilibrado
- **Comer Bem** - Reduz Fadiga e melhora humor

✅ **Benefício:** Sua Besta precisa descansar!

---

## ⏩ Avançar Semana

1. Selecione uma **categoria** (Treinar/Trabalhar/Descansar)
2. Escolha a **ação específica**
3. Clique em **"⏩ Avançar Semana"**

A ação será executada e você verá:
- **Ganhos** de atributos
- **Mudanças** em Fadiga/Stress
- **Dinheiro** ganho (se trabalhou)
- **Idade** aumenta em 1 semana

---

## 💡 Dicas de Estratégia

### Para Iniciantes

1. **Comece Treinando**
   - Treino Força ou Vitalidade nas primeiras 5 semanas
   - Sua besta ainda é fraca, foque em sobreviver

2. **Monitore a Fadiga**
   - Se Fadiga > 70: **DESCANSE!**
   - Treinar cansado = menos ganhos

3. **Equilíbrio é Chave**
   - 2 semanas treino → 1 semana descanso
   - Trabalhe quando precisar de dinheiro

4. **Não Treine Demais**
   - Stress alto = humor ruim = lealdade baixa
   - Bestas estressadas podem desobedecer em batalha (futuro)

### Estratégias Avançadas

#### Build Tanque (Terravox)
```
Semana 1-3:   Treinar Resistência
Semana 4:     Descansar
Semana 5-7:   Treinar Vitalidade
Semana 8:     Trabalho (ganhar dinheiro)
Semana 9-10:  Descansar
Repetir...
```

#### Build Mago (Olgrim, Sylphid)
```
Semana 1-2:   Treinar Astúcia
Semana 3:     Treinar Foco
Semana 4:     Descansar
Semana 5-6:   Treinar Astúcia
Semana 7:     Trabalho Biblioteca
Semana 8:     Descansar
```

#### Build Velocista (Feralis, Zephyra)
```
Semana 1-3:   Treinar Agilidade
Semana 4:     Descansar
Semana 5-6:   Treinar Foco
Semana 7:     Treinar Agilidade
Semana 8:     Descansar
```

---

## 📊 Entendendo as Fases da Vida

| Fase | Semanas | Descrição |
|------|---------|-----------|
| **Filhote** | 0-20 | Crescimento lento, fácil de treinar |
| **Jovem** | 21-60 | Melhor fase para treino! |
| **Adulto** | 61-150 | Auge da força |
| **Maduro** | 151-180 | Começa a envelhecer |
| **Idoso** | 181+ | Performance cai |

⚠️ **Bestas morrem ao atingir sua expectativa de vida!**

### Longevidade por Espécie

| Besta | Vida Máxima |
|-------|-------------|
| **Terravox** | 4 anos (208 semanas) |
| **Raukor** | 3.5 anos (182 semanas) |
| **Brontis** | 3.2 anos (166 semanas) |
| **Feralis, Mirella, Zephyra, Umbrix** | 3 anos (156 semanas) |
| **Sylphid** | 2.8 anos (145 semanas) |
| **Ignar** | 2.7 anos (140 semanas) |
| **Olgrim** | 2.5 anos (130 semanas) |

---

## ⌨️ Atalhos de Teclado

- **S** - Salvar manualmente
- **Ctrl + R** - Resetar jogo (apaga save)

---

## 💾 Sistema de Save

- ✅ **Auto-save** a cada 10 segundos
- ✅ **Save ao minimizar** a janela
- ✅ **Save manual** com tecla S
- 💿 Salvo no **IndexedDB** (funciona offline)

---

## 🐛 Problemas Comuns

### "Nenhuma besta ativa!"
- Recarregue a página ou crie novo jogo (Ctrl+R)

### Botões não respondem
- Certifique-se de **selecionar uma categoria** primeiro (Treinar/Trabalhar/Descansar)
- Depois escolha a **ação específica**

### Besta morreu muito rápido
- Você treinou demais sem descansar
- Próxima vez, alterne: 2 treinos → 1 descanso

### Não consigo ganhar dinheiro
- Use as ações de **Trabalho**
- Fazenda e Guarda pagam bem (400-500💰)

---

## 🎯 Próximas Features (Em Desenvolvimento)

- ⚔️ **Sistema de Combate** (Fase 2)
- 🏆 **Torneios** Bronze/Prata/Ouro (Fase 3)
- 🔮 **Relíquias de Eco** - Gerar novas Bestas (Fase 4)
- 🧬 **Herança Espiritual** - Passar traços entre gerações (Fase 4)
- 👥 **NPCs** - Mestre Ruvian, Liora, Alya (Fase 5)
- 🏘️ **Vila** de Vale Esmeralda (Fase 5)

---

## 📚 Bestas Disponíveis (Atual)

No MVP você começa com **Brontis** (boa para iniciantes).

### Brontis (Réptil Colosso)
- **Elemento:** Terra/Fogo
- **Estilo:** Balanceado
- **Força:** ⭐⭐⭐⭐
- **Defesa:** ⭐⭐⭐⭐
- **Magia:** ⭐⭐
- **Velocidade:** ⭐⭐
- **Ideal para:** Iniciantes - fácil de treinar, sem fraquezas extremas

---

## 🎮 Divirta-se!

Beast Keepers está em **desenvolvimento ativo**. Esta é a **Fase 1 (Core)**.

Próximas atualizações trarão:
- Combate tático
- Mais bestas
- Torneios
- Multiplayer (futuro)

**Feedback é bem-vindo!** 🚀

