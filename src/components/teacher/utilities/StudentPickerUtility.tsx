import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Users } from 'lucide-react';
import SingleStudentPickerUtility from './SingleStudentPickerUtility';
import LiveStudentPickerUtility from './LiveStudentPickerUtility';

type PickerMode = 'local' | 'live';

export default function StudentPickerUtility() {
  const [mode, setMode] = useState<PickerMode>('local');

  return (
    <div className="space-y-4">
      <Card className="border-indigo-200 dark:border-indigo-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Modo do sorteador
          </CardTitle>
          <CardDescription>
            Use uma lista digitada manualmente ou abra uma sala para receber alunos em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60 border">
            <Button type="button" variant={mode === 'local' ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setMode('local')}>
              <Users className="w-4 h-4" />
              Modo local
              <span className="ml-auto text-xs opacity-70">Lista manual</span>
            </Button>
            <Button type="button" variant={mode === 'live' ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setMode('live')}>
              <Radio className="w-4 h-4" />
              Tempo real
              <span className="ml-auto text-xs opacity-70">QR Code + PIN</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {mode === 'local' ? <SingleStudentPickerUtility /> : <LiveStudentPickerUtility />}
    </div>
  );
}
