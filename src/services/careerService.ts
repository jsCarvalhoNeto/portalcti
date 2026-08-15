import { supabase } from '../lib/supabaseClient';

export interface Education {
    institution: string;
    course: string;
    status: 'Em andamento' | 'Concluído' | 'Trancado';
    completion_date: string;
}

export interface Project {
    name: string;
    description: string;
    technologies: string[];
    link: string;
}

export interface Language {
    name: string;
    level: 'Básico' | 'Intermediário' | 'Avançado' | 'Fluente';
}

export interface Certification {
    name: string;
    institution: string;
    year: string;
}

export interface Experience {
    company: string;
    role: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current: boolean;
}

export interface CareerProfile {
    id?: string | number;
    student_id: string;
    full_name: string | null;
    birth_date: string | null;
    bio: string;
    title: string;
    skills: string[];
    linkedin_url: string;
    github_url: string;
    portfolio_url: string;
    resume_url: string | null;
    photo_url: string | null;
    is_available: boolean;
    is_public: boolean;
    is_employed: boolean;
    views: number;
    contact_email?: string;
    contact_phone?: string;
    education?: Education[];
    projects?: Project[];
    languages?: Language[];
    certifications?: Certification[];
    experiences?: Experience[];
}

const getDefaultProfile = (studentId: string): CareerProfile => ({
    student_id: studentId,
    full_name: '',
    birth_date: '',
    bio: '',
    title: '',
    skills: [],
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    resume_url: null,
    photo_url: null,
    is_available: false,
    is_public: false,
    is_employed: false,
    views: 0,
    education: [],
    projects: [],
    languages: [],
    certifications: [],
    experiences: [],
    contact_email: '',
    contact_phone: ''
});

const formatProfileData = (data: any, studentId: string): CareerProfile => {
    return {
        id: data.id,
        student_id: data.student_id || studentId,
        full_name: data.full_name || '',
        birth_date: data.birth_date ? String(data.birth_date).split('T')[0] : '',
        bio: data.bio || '',
        title: data.title || '',
        skills: Array.isArray(data.skills) ? data.skills : [],
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        portfolio_url: data.portfolio_url || '',
        resume_url: data.resume_url || null,
        photo_url: data.photo_url || null,
        is_available: Boolean(data.is_available),
        is_public: Boolean(data.is_public),
        is_employed: Boolean(data.is_employed),
        views: Number(data.views) || 0,
        education: Array.isArray(data.education) ? data.education : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        experiences: Array.isArray(data.experiences) ? data.experiences : [],
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || ''
    };
};

export const careerService = {
    /**
     * Lista todos os perfis de carreira públicos (Para professores / gestores)
     */
    listProfiles: async (): Promise<CareerProfile[]> => {
        try {
            const { data, error } = await supabase
                .from('career_profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Erro ao listar perfis no Supabase:', error);
                return [];
            }

            return (data || []).map(item => formatProfileData(item, item.student_id));
        } catch (error) {
            console.error('Erro ao listar perfis de carreira:', error);
            return [];
        }
    },

    /**
     * Obtém o perfil de carreira de um estudante
     */
    getProfile: async (studentId: string): Promise<CareerProfile> => {
        try {
            const { data, error } = await supabase
                .from('career_profiles')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle();

            if (error) {
                console.warn('Aviso ao buscar perfil de carreira no Supabase:', error.message);
                return getDefaultProfile(studentId);
            }

            if (!data) {
                // Tenta puxar nome do profile básico se existir
                try {
                    const { data: userProfile } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', studentId)
                        .maybeSingle();

                    const defaultProf = getDefaultProfile(studentId);
                    if (userProfile?.full_name) defaultProf.full_name = userProfile.full_name;
                    if (userProfile?.email) defaultProf.contact_email = userProfile.email;
                    return defaultProf;
                } catch {
                    return getDefaultProfile(studentId);
                }
            }

            return formatProfileData(data, studentId);
        } catch (error) {
            console.error('Erro ao buscar perfil de carreira:', error);
            return getDefaultProfile(studentId);
        }
    },

    /**
     * Cria ou atualiza o perfil de carreira
     */
    updateProfile: async (studentId: string, data: Partial<CareerProfile>): Promise<CareerProfile> => {
        try {
            const payload = {
                student_id: studentId,
                full_name: data.full_name || null,
                birth_date: data.birth_date ? data.birth_date : null,
                bio: data.bio || '',
                title: data.title || '',
                linkedin_url: data.linkedin_url || '',
                github_url: data.github_url || '',
                portfolio_url: data.portfolio_url || '',
                contact_email: data.contact_email || '',
                contact_phone: data.contact_phone || '',
                is_public: Boolean(data.is_public),
                is_available: Boolean(data.is_available),
                is_employed: Boolean(data.is_employed),
                skills: Array.isArray(data.skills) ? data.skills : [],
                education: Array.isArray(data.education) ? data.education : [],
                projects: Array.isArray(data.projects) ? data.projects : [],
                languages: Array.isArray(data.languages) ? data.languages : [],
                certifications: Array.isArray(data.certifications) ? data.certifications : [],
                experiences: Array.isArray(data.experiences) ? data.experiences : [],
                updated_at: new Date().toISOString()
            };

            const { data: updated, error } = await supabase
                .from('career_profiles')
                .upsert(payload, { onConflict: 'student_id' })
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar perfil no Supabase:', error);
                throw error;
            }

            return formatProfileData(updated, studentId);
        } catch (error) {
            console.error('Falha ao atualizar perfil de carreira:', error);
            throw error;
        }
    },

    /**
     * Faz upload do currículo (PDF)
     */
    uploadResume: async (studentId: string, file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop() || 'pdf';
            const fileName = `${studentId}/resume_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('career')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Erro no upload de currículo para o Supabase Storage:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('career')
                .getPublicUrl(fileName);

            // Atualiza imediatamente a URL do currículo no banco
            await supabase
                .from('career_profiles')
                .upsert({
                    student_id: studentId,
                    resume_url: publicUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'student_id' });

            return publicUrl;
        } catch (error) {
            console.error('Erro ao enviar currículo:', error);
            throw error;
        }
    },

    /**
     * Faz upload da foto (Imagem)
     */
    uploadPhoto: async (studentId: string, file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${studentId}/photo_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('career')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Erro no upload da foto para o Supabase Storage:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('career')
                .getPublicUrl(fileName);

            // Atualiza imediatamente a foto no banco
            await supabase
                .from('career_profiles')
                .upsert({
                    student_id: studentId,
                    photo_url: publicUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'student_id' });

            return publicUrl;
        } catch (error) {
            console.error('Erro ao enviar foto de perfil:', error);
            throw error;
        }
    },

    /**
     * Incrementa o contador de visualizações
     */
    incrementViews: async (studentId: string): Promise<void> => {
        try {
            const { error } = await supabase.rpc('increment_career_views', {
                target_student_id: studentId
            });

            if (error) {
                // Fallback: se a RPC falhar, tenta update direto
                const { data: prof } = await supabase
                    .from('career_profiles')
                    .select('views')
                    .eq('student_id', studentId)
                    .maybeSingle();

                if (prof) {
                    await supabase
                        .from('career_profiles')
                        .update({
                            views: (prof.views || 0) + 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('student_id', studentId);
                }
            }
        } catch (error) {
            console.error('Erro ao incrementar visualizações:', error);
        }
    }
};
