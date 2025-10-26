/**
 * Beast Data Utility
 * Provides base stats and techniques for each beast line
 */

export interface BeastLineData {
  name: string;
  attributes: {
    might: number;
    wit: number;
    focus: number;
    agility: number;
    ward: number;
    vitality: number;
  };
  maxHp: number;
  techniques: string[];
}

export function getBeastLineData(line: string): BeastLineData {
  const baseData: Record<string, BeastLineData> = {
    olgrim: {
      name: 'Olgrim',
      attributes: { might: 15, wit: 30, focus: 25, agility: 18, ward: 12, vitality: 18 },
      maxHp: 90,
      techniques: ['mystic_blast', 'mind_spike', 'ethereal_shield']
    },
    terravox: {
      name: 'Terravox',
      attributes: { might: 28, wit: 12, focus: 18, agility: 10, ward: 35, vitality: 32 },
      maxHp: 160,
      techniques: ['stone_slam', 'earth_wall', 'tremor']
    },
    feralis: {
      name: 'Feralis',
      attributes: { might: 25, wit: 18, focus: 25, agility: 30, ward: 18, vitality: 22 },
      maxHp: 110,
      techniques: ['swift_strike', 'shadow_claw', 'agile_dodge']
    },
    brontis: {
      name: 'Brontis',
      attributes: { might: 28, wit: 18, focus: 20, agility: 18, ward: 25, vitality: 28 },
      maxHp: 140,
      techniques: ['power_crush', 'tail_whip', 'stomp']
    },
    zephyra: {
      name: 'Zephyra',
      attributes: { might: 18, wit: 25, focus: 25, agility: 35, ward: 15, vitality: 18 },
      maxHp: 90,
      techniques: ['wind_slash', 'aerial_dive', 'gust']
    },
    ignar: {
      name: 'Ignar',
      attributes: { might: 35, wit: 20, focus: 20, agility: 22, ward: 20, vitality: 24 },
      maxHp: 120,
      techniques: ['flame_burst', 'inferno', 'fire_tackle']
    },
    mirella: {
      name: 'Mirella',
      attributes: { might: 22, wit: 24, focus: 24, agility: 22, ward: 22, vitality: 24 },
      maxHp: 120,
      techniques: ['water_pulse', 'aqua_shield', 'tide_surge']
    },
    umbrix: {
      name: 'Umbrix',
      attributes: { might: 20, wit: 28, focus: 24, agility: 25, ward: 18, vitality: 22 },
      maxHp: 110,
      techniques: ['shadow_strike', 'dark_veil', 'nightmare']
    },
    sylphid: {
      name: 'Sylphid',
      attributes: { might: 12, wit: 35, focus: 30, agility: 25, ward: 15, vitality: 18 },
      maxHp: 90,
      techniques: ['spirit_bolt', 'ethereal_form', 'mystic_ray']
    },
    raukor: {
      name: 'Raukor',
      attributes: { might: 28, wit: 18, focus: 25, agility: 26, ward: 22, vitality: 25 },
      maxHp: 125,
      techniques: ['feral_bite', 'pack_tactics', 'howl']
    }
  };

  return baseData[line] || baseData.feralis; // Default to feralis if unknown
}

