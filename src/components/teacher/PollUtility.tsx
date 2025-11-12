import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, Users, BarChart3 } from 'lucide-react';
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
  createdAt: string; // ISO string from API
}

export default function PollUtility() {
  const [pollTitle, setPollTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [pollId, setPollId] = useState<string | null>(null);
  const [polls, setPolls] = useState<PollData[]>([]);
  const [currentPoll, setCurrentPoll] = useState<PollData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Carregar enquetes da API
  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const response = await api.get('/polls');
      if (response.data.success) {
        setPolls(response.data.polls);
      }
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error);
      // Inicializar com array vazio em caso de erro
      setPolls([]);
    }
  };


  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 4) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const createPoll = async () => {
    if (!pollTitle.trim()) {
      alert('Por favor, informe o título da pesquisa');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Adicione pelo menos 2 opções válidas');
      return;
    }

    try {
      const response = await api.post('/polls', {
        title: pollTitle,
        options: validOptions
      });

      if (response.data.success) {
        const newPoll = response.data.poll;
        setPolls(prev => [...prev, newPoll]);
        setPollTitle('');
        setOptions(['', '', '', '']);
        setCurrentPoll(newPoll);
      } else {
        alert('Erro ao criar pesquisa: ' + response.data.error);
      }
    } catch (error) {
      console.error('Erro ao criar pesquisa:', error);
      alert('Erro ao criar pesquisa');
    }
  };

  const togglePollStatus = async (pollId: string) => {
    try {
      const response = await api.patch(`/polls/${pollId}/status`, {
        isActive: !currentPoll?.isActive
      });

      if (response.data.success) {
        const updatedPolls = polls.map(poll => {
          if (poll.id === pollId) {
            const updatedPoll = {
              ...poll,
              isActive: !poll.isActive
            };
            
            // Atualizar o estado atual da enquete
            if (currentPoll?.id === pollId) {
              setCurrentPoll(updatedPoll);
            }
            
            return updatedPoll;
          }
          return poll;
        });
        
        setPolls(updatedPolls);
      } else {
        alert('Erro ao atualizar status: ' + response.data.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };


  const getPollLink = (pollId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/poll/${pollId}`;
  };

  const copyLink = (pollId: string) => {
    const link = getPollLink(pollId);
    navigator.clipboard.writeText(link);
    alert('Link copiado para a área de transferência!');
  };

  const loadResults = async (pollId: string) => {
    try {
      const response = await api.get(`/polls/${pollId}/results`);
      if (response.data.success) {
        return response.data.results;
      }
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
    }
    return null;
  };

  const totalVotes = currentPoll?.options.reduce((sum, option) => sum + option.votes, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Painel de Criação */}
      {!currentPoll && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Nova Pesquisa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título da Pesquisa</Label>
                <Input
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Digite o título da pesquisa..."
                />
              </div>
              
              <div>
                <Label>Opções de Votação</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Opção ${index + 1}...`}
                      />
                      {options.length > 4 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="h-8"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  Adicionar Opção
                </Button>
              </div>
              
              <Button onClick={createPoll} className="w-full">
                Criar Pesquisa
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Painel de Gerenciamento */}
      {currentPoll && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{currentPoll.title}</CardTitle>
                <Badge variant={currentPoll.isActive ? "default" : "secondary"}>
                  {currentPoll.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => togglePollStatus(currentPoll.id)}
                  variant={currentPoll.isActive ? "outline" : "default"}
                >
                  {currentPoll.isActive ? "Encerrar" : "Iniciar"} Votação
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => copyLink(currentPoll.id)}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowResults(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resultados
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPoll(null)}
                >
                  Nova Pesquisa
                </Button>
              </div>
              
              {currentPoll.isActive && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Link para votação: {getPollLink(currentPoll.id)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Resultados */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados da Pesquisa</DialogTitle>
          </DialogHeader>
          
          {currentPoll && (
            <div className="space-y-4">
              <h3 className="font-semibold">{currentPoll.title}</h3>
              <div className="text-sm text-gray-600">
                Total de votos: {totalVotes}
              </div>
              
              {currentPoll.options.map((option, index) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Opção {index + 1}: {option.text}</span>
                    <span className="text-sm text-gray-600">
                      {option.votes} voto{option.votes !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {option.votes > 0 && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: totalVotes > 0 ? `${(option.votes / totalVotes) * 100}%` : '0%'
                          }}
                        />
                      </div>
                      {option.voters.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-xs">
                          {option.voters.map((voter, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {voter}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Página de Votação (simulada para demonstração) */}
      {currentPoll && currentPoll.isActive && (
        <VotingPage poll={currentPoll} />
      )}
    </div>
  );
}

// Componente de Página de Votação
function VotingPage({ poll }: { poll: PollData }) {
  const [voterName, setVoterName] = useState('');
 const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingError, setVotingError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!voterName.trim()) {
      alert('Por favor, informe seu nome');
      return;
    }
    if (!selectedOption) {
      alert('Selecione uma opção para votar');
      return;
    }

    try {
      const response = await api.post(`/polls/${poll.id}/vote`, {
        optionId: selectedOption,
        studentName: voterName.trim()
      });

      if (response.data.success) {
        setHasVoted(true);
        setVotingError(null);
      } else {
        setVotingError(response.data.error || 'Erro ao registrar voto');
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
      setVotingError('Erro ao registrar voto');
    }
  };

  if (hasVoted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-green-800">
          <Users className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Voto registrado com sucesso!</p>
          <p>Obrigado, {voterName}, por participar da pesquisa!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{poll.title}</h3>
      
      {votingError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
          {votingError}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <Label>Seu Nome</Label>
          <Input
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Digite seu nome..."
            disabled={hasVoted}
          />
        </div>
        
        <div>
          <Label>Selecione sua opção</Label>
          <div className="space-y-2">
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
          onClick={handleVote}
          disabled={!voterName.trim() || !selectedOption}
          className="w-full"
        >
          Registrar Voto
        </Button>
      </div>
    </div>
  );
}
