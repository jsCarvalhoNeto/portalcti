import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useSubjectFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Load favorites from localStorage for now
      const stored = localStorage.getItem(`favorites_${user?.id}`);
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (subjectId: string) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(subjectId)) {
      newFavorites.delete(subjectId);
    } else {
      newFavorites.add(subjectId);
    }
    
    setFavorites(newFavorites);
    
    // Save to localStorage
    if (user?.id) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify([...newFavorites]));
    }
  };

  const isFavorite = (subjectId: string): boolean => {
    return favorites.has(subjectId);
  };

  return {
    favorites: Array.from(favorites),
    loading,
    toggleFavorite,
    isFavorite,
  };
}
