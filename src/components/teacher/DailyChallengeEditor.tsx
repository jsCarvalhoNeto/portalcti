import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Code, Eye, X, Save, AlertTriangle, Info } from 'lucide-react';
import { DailyChallenge, CreateChallengeData, UpdateChallengeData } from '../../services/dailyChallengeService';

interface DailyChallengeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  challenge?: DailyChallenge | null;
  onSave: (data: CreateChallengeData | UpdateChallengeData) => Promise<void>;
  subjects: Array<{ id: number; name: string; }>;
  isLoading?: boolean;
}

interface PreviewMode {
  mode: 'desktop' | 'tablet' | 'mobile';
}

const DailyChallengeEditor: React.FC<DailyChallengeEditorProps> = ({
  isOpen,
  onClose,
  challenge,
  onSave,
  subjects,
  isLoading = false
}) => {
  // Estados para os campos do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<number>(0);
  const [availableDate, setAvailableDate] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationTime, setExpirationTime] = useState('');
  const [points, setPoints] = useState(10);
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [jsContent, setJsContent] = useState('');

  // Estados para controle da interface
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [previewMode, setPreviewMode] = useState<PreviewMode['mode']>('desktop');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicialização dos dados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (challenge) {
        // Editando um desafio existente
        setTitle(challenge.title || '');
        setDescription(challenge.description || '');
        setSubjectId(challenge.subject_id || 0);
        setPoints(challenge.points || 10);
        setHtmlContent(challenge.html_content || '');
        setCssContent(''); // CSS será extraído do HTML se existir
        setJsContent('');  // JS será extraído do HTML se existir

        // Converter timestamps para formato de input
        if (challenge.start_date) {
          const startDate = new Date(challenge.start_date);
          setAvailableDate(startDate.toISOString().split('T')[0]);
          setAvailableTime(startDate.toTimeString().slice(0, 5));
        }

        if (challenge.end_date) {
          const endDate = new Date(challenge.end_date);
          setExpirationDate(endDate.toISOString().split('T')[0]);
          setExpirationTime(endDate.toTimeString().slice(0, 5));
        }
      } else {
        // Criando um novo desafio - valores padrão
        resetForm();
        
        // Definir datas padrão (hoje para início, amanhã para expiração)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setAvailableDate(today.toISOString().split('T')[0]);
        setAvailableTime('08:00');
        setExpirationDate(tomorrow.toISOString().split('T')[0]);
        setExpirationTime('23:59');
      }
      
      setErrors({});
    }
  }, [isOpen, challenge]);

  // Reset do formulário
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubjectId(0);
    setAvailableDate('');
    setAvailableTime('');
    setExpirationDate('');
    setExpirationTime('');
    setPoints(10);
    setHtmlContent(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Desafio do Dia</title>
</head>
<body>
    <div class="container">
        <h1>Bem-vindo ao Desafio!</h1>
        <p>Edite este HTML para completar o desafio.</p>
    </div>
</body>
</html>`);
    setCssContent(`/* Adicione seu CSS aqui */
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

h1 {
    color: #333;
    text-align: center;
}

p {
    line-height: 1.6;
    color: #666;
}`);
    setJsContent(`// Adicione seu JavaScript aqui
document.addEventListener('DOMContentLoaded', function() {
    console.log('Desafio carregado!');
    
    // Seu código JavaScript vai aqui
});`);
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (subjectId === 0) {
      newErrors.subjectId = 'Selecione uma disciplina';
    }

    if (!availableDate) {
      newErrors.availableDate = 'Data de disponibilização é obrigatória';
    }

    if (!availableTime) {
      newErrors.availableTime = 'Hora de disponibilização é obrigatória';
    }

    if (!expirationDate) {
      newErrors.expirationDate = 'Data de expiração é obrigatória';
    }

    if (!expirationTime) {
      newErrors.expirationTime = 'Hora de expiração é obrigatória';
    }

    // Validar se a data de expiração é posterior à data de disponibilização
    if (availableDate && availableTime && expirationDate && expirationTime) {
      const availableDateTime = new Date(`${availableDate}T${availableTime}`);
      const expirationDateTime = new Date(`${expirationDate}T${expirationTime}`);
      
      if (expirationDateTime <= availableDateTime) {
        newErrors.expirationDate = 'Data de expiração deve ser posterior à data de disponibilização';
      }
    }

    if (points < 1 || points > 100) {
      newErrors.points = 'Pontos devem estar entre 1 e 100';
    }

    if (!htmlContent.trim()) {
      newErrors.htmlContent = 'Conteúdo HTML é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const startDate = new Date(`${availableDate}T${availableTime}`);
      const endDate = new Date(`${expirationDate}T${expirationTime}`);

      const data = {
        title: title.trim(),
        description: description.trim(),
        subject_id: subjectId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        points,
        html_content: htmlContent,
        css_content: cssContent || null,
        js_content: jsContent || null
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar desafio:', error);
    }
  };

  // Gerar preview do código
  const generatePreview = (): string => {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview - ${title || 'Desafio do Dia'}</title>
          <style>
              ${cssContent}
          </style>
      </head>
      <body>
          ${htmlContent}
          <script>
              ${jsContent}
          </script>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {challenge ? 'Editar Desafio do Dia' : 'Criar Novo Desafio do Dia'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {challenge ? 'Modifique as informações do desafio' : 'Crie um novo desafio interativo para os alunos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('form')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code size={16} />
                  Configurações
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  Preview
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'form' ? (
            <div className="h-[calc(95vh-200px)] overflow-y-auto">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ex: Criando um Card Responsivo"
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição *
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Descreva o objetivo e instruções do desafio..."
                      />
                      {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                          Disciplina *
                        </label>
                        <select
                          id="subject"
                          value={subjectId}
                          onChange={(e) => setSubjectId(Number(e.target.value))}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.subjectId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value={0}>Selecione uma disciplina</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        {errors.subjectId && <p className="mt-1 text-sm text-red-600">{errors.subjectId}</p>}
                      </div>

                      <div>
                        <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center gap-1">
                            <Trophy size={16} className="text-yellow-500" />
                            Pontos *
                          </div>
                        </label>
                        <input
                          type="number"
                          id="points"
                          min="1"
                          max="100"
                          value={points}
                          onChange={(e) => setPoints(Number(e.target.value))}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.points ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.points && <p className="mt-1 text-sm text-red-600">{errors.points}</p>}
                      </div>
                    </div>

                    {/* Datas */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar size={18} />
                        Período de Disponibilidade
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Disponível a partir de *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={availableDate}
                              onChange={(e) => setAvailableDate(e.target.value)}
                              className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.availableDate ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            <input
                              type="time"
                              value={availableTime}
                              onChange={(e) => setAvailableTime(e.target.value)}
                              className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.availableTime ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {errors.availableDate && <p className="mt-1 text-sm text-red-600">{errors.availableDate}</p>}
                          {errors.availableTime && <p className="mt-1 text-sm text-red-600">{errors.availableTime}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expira em *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={expirationDate}
                              onChange={(e) => setExpirationDate(e.target.value)}
                              className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.expirationDate ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            <input
                              type="time"
                              value={expirationTime}
                              onChange={(e) => setExpirationTime(e.target.value)}
                              className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.expirationTime ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {errors.expirationDate && <p className="mt-1 text-sm text-red-600">{errors.expirationDate}</p>}
                          {errors.expirationTime && <p className="mt-1 text-sm text-red-600">{errors.expirationTime}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editor de Código */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Código do Desafio</h3>
                    
                    {/* Tabs do Editor */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 flex">
                        {['html', 'css', 'js'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveCodeTab(tab as 'html' | 'css' | 'js')}
                            className={`px-4 py-2 text-sm font-medium border-r border-gray-200 transition-colors ${
                              activeCodeTab === tab
                                ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            {tab.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      
                      <div className="p-0">
                        {activeCodeTab === 'html' && (
                          <div>
                            <textarea
                              value={htmlContent}
                              onChange={(e) => setHtmlContent(e.target.value)}
                              className={`w-full h-64 p-3 font-mono text-sm border-none resize-none focus:outline-none ${
                                errors.htmlContent ? 'bg-red-50' : ''
                              }`}
                              placeholder="Cole ou digite seu HTML aqui..."
                              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                            />
                            {errors.htmlContent && (
                              <div className="p-2 bg-red-50 border-t border-red-200">
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                  <AlertTriangle size={14} />
                                  {errors.htmlContent}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {activeCodeTab === 'css' && (
                          <textarea
                            value={cssContent}
                            onChange={(e) => setCssContent(e.target.value)}
                            className="w-full h-64 p-3 font-mono text-sm border-none resize-none focus:outline-none"
                            placeholder="Cole ou digite seu CSS aqui... (opcional)"
                            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                          />
                        )}
                        
                        {activeCodeTab === 'js' && (
                          <textarea
                            value={jsContent}
                            onChange={(e) => setJsContent(e.target.value)}
                            className="w-full h-64 p-3 font-mono text-sm border-none resize-none focus:outline-none"
                            placeholder="Cole ou digite seu JavaScript aqui... (opcional)"
                            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                      <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Dicas para o código:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>HTML é obrigatório - será a base do desafio</li>
                          <li>CSS e JavaScript são opcionais</li>
                          <li>Use a aba "Preview" para visualizar o resultado</li>
                          <li>O código será executado diretamente no navegador dos alunos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Preview Tab */
            <div className="h-[calc(95vh-200px)] flex flex-col">
              {/* Preview Controls */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Preview do Desafio</h3>
                    <p className="text-xs text-gray-600">Visualize como os alunos verão o desafio</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          previewMode === mode
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300'
                        }`}
                      >
                        {mode === 'desktop' && '🖥️ Desktop'}
                        {mode === 'tablet' && '📱 Tablet'} 
                        {mode === 'mobile' && '📱 Mobile'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Preview Frame */}
              <div className="flex-1 p-4 bg-gray-100">
                <div 
                  className={`mx-auto bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm transition-all ${
                    previewMode === 'desktop' ? 'w-full' : 
                    previewMode === 'tablet' ? 'w-3/4 max-w-3xl' : 
                    'w-1/2 max-w-sm'
                  }`}
                  style={{ height: 'calc(100% - 2rem)' }}
                >
                  {htmlContent.trim() ? (
                    <iframe
                      srcDoc={generatePreview()}
                      className="w-full h-full border-none"
                      title={`Preview - ${title || 'Desafio do Dia'}`}
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Code size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Nenhum código para preview</p>
                        <p className="text-sm">Adicione HTML na aba "Configurações" para ver o preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                {challenge ? 'Atualizar Desafio' : 'Criar Desafio'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengeEditor;