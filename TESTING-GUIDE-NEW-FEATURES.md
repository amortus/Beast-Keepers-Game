# 🧪 Guia de Testes - Novas Funcionalidades

**Versão:** 1.2.0  
**Data:** 2025-10-30

---

## ✅ Checklist de Testes

Use este guia para testar sistematicamente cada funcionalidade implementada.

---

## 🎵 1. Sistema de Som e Música

### Teste Básico
- [ ] Abrir o jogo
- [ ] Ouvir música de menu (se assets existirem)
- [ ] Pressionar **'M'** para abrir configurações
- [ ] Verificar 3 sliders aparecem
- [ ] Verificar botão Mute/Unmute funciona

### Teste de Controles
- [ ] Mover slider Master - volume muda
- [ ] Mover slider Música - só música muda
- [ ] Mover slider SFX - só efeitos mudam
- [ ] Clicar "Testar SFX" - ouvir som
- [ ] Clicar Mute - tudo silencia
- [ ] Fechar e reabrir (M) - configurações persistem

### Teste de Contextos
- [ ] Entrar no rancho - ouvir música de rancho
- [ ] Iniciar batalha - música muda para battle
- [ ] Abrir templo - música muda para temple
- [ ] Iniciar exploração - música muda para dungeon
- [ ] Voltar ao rancho - música volta para ranch

**Resultado Esperado:** ✅ Música muda suavemente entre contextos

---

## 🏆 2. Conquistas (50 Total)

### Teste Básico
- [ ] Abrir painel de conquistas
- [ ] Contar conquistas - deve ter 50
- [ ] Verificar categorias:
  - [ ] Batalha (11)
  - [ ] Treino (10)
  - [ ] Coleção (11)
  - [ ] Social (4)
  - [ ] Especiais (14)

### Teste de Progresso
- [ ] Ganhar uma batalha - "Primeira Vitória" progride
- [ ] Treinar besta - conquistas de treino progridem
- [ ] Craftar item - conquistas de craft progridem
- [ ] Verificar barra de progresso atualiza
- [ ] Desbloquear conquista - ver notificação

### Teste de Conquistas Secretas
- [ ] Encontrar 8 conquistas marcadas como "???"
- [ ] Tentar desbloquear uma
- [ ] Verificar revelação após desbloquear

**Resultado Esperado:** ✅ 50 conquistas funcionais

---

## 🎯 3. Desafios Diários e Semanais

### Teste Diário
- [ ] Ver 3 desafios diários no header/UI
- [ ] Verificar requisitos:
  - [ ] Ex: "Vença 3 batalhas"
  - [ ] Ex: "Treine 5 vezes"
  - [ ] Ex: "Colete 10 materiais"
- [ ] Completar ações
- [ ] Ver progresso atualizar (X/Y)
- [ ] Completar desafio - ver recompensa
- [ ] Verificar desafio marcado como completo

### Teste Semanal
- [ ] Ver 1 desafio semanal
- [ ] Verificar requisito maior (ex: 20 batalhas)
- [ ] Verificar recompensa maior
- [ ] Progredir durante a semana

### Teste de Streak
- [ ] Completar todos desafios de um dia
- [ ] Verificar streak = 1
- [ ] No dia seguinte, completar novamente
- [ ] Verificar streak = 2
- [ ] Ver bônus de streak ativo (10%+ reward)

### Teste de Renovação
- [ ] Esperar até 00:00 (ou mudar data do sistema)
- [ ] Verificar novos 3 desafios diários aparecem
- [ ] Antigos desafios incompletos removidos

**Resultado Esperado:** ✅ Sistema completo funcional

---

## 🔄 4. Ciclo de Vida das Bestas

### Teste de Envelhecimento
- [ ] Criar nova besta (idade = 0)
- [ ] Avançar 20 semanas - estágio "Filhote"
- [ ] Verificar modificador de stats (-10%)
- [ ] Avançar para 50 semanas - estágio "Adulto"
- [ ] Verificar stats normais (100%)
- [ ] Avançar para 100 semanas - estágio "Veterano"
- [ ] Verificar bônus de stats (+10%)
- [ ] Avançar para 150 semanas - estágio "Ancião"
- [ ] Verificar bônus máximo (+20%)

### Teste de Morte
- [ ] Avançar para 156 semanas
- [ ] Ver mensagem de morte
- [ ] Ver Cerimônia de Eco
- [ ] Verificar memorial criado

### Teste de Herança
- [ ] Criar nova besta após morte
- [ ] Verificar stats herdados (50% da anterior)
- [ ] Verificar 2 técnicas espectrais (+20% power)
- [ ] Verificar trait "Reencarnada" (+10% XP)
- [ ] Verificar memorial da besta anterior no rancho

**Resultado Esperado:** ✅ Ciclo completo funcional

---

## ⚔️ 5. Sistema de PvP

### Teste de Matchmaking
- [ ] Abrir painel PvP
- [ ] Clicar "Buscar Oponente"
- [ ] Ver oponente compatível (ELO similar)
- [ ] Ver informações do oponente

### Teste de Batalha
- [ ] Aceitar batalha PvP
- [ ] Lutar
- [ ] Vencer ou perder
- [ ] Ver mudança de ELO (+/- pontos)

### Teste de Ranking
- [ ] Abrir ranking PvP
- [ ] Ver posição global
- [ ] Ver ELO atual
- [ ] Ver wins/losses
- [ ] Ver streak

### Teste de Temporada
- [ ] Verificar número da temporada atual
- [ ] Ver data de início/fim
- [ ] Verificar reset mensal (calendário)

**Resultado Esperado:** ✅ PvP competitivo funcional

---

## 🌍 6. Dungeons (5 Temáticas)

### Teste de Desbloqueio
- [ ] Ver dungeons disponíveis por nível:
  - [ ] Floresta Eterna (lvl 10+)
  - [ ] Caverna Profundezas (lvl 20+)
  - [ ] Ruínas Antigas (lvl 30+)
  - [ ] Vulcão Furioso (lvl 40+)
  - [ ] Abismo Eterno (lvl 50+)

### Teste de Exploração
- [ ] Entrar em dungeon
- [ ] Ver 5 andares disponíveis
- [ ] Explorar andar 1 - enfrentar inimigo
- [ ] Coletar tesouro
- [ ] Avançar para andar 2-4
- [ ] Andar 5 - enfrentar BOSS
- [ ] Vencer boss - recompensa lendária

### Teste de Stamina
- [ ] Verificar stamina inicial = 100
- [ ] Explorar dungeon - gasta stamina
- [ ] Verificar regeneração (1 por minuto)
- [ ] Tentar explorar sem stamina - bloqueado

### Teste de First Clear
- [ ] Completar dungeon pela primeira vez
- [ ] Ver bônus de first clear (coronas + item especial)
- [ ] Completar novamente - sem bônus extra

**Resultado Esperado:** ✅ 5 dungeons épicas

---

## 🛡️ 7. Sistema de Equipamentos

### Teste de Equipar
- [ ] Abrir inventário/equipamentos
- [ ] Ver 4 slots vazios:
  - [ ] Máscara
  - [ ] Armadura
  - [ ] Arma
  - [ ] Amuleto
- [ ] Obter equipamento (loot ou compra)
- [ ] Equipar em slot correto
- [ ] Ver stats da besta aumentarem

### Teste de Raridades
- [ ] Equipamento comum (branco) - bônus pequeno
- [ ] Equipamento raro (azul) - bônus médio
- [ ] Equipamento épico (roxo) - bônus grande
- [ ] Equipamento lendário (dourado) - bônus máximo

### Teste de Forja
- [ ] Selecionar equipamento
- [ ] Abrir forja
- [ ] Usar materiais para upgrade
- [ ] Ver "+1" no nome
- [ ] Ver stats aumentadas

### Teste de Efeitos
- [ ] Equipar arma com crit chance
- [ ] Ver chance de crítico na batalha aumentada
- [ ] Equipar armadura com damage reduction
- [ ] Ver dano recebido reduzido

**Resultado Esperado:** ✅ 4 slots, raridades, forja

---

## 🏠 8. Customização do Rancho

### Teste de Decorações
- [ ] Abrir loja de decorações
- [ ] Ver 20 itens disponíveis:
  - [ ] 4 Árvores
  - [ ] 3 Pedras
  - [ ] 2 Fontes
  - [ ] 3 Estátuas
  - [ ] 3 Flores
  - [ ] 3 Cercas
  - [ ] 3 Caminhos
- [ ] Comprar decoração (gasta coronas)
- [ ] Ver item no inventário

### Teste de Editor
- [ ] Abrir modo de edição
- [ ] Selecionar decoração
- [ ] Arrastar e posicionar no rancho 3D
- [ ] Rotacionar objeto
- [ ] Ajustar escala
- [ ] Salvar posição

