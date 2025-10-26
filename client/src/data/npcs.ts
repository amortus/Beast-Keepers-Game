/**
 * NPCs do Beast Keepers
 * Personagens não-jogáveis com diálogos
 */

import type { NPC } from '../types';

export const NPCS: Record<string, NPC> = {
  ruvian: {
    id: 'ruvian',
    name: 'Mestre Ruvian',
    title: 'Guardião Ancião',
    description: 'Um ancião ex-Guardião que orienta novatos no caminho da criação de Bestas.',
    affinity: 0,
    dialogues: {
      greeting: [
        'Bem-vindo, jovem Guardião. O caminho à frente é longo, mas recompensador.',
        'Ah, você voltou! Como está indo o treinamento da sua Besta?',
        'É bom ver um jovem com tanto potencial. Continue assim!',
      ],
      advice: [
        'Lembre-se: uma Besta forte precisa de equilíbrio. Treino sem descanso leva apenas à exaustão.',
        'A lealdade é conquistada com paciência, não com força. Cuide bem dela.',
        'Nos torneios, não se esqueça: a estratégia vale mais que a força bruta.',
      ],
      farewell: [
        'Vá com sabedoria, jovem Guardião.',
        'Até a próxima. Que sua Besta cresça forte!',
        'Volte sempre que precisar de conselho.',
      ],
    },
    location: 'ranch',
    unlocked: true,
  },

  liora: {
    id: 'liora',
    name: 'Liora',
    title: 'Bibliotecária do Templo',
    description: 'Guardiã do conhecimento sobre as Relíquias de Eco e história das Bestas.',
    affinity: 0,
    dialogues: {
      greeting: [
        'Olá! Bem-vindo ao Templo dos Ecos. Posso ajudá-lo a entender as Relíquias?',
        'Ah, você retorna! Descobriu algo interessante sobre sua Besta?',
        'É sempre um prazer receber um Guardião tão dedicado.',
      ],
      advice: [
        'As Relíquias de Eco ressoam com a essência que você coloca nelas. Escolha com o coração!',
        'Cada Sangue traz características únicas. Pálido para inteligência, Carmesim para força...',
        'Já ouviu falar das Relíquias Lendárias? Elas estão escondidas por todo Aurath...',
      ],
      lore: [
        'As civilizações antigas criaram as Relíquias para preservar memórias e emoções.',
        'Dizem que existem 10 Linhas principais, mas há rumores de outras perdidas no tempo.',
        'O Templo dos Ecos foi construído há mil anos. Seus segredos ainda não foram todos revelados.',
      ],
      farewell: [
        'Volte sempre! Há tanto para aprender.',
        'Que as Relíquias guiem seu caminho.',
        'Até breve, Guardião.',
      ],
    },
    location: 'temple',
    unlocked: true,
  },

  dalan: {
    id: 'dalan',
    name: 'Dalan',
    title: 'Mercador Nômade',
    description: 'Viajante experiente que vende itens raros e úteis para Guardiões.',
    affinity: 0,
    dialogues: {
      greeting: [
        'Ei, Guardião! Procurando algo especial hoje?',
        'Voltou para mais negócios? Ótimo! Tenho novidades.',
        'Bem-vindo! Minha carroça está cheia de tesouros para você.',
      ],
      shop: [
        'Tenho desde Ervas Serenas até Cristais de Eco raros. O que te interessa?',
        'Produtos de qualidade não são baratos, mas valem cada Corona!',
        'Psiu... consegui uma Relíquia Antiga. Mas entre nós, entende?',
      ],
      barter: [
        'Hmm, posso fazer um desconto se você me trouxer itens de exploração.',
        'Está sem dinheiro? Que tal um trabalho rápido? Preciso de ajuda com entregas.',
        'Para clientes especiais, tenho ofertas... especiais.',
      ],
      farewell: [
        'Volte sempre! Dalan nunca desaponta.',
        'Até a próxima, amigo. E cuide dessa Besta!',
        'Boa sorte nos torneios! Se ganhar, volte com mais dinheiro!',
      ],
    },
    location: 'market',
    unlocked: true,
  },

  alya: {
    id: 'alya',
    name: 'Alya',
    title: 'Guardiã Rival',
    description: 'Jovem Guardiã talentosa que também está em treinamento. Competitiva e determinada.',
    affinity: 0,
    dialogues: {
      greeting: [
        'Ah, você de novo... Achei que já teria desistido.',
        'Oi. Pronto para ser deixado para trás mais uma vez?',
        'Hmm, vejo que ainda está por aqui. Interessante.',
      ],
      challenge: [
        'Minha Besta está mais forte a cada dia. Você consegue acompanhar?',
        'Nos vemos no próximo torneio. Vamos ver quem é melhor!',
        'Não pense que vai me vencer só porque teve sorte antes.',
      ],
      respect: [
        'Okay, admito... você está melhorando. Mas eu ainda sou melhor!',
        'Essa foi uma boa batalha. Mas da próxima vez, eu ganho.',
        'Hmph. Talvez você seja um rival à altura afinal...',
      ],
      friendly: [
        'Sabe... talvez possamos trocar algumas dicas de treino algum dia.',
        'Sua Besta parece bem cuidada. Você... não é tão ruim assim.',
        'Continue assim e quem sabe um dia seremos parceiros, não rivais.',
      ],
      farewell: [
        'Até logo. E não relaxe, estou sempre treinando!',
        'Tchau. Nos vemos nos torneios.',
        'Vá embora antes que eu mude de ideia sobre ser legal.',
      ],
    },
    location: 'arena',
    unlocked: true,
  },
};

/**
 * Retorna um diálogo aleatório de um NPC em uma categoria
 */
export function getNPCDialogue(npcId: string, category: keyof NPC['dialogues']): string {
  const npc = NPCS[npcId];
  if (!npc || !npc.dialogues[category]) {
    return 'Olá, Guardião.';
  }

  const dialogues = npc.dialogues[category];
  if (!dialogues || dialogues.length === 0) {
    return 'Olá, Guardião.';
  }

  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

/**
 * Retorna um diálogo baseado na afinidade
 */
export function getNPCDialogueByAffinity(npcId: string): string {
  const npc = NPCS[npcId];
  if (!npc) return 'Olá, Guardião.';

  // Alya tem diálogos especiais baseados em afinidade
  if (npcId === 'alya') {
    if (npc.affinity >= 50) {
      return getNPCDialogue(npcId, 'friendly');
    } else if (npc.affinity >= 20) {
      return getNPCDialogue(npcId, 'respect');
    } else {
      return getNPCDialogue(npcId, 'challenge');
    }
  }

  // Outros NPCs usam greeting
  return getNPCDialogue(npcId, 'greeting');
}

/**
 * Aumenta afinidade com um NPC
 */
export function increaseAffinity(npcId: string, amount: number): void {
  const npc = NPCS[npcId];
  if (npc) {
    npc.affinity = Math.min(100, npc.affinity + amount);
  }
}

/**
 * Diminui afinidade com um NPC
 */
export function decreaseAffinity(npcId: string, amount: number): void {
  const npc = NPCS[npcId];
  if (npc) {
    npc.affinity = Math.max(0, npc.affinity - amount);
  }
}

/**
 * Retorna lista de NPCs disponíveis em um local
 */
export function getNPCsByLocation(location: string): NPC[] {
  return Object.values(NPCS).filter(npc => npc.location === location && npc.unlocked);
}

