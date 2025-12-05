import api from './api';

export interface CareerProfile {
    id?: number;
    student_id: string;
    bio: string;
    title: string;
    skills: string[];
    linkedin_url: string;
    github_url: string;
    portfolio_url: string;
    resume_url: string | null;
    is_available: boolean;
    is_public: boolean;
    views: number;
}

export const careerService = {
    /**
     * Obtém o perfil de carreira de um estudante
     */
    getProfile: async (studentId: string): Promise<CareerProfile> => {
        try {
            const response = await api.get(`/career/${studentId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                // Retornar perfil vazio se não existir ainda
                return {
                    student_id: studentId,
                    bio: '',
                    title: '',
                    skills: [],
                    linkedin_url: '',
                    github_url: '',
                    portfolio_url: '',
                    resume_url: null,
                    is_available: false,
                    is_public: false,
                    views: 0
                };
            }
            throw error;
        }
    },

    /**
     * Cria ou atualiza o perfil de carreira
     */
    updateProfile: async (studentId: string, data: Partial<CareerProfile>): Promise<CareerProfile> => {
        const response = await api.put(`/career/${studentId}`, data);
        return response.data;
    },

    /**
     * Faz upload do currículo (PDF)
     */
    uploadResume: async (studentId: string, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('resume', file);

        const response = await api.post(`/career/${studentId}/resume`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.url;
    },

    /**
     * Incrementa o contador de visualizações
     */
    incrementViews: async (studentId: string): Promise<void> => {
        await api.post(`/career/${studentId}/view`);
    }
};
