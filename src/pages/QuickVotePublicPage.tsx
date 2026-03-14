import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPublicQuickVoteByHash, submitPublicQuickVote, type QuickVoteSession } from '@/services/quickVoteService';

const scoreOptions = Array.from({ length: 11 }, (_, index) => index);

export default function QuickVotePublicPage() {
  const { hash } = useParams<{ hash: string }>();
  const { toast } = useToast();

  const [quickVote, setQuickVote] = useState<QuickVoteSession | null>(null);
  const [studentName, setStudentName] = useState('');
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadQuickVote = async () => {
      if (!hash) {
        setErrorMessage('Link de votacao invalido.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getPublicQuickVoteByHash(hash);
        setQuickVote(data);
      } catch (error: any) {
        setErrorMessage(error?.message || 'Nao foi possivel carregar a votacao.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuickVote();
  }, [hash]);

  const handleSubmitVote = async () => {
    if (!hash || !quickVote) {
      return;
    }

    if (!studentName.trim()) {
      toast({
        title: 'Nome obrigatorio',
        description: 'Informe seu nome para enviar o voto.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedScore === null) {
      toast({
        title: 'Nota obrigatoria',
        description: 'Selecione uma nota de 0 a 10.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitPublicQuickVote(hash, {
        studentName: studentName.trim(),
        score: selectedScore
      });

      setHasVoted(true);
      toast({
        title: 'Voto enviado',
        description: 'Obrigado por participar da votacao!'
      });
    } catch (error: any) {
      toast({
        title: 'Nao foi possivel enviar o voto',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Carregando votacao...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !quickVote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Votacao indisponivel</CardTitle>
            <CardDescription>{errorMessage || 'A votacao nao foi encontrada.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">Voto registrado com sucesso</CardTitle>
            <CardDescription>
              Obrigado, {studentName}, por participar da votacao "{quickVote.title}".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Enviar novo voto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quickVote.status !== 'active') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Votacao encerrada</CardTitle>
            <CardDescription>
              Esta votacao ja foi encerrada pelo professor.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{quickVote.title}</CardTitle>
            <CardDescription>
              Turma: {quickVote.subjectName} | Escolha uma nota de 0 a 10.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="student-name">Seu Nome</Label>
              <Input
                id="student-name"
                placeholder="Digite seu nome"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Selecione sua nota</Label>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                {scoreOptions.map((score) => (
                  <button
                    key={score}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedScore(score)}
                    className={`rounded-md border py-2 text-sm font-semibold transition-colors ${
                      selectedScore === score
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white hover:border-blue-400'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitVote}
              disabled={isSubmitting || !studentName.trim() || selectedScore === null}
            >
              {isSubmitting ? 'Enviando voto...' : 'Enviar Voto'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
