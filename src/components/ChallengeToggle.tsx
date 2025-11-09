/**
 * Componente React para o Toggle Switch de Ativar/Desativar Desafios
 * Este componente implementa a interface para a funcionalidade de um desafio ativo por disciplina
 */

import React, { useState } from 'react';
import './ChallengeToggle.css';

interface Challenge {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  subject_id: number;
  subject_name: string;
  points: number;
  start_date: string;
  end_date: string;
}

interface ChallengeToggleProps {
  challenge: Challenge;
  onToggle: (challengeId: number, isActive: boolean) => Promise<void>;
  disabled?: boolean;
}

export const ChallengeToggle: React.FC<ChallengeToggleProps> = ({
  challenge,
  onToggle,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.checked;
    setIsLoading(true);

    try {
      await onToggle(challenge.id, newStatus);
    } catch (error) {
      // O erro já é tratado no componente pai
      console.error('Erro ao alternar status:', error);
      // Reverter o toggle se houve erro
      e.target.checked = !newStatus;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="challenge-toggle-container">
      <div className="toggle-wrapper">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={challenge.is_active}
            onChange={handleToggle}
            disabled={disabled || isLoading}
            title={challenge.is_active ? 'Clique para desativar' : 'Clique para ativar'}
          />
          <span className="slider round"></span>
        </label>
        
        <div className="toggle-status">
          <span className={`status-badge ${challenge.is_active ? 'active' : 'inactive'}`}>
            {challenge.is_active ? 'Ativo' : 'Inativo'}
          </span>
          
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
      
      {challenge.is_active && (
        <div className="active-indicator">
          <span className="pulse-dot"></span>
          <span className="indicator-text">Desafio ativo para {challenge.subject_name}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hook personalizado para gerenciar o toggle de desafios
 */
export const useChallengeToggle = () => {
  const [loading, setLoading] = useState<number | null>(null);

  const toggleChallenge = async (challengeId: number, isActive: boolean) => {
    setLoading(challengeId);
    
    try {
      const response = await fetch(`/api/daily-challenges/${challengeId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao alterar status do desafio');
      }

      const result = await response.json();
      
      // Exibir mensagem de sucesso (você pode usar uma biblioteca de toast)
      console.log('✅ Sucesso:', result.message);
      
      return result;
    } catch (error) {
      console.error('❌ Erro:', error);
      // Exibir mensagem de erro (você pode usar uma biblioteca de toast)
      throw error;
    } finally {
      setLoading(null);
    }
  };

  return { toggleChallenge, loading };
};

/**
 * Componente principal que usa o ChallengeToggle
 */
export const ChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const { toggleChallenge, loading } = useChallengeToggle();

  const handleToggle = async (challengeId: number, isActive: boolean) => {
    try {
      await toggleChallenge(challengeId, isActive);
      // Aqui você pode atualizar o estado global ou recarregar a lista
      // window.location.reload(); // Método simples, mas não ideal
      // Melhor usar context/redux para atualizar o estado
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao alterar status do desafio: ' + errorMessage);
    }
  };

  return (
    <div className="challenge-card">
      <div className="card-header">
        <div className="challenge-info">
          <h3 className="challenge-title">{challenge.title}</h3>
          <span className="challenge-subject">{challenge.subject_name}</span>
        </div>
        
        <ChallengeToggle
          challenge={challenge}
          onToggle={handleToggle}
          disabled={loading === challenge.id}
        />
      </div>
      
      <div className="card-body">
        <p className="challenge-description">{challenge.description}</p>
        
        <div className="challenge-metadata">
          <div className="metadata-item">
            <span className="label">Pontos:</span>
            <span className="value">{challenge.points}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Início:</span>
            <span className="value">{new Date(challenge.start_date).toLocaleDateString()}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Fim:</span>
            <span className="value">{new Date(challenge.end_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="card-actions">
        <button className="btn btn-secondary">Ver Detalhes</button>
        <button className="btn btn-primary">Editar</button>
        <button className="btn btn-danger">Excluir</button>
      </div>
    </div>
  );
};

export default ChallengeCard;