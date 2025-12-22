import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { careerService, type CareerProfile, type Education, type Project, type Language, type Certification, type Experience } from '@/services/careerService';
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
    Plus,
    User,
    Calendar,
    Camera,
    GraduationCap,
    Code,
    Languages,
    Award,
    Trash2,
    ExternalLink
} from 'lucide-react';

export default function StudentCareer() {
    const { user, isStudent } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<CareerProfile | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [bio, setBio] = useState('');
    const [title, setTitle] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isEmployed, setIsEmployed] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');

    // New Sections State
    const [education, setEducation] = useState<Education[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [experiences, setExperiences] = useState<Experience[]>([]);

    // Temporary states for new items
    const [newEducation, setNewEducation] = useState<Partial<Education>>({ status: 'Em andamento' });
    const [newProject, setNewProject] = useState<Partial<Project>>({ technologies: [] });
    const [newProjectTech, setNewProjectTech] = useState('');
    const [newLanguage, setNewLanguage] = useState<Partial<Language>>({ level: 'Básico' });
    const [newCertification, setNewCertification] = useState<Partial<Certification>>({});
    const [newExperience, setNewExperience] = useState<Partial<Experience>>({ is_current: false });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

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

            // Init form (Backend Data)
            setFullName(data.full_name || '');
            setBirthDate(data.birth_date ? data.birth_date.split('T')[0] : ''); // Format YYYY-MM-DD
            setBio(data.bio || '');
            setTitle(data.title || '');
            setLinkedin(data.linkedin_url || '');
            setGithub(data.github_url || '');
            setPortfolio(data.portfolio_url || '');
            setContactEmail(data.contact_email || '');
            setContactPhone(data.contact_phone || '');
            setContactPhone(data.contact_phone || '');
            setIsPublic(data.is_public);
            setIsAvailable(data.is_available);
            setIsEmployed(data.is_employed);
            setSkills(data.skills || []);

            // Init new sections (Backend Data)
            setEducation(data.education || []);
            setProjects(data.projects || []);
            setLanguages(data.languages || []);
            setCertifications(data.certifications || []);
            setExperiences(data.experiences || []);

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

            // Salvar dados completos na API
            const updatedData: Partial<CareerProfile> = {
                full_name: fullName,
                birth_date: birthDate,
                bio,
                title,
                linkedin_url: linkedin,
                github_url: github,
                portfolio_url: portfolio,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                is_public: isPublic,
                is_available: isAvailable,
                is_employed: isEmployed,
                skills,
                education,
                projects,
                experiences,
                languages,
                certifications
            };

            const result = await careerService.updateProfile(user.id, updatedData);
            setProfile(result);

            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado com sucesso.",
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

    // Função para gerar o link limpo
    const generateShareLink = () => {
        if (!user) return '';
        return `${window.location.origin}/talento/${user.id}`;
    };

    // --- Skills Helpers ---
    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleKeyDownSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    // --- Education Helpers ---
    const handleAddEducation = () => {
        if (newEducation.institution && newEducation.course) {
            setEducation([...education, newEducation as Education]);
            setNewEducation({ status: 'Em andamento', institution: '', course: '', completion_date: '' });
        }
    };

    const handleRemoveEducation = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    // --- Project Helpers ---
    const handleAddProject = () => {
        if (newProject.name) {
            setProjects([...projects, newProject as Project]);
            setNewProject({ technologies: [], name: '', description: '', link: '' });
        }
    };

    const handleRemoveProject = (index: number) => {
        setProjects(projects.filter((_, i) => i !== index));
    };

    const handleAddProjectTech = () => {
        if (newProjectTech.trim() && !newProject.technologies?.includes(newProjectTech.trim())) {
            setNewProject({
                ...newProject,
                technologies: [...(newProject.technologies || []), newProjectTech.trim()]
            });
            setNewProjectTech('');
        }
    };

    // --- Language Helpers ---
    const handleAddLanguage = () => {
        if (newLanguage.name) {
            setLanguages([...languages, newLanguage as Language]);
            setNewLanguage({ level: 'Básico', name: '' });
        }
    };

    const handleRemoveLanguage = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };

    // --- Certification Helpers ---
    const handleAddCertification = () => {
        if (newCertification.name) {
            setCertifications([...certifications, newCertification as Certification]);
            setNewCertification({ name: '', institution: '', year: '' });
        }
    };

    const handleRemoveCertification = (index: number) => {
        setCertifications(certifications.filter((_, i) => i !== index));
    };

    // --- Experience Helpers ---
    const handleAddExperience = () => {
        if (newExperience.company && newExperience.role) {
            setExperiences([...experiences, newExperience as Experience]);
            setNewExperience({ is_current: false, company: '', role: '', start_date: '', end_date: '', description: '' });
        }
    };

    const handleRemoveExperience = (index: number) => {
        setExperiences(experiences.filter((_, i) => i !== index));
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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validar tipo imagem
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Formato inválido",
                description: "Por favor, envie apenas arquivos de imagem (JPG, PNG).",
                variant: "destructive"
            });
            return;
        }

        try {
            setUploadingPhoto(true);
            const url = await careerService.uploadPhoto(user.id, file);
            setProfile(prev => prev ? ({ ...prev, photo_url: url }) : null);
            toast({
                title: "Foto Atualizada!",
                description: "Sua foto de perfil foi atualizada com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro no upload",
                description: "Não foi possível enviar a foto.",
                variant: "destructive"
            });
        } finally {
            setUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
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
                                    Crie sua identidade profissional.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Photo & Basic Info Row */}
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div
                                            className="w-32 h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative group"
                                            onClick={() => photoInputRef.current?.click()}
                                        >
                                            {profile?.photo_url ? (
                                                <img src={profile.photo_url} alt="Foto de Perfil" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-gray-400" />
                                            )}

                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>

                                            {uploadingPhoto && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">Foto 3x4</p>
                                        <input
                                            type="file"
                                            ref={photoInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>

                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullname">Nome Completo (Profissional)</Label>
                                            <Input
                                                id="fullname"
                                                placeholder="Seu nome como gostaria de ser chamado"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="birthdate">Data de Nascimento</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                                <Input
                                                    id="birthdate"
                                                    type="date"
                                                    className="pl-9"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Título / Objetivo Profissional</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ex: Estudante de Técnico em Informática | Foco em Front-end"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Uma frase curta que resume seu status atual e objetivo.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Resumo (Bio)</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Fale sobre sua paixão pela tecnologia, o que tem aprendido no curso, projetos que realizou e seus objetivos de carreira..."
                                        className="min-h-[120px]"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Habilidades Técnicas</Label>
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
                                            placeholder="Ex: React, Python, SQL..."
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={handleKeyDownSkill}
                                            className="max-w-[200px]"
                                        />
                                        <Button variant="outline" size="icon" onClick={handleAddSkill}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Education Section - CRITICAL for Students */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                                    Formação Acadêmica
                                </CardTitle>
                                <CardDescription>Seu curso técnico e escolaridade são seus principais diferenciais agora.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* List of Education */}
                                {education.map((edu, index) => (
                                    <div key={index} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="font-semibold">{edu.course}</h4>
                                            <p className="text-sm text-gray-600">{edu.institution}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">{edu.status}</Badge>
                                                <span className="text-xs text-muted-foreground">Conclusão: {edu.completion_date}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveEducation(index)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}



                                {/* Add New Education Form */}
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <h4 className="text-sm font-medium">Adicionar Formação</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Instituição (Ex: Escola Técnica...)"
                                            value={newEducation.institution || ''}
                                            onChange={e => setNewEducation({ ...newEducation, institution: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Curso (Ex: Técnica em Informática)"
                                            value={newEducation.course || ''}
                                            onChange={e => setNewEducation({ ...newEducation, course: e.target.value })}
                                        />
                                        <Select
                                            value={newEducation.status}
                                            onValueChange={(val: any) => setNewEducation({ ...newEducation, status: val })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Em andamento">Em andamento</SelectItem>
                                                <SelectItem value="Concluído">Concluído</SelectItem>
                                                <SelectItem value="Trancado">Trancado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="Prev. Formatura (Ex: Dez/2024)"
                                            value={newEducation.completion_date || ''}
                                            onChange={e => setNewEducation({ ...newEducation, completion_date: e.target.value })}
                                        />
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={handleAddEducation} className="w-full">
                                        <Plus className="w-4 h-4 mr-2" /> Adicionar Formação
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>



                        {/* Experience Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    Experiência Profissional
                                </CardTitle>
                                <CardDescription>Liste suas experiências de trabalho, estágios ou voluntariado.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {experiences.map((exp, index) => (
                                    <div key={index} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="font-semibold">{exp.role}</h4>
                                            <p className="text-sm font-medium text-gray-700">{exp.company}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{exp.start_date} - {exp.is_current ? 'Atualmente' : exp.end_date}</span>
                                            </div>
                                            {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveExperience(index)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <h4 className="text-sm font-medium">Adicionar Experiência</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Cargo (Ex: Desenvolvedor Jr)"
                                            value={newExperience.role || ''}
                                            onChange={e => setNewExperience({ ...newExperience, role: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Empresa"
                                            value={newExperience.company || ''}
                                            onChange={e => setNewExperience({ ...newExperience, company: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Data Início (Ex: Jan/2023)"
                                            value={newExperience.start_date || ''}
                                            onChange={e => setNewExperience({ ...newExperience, start_date: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Data Término (Deixe vazio se atual)"
                                            value={newExperience.end_date || ''}
                                            onChange={e => setNewExperience({ ...newExperience, end_date: e.target.value })}
                                            disabled={newExperience.is_current}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="current-job"
                                            checked={newExperience.is_current}
                                            onCheckedChange={(checked) => setNewExperience({ ...newExperience, is_current: checked, end_date: checked ? '' : newExperience.end_date })}
                                        />
                                        <Label htmlFor="current-job">Trabalho Atual</Label>
                                    </div>
                                    <Textarea
                                        placeholder="Descrição das atividades..."
                                        value={newExperience.description || ''}
                                        onChange={e => setNewExperience({ ...newExperience, description: e.target.value })}
                                    />
                                    <Button size="sm" variant="secondary" onClick={handleAddExperience} className="w-full">
                                        <Plus className="w-4 h-4 mr-2" /> Adicionar Experiência
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Projects Section - SHOWCASE */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="w-5 h-5 text-emerald-600" />
                                    Projetos de Destaque
                                </CardTitle>
                                <CardDescription>Mostre o que você sabe fazer. Adicione projetos de aula, TCC ou pessoais.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {projects.map((proj, index) => (
                                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold flex items-center gap-2">
                                                {proj.name}
                                                {proj.link && (
                                                    <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </h4>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveProject(index)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{proj.description}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {proj.technologies.map((tech, i) => (
                                                <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Add Project Form */}
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <h4 className="text-sm font-medium">Adicionar Projeto</h4>
                                    <Input
                                        placeholder="Nome do Projeto"
                                        value={newProject.name || ''}
                                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    />
                                    <Textarea
                                        placeholder="Descrição breve do que o projeto faz..."
                                        value={newProject.description || ''}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Link (GitHub ou Deploy) - Opcional"
                                        value={newProject.link || ''}
                                        onChange={e => setNewProject({ ...newProject, link: e.target.value })}
                                    />

                                    <div className="space-y-2">
                                        <Label className="text-xs">Tecnologias usadas</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ex: React"
                                                value={newProjectTech}
                                                onChange={e => setNewProjectTech(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                            <Button size="sm" variant="outline" onClick={handleAddProjectTech}>Add</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {newProject.technologies?.map((t, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <Button size="sm" variant="secondary" onClick={handleAddProject} className="w-full mt-2">
                                        <Plus className="w-4 h-4 mr-2" /> Adicionar Projeto
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certifications Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-yellow-600" />
                                    Cursos e Certificações
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {certifications.map((cert, index) => (
                                    <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">{cert.name}</p>
                                            <p className="text-xs text-muted-foreground">{cert.institution} • {cert.year}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCertification(index)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                                    <Input
                                        placeholder="Nome do Curso"
                                        className="md:col-span-1"
                                        value={newCertification.name || ''}
                                        onChange={e => setNewCertification({ ...newCertification, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Instituição"
                                        value={newCertification.institution || ''}
                                        onChange={e => setNewCertification({ ...newCertification, institution: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ano"
                                            className="w-20"
                                            value={newCertification.year || ''}
                                            onChange={e => setNewCertification({ ...newCertification, year: e.target.value })}
                                        />
                                        <Button size="icon" variant="secondary" onClick={handleAddCertification}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Links Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contato e Redes Sociais</CardTitle>
                                <CardDescription>Facilite o contato de recrutadores.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Email de Contato</Label>
                                        <Input
                                            placeholder="Ex: contato@email.com"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone / WhatsApp</Label>
                                        <Input
                                            placeholder="Ex: (11) 99999-9999"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                        />
                                    </div>

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
                                <CardDescription className="text-xs">
                                    Mantenha seu CV sempre atualizado.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profile?.resume_url ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
                                            <FileText className="w-8 h-8 text-red-500 mr-3" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">Currículo Cadastrado</p>
                                                <div className="flex gap-3 mt-1">
                                                    <a
                                                        href={profile.resume_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" /> Visualizar
                                                    </a>
                                                    {profile.resume_url.includes('cloudinary') && (
                                                        <a
                                                            href={profile.resume_url.includes('/raw/')
                                                                ? profile.resume_url
                                                                : profile.resume_url.replace('/upload/', '/upload/fl_attachment/')}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                                            download // Dica para o navegador tentar baixar
                                                        >
                                                            <Upload className="w-3 h-3 rotate-180" /> Baixar
                                                        </a>
                                                    )}
                                                </div>
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

                        {/* Languages Card - small & on the side */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Languages className="w-5 h-5 text-sky-500" />
                                    Idiomas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {languages.map((lang, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <span>{lang.name} <span className="text-muted-foreground text-xs">({lang.level})</span></span>
                                        <button onClick={() => handleRemoveLanguage(index)} className="text-muted-foreground hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex gap-2 pt-2">
                                    <Input
                                        placeholder="Idioma"
                                        className="h-8 text-sm"
                                        value={newLanguage.name || ''}
                                        onChange={e => setNewLanguage({ ...newLanguage, name: e.target.value })}
                                    />
                                    <Select
                                        value={newLanguage.level}
                                        onValueChange={(val: any) => setNewLanguage({ ...newLanguage, level: val })}
                                    >
                                        <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="Nível" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Básico">Básico</SelectItem>
                                            <SelectItem value="Intermediário">Intermediário</SelectItem>
                                            <SelectItem value="Avançado">Avançado</SelectItem>
                                            <SelectItem value="Fluente">Fluente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleAddLanguage}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
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
                                    if (user?.id) {
                                        const url = generateShareLink();
                                        navigator.clipboard.writeText(url);
                                        toast({
                                            title: "Link Copiado!",
                                            description: "O link do seu perfil (com seus dados completos) foi copiado."
                                        });
                                    }
                                }}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div >
        </div >
    );
}