### Teste de Temas
- [ ] Ver 5 temas disponíveis
- [ ] Verificar preços:
  - [ ] Padrão (grátis)
  - [ ] Floresta (5.000₡)
  - [ ] Deserto (8.000₡)
  - [ ] Montanha (12.000₡)
  - [ ] Cristal (20.000₡)
- [ ] Comprar tema (se tiver coronas)
- [ ] Ver rancho mudar visualmente

**Resultado Esperado:** ✅ Rancho customizável

---

## 👥 9. Sistema de Guildas

### Teste de Criação
- [ ] Abrir menu de guildas
- [ ] Clicar "Criar Guilda"
- [ ] Inserir nome, descrição
- [ ] Escolher emblema (ícone + cor)
- [ ] Confirmar criação
- [ ] Verificar você é o líder

### Teste de Membros
- [ ] Convidar amigo
- [ ] Ver lista de membros
- [ ] Ver roles (líder, oficial, membro)
- [ ] Promover membro
- [ ] Kickar membro (se líder)

### Teste de Ranking
- [ ] Abrir ranking de guildas
- [ ] Ver posição global da sua guilda
- [ ] Ver guilds concorrentes
- [ ] Ver stats (wins, losses, level)

### Teste de Guerra
- [ ] Participar de guerra semanal
- [ ] Contribuir pontos (batalhas, doações)
- [ ] Ver placar atualizar
- [ ] Fim da guerra - ver vencedor
- [ ] Receber recompensas

**Resultado Esperado:** ✅ Guildas sociais e competitivas

---

## 📊 10. Dashboard de Estatísticas

### Teste de Visualização
- [ ] Abrir perfil/dashboard
- [ ] Ver 12 categorias de stats:
  1. [ ] ⚔️ Vitórias
  2. [ ] 💀 Derrotas
  3. [ ] 📈 Win Rate
  4. [ ] 🎯 Total Batalhas
  5. [ ] 🐾 Bestas Criadas
  6. [ ] 📅 Semana Atual
  7. [ ] 💪 Treinos
  8. [ ] 🔨 Crafts
  9. [ ] 💰 Gasto Total
  10. [ ] ⏱️ Tempo de Jogo
  11. [ ] 🏆 Conquistas (X/50)
  12. [ ] 🔥 Streaks

### Teste de Scroll
- [ ] Ver indicador "Role para ver mais"
- [ ] Usar scroll do mouse
- [ ] Ver mais stats aparecerem

### Teste de Stats Tracker
- [ ] Ganhar batalha - contador incrementa
- [ ] Usar técnica - contador incrementa
- [ ] Dar dano - totalDamageDealt aumenta
- [ ] Receber dano - totalDamageTaken aumenta

### Teste de Comparação
- [ ] Abrir comparação com amigos
- [ ] Selecionar amigo
- [ ] Ver stats lado a lado
- [ ] Ver quem está à frente em cada categoria

**Resultado Esperado:** ✅ Dashboard completo

---

## 🗄️ Database - Verificação

### Após Rodar Migrations

```sql
-- Conectar ao banco
psql -U postgres -d beast_keepers

-- Verificar novas colunas
\d game_state
-- Deve mostrar:
-- - daily_challenges (jsonb)
-- - challenge_streak (jsonb)
-- - beast_memorials (jsonb)
-- - current_beast_lineage (integer)
-- - relic_history (jsonb)
-- - dungeon_progress (jsonb)
-- - stamina (integer)
-- - last_stamina_regen (timestamp)
-- - beast_equipment (jsonb)
-- - ranch_decorations (jsonb)
-- - ranch_theme (varchar)
-- - stats_tracker (jsonb)

-- Verificar novas tabelas
\dt
-- Deve mostrar:
-- - pvp_rankings
-- - pvp_battles
-- - pvp_seasons
-- - guilds
-- - guild_members
-- - guild_wars

-- Verificar índices
\di
-- Deve ter 12+ novos índices

-- Teste de inserção
SELECT * FROM pvp_rankings LIMIT 1;
SELECT * FROM guilds LIMIT 1;
```

**Resultado Esperado:** ✅ Todas tabelas e colunas criadas

---

## 🎮 Fluxo de Jogo Completo

### Novo Jogador
1. [ ] Registrar conta
2. [ ] Criar primeira besta (Relíquia de Eco ou normal)
3. [ ] Ouvir música de menu/rancho
4. [ ] Ver tutorial (se existir)
5. [ ] Abrir conquistas - ver 50 disponíveis
6. [ ] Ver 3 desafios diários
7. [ ] Completar primeiro desafio
8. [ ] Ver recompensa de coronas

