import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { careerService, type CareerProfile } from '@/services/careerService';
import {
    Briefcase,
    Linkedin,
    Github,
    Globe,
    FileText,
    Mail,
    Phone,
    ArrowLeft,
    GraduationCap,
    Code,
    Languages,
    Award,
    ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PublicCareerProfile() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<CareerProfile | null>(null);

    useEffect(() => {
        if (studentId) {
            loadPublicProfile(studentId);
        }
    }, [studentId]);

    const loadPublicProfile = async (id: string) => {
        try {
            setLoading(true);
            // Nota: Isso assume que o backend permite acesso público a este endpoint
            // Se o backend exigir autenticação, um endpoint específico "/public/career/:id" seria necessário
            const data = await careerService.getProfile(id);

            // Verificação de segurança no frontend (idealmente o backend também deve bloquear)
            if (!data.is_public) {
                setProfile(null);
            } else {
                setProfile(data);
                // Increment view count
                careerService.incrementViews(id).catch(console.error);
            }
        } catch (error) {
            console.error("Erro ao carregar perfil", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <div className="mb-4 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Perfil não disponível</h1>
                    <p className="text-gray-600 mb-6">
                        Este perfil não existe ou está configurado como privado pelo estudante.
                    </p>
                    <Button onClick={() => navigate('/')}>Voltar para o Início</Button>
                </div>
            </div>
        );
    }

    const calculateAge = (dateString: string | null) => {
        if (!dateString) return null;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Top Bar (Public View) */}
            <div className="bg-white border-b shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl">
                        <Briefcase className="w-6 h-6" />
                        <span>Mural de Talentos</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                        Acessar Plataforma
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Banner / Header Card */}
                        <Card className="overflow-hidden border-t-4 border-t-primary">
                            <CardContent className="pt-8 pb-8 flex flex-col items-center">
                                <div className="w-32 h-40 bg-gray-100 rounded-lg border-4 border-white shadow-lg overflow-hidden mb-4 flex-shrink-0 relative">
                                    {profile.photo_url ? (
                                        <img src={profile.photo_url} alt={profile.full_name || "Foto"} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400">
                                            <Briefcase className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-3xl font-bold mb-1 text-center">{profile.full_name || 'Estudante Técnico'}</h1>
                                <div className="flex items-center gap-2 text-gray-500 mb-4">
                                    {calculateAge(profile.birth_date) && (
                                        <span className="text-sm border px-2 py-0.5 rounded-full bg-gray-50">{calculateAge(profile.birth_date)} anos</span>
                                    )}
                                    <span className="text-sm text-primary font-medium">{profile.title || 'Estudante de Tecnologia'}</span>
                                </div>

                                {profile.is_available && (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                        Disponível para Oportunidades
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>

                        {/* About */}
                        {profile.bio && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sobre</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Habilidades Técnicas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Education */}
                        {profile.education && profile.education.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                                        Formação Acadêmica
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {profile.education.map((edu, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <h4 className="font-semibold text-lg">{edu.course}</h4>
                                                <p className="text-gray-600 font-medium">{edu.institution}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 mt-2 sm:mt-0">
                                                <Badge variant="outline" className="text-xs w-fit">{edu.status}</Badge>
                                                <span className="text-xs text-muted-foreground">{edu.completion_date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Projects */}
                        {profile.projects && profile.projects.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="w-5 h-5 text-emerald-600" />
                                        Projetos de Destaque
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {profile.projects.map((proj, index) => (
                                        <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                                    {proj.name}
                                                    {proj.link && (
                                                        <a
                                                            href={proj.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-blue-500 hover:text-blue-700 transition-colors"
                                                            title="Ver Projeto"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </h4>
                                            </div>
                                            <p className="text-gray-600 mb-3">{proj.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {proj.technologies?.map((tech, i) => (
                                                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium border">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Certifications */}
                        {profile.certifications && profile.certifications.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-600" />
                                        Certificações
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {profile.certifications.map((cert, index) => (
                                        <div key={index} className="flex justify-between items-start border-l-2 border-yellow-200 pl-3">
                                            <div>
                                                <p className="font-medium">{cert.name}</p>
                                                <p className="text-sm text-gray-600">{cert.institution}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground bg-gray-50 border px-2 py-0.5 rounded">{cert.year}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* Right Column - Contact & Resume */}
                    <div className="space-y-6">

                        {/* Contact Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contato e Links</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.contact_email && (
                                    <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border transition-colors group">
                                        <Mail className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-gray-700">{profile.contact_email}</span>
                                    </a>
                                )}

                                {profile.contact_phone && (
                                    <a href={`https://wa.me/55${profile.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border transition-colors group">
                                        <Phone className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-gray-700">{profile.contact_phone}</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                                    </a>
                                )}

                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border transition-colors group">
                                        <Linkedin className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                                    </a>
                                )}

                                {profile.github_url && (
                                    <a href={profile.github_url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border transition-colors group">
                                        <Github className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-gray-700">GitHub</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                                    </a>
                                )}

                                {profile.portfolio_url && (
                                    <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border transition-colors group">
                                        <Globe className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-gray-700">Portfólio</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        {/* Resume Download */}
                        {profile.resume_url && (
                            <Card className="border-green-100 bg-green-50/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-orange-500" />
                                        Currículo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={() => window.open(profile.resume_url!, '_blank')}>
                                        Visualizar Currículo (PDF)
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Languages */}
                        {profile.languages && profile.languages.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Languages className="w-5 h-5 text-sky-500" />
                                        Idiomas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {profile.languages.map((lang, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="font-medium">{lang.name}</span>
                                            <span className="text-muted-foreground text-xs bg-gray-100 px-2 py-0.5 rounded-full">{lang.level}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
