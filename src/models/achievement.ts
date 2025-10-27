export interface Achievement {
  id?: string | number;
  key?: string; // optional internal key/name
  title: string;
  description?: string;
  points: number; // ponto padrão atribuído pela conquista
  minPoints?: number; // limite inferior (opcional)
  maxPoints?: number; // limite superior (opcional)
  imageUrl?: string; // link para imagem/medalha
  created_at?: string;
  updated_at?: string;
}

export interface AchievementCreatePayload {
  key?: string;
  title: string;
  description?: string;
  points: number;
  minPoints?: number;
  maxPoints?: number;
  imageUrl?: string;
}
