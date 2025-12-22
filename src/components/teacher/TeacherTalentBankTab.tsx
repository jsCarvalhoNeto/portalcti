import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { careerService, type CareerProfile } from '@/services/careerService';
import {
    Search,
    Briefcase,
    ExternalLink,
    Copy,
    User,
    CheckCircle2,
    XCircle,
    Eye
} from 'lucide-react';

export default function TeacherTalentBankTab() {
    const [profiles, setProfiles] = useState<CareerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const data = await careerService.listProfiles();
            setProfiles(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar o banco de talentos.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = (studentId: string) => {
        const url = `${window.location.origin}/talento/${studentId}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copiado!",
            description: "O link do perfil foi copiado para a área de transferência.",
        });
    };

    const handleViewProfile = (studentId: string) => {
        window.open(`/talento/${studentId}`, '_blank');
    };

    const filteredProfiles = profiles.filter(profile => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (profile.full_name?.toLowerCase().includes(searchLower) || false) ||
            (profile.title?.toLowerCase().includes(searchLower) || false) ||
            (profile.skills?.some(skill => skill.toLowerCase().includes(searchLower)) || false)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        Banco de Talentos
                    </h2>
                    <p className="text-muted-foreground">
                        Visualize e compartilhe os perfis de carreira dos seus alunos.
                    </p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, cargo ou skill..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredProfiles.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nenhum talento encontrado</h3>
                        <p className="text-muted-foreground">
                            {searchTerm
                                ? "Tente buscar com outros termos."
                                : "Nenhum aluno cadastrou um perfil de carreira ainda."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfiles.map((profile) => (
                        <Card key={profile.student_id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
                            <CardHeader className="relative pb-2">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {profile.is_available && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                            Disponível
                                        </Badge>
                                    )}
                                    {profile.is_employed && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            Empregado
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-col items-center text-center pt-4">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg mb-4">
                                        <AvatarImage src={profile.photo_url || ''} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {(profile.full_name || 'A')[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-lg line-clamp-1" title={profile.full_name || 'Estudante'}>
                                        {profile.full_name || 'Estudante'}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 h-5">
                                        {profile.title || 'Estudante de Tecnologia'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-4">
                                    {profile.bio && (
                                        <p className="text-sm text-gray-600 line-clamp-3 h-[60px]">
                                            {profile.bio}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {(profile.skills || []).slice(0, 4).map((skill, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {skill}
                                            </Badge>
                                        ))}
                                        {(profile.skills || []).length > 4 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{(profile.skills?.length || 0) - 4}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t mt-4">
                                        <div className="flex items-center gap-1" title="Visualizações">
                                            <Eye className="w-3 h-3" /> {profile.views || 0}
                                        </div>
                                        <div className="flex items-center gap-1" title={profile.is_public ? "Público" : "Privado"}>
                                            {profile.is_public ? (
                                                <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Público</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-3 h-3" /> Privado</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 pb-6 px-6 gap-2">
                                <Button
                                    className="flex-1"
                                    variant="default"
                                    onClick={() => handleViewProfile(profile.student_id)}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver Perfil
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleCopyLink(profile.student_id)}
                                    title="Copiar Link Público"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
