import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentsByGrade } from '@/services/studentService';

const GRADES = ['1º Ano', '2º Ano', '3º Ano'];

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_registration: string;
  grade: string;
}

export default function SorteadorEquipes() {
  const [grade, setGrade] = useState<string>('');
  const [teamCount, setTeamCount] = useState<number>(2);
  const [students, setStudents] = useState<Student[]>([]);
  const [leaders, setLeaders] = useState<{ [team: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<{ leader: Student | null; members: Student[] }[]>([]);
  const [sorted, setSorted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sortError, setSortError] = useState<string | null>(null);

  useEffect(() => {
    if (grade) {
      setLoading(true);
      getStudentsByGrade(grade)
        .then((data) => {
          setStudents(data);
          setLeaders({});
          setTeams([]);
          setSorted(false);
          setError(null);
        })
        .catch(() => {
          setStudents([]);
          setLeaders({});
          setTeams([]);
          setSorted(false);
          setError('Erro ao buscar alunos da série.');
        })
        .finally(() => setLoading(false));
    } else {
      setStudents([]);
      setLeaders({});
      setTeams([]);
      setSorted(false);
    }
  }, [grade]);
  // Função para sortear alunos para equipes
  function sortTeams() {
    setSortError(null);
    if (!grade || students.length === 0) {
      setSortError('Selecione a série e aguarde o carregamento dos alunos.');
      return;
    }
    if (teamCount < 2 || teamCount > students.length) {
      setSortError('Quantidade de equipes inválida.');
      return;
    }
    // Garantir que todos os líderes foram escolhidos e são diferentes
    const leaderIds = Object.values(leaders);
    if (leaderIds.length !== teamCount || new Set(leaderIds).size !== teamCount) {
      setSortError('Escolha um líder diferente para cada equipe.');
      return;
    }
    // Separar líderes dos demais alunos
    const leaderStudents = leaderIds.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];
    const otherStudents = students.filter(s => !leaderIds.includes(s.id));
    // Embaralhar alunos restantes
    const shuffled = [...otherStudents].sort(() => Math.random() - 0.5);
    // Distribuir alunos nas equipes
    const newTeams: { leader: Student | null; members: Student[] }[] = leaderStudents.map(leader => ({ leader, members: [] }));
    shuffled.forEach((student, idx) => {
      newTeams[idx % teamCount].members.push(student);
    });
    setTeams(newTeams);
    setSorted(true);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Sorteador de Equipes</h2>
      </div>
      <div className="space-y-4">
        <p>Selecione a série, defina a quantidade de equipes e escolha um líder para cada equipe. Em seguida, sorteie os alunos para preencher as equipes.</p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Série</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a série" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium">Quantidade de equipes</label>
            <Input
              type="number"
              min={2}
              max={students.length > 0 ? students.length : 10}
              value={teamCount}
              onChange={e => setTeamCount(Math.max(2, Number(e.target.value)))}
              disabled={!grade || students.length === 0}
            />
          </div>
        </div>

        {loading && <p>Carregando alunos...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {grade && students.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Escolha um líder para cada equipe:</h3>
            {[...Array(teamCount)].map((_, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <span className="font-medium">Equipe {idx + 1}:</span>
                <Select
                  value={leaders[idx] || ''}
                  onValueChange={val => setLeaders(l => ({ ...l, [idx]: val }))}
                  disabled={sorted}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione o líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {!sorted && (
              <Button className="mt-4" onClick={sortTeams} disabled={loading || students.length === 0}>
                Sortear alunos para equipes
              </Button>
            )}
            {sortError && <p className="text-red-500">{sortError}</p>}
            {sorted && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Equipes sorteadas:</h3>
                  <Button size="sm" variant={editMode ? 'secondary' : 'outline'} onClick={() => setEditMode(e => !e)}>
                    {editMode ? 'Concluir edição' : 'Editar equipes'}
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {teams.map((team, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="font-bold mb-2">Equipe {idx + 1}</div>
                      <div><span className="font-medium">Líder:</span> {team.leader?.full_name}</div>
                      <div className="mt-2">
                        <span className="font-medium">Membros:</span>
                        <ul className="list-disc ml-6">
                          {team.members.map(m => (
                            <li key={m.id} className="flex items-center gap-2">
                              {m.full_name}
                              {editMode && (
                                <Button size="xs" variant="destructive" onClick={() => {
                                  setTeams(ts => ts.map((t, tIdx) => tIdx === idx ? { ...t, members: t.members.filter(mem => mem.id !== m.id) } : t));
                                }}>Remover</Button>
                              )}
                            </li>
                          ))}
                        </ul>
                        {editMode && (
                          <div className="mt-2">
                            <label className="block text-xs mb-1">Adicionar aluno:</label>
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value=""
                              onChange={e => {
                                const studentId = e.target.value;
                                if (!studentId) return;
                                const student = students.find(s => s.id === studentId);
                                if (!student) return;
                                // Remover de outra equipe se já estiver
                                setTeams(ts => ts.map((t, tIdx) => {
                                  if (tIdx === idx) return { ...t, members: [...t.members, student] };
                                  return { ...t, members: t.members.filter(mem => mem.id !== studentId) };
                                }));
                              }}
                            >
                              <option value="">Selecione um aluno</option>
                              {students.filter(s =>
                                s.id !== team.leader?.id &&
                                !team.members.some(m => m.id === s.id) &&
                                !teams.some((t, tIdx) => tIdx !== idx && t.members.some(m => m.id === s.id))
                              ).map(s => (
                                <option key={s.id} value={s.id}>{s.full_name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
