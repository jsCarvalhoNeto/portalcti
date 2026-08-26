import { SubjectLesson } from '@/services/subjectLessonService';
import { markdownToHtml, sanitizeHtml } from './markdownUtils';

/**
 * Formata uma data ISO (AAAA-MM-DD ou ISO String) em texto legível por extenso
 */
function formatDateToPortuguese(dateStr?: string | null): string {
  if (!dateStr) return 'Data não informada';
  try {
    const raw = dateStr.split('T')[0];
    const [year, month, day] = raw.split('-');
    if (year && month && day) {
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch (e) {
    console.warn('Erro ao formatar data para PDF:', e);
  }
  return dateStr;
}

/**
 * Retorna o rótulo do período/bimestre
 */
function getPeriodLabel(period?: string | null): string {
  switch (period) {
    case '1': return '1º Bimestre';
    case '2': return '2º Bimestre';
    case '3': return '3º Bimestre';
    case '4': return '4º Bimestre';
    default: return '';
  }
}

/**
 * Retorna o rótulo da avaliação
 */
function getEvaluationLabel(evalType?: string | null): string {
  switch (evalType) {
    case 'parcial': return 'Avaliação Parcial (AV1)';
    case 'global': return 'Avaliação Global (AV2)';
    default: return '';
  }
}

/**
 * Exporta e aciona a impressão / salvamento em PDF de uma aula
 */
export function exportLessonToPdf(lesson: SubjectLesson, subjectName?: string): void {
  try {
    const title = lesson.title || 'Conteúdo da Aula';
    const orderIndex = lesson.order_index || 1;
    const formattedDate = formatDateToPortuguese(lesson.lesson_date);
    const period = getPeriodLabel(lesson.period);
    const evalType = getEvaluationLabel(lesson.evaluation_type);
    const schoolName = lesson.school_name || 'EEEP Balbina Viana Arrais';
    const courseName = lesson.course_name || 'Curso Técnico em Informática Integrado ao Ensino Médio';
    const currentYear = new Date().getFullYear();

    // Renderiza o markdown para HTML
    let renderedContent = '';
    if (lesson.content && lesson.content.trim()) {
      renderedContent = sanitizeHtml(markdownToHtml(lesson.content));
    } else {
      renderedContent = '<div class="empty-notice"><p>Nenhum texto de roteiro ou anotação registrado para esta aula.</p></div>';
    }

    // Monta links complementares se existirem
    let resourcesHtml = '';
    if (lesson.pdf_url || lesson.presentation_url || lesson.video_url) {
      resourcesHtml = `
        <div class="resources-box">
          <div class="resources-title">📌 Materiais Complementares da Aula</div>
          <ul class="resources-list">
            ${lesson.pdf_url ? `<li><strong>Material/Apostila (PDF):</strong> <a href="${lesson.pdf_url}" target="_blank">${lesson.pdf_url}</a></li>` : ''}
            ${lesson.presentation_url ? `<li><strong>Slides de Apresentação:</strong> <a href="${lesson.presentation_url}" target="_blank">${lesson.presentation_url}</a></li>` : ''}
            ${lesson.video_url ? `<li><strong>Videoaula / Gravação:</strong> <a href="${lesson.video_url}" target="_blank">${lesson.video_url}</a></li>` : ''}
          </ul>
        </div>
      `;
    }

    // Monta o documento HTML completo de impressão
    const printHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Aula ${orderIndex} - ${title} | ${subjectName || 'Disciplina'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }

    /* Cabeçalho Institucional */
    .header-container {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }

    .school-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .school-name {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }

    .course-name {
      font-size: 9.5pt;
      color: #475569;
      font-weight: 500;
    }

    .doc-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 700;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      text-align: right;
    }

    /* Título e Metadados da Aula */
    .lesson-meta-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }

    .lesson-number-tag {
      display: inline-block;
      background: #2563eb;
      color: white;
      font-size: 9pt;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .lesson-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin: 4px 0 10px 0;
    }

    .meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      font-size: 9pt;
      color: #334155;
    }

    .meta-pill {
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 8px;
      font-weight: 600;
    }

    .meta-pill.highlight {
      background-color: #fef3c7;
      border-color: #fde68a;
      color: #b45309;
    }

    /* Recursos / Links */
    .resources-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .resources-title {
      font-size: 10pt;
      font-weight: 700;
      color: #166534;
      margin-bottom: 6px;
    }

    .resources-list {
      margin: 0;
      padding-left: 20px;
      font-size: 9pt;
      color: #14532d;
    }

    .resources-list li {
      margin-bottom: 3px;
      word-break: break-all;
    }

    .resources-list a {
      color: #15803d;
      text-decoration: underline;
    }

    /* Conteúdo Markdown da Aula */
    .lesson-content {
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1e293b;
    }

    .lesson-content h1, 
    .lesson-content h2, 
    .lesson-content h3, 
    .lesson-content h4 {
      color: #0f172a;
      font-weight: 800;
      margin-top: 1.4em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }

    .lesson-content h1 { font-size: 14pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .lesson-content h2 { font-size: 12.5pt; }
    .lesson-content h3 { font-size: 11.5pt; }
    .lesson-content h4 { font-size: 10.5pt; }

    .lesson-content p {
      margin-top: 0;
      margin-bottom: 0.85em;
    }

    .lesson-content ul, 
    .lesson-content ol {
      margin-top: 0;
      margin-bottom: 0.85em;
      padding-left: 22px;
    }

    .lesson-content li {
      margin-bottom: 0.35em;
    }

    .lesson-content strong {
      font-weight: 700;
      color: #0f172a;
    }

    .lesson-content em {
      font-style: italic;
    }

    .lesson-content blockquote {
      border-left: 4px solid #3b82f6;
      background-color: #f8fafc;
      padding: 8px 14px;
      margin: 1em 0;
      color: #334155;
      font-style: italic;
      border-radius: 0 6px 6px 0;
    }

    .lesson-content code {
      font-family: Consolas, Monaco, "Courier New", Courier, monospace;
      font-size: 9.5pt;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .lesson-content pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: Consolas, Monaco, "Courier New", Courier, monospace;
      font-size: 9pt;
      line-height: 1.45;
      margin: 1em 0;
      page-break-inside: avoid;
    }

    .lesson-content pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    .lesson-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.2em 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    .lesson-content th, 
    .lesson-content td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }

    .lesson-content th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }

    .lesson-content tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .lesson-content hr {
      border: none;
      border-top: 1px solid #cbd5e1;
      margin: 1.5em 0;
    }

    .lesson-content img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 1em 0;
      page-break-inside: avoid;
    }

    .empty-notice {
      text-align: center;
      padding: 30px 10px;
      color: #64748b;
      font-style: italic;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
    }

    /* Rodapé Institucional */
    .footer-container {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #64748b;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- Cabeçalho -->
  <div class="header-container">
    <div class="school-info">
      <div>
        <div class="school-name">${schoolName}</div>
        <div class="course-name">${courseName}</div>
      </div>
      <div class="doc-badge">
        Plano de Aula & Conteúdo
      </div>
    </div>
  </div>

  <!-- Identificação da Aula -->
  <div class="lesson-meta-box">
    <span class="lesson-number-tag">Aula #${orderIndex}</span>
    <h1 class="lesson-title">${title}</h1>
    
    <div class="meta-pills">
      ${subjectName ? `<div class="meta-pill"><strong>Disciplina:</strong> ${subjectName}</div>` : ''}
      ${period ? `<div class="meta-pill"><strong>Período:</strong> ${period}</div>` : ''}
      <div class="meta-pill"><strong>Data:</strong> ${formattedDate}</div>
      ${evalType ? `<div class="meta-pill highlight">⭐ ${evalType}</div>` : ''}
    </div>
  </div>

  <!-- Materiais Extras -->
  ${resourcesHtml}

  <!-- Corpo Didático -->
  <div class="lesson-content">
    ${renderedContent}
  </div>

  <!-- Rodapé -->
  <div class="footer-container">
    <div>Gerado via Sistema Educacional • Informática BVA (${currentYear})</div>
    <div>Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>
    `;

    // Utiliza um iframe oculto para impressão limpa sem criar popup em branco
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();

      // Remove o iframe do DOM após a impressão
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 60000);
    } else {
      // Fallback caso iframe falhe
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
      }
    }
  } catch (error) {
    console.error('Erro ao exportar aula para PDF:', error);
    throw error;
  }
}
