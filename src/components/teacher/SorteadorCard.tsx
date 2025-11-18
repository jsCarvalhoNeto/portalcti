import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface SorteadorCardProps {
  onAcessar: () => void;
}

export default function SorteadorCard({ onAcessar }: SorteadorCardProps) {
  return (
    <Card
      className="hover:shadow-glow transition-all duration-300 border-0 relative overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #f43f5eCC 0%, #f43f5eAA 100%)',
        color: '#fff',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#f43f5e' }} />
      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg" style={{ color: '#fff' }}>
              Sorteador de Equipes
            </CardTitle>
            <CardDescription style={{ color: '#fff9' }}>
              Ferramenta do Professor
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-white/30 text-white bg-white/20">
            Disponível
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#fff' }}>
            Sorteie alunos para equipes, defina líderes e edite as equipes facilmente.
          </p>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center justify-center gap-2 bg-white/20 border-white/30 hover:bg-white/30 transition-all py-3 px-6"
              style={{ color: '#fff' }}
              onClick={onAcessar}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Acessar</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
