/**
 * Página de Gerenciamento de Desafios do Professor
 * Esta página usa o componente ChallengeToggle para implementar a funcionalidade
 * de um desafio ativo por disciplina
 */

import React, { useState, useEffect } from 'react';
import ChallengeCard from '../components/ChallengeToggle';
import './TeacherChallenges.css';

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
  submissions_count?: number;
}

const TeacherChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Carregar desafios do professor
  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/daily-challenges/teacher/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar desafios');
      }

      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
      // Aqui você pode usar um toast/notification
    } finally {
      setLoading(false);
    }
  };

  // Filtrar desafios baseado no filtro selecionado
  const filteredChallenges = challenges.filter(challenge => {
    switch (filter) {
      case 'active':
        return challenge.is_active;
      case 'inactive':
        return !challenge.is_active;
      default:
        return true;
    }
  });

  // Agrupar desafios por disciplina
  const challengesBySubject = filteredChallenges.reduce((acc, challenge) => {
    const subject = challenge.subject_name || 'Sem Disciplina';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(challenge);
    return acc;
  }, {} as Record<string, Challenge[]>);

  const getActiveCount = () => challenges.filter(c => c.is_active).length;
  const getTotalCount = () => challenges.length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando seus desafios...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎯 Gerenciar Desafios Diários</h1>
          <p>Crie desafios HTML, CSS e JavaScript para suas disciplinas. Desenvolva a criatividade e habilidades práticas através de projetos interativos.</p>
        </div>

        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{getTotalCount()}</div>
            <div className="stat-label">Total de Desafios</div>
          </div>
          <div className="stat-card active">
            <div className="stat-number">{getActiveCount()}</div>
            <div className="stat-label">Desafios Ativos</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(challengesBySubject).length}</div>
            <div className="stat-label">Disciplinas</div>
          </div>
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({getTotalCount()})
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Ativos ({getActiveCount()})
          </button>
          <button 
            className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inativos ({getTotalCount() - getActiveCount()})
          </button>
        </div>

        <div className="action-controls">
          <button className="btn btn-primary">
            <span className="icon">+</span>
            Novo Desafio
          </button>
          <button className="btn btn-secondary" onClick={loadChallenges}>
            <span className="icon">🔄</span>
            Atualizar
          </button>
        </div>
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>Nenhum desafio encontrado</h3>
          <p>
            {filter === 'all' 
              ? 'Você ainda não criou nenhum desafio. Clique em "Novo Desafio" para começar!'
              : `Não há desafios ${filter === 'active' ? 'ativos' : 'inativos'} no momento.`
            }
          </p>
          {filter === 'all' && (
            <button className="btn btn-primary">Criar Primeiro Desafio</button>
          )}
        </div>
      ) : (
        <div className="challenges-container">
          {Object.entries(challengesBySubject).map(([subjectName, subjectChallenges]) => (
            <div key={subjectName} className="subject-group">
              <div className="subject-header">
                <h2 className="subject-title">
                  📚 {subjectName}
                  <span className="subject-count">({subjectChallenges.length})</span>
                </h2>
                <div className="subject-status">
                  {subjectChallenges.some(c => c.is_active) ? (
                    <span className="status-badge active">
                      ✅ {subjectChallenges.filter(c => c.is_active).length} ativo(s)
                    </span>
                  ) : (
                    <span className="status-badge inactive">
                      ⚪ Nenhum desafio ativo
                    </span>
                  )}
                </div>
              </div>

              <div className="challenges-grid">
                {subjectChallenges.map(challenge => (
                  <ChallengeCard 
                    key={challenge.id} 
                    challenge={challenge}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-footer">
        <div className="info-box">
          <h4>💡 Dica Importante</h4>
          <p>
            <strong>Apenas um desafio pode estar ativo por disciplina.</strong> 
            Quando você ativar um desafio, todos os outros da mesma disciplina serão automaticamente desativados.
          </p>
        </div>

        <div className="help-links">
          <a href="#" className="help-link">📋 Como criar desafios efetivos</a>
          <a href="#" className="help-link">🎨 Exemplos de desafios HTML/CSS</a>
          <a href="#" className="help-link">💬 Precisa de ajuda?</a>
        </div>
      </div>
    </div>
  );
};

export default TeacherChallenges;