### Sessão de Jogo Típica
1. [ ] Fazer login - ouvir música
2. [ ] Ver desafios do dia (3)
3. [ ] Treinar besta 5x (completar desafio)
4. [ ] Ganhar 3 batalhas (completar desafio)
5. [ ] Explorar dungeon
6. [ ] Encontrar equipamento lendário
7. [ ] Equipar no slot apropriado
8. [ ] Ver stats aumentadas
9. [ ] Abrir dashboard - ver progresso
10. [ ] Fazer logout

### Jogador Avançado
1. [ ] Besta com 150+ semanas (Ancião)
2. [ ] Verificar bônus de +20% stats
3. [ ] Alcançar 156 semanas - ver morte
4. [ ] Cerimônia de Eco
5. [ ] Criar besta herdeira
6. [ ] Verificar 50% stats herdados
7. [ ] Verificar 2 técnicas espectrais
8. [ ] Buscar PvP - encontrar oponente
9. [ ] Batalha ranqueada
10. [ ] Ver mudança de ELO
11. [ ] Criar ou entrar em guilda
12. [ ] Participar de guerra de guilda

---

## 🐛 Bugs Conhecidos (Para Reportar)

### Esperados (Não Implementado Ainda)
- ⚠️ Assets de áudio não existem (modo silencioso ok)
- ⚠️ UIs de PvP, Guildas, Dungeons ainda não integradas no fluxo principal
- ⚠️ Algumas conquistas especiais precisam de lógica custom
- ⚠️ Controllers REST estão com TODOs (skeleton implementation)

### Não Esperados (Reportar!)
- ❌ Erros de TypeScript
- ❌ Erros no console
- ❌ Crashes ao abrir menus
- ❌ Dados não salvando
- ❌ Migrations falhando

---

## 📋 Checklist Pré-Teste

Antes de começar os testes, verificar:

- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL instalado (v14+)
- [ ] Dependências instaladas (`npm install`)
- [ ] 9 Migrations executadas (009-017)
- [ ] Servidor backend rodando (porta 3001)
- [ ] Frontend rodando (porta 5173)
- [ ] Banco de dados acessível
- [ ] Sem erros no console ao iniciar

---

## ✅ Resultado Final Esperado

Após todos os testes, você deve ter:

1. ✅ Sistema de áudio funcional (mesmo sem assets)
2. ✅ 50 conquistas visíveis e rastreáveis
3. ✅ 3 desafios diários + 1 semanal
4. ✅ Sistema de streak ativo
5. ✅ Bestas envelhecendo e morrendo
6. ✅ Sistema de herança funcional
7. ✅ PvP com matchmaking e ranking
8. ✅ 5 dungeons exploráveis
9. ✅ Equipamentos equipáveis
10. ✅ Rancho customizável
11. ✅ Guildas criáveis
12. ✅ Dashboard de stats detalhado

---

## 📊 Relatório de Teste

Após completar todos os testes, preencher:

| Funcionalidade | Status | Bugs Encontrados | Nota (1-10) |
|----------------|--------|------------------|-------------|
| 1. Áudio | ⬜ | | |
| 2. Conquistas | ⬜ | | |
| 3. Desafios | ⬜ | | |
| 4. Ciclo de Vida | ⬜ | | |
| 5. PvP | ⬜ | | |
| 6. Dungeons | ⬜ | | |
| 7. Equipamentos | ⬜ | | |
| 8. Rancho | ⬜ | | |
| 9. Guildas | ⬜ | | |
| 10. Dashboard | ⬜ | | |

**Média Geral:** ____ / 10

---

## 🚀 Após os Testes

### Se Tudo OK (90%+ aprovação)
1. ✅ Mergear código em main/master
2. ✅ Taggar versão (v1.2.0)
3. ✅ Deploy em staging
4. ✅ Beta testing com usuários
5. ✅ Deploy em produção

### Se Houver Issues (< 90%)
1. ⚠️ Documentar bugs encontrados
2. ⚠️ Priorizar correções
3. ⚠️ Corrigir e re-testar
4. ⚠️ Repetir ciclo até 90%+

---

## 📞 Contato

**Bugs/Issues:** Abrir issue no GitHub  
**Dúvidas:** Ver documentação em `/docs`  
**Sugestões:** ROADMAP-30-MELHORIAS.md

---

**BOA SORTE NOS TESTES! 🧪✨**

---

**Guia criado em:** 2025-10-30  
**Versão do jogo:** 1.2.0  
**Total de features para testar:** 10

