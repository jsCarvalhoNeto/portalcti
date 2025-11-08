import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { subjectFavoritesService, FavoriteResponse } from '@/services/subjectFavoritesService';
import { useToast } from './use-toast';

/**
 * Hook personalizado para gerenciar disciplinas favoritas
 * Fornece estado reativo e funções para manipular favoritos
 */
export const useSubjectFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega os IDs das disciplinas favoritas do usuário
   */
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const ids = await subjectFavoritesService.getFavoriteIds();
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Erro ao carregar favoritos:', error);
      setError(error.message);
      // Em caso de erro, mantém array vazio para não quebrar a interface
      setFavoriteIds([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Verifica se uma disciplina é favorita
   */
  const isFavorite = useCallback((subjectId: number): boolean => {
    return favoriteIds.includes(subjectId);
  }, [favoriteIds]);

  /**
   * Alterna o status de favorito de uma disciplina
   */
  const toggleFavorite = useCallback(async (subjectId: number, subjectName?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para favoritar disciplinas",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response: FavoriteResponse = await subjectFavoritesService.toggleFavorite(subjectId);
      
      if (response.success) {
        // Atualizar estado local
        if (response.is_favorite) {
          setFavoriteIds(prev => [...prev, subjectId]);
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== subjectId));
        }

        // Mostrar toast de sucesso
        const name = subjectName || response.subject_name || 'Disciplina';
        toast({
          title: response.action === 'added' ? "Adicionado aos favoritos!" : "Removido dos favoritos",
          description: response.action === 'added' 
            ? `${name} foi adicionada aos seus favoritos` 
            : `${name} foi removida dos seus favoritos`,
          variant: "default",
        });

        return response.is_favorite;
      } else {
        // Resposta não bem-sucedida (ex: já era favorito)
        toast({
          title: "Aviso",
          description: response.message,
          variant: "default",
        });
        return response.is_favorite;
      }
    } catch (error: any) {
      console.error('Erro ao alternar favorito:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar favoritos",
        variant: "destructive",
      });
      return isFavorite(subjectId); // Retorna o estado atual em caso de erro
    }
  }, [user, toast, isFavorite]);

  /**
   * Adiciona disciplina aos favoritos
   */
  const addToFavorites = useCallback(async (subjectId: number, subjectName?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para favoritar disciplinas",
        variant: "destructive",
      });
      return false;
    }

    if (isFavorite(subjectId)) {
      return true; // Já é favorito
    }

    try {
      const response = await subjectFavoritesService.addToFavorites(subjectId);
      
      if (response.success) {
        setFavoriteIds(prev => [...prev, subjectId]);
        
        const name = subjectName || response.subject_name || 'Disciplina';
        toast({
          title: "Adicionado aos favoritos!",
          description: `${name} foi adicionada aos seus favoritos`,
          variant: "default",
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Erro ao adicionar favorito:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar aos favoritos",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, isFavorite]);

  /**
   * Remove disciplina dos favoritos
   */
  const removeFromFavorites = useCallback(async (subjectId: number, subjectName?: string): Promise<boolean> => {
    if (!user) return false;

    if (!isFavorite(subjectId)) {
      return true; // Já não é favorito
    }

    try {
      const response = await subjectFavoritesService.removeFromFavorites(subjectId);
      
      if (response.success) {
        setFavoriteIds(prev => prev.filter(id => id !== subjectId));
        
        const name = subjectName || 'Disciplina';
        toast({
          title: "Removido dos favoritos",
          description: `${name} foi removida dos seus favoritos`,
          variant: "default",
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Erro ao remover favorito:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover dos favoritos",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, isFavorite]);

  /**
   * Ordena uma lista de disciplinas colocando favoritas primeiro
   */
  const sortSubjectsByFavorites = useCallback(<T extends { id: number }>(subjects: T[]): T[] => {
    return [...subjects].sort((a, b) => {
      const aIsFavorite = isFavorite(a.id);
      const bIsFavorite = isFavorite(b.id);
      
      // Favoritos primeiro
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Manter ordem original para disciplinas do mesmo status
      return 0;
    });
  }, [isFavorite]);

  /**
   * Força recarregamento dos favoritos
   */
  const refetchFavorites = useCallback(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Carrega favoritos quando o usuário muda ou na inicialização
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    // Estados
    favoriteIds,
    loading,
    error,
    
    // Funções de consulta
    isFavorite,
    
    // Funções de manipulação
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    
    // Utilitários
    sortSubjectsByFavorites,
    refetchFavorites
  };
};