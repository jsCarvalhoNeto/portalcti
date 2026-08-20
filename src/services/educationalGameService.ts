import { supabase } from '@/lib/supabaseClient';

export type EducationalGameAccessMode = 'classroom' | 'online';

export interface EducationalGame {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  code_content: string;
  access_mode: EducationalGameAccessMode;
  is_published: boolean;
  share_code: string;
  created_at: string;
  updated_at: string;
}

export interface SaveEducationalGameData {
  title: string;
  description: string;
  code_content: string;
  access_mode: EducationalGameAccessMode;
  is_published: boolean;
}

const createShareCode = () => {
  const raw = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}${Math.random().toString(36).slice(2)}`;

  return raw.slice(0, 12).toUpperCase();
};

const table = () => supabase.from('educational_games');

export const educationalGameService = {
  async getByTeacher(teacherId: string): Promise<EducationalGame[]> {
    const { data, error } = await table()
      .select('*')
      .eq('teacher_id', teacherId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EducationalGame[];
  },

  async getPublishedByShareCode(shareCode: string): Promise<EducationalGame | null> {
    const { data, error } = await table()
      .select('*')
      .eq('share_code', shareCode.toUpperCase())
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw error;
    return data as EducationalGame | null;
  },

  async create(teacherId: string, game: SaveEducationalGameData): Promise<EducationalGame> {
    const { data, error } = await table()
      .insert({
        teacher_id: teacherId,
        title: game.title.trim(),
        description: game.description.trim(),
        code_content: game.code_content,
        access_mode: game.access_mode,
        is_published: game.is_published,
        share_code: createShareCode()
      })
      .select()
      .single();

    if (error) throw error;
    return data as EducationalGame;
  },

  async update(id: string, teacherId: string, game: SaveEducationalGameData): Promise<EducationalGame> {
    const { data, error } = await table()
      .update({
        title: game.title.trim(),
        description: game.description.trim(),
        code_content: game.code_content,
        access_mode: game.access_mode,
        is_published: game.is_published
      })
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .select()
      .single();

    if (error) throw error;
    return data as EducationalGame;
  },

  async remove(id: string, teacherId: string): Promise<void> {
    const { error } = await table()
      .delete()
      .eq('id', id)
      .eq('teacher_id', teacherId);

    if (error) throw error;
  }
};

export default educationalGameService;
