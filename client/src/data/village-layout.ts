import type { NpcId } from '../types';
import type {
  VillageBuildingVariant,
  Vector3Like,
} from '../types/village';

export interface VillageBuildingBlueprint {
  id: string;
  icon: string;
  variant: VillageBuildingVariant;
  position: Vector3Like;
  rotation?: number;
  color: number;
  npcId?: NpcId;
  facilityId?: 'shop' | 'temple' | 'blacksmith' | 'quests' | 'exploration' | 'dungeons' | 'achievements' | 'ranch';
  label: string;
}

export const VILLAGE_BLUEPRINT: VillageBuildingBlueprint[] = [
  {
    id: 'npc:ruvian',
    icon: '🧙',
    variant: 'house',
    position: { x: -14, y: 0, z: -9 },
    color: 0xceb48a,
    npcId: 'ruvian',
    label: 'Mestre Ruvian',
  },
  {
    id: 'facility:shop',
    icon: '🛒',
    variant: 'shop',
    position: { x: -6, y: 0, z: -2 },
    color: 0xf5c06f,
    npcId: 'dalan',
    facilityId: 'shop',
    label: 'Loja do Dalan',
  },
  {
    id: 'facility:blacksmith',
    icon: '⚒️',
    variant: 'blacksmith',
    position: { x: 8, y: 0, z: -3 },
    color: 0xb87333,
    npcId: 'koran',
    facilityId: 'blacksmith',
    label: 'Forja do Koran',
  },
  {
    id: 'facility:temple',
    icon: '🏛️',
    variant: 'temple',
    position: { x: 0, y: 0, z: 13 },
    color: 0xcbb5f5,
    npcId: 'liora',
    facilityId: 'temple',
    label: 'Templo dos Ecos',
  },
  {
    id: 'npc:alya',
    icon: '⚔️',
    variant: 'house',
    position: { x: 16, y: 0, z: -10 },
    color: 0xf28c8c,
    npcId: 'alya',
    label: 'Alya',
  },
  {
    id: 'npc:toran',
    icon: '📜',
    variant: 'guild',
    position: { x: -18, y: 0, z: 8 },
    color: 0xe1a95f,
    npcId: 'toran',
    label: 'Toran',
  },
  {
    id: 'npc:eryon',
    icon: '🎻',
    variant: 'tavern',
    position: { x: 16, y: 0, z: 8 },
    color: 0x8fbc8f,
    npcId: 'eryon',
    label: 'Eryon',
  },
];
