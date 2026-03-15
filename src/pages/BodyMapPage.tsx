import { useState } from 'react';
import BodyMap from '../components/BodyMap';
import InjuryModal from '../components/InjuryModal';
import type { Injury, InjuryType, InjuryContext } from '../types';

interface BodyMapPageProps {
  injuries: Injury[];
  onAddInjury: (data: {
    bodyZoneId: string;
    subLocation?: string;
    side?: 'links' | 'rechts' | 'midden';
    type: InjuryType;
    severity: 1 | 2 | 3 | 4 | 5;
    context: InjuryContext;
    date: string;
    notes: string;
  }) => void;
}

export default function BodyMapPage({ injuries, onAddInjury }: BodyMapPageProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col px-4 pt-3 pb-2">
      <div className="text-center mb-2">
        <h1 className="text-lg font-bold text-gray-900">Blessure Logboek</h1>
        <p className="text-xs text-gray-400">Tik op een lichaamsdeel om een blessure te registreren</p>
      </div>

      <div className="flex-1 min-h-0">
        <BodyMap
          injuries={injuries}
          onZoneClick={setSelectedZone}
        />
      </div>

      {selectedZone && (
        <InjuryModal
          zoneId={selectedZone}
          onSave={(data) => {
            onAddInjury(data);
            setSelectedZone(null);
          }}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}
