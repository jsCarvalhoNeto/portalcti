import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Code2,
  Send,
  Trash2,
  Award,
  ArrowLeft,
  BookOpen,
  Eye,
  Edit3,
  RefreshCw,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import subjectLessonService, { SubjectLesson } from '@/services/subjectLessonService';
import subjectQaService, {
  SubjectQuestion,
  SubjectQuestionAnswer,
} from '@/services/subjectQaService';
import { FORUM_SOLUTION_POINTS } from '@/services/gamificationService';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';
import { toast } from 'sonner';

interface SubjectQaForumPanelProps {
  subjectId: number | string;
  subjectName?: string;
  canManage?: boolean;
}

const CODE_TEMPLATES: Record<string, string> = {
  javascript: '\n```javascript\n// Cole seu código aqui\n\n```\n',
  html: '\n```html\n<!-- Cole seu HTML aqui -->\n\n```\n',
  css: '\n```css\n/* Cole seu CSS aqui */\n\n```\n',
  python: '\n```python\n# Cole seu código Python aqui\n\n```\n',
  sql: '\n```sql\n-- Cole sua consulta SQL aqui\n\n```\n',
};

export default function SubjectQaForumPanel({
  subjectId,
  subjectName = 'Disciplina',
  canManage = false,
}: SubjectQaForumPanelProps) {
  const { user, isTeacher, isAdmin } = useAuth();
  const isStaff = Boolean(canManage || isTeacher || isAdmin);

  const [questions, setQuestions] = useState<SubjectQuestion[]>([]);
  const [lessons, setLessons] = useState<SubjectLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [lessonFilter, setLessonFilter] = useState<string>('all');

  // Nova dúvida
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLessonId, setNewLessonId] = useState<string>('none');
  const [newContent, setNewContent] = useState('');
  const [newPreviewMode, setNewPreviewMode] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Dúvida selecionada & Respostas
  const [selectedQuestion, setSelectedQuestion] = useState<SubjectQuestion | null>(null);
  const [answers, setAnswers] = useState<SubjectQuestionAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyPreviewMode, setReplyPreviewMode] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [markingSolutionId, setMarkingSolutionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qList, lList] = await Promise.all([
        subjectQaService.getQuestionsBySubject(subjectId),
        subjectLessonService.getBySubject(subjectId),
      ]);
      setQuestions(qList);
      setLessons(lList);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao carregar o mural de dúvidas.');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAnswers = useCallback(async (questionId: string) => {
    setLoadingAnswers(true);
    try {
      const list = await subjectQaService.getAnswersByQuestion(questionId);
      setAnswers(list);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao carregar respostas.');
    } finally {
      setLoadingAnswers(false);
    }
  }, []);

  const handleOpenQuestion = (q: SubjectQuestion) => {
    setSelectedQuestion(q);
    setReplyContent('');
    setReplyPreviewMode(false);
    loadAnswers(q.id);
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter === 'open' && q.is_resolved) return false;
      if (statusFilter === 'resolved' && !q.is_resolved) return false;
      if (lessonFilter !== 'all' && String(q.lesson_id || '') !== lessonFilter) return false;
      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(s);
        const matchContent = q.content.toLowerCase().includes(s);
        const matchAuthor = (q.author_name || '').toLowerCase().includes(s);
        if (!matchTitle && !matchContent && !matchAuthor) return false;
      }
      return true;
    });
  }, [questions, statusFilter, lessonFilter, searchQuery]);

  const handleInsertCodeBlock = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    lang: string
  ) => {
    const snippet = CODE_TEMPLATES[lang] || CODE_TEMPLATES.javascript;
    setter((prev) => `${prev}${snippet}`);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Faça login para publicar uma dúvida.');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Preencha o título e a descrição da dúvida.');
      return;
    }

    setSubmittingQuestion(true);
    try {
      const linkedLesson =
        newLessonId !== 'none'
          ? lessons.find((l) => String(l.id) === newLessonId)
          : undefined;

      await subjectQaService.createQuestion({
        subjectId,
        authorId: user.id,
        title: newTitle,
        content: newContent,
        lessonId: linkedLesson ? String(linkedLesson.id) : null,
        lessonTitle: linkedLesson ? linkedLesson.title : null,
      });

      toast.success('Dúvida publicada no mural!');
      setNewTitle('');
      setNewContent('');
      setNewLessonId('none');
      setNewPreviewMode(false);
      setIsNewModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao publicar dúvida.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleCreateAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !user?.id) return;
    if (!replyContent.trim()) {
      toast.error('Escreva sua resposta antes de enviar.');
      return;
    }

    setSubmittingReply(true);
    try {
      await subjectQaService.createAnswer({
        questionId: selectedQuestion.id,
        authorId: user.id,
        content: replyContent,
        isTeacherAnswer: isStaff,
      });

      toast.success('Resposta enviada!');
      setReplyContent('');
      setReplyPreviewMode(false);
      await loadAnswers(selectedQuestion.id);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? { ...q, answers_count: (q.answers_count || 0) + 1 }
            : q
        )
      );
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar resposta.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMarkAsSolution = async (answer: SubjectQuestionAnswer) => {
    if (!selectedQuestion || !isStaff) return;
    setMarkingSolutionId(answer.id);
    try {
      const res = await subjectQaService.markAnswerAsSolution(selectedQuestion, answer);
      const updatedQuestion: SubjectQuestion = {
        ...selectedQuestion,
        is_resolved: true,
        accepted_answer_id: answer.id,
      };
      setSelectedQuestion(updatedQuestion);
      setQuestions((prev) =>
        prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
      );
      await loadAnswers(selectedQuestion.id);

      if (res.pointsAwarded > 0) {
        toast.success(
          `Resposta marcada como Solução! ${answer.author_name || 'O aluno'} ganhou +${res.pointsAwarded} pontos na gamificação.`
        );
      } else {
        toast.success('Resposta marcada como Solução oficial!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao marcar solução.');
    } finally {
      setMarkingSolutionId(null);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Deseja excluir esta dúvida e todas as suas respostas?')) return;
    try {
      await subjectQaService.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(null);
      }
      toast.success('Dúvida excluída.');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir dúvida.');
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!selectedQuestion) return;
    if (!window.confirm('Deseja excluir esta resposta?')) return;
    try {
      await subjectQaService.deleteAnswer(answerId);
      setAnswers((prev) => prev.filter((a) => a.id !== answerId));
      toast.success('Resposta excluída.');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir resposta.');
    }
  };

  const renderMarkdown = (text: string) => {
    return sanitizeHtml(markdownToHtml(text || ''));
  };

  // Visualização de Tópico Individual
  if (selectedQuestion) {
    const canDeleteQ = isStaff || selectedQuestion.author_id === user?.id;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedQuestion(null)}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Mural de Dúvidas
          </Button>
          {canDeleteQ && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => handleDeleteQuestion(selectedQuestion.id)}
            >
              <Trash2 className="w-4 h-4" />
              Excluir Dúvida
            </Button>
          )}
        </div>

        {/* Pergunta */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                variant={selectedQuestion.is_resolved ? 'default' : 'secondary'}
                className={
                  selectedQuestion.is_resolved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                }
              >
                {selectedQuestion.is_resolved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Resolvida
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Em Aberto
                  </>
                )}
              </Badge>

              {selectedQuestion.lesson_title && (
                <Badge variant="outline" className="gap-1">
                  <BookOpen className="w-3 h-3" />
                  {selectedQuestion.lesson_title}
                </Badge>
              )}
            </div>

            <CardTitle className="text-xl">{selectedQuestion.title}</CardTitle>
            <CardDescription>
              Postada por <strong>{selectedQuestion.author_name}</strong> em{' '}
              {new Date(selectedQuestion.created_at).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div
              className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedQuestion.content) }}
            />
          </CardContent>
        </Card>

        {/* Lista de Respostas */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Respostas ({answers.length})
          </h3>

          {loadingAnswers ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Carregando respostas...
            </div>
          ) : answers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma resposta ainda. Ajude seu colega respondendo abaixo — se sua resposta for marcada como <strong>Solução</strong> pelo professor, você ganha <strong>+{FORUM_SOLUTION_POINTS} pontos</strong> na gamificação!
              </CardContent>
            </Card>
          ) : (
            answers.map((ans) => {
              const canDeleteA = isStaff || ans.author_id === user?.id;
              const isEligibleForPoints =
                !ans.is_teacher_answer &&
                ans.author_role !== 'teacher' &&
                ans.author_role !== 'admin' &&
                ans.author_id !== selectedQuestion.author_id;

              return (
                <Card
                  key={ans.id}
                  className={
                    ans.is_solution
                      ? 'border-2 border-emerald-500/60 bg-emerald-500/5'
                      : ''
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{ans.author_name}</span>
                        {(ans.is_teacher_answer || ans.author_role === 'teacher' || ans.author_role === 'admin') && (
                          <Badge className="bg-indigo-600 text-white text-[10px]">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            Professor
                          </Badge>
                        )}
                        {ans.is_solution && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Solução Oficial
                          </Badge>
                        )}
                        {ans.is_solution && ans.points_awarded > 0 && (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px]">
                            <Sparkles className="w-3 h-3 mr-1" />+{ans.points_awarded} pts
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(ans.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isStaff && !ans.is_solution && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            disabled={markingSolutionId === ans.id}
                            onClick={() => handleMarkAsSolution(ans)}
                          >
                            <Award className="w-3.5 h-3.5 mr-1" />
                            {markingSolutionId === ans.id
                              ? 'Salvando...'
                              : isEligibleForPoints
                              ? `Marcar Solução (+${FORUM_SOLUTION_POINTS} pts)`
                              : 'Marcar como Solução'}
                          </Button>
                        )}
                        {canDeleteA && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAnswer(ans.id)}
                            title="Excluir resposta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div
                      className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(ans.content) }}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Formulário de Resposta */}
        {user && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Responder Dúvida</CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleInsertCodeBlock(setReplyContent, 'javascript')}
                  >
                    <Code2 className="w-3.5 h-3.5 mr-1" />
                    + Código
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={replyPreviewMode ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => setReplyPreviewMode((v) => !v)}
                  >
                    {replyPreviewMode ? (
                      <>
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Pré-visualizar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAnswer} className="space-y-3">
                {replyPreviewMode ? (
                  <div className="min-h-[120px] p-4 rounded-lg border bg-muted/20">
                    <div
                      className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(replyContent || '_Nada para pré-visualizar._'),
                      }}
                    />
                  </div>
                ) : (
                  <Textarea
                    rows={5}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escreva sua explicação usando Markdown ou blocos de código (```js ... ```)..."
                    required
                  />
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingReply || !replyContent.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {submittingReply ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Lista Principal do Mural de Dúvidas
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Mural de Dúvidas — {subjectName}
              </CardTitle>
              <CardDescription>
                Tire dúvidas com código em Markdown fora do horário de aula. Colegas que tiverem a resposta marcada como{' '}
                <strong>Solução</strong> pelo professor ganham <strong>+{FORUM_SOLUTION_POINTS} pts</strong> na gamificação!
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {user && (
                <Button size="sm" onClick={() => setIsNewModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nova Dúvida
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar dúvida por título, código ou autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="md:col-span-3">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'open' | 'resolved')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as dúvidas</SelectItem>
                  <SelectItem value="open">Em aberto</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4">
              <Select value={lessonFilter} onValueChange={setLessonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por aula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as aulas</SelectItem>
                  {lessons.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Tópicos */}
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando dúvidas...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-12 text-center border rounded-xl border-dashed text-muted-foreground space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
              <p className="font-medium text-sm">Nenhuma dúvida encontrada</p>
              <p className="text-xs">
                Seja o primeiro a postar uma dúvida sobre a disciplina ou compartilhe um trecho de código!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleOpenQuestion(q)}
                  className="w-full text-left p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={q.is_resolved ? 'default' : 'secondary'}
                        className={
                          q.is_resolved
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]'
                        }
                      >
                        {q.is_resolved ? 'Resolvida' : 'Em Aberto'}
                      </Badge>
                      {q.lesson_title && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <BookOpen className="w-3 h-3" />
                          {q.lesson_title}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-base truncate">{q.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Por <strong>{q.author_name}</strong> •{' '}
                      {new Date(q.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span>
                      <strong>{q.answers_count ?? 0}</strong>{' '}
                      {q.answers_count === 1 ? 'resposta' : 'respostas'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Dúvida */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Nova Dúvida</DialogTitle>
            <DialogDescription>
              Descreva sua dúvida e use blocos de código Markdown se precisar mostrar algum erro ou trecho de código.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateQuestion} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="qa-title">Título da Dúvida</Label>
              <Input
                id="qa-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Erro de CORS ao chamar API no React"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Aula Relacionada (Opcional)</Label>
              <Select value={newLessonId} onValueChange={setNewLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Geral da disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geral da disciplina</SelectItem>
                  {lessons.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="qa-content">Descrição e Código (Markdown)</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['javascript', 'html', 'python', 'sql'] as const).map((lang) => (
                    <Button
                      key={lang}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => handleInsertCodeBlock(setNewContent, lang)}
                    >
                      + {lang.toUpperCase()}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={newPreviewMode ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setNewPreviewMode((v) => !v)}
                  >
                    {newPreviewMode ? 'Editar' : 'Preview'}
                  </Button>
                </div>
              </div>

              {newPreviewMode ? (
                <div className="min-h-[160px] p-4 rounded-lg border bg-muted/20">
                  <div
                    className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(newContent || '_Nada para pré-visualizar._'),
                    }}
                  />
                </div>
              ) : (
                <Textarea
                  id="qa-content"
                  rows={7}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={'Explique o que você tentou fazer...\n\n```javascript\nconst exemplo = "código aqui";\n```'}
                  required
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingQuestion}>
                {submittingQuestion ? 'Publicando...' : 'Publicar Dúvida'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
