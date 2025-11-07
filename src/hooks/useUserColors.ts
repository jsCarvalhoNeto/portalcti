// Hook para gerenciar cores personalizadas do usuário usando localStorage temporariamente
// TODO: Substituir por chamadas à API quando estiver funcionando

import { useAuth } from '@/hooks/useAuth';

export const useUserColors = () => {
  const { user } = useAuth();

  const getUserColorKey = () => `user-colors-${user?.id || 'anonymous'}`;

  const loadUserColors = (): Record<number, string> => {
    try {
      const storedColors = localStorage.getItem(getUserColorKey());
      return storedColors ? JSON.parse(storedColors) : {};
    } catch (error) {
      console.error('Erro ao carregar cores:', error);
      return {};
    }
  };

  const saveUserColor = (subjectId: number, color: string): void => {
    try {
      const colorsMap = loadUserColors();
      colorsMap[subjectId] = color;
      localStorage.setItem(getUserColorKey(), JSON.stringify(colorsMap));
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
    }
  };

  const removeUserColor = (subjectId: number): void => {
    try {
      const colorsMap = loadUserColors();
      delete colorsMap[subjectId];
      localStorage.setItem(getUserColorKey(), JSON.stringify(colorsMap));
    } catch (error) {
      console.error('Erro ao remover cor:', error);
    }
  };

  const getUserColor = (subjectId: number): string | null => {
    const colorsMap = loadUserColors();
    return colorsMap[subjectId] || null;
  };

  return {
    loadUserColors,
    saveUserColor,
    removeUserColor,
    getUserColor
  };
};