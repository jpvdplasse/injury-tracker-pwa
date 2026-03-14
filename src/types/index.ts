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

export type BodyView = 'front' | 'back';

export interface Injury {
  id: string;
  bodyZoneId: string;
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
  view: BodyView;
  region: 'head' | 'torso' | 'arms' | 'legs';
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
  1: '#4ade80',
  2: '#a3e635',
  3: '#facc15',
  4: '#fb923c',
  5: '#ef4444',
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
  // Front view
  { id: 'head', name: 'Head', nameNl: 'Hoofd', view: 'front', region: 'head' },
  { id: 'neck', name: 'Neck', nameNl: 'Nek', view: 'front', region: 'head' },
  { id: 'left-shoulder', name: 'Left Shoulder', nameNl: 'Linker Schouder', view: 'front', region: 'arms' },
  { id: 'right-shoulder', name: 'Right Shoulder', nameNl: 'Rechter Schouder', view: 'front', region: 'arms' },
  { id: 'chest', name: 'Chest', nameNl: 'Borst', view: 'front', region: 'torso' },
  { id: 'left-upper-arm', name: 'Left Upper Arm', nameNl: 'Linker Bovenarm', view: 'front', region: 'arms' },
  { id: 'right-upper-arm', name: 'Right Upper Arm', nameNl: 'Rechter Bovenarm', view: 'front', region: 'arms' },
  { id: 'left-elbow', name: 'Left Elbow', nameNl: 'Linker Elleboog', view: 'front', region: 'arms' },
  { id: 'right-elbow', name: 'Right Elbow', nameNl: 'Rechter Elleboog', view: 'front', region: 'arms' },
  { id: 'abs', name: 'Abdomen', nameNl: 'Buik', view: 'front', region: 'torso' },
  { id: 'left-forearm', name: 'Left Forearm', nameNl: 'Linker Onderarm', view: 'front', region: 'arms' },
  { id: 'right-forearm', name: 'Right Forearm', nameNl: 'Rechter Onderarm', view: 'front', region: 'arms' },
  { id: 'left-hand', name: 'Left Hand', nameNl: 'Linker Hand', view: 'front', region: 'arms' },
  { id: 'right-hand', name: 'Right Hand', nameNl: 'Rechter Hand', view: 'front', region: 'arms' },
  { id: 'left-hip', name: 'Left Hip', nameNl: 'Linker Heup', view: 'front', region: 'legs' },
  { id: 'right-hip', name: 'Right Hip', nameNl: 'Rechter Heup', view: 'front', region: 'legs' },
  { id: 'left-thigh', name: 'Left Thigh', nameNl: 'Linker Bovenbeen', view: 'front', region: 'legs' },
  { id: 'right-thigh', name: 'Right Thigh', nameNl: 'Rechter Bovenbeen', view: 'front', region: 'legs' },
  { id: 'left-knee', name: 'Left Knee', nameNl: 'Linker Knie', view: 'front', region: 'legs' },
  { id: 'right-knee', name: 'Right Knee', nameNl: 'Rechter Knie', view: 'front', region: 'legs' },
  { id: 'left-shin', name: 'Left Shin', nameNl: 'Linker Scheenbeen', view: 'front', region: 'legs' },
  { id: 'right-shin', name: 'Right Shin', nameNl: 'Rechter Scheenbeen', view: 'front', region: 'legs' },
  { id: 'left-ankle', name: 'Left Ankle', nameNl: 'Linker Enkel', view: 'front', region: 'legs' },
  { id: 'right-ankle', name: 'Right Ankle', nameNl: 'Rechter Enkel', view: 'front', region: 'legs' },
  { id: 'left-foot', name: 'Left Foot', nameNl: 'Linker Voet', view: 'front', region: 'legs' },
  { id: 'right-foot', name: 'Right Foot', nameNl: 'Rechter Voet', view: 'front', region: 'legs' },
  // Back view
  { id: 'upper-back', name: 'Upper Back', nameNl: 'Bovenrug', view: 'back', region: 'torso' },
  { id: 'lower-back', name: 'Lower Back', nameNl: 'Onderrug', view: 'back', region: 'torso' },
  { id: 'left-hamstring', name: 'Left Hamstring', nameNl: 'Linker Hamstring', view: 'back', region: 'legs' },
  { id: 'right-hamstring', name: 'Right Hamstring', nameNl: 'Rechter Hamstring', view: 'back', region: 'legs' },
  { id: 'left-calf', name: 'Left Calf', nameNl: 'Linker Kuit', view: 'back', region: 'legs' },
  { id: 'right-calf', name: 'Right Calf', nameNl: 'Rechter Kuit', view: 'back', region: 'legs' },
];

export function getBodyZone(id: string): BodyZone | undefined {
  return BODY_ZONES.find(z => z.id === id);
}
