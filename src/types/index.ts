export type InjuryStatus = 'active' | 'recovering' | 'healed';

export type InjuryType =
  | 'kneuzing'
  | 'verrekking'
  | 'verstuiking'
  | 'breuk'
  | 'snijwond'
  | 'hersenschudding'
  | 'overig';

export type InjuryContext = 'training' | 'wedstrijd' | 'overig';

export interface Injury {
  id: string;
  bodyZoneId: string;
  subLocation?: string;
  side?: 'links' | 'rechts' | 'midden';
  type: InjuryType;
  severity: 1 | 2 | 3 | 4 | 5;
  context: InjuryContext;
  date: string; // ISO date string
  notes: string;
  status: InjuryStatus;
  recoveryNotes: string;
  recoveryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BodyZone {
  id: string;
  name: string;
  nameNl: string;
  region: 'head' | 'torso' | 'arms' | 'legs';
  /** true = zone already implies a side (left- or right-), false = ask side in modal */
  sided: boolean;
  /** sub-location options shown in modal */
  subLocations?: string[];
}

export const INJURY_TYPES: Record<InjuryType, { nl: string; en: string }> = {
  kneuzing: { nl: 'Kneuzing', en: 'Bruise' },
  verrekking: { nl: 'Verrekking', en: 'Strain' },
  verstuiking: { nl: 'Verstuiking', en: 'Sprain' },
  breuk: { nl: 'Breuk', en: 'Fracture' },
  snijwond: { nl: 'Snijwond', en: 'Cut' },
  hersenschudding: { nl: 'Hersenschudding', en: 'Concussion' },
  overig: { nl: 'Overig', en: 'Other' },
};

export const INJURY_CONTEXTS: Record<InjuryContext, string> = {
  training: 'Training',
  wedstrijd: 'Wedstrijd',
  overig: 'Overig',
};

export const SEVERITY_COLORS: Record<number, string> = {
  1: '#f5a623',
  2: '#f5a623',
  3: '#ff6b35',
  4: '#dc2626',
  5: '#dc2626',
};

export const STATUS_COLORS: Record<InjuryStatus, string> = {
  active: '#ef4444',
  recovering: '#f59e0b',
  healed: '#22c55e',
};

export const STATUS_LABELS: Record<InjuryStatus, string> = {
  active: 'Actief',
  recovering: 'Herstellend',
  healed: 'Genezen',
};

export const BODY_ZONES: BodyZone[] = [
  {
    id: 'head',
    name: 'Head',
    nameNl: 'Hoofd',
    region: 'head',
    sided: false,
    subLocations: ['Schedel', 'Gezicht', 'Oog', 'Kaak', 'Neus'],
  },
  {
    id: 'neck',
    name: 'Neck',
    nameNl: 'Nek',
    region: 'head',
    sided: false,
    subLocations: ['Voorzijde', 'Achterzijde', 'Linkerzijde', 'Rechterzijde'],
  },
  {
    id: 'left-shoulder',
    name: 'Left Shoulder',
    nameNl: 'Linker Schouder',
    region: 'arms',
    sided: true,
    subLocations: ['Sleutelbeen', 'Gewricht', 'Spier'],
  },
  {
    id: 'right-shoulder',
    name: 'Right Shoulder',
    nameNl: 'Rechter Schouder',
    region: 'arms',
    sided: true,
    subLocations: ['Sleutelbeen', 'Gewricht', 'Spier'],
  },
  {
    id: 'chest',
    name: 'Chest / Upper Body',
    nameNl: 'Borst / Bovenlichaam',
    region: 'torso',
    sided: false,
    subLocations: ['Ribben links', 'Ribben rechts', 'Borstbeen', 'Borstspier links', 'Borstspier rechts'],
  },
  {
    id: 'left-arm',
    name: 'Left Arm',
    nameNl: 'Linker Arm',
    region: 'arms',
    sided: true,
    subLocations: ['Bovenarm', 'Elleboog', 'Onderarm'],
  },
  {
    id: 'right-arm',
    name: 'Right Arm',
    nameNl: 'Rechter Arm',
    region: 'arms',
    sided: true,
    subLocations: ['Bovenarm', 'Elleboog', 'Onderarm'],
  },
  {
    id: 'left-hand',
    name: 'Left Hand',
    nameNl: 'Linker Hand',
    region: 'arms',
    sided: true,
    subLocations: ['Pols', 'Handrug', 'Handpalm', 'Vingers'],
  },
  {
    id: 'right-hand',
    name: 'Right Hand',
    nameNl: 'Rechter Hand',
    region: 'arms',
    sided: true,
    subLocations: ['Pols', 'Handrug', 'Handpalm', 'Vingers'],
  },
  {
    id: 'core',
    name: 'Core / Torso',
    nameNl: 'Romp / Buik',
    region: 'torso',
    sided: false,
    subLocations: ['Buik', 'Zij links', 'Zij rechts', 'Lies links', 'Lies rechts'],
  },
  {
    id: 'back',
    name: 'Back',
    nameNl: 'Rug',
    region: 'torso',
    sided: false,
    subLocations: ['Bovenrug links', 'Bovenrug rechts', 'Middenrug', 'Onderrug links', 'Onderrug rechts', 'Stuit'],
  },
  {
    id: 'left-upper-leg',
    name: 'Left Upper Leg',
    nameNl: 'Linker Bovenbeen',
    region: 'legs',
    sided: true,
    subLocations: ['Heup', 'Quadricep', 'Hamstring', 'Binnenkant dij', 'Buitenkant dij'],
  },
  {
    id: 'right-upper-leg',
    name: 'Right Upper Leg',
    nameNl: 'Rechter Bovenbeen',
    region: 'legs',
    sided: true,
    subLocations: ['Heup', 'Quadricep', 'Hamstring', 'Binnenkant dij', 'Buitenkant dij'],
  },
  {
    id: 'left-knee',
    name: 'Left Knee',
    nameNl: 'Linker Knie',
    region: 'legs',
    sided: true,
    subLocations: ['Voorkant', 'Achterkant', 'Binnenzijde', 'Buitenzijde'],
  },
  {
    id: 'right-knee',
    name: 'Right Knee',
    nameNl: 'Rechter Knie',
    region: 'legs',
    sided: true,
    subLocations: ['Voorkant', 'Achterkant', 'Binnenzijde', 'Buitenzijde'],
  },
  {
    id: 'left-lower-leg',
    name: 'Left Lower Leg',
    nameNl: 'Linker Onderbeen',
    region: 'legs',
    sided: true,
    subLocations: ['Scheenbeen', 'Kuit', 'Achillespees'],
  },
  {
    id: 'right-lower-leg',
    name: 'Right Lower Leg',
    nameNl: 'Rechter Onderbeen',
    region: 'legs',
    sided: true,
    subLocations: ['Scheenbeen', 'Kuit', 'Achillespees'],
  },
  {
    id: 'left-ankle-foot',
    name: 'Left Ankle / Foot',
    nameNl: 'Linker Enkel / Voet',
    region: 'legs',
    sided: true,
    subLocations: ['Enkel', 'Hiel', 'Wreef', 'Teen', 'Voetzool'],
  },
  {
    id: 'right-ankle-foot',
    name: 'Right Ankle / Foot',
    nameNl: 'Rechter Enkel / Voet',
    region: 'legs',
    sided: true,
    subLocations: ['Enkel', 'Hiel', 'Wreef', 'Teen', 'Voetzool'],
  },
];

export function getBodyZone(id: string): BodyZone | undefined {
  return BODY_ZONES.find(z => z.id === id);
}
