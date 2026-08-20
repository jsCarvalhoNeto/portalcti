import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import educationalGameService, { EducationalGame, EducationalGameAccessMode, SaveEducationalGameData } from '@/services/educationalGameService';
import EducationalGamePlayer from './EducationalGamePlayer';
import { MAZE_GAME_DESCRIPTION, MAZE_GAME_TEMPLATE, MAZE_GAME_TITLE } from './educationalMazeGameTemplate';
import { Check, Copy, Edit, ExternalLink, Gamepad2, Loader2, Play, Plus, QrCode, Trash2, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const EMPTY_FORM: SaveEducationalGameData = {
  title: '',
  description: '',
  code_content: '',
  access_mode: 'classroom',
  is_published: false
};

const EXAMPLE_GAME = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><style>
    body{font-family:system-ui;margin:0;min-height:100vh;display:grid;place-items:center;background:#312e81;color:white}
    main{max-width:580px;padding:36px;text-align:center;background:#1e1b4b;border-radius:24px;box-shadow:0 20px 55px #0007}
    button{padding:12px 20px;border:0;border-radius:10px;background:#a5b4fc;color:#1e1b4b;font-weight:bold;cursor:pointer}
  </style></head>
  <body><main><h1>⚡ Quiz Relâmpago</h1><p>Qual linguagem é executada diretamente pelo navegador?</p>
  <button onclick="alert('Correto! JavaScript é executado pelo navegador.')">JavaScript</button></main></body>
</html>`;

export default function EducationalGamesUtility() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState<EducationalGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGame, setEditingGame] = useState<EducationalGame | null>(null);
  const [form, setForm] = useState<SaveEducationalGameData>(EMPTY_FORM);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [gameToShare, setGameToShare] = useState<EducationalGame | null>(null);
  const [gameToPlay, setGameToPlay] = useState<EducationalGame | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(
    () => gameToShare ? `${window.location.origin}/jogos/${gameToShare.share_code}` : '',
    [gameToShare]
  );

  const loadGames = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setGames(await educationalGameService.getByTeacher(user.id));
    } catch (error) {
      console.error('Erro ao carregar jogos educativos:', error);
      toast({ title: 'Não foi possível carregar os jogos', description: 'Verifique se a migração do banco foi aplicada.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadGames(); }, [user]);

  const openCreate = () => {
    setEditingGame(null);
    setForm(EMPTY_FORM);
    setIsEditorOpen(true);
  };

  const loadMazeGame = () => {
    setEditingGame(null);
    setForm({ title: MAZE_GAME_TITLE, description: MAZE_GAME_DESCRIPTION, code_content: MAZE_GAME_TEMPLATE, access_mode: 'online', is_published: false });
    setIsEditorOpen(true);
  };

  const openEdit = (game: EducationalGame) => {
    setEditingGame(game);
    setForm({
      title: game.title,
      description: game.description || '',
      code_content: game.code_content,
      access_mode: game.access_mode,
      is_published: game.is_published
    });
    setIsEditorOpen(true);
  };

  const saveGame = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.code_content.trim()) {
      toast({ title: 'Preencha o nome e o código do jogo.', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      const saved = editingGame
        ? await educationalGameService.update(editingGame.id, user.id, form)
        : await educationalGameService.create(user.id, form);
      setGames(current => editingGame
        ? current.map(game => game.id === saved.id ? saved : game)
        : [saved, ...current]);
      setIsEditorOpen(false);
      toast({ title: editingGame ? 'Jogo atualizado' : 'Jogo criado', description: saved.is_published ? 'O link já está disponível para compartilhar.' : 'O jogo foi salvo como rascunho.' });
    } catch (error) {
      console.error('Erro ao salvar jogo educativo:', error);
      toast({ title: 'Não foi possível salvar o jogo', description: 'Confirme se a migração do banco foi aplicada.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGame = async (game: EducationalGame) => {
    if (!user || !window.confirm(`Excluir o jogo “${game.title}”?`)) return;
    try {
      await educationalGameService.remove(game.id, user.id);
      setGames(current => current.filter(item => item.id !== game.id));
      toast({ title: 'Jogo excluído' });
    } catch (error) {
      console.error('Erro ao excluir jogo educativo:', error);
      toast({ title: 'Não foi possível excluir o jogo', variant: 'destructive' });
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Não foi possível copiar o link', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-violet-200 dark:border-violet-900/60 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-white/10"><Gamepad2 className="w-7 h-7" /></div>
              <div>
                <CardTitle className="text-xl text-white">Jogos Educativos</CardTitle>
                <CardDescription className="text-violet-100">Crie jogos HTML interativos, projete-os em sala ou compartilhe o acesso online.</CardDescription>
              </div>
            </div>
            <div className="flex gap-2"><Button variant="outline" onClick={loadMazeGame} className="bg-violet-100 text-indigo-900 hover:bg-white gap-2"><Gamepad2 className="w-4 h-4" /> Carregar labirinto</Button><Button onClick={openCreate} className="bg-white text-indigo-900 hover:bg-violet-100 gap-2"><Plus className="w-4 h-4" /> Novo jogo educativo</Button></div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Carregando jogos...</div>
      ) : games.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-14 text-center">
          <Gamepad2 className="w-10 h-10 mx-auto mb-3 text-violet-500" />
          <h3 className="font-bold text-lg">Seu catálogo de jogos está vazio</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Crie um jogo e publique o QR Code para a turma.</p>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Criar primeiro jogo</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {games.map(game => (
            <Card key={game.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><Gamepad2 className="w-5 h-5" /></div>
                  <div className="flex gap-1">
                    <Badge variant={game.is_published ? 'default' : 'secondary'}>{game.is_published ? 'Publicado' : 'Rascunho'}</Badge>
                    <Badge variant="outline">{game.access_mode === 'online' ? 'Online' : 'Sala'}</Badge>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{game.title}</CardTitle>
                {game.description && <CardDescription className="line-clamp-2">{game.description}</CardDescription>}
              </CardHeader>
              <CardContent className="mt-auto space-y-2">
                <Button className="w-full gap-2" onClick={() => setGameToPlay(game)}><Play className="w-4 h-4" /> Abrir jogo</Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(game)} title="Editar"><Edit className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" disabled={!game.is_published} onClick={() => { setCopied(false); setGameToShare(game); }} title="Compartilhar"><QrCode className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => void deleteGame(game)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingGame ? 'Editar jogo educativo' : 'Novo jogo educativo'}</DialogTitle><DialogDescription>O código será executado em um ambiente isolado no navegador do aluno.</DialogDescription></DialogHeader>
          <form onSubmit={saveGame} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="game-title">Nome do jogo *</Label><Input id="game-title" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Ex.: Batalha das Portas Lógicas" /></div>
              <div className="space-y-2"><Label>Modo de uso</Label><div className="grid grid-cols-2 gap-2"><Button type="button" variant={form.access_mode === 'classroom' ? 'default' : 'outline'} onClick={() => setForm(current => ({ ...current, access_mode: 'classroom' }))}><Users className="w-4 h-4 mr-1" /> Sala</Button><Button type="button" variant={form.access_mode === 'online' ? 'default' : 'outline'} onClick={() => setForm(current => ({ ...current, access_mode: 'online' }))}><ExternalLink className="w-4 h-4 mr-1" /> Online</Button></div></div>
            </div>
            <div className="space-y-2"><Label htmlFor="game-description">Descrição e orientações</Label><Textarea id="game-description" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows={2} placeholder="Explique o objetivo e as regras para os alunos." /></div>
            <div className="space-y-2"><div className="flex justify-between gap-3"><Label htmlFor="game-code">Código do jogo (HTML, CSS e JavaScript) *</Label><Button type="button" size="sm" variant="outline" onClick={() => setForm(current => ({ ...current, code_content: current.code_content || EXAMPLE_GAME }))}>Carregar exemplo</Button></div><Textarea id="game-code" value={form.code_content} onChange={event => setForm(current => ({ ...current, code_content: event.target.value }))} rows={15} spellCheck={false} className="font-mono text-xs bg-slate-950 text-emerald-300 border-slate-800" placeholder="<!doctype html>..." /></div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"><div><Label htmlFor="game-published">Publicar para alunos</Label><p className="text-xs text-muted-foreground">Ao publicar, será gerado um link e QR Code de acesso.</p></div><Switch id="game-published" checked={form.is_published} onCheckedChange={checked => setForm(current => ({ ...current, is_published: checked }))} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingGame ? 'Salvar alterações' : 'Criar jogo'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(gameToShare)} onOpenChange={open => !open && setGameToShare(null)}>
        <DialogContent className="max-w-md text-center"><DialogHeader><DialogTitle>Compartilhar jogo</DialogTitle><DialogDescription>{gameToShare?.title}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2"><div className="inline-block bg-white p-4 rounded-xl border"><QRCodeSVG value={shareUrl} size={210} level="H" /></div><p className="text-xs font-mono break-all text-muted-foreground">{shareUrl}</p></div>
          <DialogFooter className="sm:justify-center"><Button onClick={() => void copyShareUrl()} className="gap-2">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Link copiado' : 'Copiar link'}</Button><Button variant="outline" onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="w-4 h-4 mr-2" /> Abrir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(gameToPlay)} onOpenChange={open => !open && setGameToPlay(null)}>
        <DialogContent className="max-w-[96vw] w-[1300px] h-[90vh] p-0 overflow-hidden"><EducationalGamePlayer title={gameToPlay?.title || ''} code={gameToPlay?.code_content || ''} role="teacher" roomId={gameToPlay?.share_code} /></DialogContent>
      </Dialog>
    </div>
  );
}
