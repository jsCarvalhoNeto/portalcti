export const EDUCATIONAL_GAME_PROTOCOL = 'educational-game:v1';

export type EducationalGameRole = 'teacher' | 'player';

export type EducationalGameEventType =
  | 'ready'
  | 'progress'
  | 'score'
  | 'complete'
  | 'error'
  | 'resize';

export interface EducationalGameRuntimeConfig {
  gameId?: string;
  roomId?: string;
  role: EducationalGameRole;
  locale: string;
  reducedMotion: boolean;
}

export interface EducationalGameMessage {
  protocol: typeof EDUCATIONAL_GAME_PROTOCOL;
  type: EducationalGameEventType;
  payload?: unknown;
}

export const isEducationalGameMessage = (value: unknown): value is EducationalGameMessage => {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<EducationalGameMessage>;
  return message.protocol === EDUCATIONAL_GAME_PROTOCOL
    && ['ready', 'progress', 'score', 'complete', 'error', 'resize'].includes(message.type || '');
};

/**
 * Creates the iframe document and installs a small, versioned portal API before
 * the author code runs. Existing games can ignore the API and remain compatible.
 */
export const createEducationalGameDocument = (
  code: string,
  config: EducationalGameRuntimeConfig & Record<string, unknown>
) => {
  const serializedConfig = JSON.stringify(config).replace(/</g, '\\u003c');
  const bootstrap = `<script>(function(){
    var protocol='${EDUCATIONAL_GAME_PROTOCOL}';
    var config=${serializedConfig};
    function emit(type,payload){parent.postMessage({protocol:protocol,type:type,payload:payload},'*')}
    window.__EDUCATIONAL_GAME_CONFIG__=Object.freeze(config);
    window.EducationalGame=Object.freeze({version:1,config:window.__EDUCATIONAL_GAME_CONFIG__,emit:emit,
      ready:function(payload){emit('ready',payload)},progress:function(payload){emit('progress',payload)},
      score:function(payload){emit('score',payload)},complete:function(payload){emit('complete',payload)},
      error:function(payload){emit('error',payload)},resize:function(height){emit('resize',{height:height})}});
    addEventListener('error',function(event){emit('error',{message:event.message})});
    addEventListener('unhandledrejection',function(event){emit('error',{message:String(event.reason||'Erro não tratado')})});
    addEventListener('DOMContentLoaded',function(){emit('ready',{title:document.title||undefined})},{once:true});
  })();<\/script>`;

  // Preserve the doctype as the first token; prepending a script would force
  // otherwise standards-compliant games into quirks mode.
  const headMatch = code.match(/<head(?:\s[^>]*)?>/i);
  if (headMatch?.index !== undefined) {
    const insertAt = headMatch.index + headMatch[0].length;
    return `${code.slice(0, insertAt)}${bootstrap}${code.slice(insertAt)}`;
  }

  const doctypeMatch = code.match(/^\s*<!doctype[^>]*>/i);
  const insertAt = doctypeMatch ? doctypeMatch[0].length : 0;
  return `${code.slice(0, insertAt)}${bootstrap}${code.slice(insertAt)}`;
};
