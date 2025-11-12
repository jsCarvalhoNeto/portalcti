import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import api from '@/services/api';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface PollData {
  id: string;
  title: string;
  options: PollOption[];
  isActive: boolean;
  createdAt: string;
}

export default function PollVotingPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const [voterName, setVoterName] = useState('');
 const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar pesquisa da API
  useEffect(() => {
    loadPoll();
  }, [pollId]);

  const loadPoll = async () => {
    if (!pollId) {
      setError('ID da pesquisa não fornecido');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/polls/${pollId}/vote`);
      if (response.data.success) {
        setPoll(response.data.poll);
        if (!response.data.poll.isActive) {
          setError('Esta pesquisa não está ativa');
        }
      } else {
        setError(response.data.error || 'Pesquisa não encontrada ou expirada');
      }
    } catch (err) {
      setError('Erro ao carregar a pesquisa');
      console.error('Erro ao carregar pesquisa:', err);
    }
    
    setLoading(false);
  };

  const vote = async () => {
    if (!pollId || !poll) return;
    if (!voterName.trim()) {
      alert('Por favor, informe seu nome');
      return;
    }
    if (!selectedOption) {
      alert('Selecione uma opção para votar');
      return;
    }

    try {
      const response = await api.post(`/polls/${pollId}/vote`, {
        optionId: selectedOption,
        studentName: voterName.trim()
      });

      if (response.data.success) {
        setHasVoted(true);
        // Recarregar a pesquisa para atualizar os votos
        loadPoll();
      } else {
        alert(response.data.error || 'Erro ao registrar voto');
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
      alert('Erro ao registrar voto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <p className="text-gray-600 mb-4">Certifique-se de que o link da pesquisa é válido e que a pesquisa ainda está ativa.</p>
          <div className="space-y-2">
            <Button onClick={() => window.history.back()} className="w-full">
              Voltar
            </Button>
            <Button onClick={() => window.location.href = '/teacher'} variant="outline" className="w-full">
              Ir para Painel do Professor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-lg mb-4">Pesquisa não encontrada</div>
          <p className="text-gray-600 mb-4">A pesquisa que você está tentando acessar não existe ou expirou.</p>
          <div className="space-y-2">
            <Button onClick={() => window.history.back()} className="w-full">
              Voltar
            </Button>
            <Button onClick={() => window.location.href = '/teacher'} variant="outline" className="w-full">
              Ir para Painel do Professor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-green-800 mb-4">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Voto registrado com sucesso!</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Obrigado, {voterName}, por participar da pesquisa "{poll.title}"!
          </p>
          <Button onClick={() => window.location.reload()}>
            Voltar para a pesquisa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{poll.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Seu Nome</Label>
              <Input
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Digite seu nome..."
                disabled={hasVoted}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Selecione sua opção</Label>
              <div className="space-y-2 mt-2">
                {poll.options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                        {selectedOption === option.id && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span>Opção {index + 1}: {option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={vote}
              disabled={!voterName.trim() || !selectedOption}
              className="w-full"
            >
              Registrar Voto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
