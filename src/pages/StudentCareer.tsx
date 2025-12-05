import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { careerService, type CareerProfile } from '@/services/careerService';
import {
    Briefcase,
    Upload,
    Linkedin,
    Github,
    Globe,
    Save,
    ArrowLeft,
    FileText,
    Eye,
    Share2,
    X,
    Plus
} from 'lucide-react';

export default function StudentCareer() {
    const { user, isStudent } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<CareerProfile | null>(null);

    // Form states
    const [bio, setBio] = useState('');
    const [title, setTitle] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && isStudent) {
            loadProfile();
        }
    }, [user, isStudent]);

    const loadProfile = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await careerService.getProfile(user.id);
            setProfile(data);

            // Init form
            setBio(data.bio || '');
            setTitle(data.title || '');
            setLinkedin(data.linkedin_url || '');
            setGithub(data.github_url || '');
            setPortfolio(data.portfolio_url || '');
            setIsPublic(data.is_public);
            setIsAvailable(data.is_available);
            setSkills(data.skills || []);
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível carregar seu perfil de carreira.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            setSaving(true);
            const updatedData = {
                bio,
                title,
                linkedin_url: linkedin,
                github_url: github,
                portfolio_url: portfolio,
                is_public: isPublic,
                is_available: isAvailable,
                skills
            };

            const result = await careerService.updateProfile(user.id, updatedData);
            setProfile(result);

            toast({
                title: "Sucesso!",
                description: "Seu perfil profissional foi atualizado.",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao salvar alterações.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.type !== 'application/pdf') {
            toast({
                title: "Formato inválido",
                description: "Por favor, envie apenas arquivos PDF.",
                variant: "destructive"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: "Arquivo muito grande",
                description: "O tamanho máximo permitido é 5MB.",
                variant: "destructive"
            });
            return;
        }

        try {
            setUploading(true);
            const url = await careerService.uploadResume(user.id, file);

            // Update local state immediately for better UX
            setProfile(prev => prev ? ({ ...prev, resume_url: url }) : null);

            toast({
                title: "Currículo Enviado!",
                description: "Seu currículo foi anexado ao seu perfil com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro no upload",
                description: "Não foi possível enviar o arquivo. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/student')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Minha Carreira
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Professional Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Profissionais</CardTitle>
                                <CardDescription>
                                    Destaque suas qualidades para potenciais empregadores
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título Profissional</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ex: Desenvolvedor Front-end Junior"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Uma frase curta que resume seu objetivo.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Resumo (Bio)</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Conte um pouco sobre você, seus interesses e objetivos de carreira..."
                                        className="min-h-[120px]"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Habilidades</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {skills.map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1">
                                                {skill}
                                                <button onClick={() => handleRemoveSkill(skill)} className="ml-1 hover:text-destructive">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Adicionar habilidade..."
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="max-w-[200px]"
                                        />
                                        <Button variant="outline" size="icon" onClick={handleAddSkill}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Links Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Links e Portfólio</CardTitle>
                                <CardDescription>Onde as empresas podem ver seu trabalho?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
                                        </Label>
                                        <Input
                                            placeholder="https://linkedin.com/in/seu-perfil"
                                            value={linkedin}
                                            onChange={(e) => setLinkedin(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Github className="w-4 h-4" /> GitHub
                                        </Label>
                                        <Input
                                            placeholder="https://github.com/seu-usuario"
                                            value={github}
                                            onChange={(e) => setGithub(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-green-600" /> Portfólio / Site Pessoal
                                        </Label>
                                        <Input
                                            placeholder="https://seu-portfolio.com"
                                            value={portfolio}
                                            onChange={(e) => setPortfolio(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column - Resume & Visibility */}
                    <div className="space-y-6">

                        {/* Resume Upload Card */}
                        <Card className={profile?.resume_url ? "border-green-200 bg-green-50/20" : ""}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    Currículo em PDF
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {profile?.resume_url ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
                                            <FileText className="w-8 h-8 text-red-500 mr-3" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">Currículo Cadastrado</p>
                                                <a
                                                    href={profile.resume_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Visualizar arquivo atual
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                                Substituir Currículo
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Clique para enviar seu currículo</p>
                                            <p className="text-xs text-muted-foreground mt-1">Apenas arquivos PDF (Máx. 5MB)</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                />

                                {uploading && (
                                    <div className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
                                        Enviando arquivo...
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Visibility Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-blue-500" />
                                    Visibilidade
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Perfil Público</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Permitir que empresas vejam seu perfil no Mural de Talentos.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isPublic}
                                        onCheckedChange={setIsPublic}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Buscando Oportunidades</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Sinalize que você está aberto a propostas de estágio ou emprego.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isAvailable}
                                        onCheckedChange={setIsAvailable}
                                    />
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Eye className="w-4 h-4" /> Visualizações do perfil
                                        </span>
                                        <span className="font-bold">{profile?.views || 0}</span>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                        {/* Share Card */}
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-primary">Compartilhar Perfil</p>
                                    <p className="text-xs text-muted-foreground">Copie o link do seu perfil público</p>
                                </div>
                                <Button size="icon" variant="secondary" onClick={() => {
                                    toast({ description: "Link copiado para a área de transferência!" });
                                }}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
