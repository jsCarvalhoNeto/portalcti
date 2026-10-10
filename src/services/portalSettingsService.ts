import { supabase } from '@/lib/supabaseClient';
import {
  PortalSettings,
  PortalMenuItem,
  PortalContactInfo,
  PortalSocialLinks,
  PortalNewsItem,
  PortalProjectItem,
  PortalEventItem
} from '@/types/portal';

// Chaves de armazenamento local para cache e fallback resiliente
const CACHE_KEYS = {
  SETTINGS: 'portal_settings_cache',
  NEWS: 'portal_news_cache',
  PROJECTS: 'portal_projects_cache',
  EVENTS: 'portal_events_cache',
};

// Dados padrão iniciais (idênticos ao estado original do portal)
export const DEFAULT_MENU_ITEMS: PortalMenuItem[] = [
  { id: 'inicio', name: 'Início', href: '/', is_active: true, order: 1 },
  { id: 'disciplinas', name: 'Disciplinas', href: '/disciplinas', is_active: true, order: 2 },
  { id: 'projetos', name: 'Projetos', href: '#projects', is_active: true, order: 3 },
  { id: 'noticias', name: 'Notícias', href: '#news', is_active: true, order: 4 },
  { id: 'eventos', name: 'Eventos', href: '/eventos', is_active: true, order: 5 },
  { id: 'contato', name: 'Contato', href: '#contact', is_active: true, order: 6 },
];

export const DEFAULT_CONTACT_INFO: PortalContactInfo = {
  school_name: 'EEEP Balbina Viana Arraes',
  course_name: 'Curso Técnico em Informática',
  address: 'Brejo Santo - CE',
  email: 'suporte@portalinfobva.tech',
  secondary_email: 'coordenacao@portalinfobva.tech',
  phone: '(88) 3531-0000',
  whatsapp: '(88) 99999-0000',
  business_hours: 'Segunda a Sexta: 07:30 às 17:00',
};

export const DEFAULT_SOCIAL_LINKS: PortalSocialLinks = {
  instagram: 'https://instagram.com',
  github: 'https://github.com',
  youtube: 'https://youtube.com',
  linkedin: '',
};

export const DEFAULT_NEWS: PortalNewsItem[] = [
  {
    id: 'news-1',
    title: 'IA Generativa Revoluciona Desenvolvimento de Software',
    excerpt: 'Novas ferramentas de IA estão transformando a forma como desenvolvedores criam e testam código, aumentando a produtividade em até 40%.',
    category: 'Tecnologia',
    read_time: '4 min',
    published_at: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    is_featured: true,
    is_active: true,
    display_order: 1,
  },
  {
    id: 'news-2',
    title: 'Lançamento do Novo Framework React 19',
    excerpt: 'O React 19 traz melhorias significativas no desempenho e novas APIs que simplificam o desenvolvimento de aplicações complexas.',
    category: 'Desenvolvimento',
    read_time: '3 min',
    published_at: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    is_featured: false,
    is_active: true,
    display_order: 2,
  },
  {
    id: 'news-3',
    title: 'Segurança em Aplicações Web: Novas Tendências',
    excerpt: 'Com o aumento de ataques cibernéticos, as melhores práticas de segurança estão evoluindo para proteger aplicações modernas contra ameaças emergentes.',
    category: 'Segurança',
    read_time: '5 min',
    published_at: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    is_featured: false,
    is_active: true,
    display_order: 3,
  },
];

export const DEFAULT_PROJECTS: PortalProjectItem[] = [
  {
    id: 'project-1',
    title: 'Portal Institucional do Curso Técnico',
    description: 'Plataforma completa para gestão acadêmica, gamificação, simuladores e portfólio de estudantes.',
    category: 'Web',
    technologies: ['React', 'TypeScript', 'TailwindCSS', 'Supabase'],
    author_name: 'Turma do 3º Ano',
    is_featured: true,
    is_active: true,
    display_order: 1,
  },
  {
    id: 'project-2',
    title: 'Laboratório de Jogos Educacionais',
    description: 'Mini-jogos e simuladores de lógica de programação e algoritmos desenvolvidos pelos estudantes.',
    category: 'Games',
    technologies: ['JavaScript', 'HTML5 Canvas', 'CSS3'],
    author_name: 'Turma do 2º Ano',
    is_featured: true,
    is_active: true,
    display_order: 2,
  },
];

export const DEFAULT_MAIN_EVENT: PortalEventItem = {
  id: 'event-1',
  title: 'Saberes em Conexão',
  subtitle: 'Escola, Ciência e Sociedade 2025',
  description: 'Um evento que conecta conhecimento acadêmico, pesquisa científica e aplicação prática na sociedade, promovendo a integração entre escola, universidade e comunidade.',
  start_date: '2025-12-08',
  end_date: '2025-12-12',
  location: 'EEEP Balbina Viana Arraes',
  attendees_count: 0,
  event_type: 'Evento',
  status: 'registration-closed',
  registration_url: '/eventos/inscricao',
  is_main_event: true,
  is_active: true,
  display_order: 1,
};

// Notificar componentes em tempo real sobre alterações
const notifyUpdate = (type: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('portal-data-updated', { detail: { type } }));
  }
};

// Funções auxiliares de cache local
function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Erro ao ler cache ${key}:`, err);
  }
  return fallback;
}

function saveCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Erro ao gravar cache ${key}:`, err);
  }
}

/* =====================================================================
 * 1. CONFIGURAÇÕES GERAIS (MENU, CONTATO, REDES SOCIAIS, DESTAQUES)
 * ===================================================================== */

export async function getPortalSettings(): Promise<PortalSettings> {
  const fallbackSettings: PortalSettings = {
    id: 'main',
    menu_items: DEFAULT_MENU_ITEMS,
    contact_info: DEFAULT_CONTACT_INFO,
    social_links: DEFAULT_SOCIAL_LINKS,
    featured_subjects: [],
  };

  const cached = loadCache<PortalSettings>(CACHE_KEYS.SETTINGS, fallbackSettings);

  try {
    const { data, error } = await supabase
      .from('portal_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();

    if (!error && data) {
      const merged: PortalSettings = {
        id: data.id || 'main',
        menu_items: Array.isArray(data.menu_items) && data.menu_items.length > 0 ? data.menu_items : DEFAULT_MENU_ITEMS,
        contact_info: data.contact_info || DEFAULT_CONTACT_INFO,
        social_links: data.social_links || DEFAULT_SOCIAL_LINKS,
        featured_subjects: data.featured_subjects || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      saveCache(CACHE_KEYS.SETTINGS, merged);
      return merged;
    }
  } catch (err) {
    console.warn('Erro ao consultar portal_settings no Supabase, usando cache/fallback:', err);
  }

  return cached;
}

export async function savePortalSettings(settings: Partial<PortalSettings>): Promise<PortalSettings> {
  const current = await getPortalSettings();
  const updated: PortalSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  saveCache(CACHE_KEYS.SETTINGS, updated);

  try {
    const { error } = await supabase
      .from('portal_settings')
      .upsert({
        id: 'main',
        menu_items: updated.menu_items,
        contact_info: updated.contact_info,
        social_links: updated.social_links,
        featured_subjects: updated.featured_subjects,
        updated_at: updated.updated_at,
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Erro ao sincronizar portal_settings no Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Falha de rede ao salvar portal_settings no Supabase:', err);
  }

  notifyUpdate('settings');
  return updated;
}

export async function updatePortalMenuItems(menuItems: PortalMenuItem[]): Promise<PortalMenuItem[]> {
  const updatedSettings = await savePortalSettings({ menu_items: menuItems });
  return updatedSettings.menu_items;
}

export async function updatePortalContactInfo(contactInfo: PortalContactInfo): Promise<PortalContactInfo> {
  const updatedSettings = await savePortalSettings({ contact_info: contactInfo });
  return updatedSettings.contact_info;
}

export async function updatePortalSocialLinks(socialLinks: PortalSocialLinks): Promise<PortalSocialLinks> {
  const updatedSettings = await savePortalSettings({ social_links: socialLinks });
  return updatedSettings.social_links;
}

/* =====================================================================
 * 2. GERENCIADOR DE NOTÍCIAS (PORTAL_NEWS)
 * ===================================================================== */

export async function getPortalNews(onlyActive = true): Promise<PortalNewsItem[]> {
  const cached = loadCache<PortalNewsItem[]>(CACHE_KEYS.NEWS, DEFAULT_NEWS);

  try {
    let query = supabase
      .from('portal_news')
      .select('*')
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      saveCache(CACHE_KEYS.NEWS, data);
      return data;
    }
  } catch (err) {
    console.warn('Erro ao consultar portal_news, usando fallback:', err);
  }

  return onlyActive ? cached.filter(n => n.is_active) : cached;
}

export async function savePortalNewsItem(item: PortalNewsItem): Promise<PortalNewsItem> {
  const cachedList = loadCache<PortalNewsItem[]>(CACHE_KEYS.NEWS, DEFAULT_NEWS);
  let savedItem: PortalNewsItem = { ...item };

  try {
    if (item.id && !item.id.startsWith('news-')) {
      const { data, error } = await supabase
        .from('portal_news')
        .update({
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          category: item.category,
          read_time: item.read_time,
          image_url: item.image_url,
          author_name: item.author_name,
          published_at: item.published_at,
          is_featured: item.is_featured,
          is_active: item.is_active,
          display_order: item.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      }
    } else {
      const { data, error } = await supabase
        .from('portal_news')
        .insert([{
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          category: item.category,
          read_time: item.read_time,
          image_url: item.image_url,
          author_name: item.author_name,
          published_at: item.published_at || new Date().toISOString().split('T')[0],
          is_featured: item.is_featured ?? false,
          is_active: item.is_active ?? true,
          display_order: item.display_order ?? 0,
        }])
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      } else {
        savedItem = { ...item, id: item.id || `news-${Date.now()}` };
      }
    }
  } catch (err) {
    console.warn('Erro ao gravar notícia no Supabase, atualizando localmente:', err);
    savedItem = { ...item, id: item.id || `news-${Date.now()}` };
  }

  // Atualizar cache
  const idx = cachedList.findIndex(n => n.id === savedItem.id);
  const updatedList = idx >= 0
    ? cachedList.map(n => n.id === savedItem.id ? savedItem : n)
    : [savedItem, ...cachedList];

  saveCache(CACHE_KEYS.NEWS, updatedList);
  notifyUpdate('news');
  return savedItem;
}

export async function deletePortalNewsItem(id: string): Promise<boolean> {
  try {
    if (!id.startsWith('news-')) {
      await supabase.from('portal_news').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Erro ao deletar notícia no Supabase:', err);
  }

  const cachedList = loadCache<PortalNewsItem[]>(CACHE_KEYS.NEWS, DEFAULT_NEWS);
  const filtered = cachedList.filter(n => n.id !== id);
  saveCache(CACHE_KEYS.NEWS, filtered);
  notifyUpdate('news');
  return true;
}

/* =====================================================================
 * 3. VITRINE DE PROJETOS (PORTAL_PROJECTS)
 * ===================================================================== */

export async function getPortalProjects(onlyActive = true): Promise<PortalProjectItem[]> {
  const cached = loadCache<PortalProjectItem[]>(CACHE_KEYS.PROJECTS, DEFAULT_PROJECTS);

  try {
    let query = supabase
      .from('portal_projects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      saveCache(CACHE_KEYS.PROJECTS, data);
      return data;
    }
  } catch (err) {
    console.warn('Erro ao consultar portal_projects, usando fallback:', err);
  }

  return onlyActive ? cached.filter(p => p.is_active) : cached;
}

export async function savePortalProjectItem(item: PortalProjectItem): Promise<PortalProjectItem> {
  const cachedList = loadCache<PortalProjectItem[]>(CACHE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  let savedItem: PortalProjectItem = { ...item };

  try {
    if (item.id && !item.id.startsWith('project-')) {
      const { data, error } = await supabase
        .from('portal_projects')
        .update({
          title: item.title,
          description: item.description,
          category: item.category,
          technologies: item.technologies,
          author_name: item.author_name,
          repo_url: item.repo_url,
          demo_url: item.demo_url,
          image_url: item.image_url,
          is_featured: item.is_featured,
          is_active: item.is_active,
          display_order: item.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      }
    } else {
      const { data, error } = await supabase
        .from('portal_projects')
        .insert([{
          title: item.title,
          description: item.description,
          category: item.category,
          technologies: item.technologies,
          author_name: item.author_name,
          repo_url: item.repo_url,
          demo_url: item.demo_url,
          image_url: item.image_url,
          is_featured: item.is_featured ?? true,
          is_active: item.is_active ?? true,
          display_order: item.display_order ?? 0,
        }])
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      } else {
        savedItem = { ...item, id: item.id || `project-${Date.now()}` };
      }
    }
  } catch (err) {
    console.warn('Erro ao gravar projeto no Supabase, atualizando localmente:', err);
    savedItem = { ...item, id: item.id || `project-${Date.now()}` };
  }

  const idx = cachedList.findIndex(p => p.id === savedItem.id);
  const updatedList = idx >= 0
    ? cachedList.map(p => p.id === savedItem.id ? savedItem : p)
    : [savedItem, ...cachedList];

  saveCache(CACHE_KEYS.PROJECTS, updatedList);
  notifyUpdate('projects');
  return savedItem;
}

export async function deletePortalProjectItem(id: string): Promise<boolean> {
  try {
    if (!id.startsWith('project-')) {
      await supabase.from('portal_projects').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Erro ao deletar projeto no Supabase:', err);
  }

  const cachedList = loadCache<PortalProjectItem[]>(CACHE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  const filtered = cachedList.filter(p => p.id !== id);
  saveCache(CACHE_KEYS.PROJECTS, filtered);
  notifyUpdate('projects');
  return true;
}

/* =====================================================================
 * 4. EVENTOS DO PORTAL (PORTAL_EVENTS)
 * ===================================================================== */

export async function getPortalEvents(onlyActive = true): Promise<PortalEventItem[]> {
  const cached = loadCache<PortalEventItem[]>(CACHE_KEYS.EVENTS, [DEFAULT_MAIN_EVENT]);

  try {
    let query = supabase
      .from('portal_events')
      .select('*')
      .order('is_main_event', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      saveCache(CACHE_KEYS.EVENTS, data);
      return data;
    }
  } catch (err) {
    console.warn('Erro ao consultar portal_events, usando fallback:', err);
  }

  return onlyActive ? cached.filter(e => e.is_active) : cached;
}

export async function getMainPortalEvent(): Promise<PortalEventItem> {
  const events = await getPortalEvents(true);
  const main = events.find(e => e.is_main_event);
  return main || events[0] || DEFAULT_MAIN_EVENT;
}

export async function savePortalEventItem(item: PortalEventItem): Promise<PortalEventItem> {
  const cachedList = loadCache<PortalEventItem[]>(CACHE_KEYS.EVENTS, [DEFAULT_MAIN_EVENT]);
  let savedItem: PortalEventItem = { ...item };

  try {
    // Se este evento estiver sendo marcado como principal, desmarcar outros
    if (item.is_main_event) {
      await supabase
        .from('portal_events')
        .update({ is_main_event: false })
        .neq('id', item.id || '');
    }

    if (item.id && !item.id.startsWith('event-')) {
      const { data, error } = await supabase
        .from('portal_events')
        .update({
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          start_date: item.start_date,
          end_date: item.end_date,
          location: item.location,
          attendees_count: item.attendees_count,
          event_type: item.event_type,
          status: item.status,
          registration_url: item.registration_url,
          is_main_event: item.is_main_event,
          is_active: item.is_active,
          display_order: item.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      }
    } else {
      const { data, error } = await supabase
        .from('portal_events')
        .insert([{
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          start_date: item.start_date,
          end_date: item.end_date,
          location: item.location,
          attendees_count: item.attendees_count || 0,
          event_type: item.event_type || 'Evento',
          status: item.status || 'registration-open',
          registration_url: item.registration_url || '/eventos/inscricao',
          is_main_event: item.is_main_event ?? false,
          is_active: item.is_active ?? true,
          display_order: item.display_order ?? 0,
        }])
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      } else {
        savedItem = { ...item, id: item.id || `event-${Date.now()}` };
      }
    }
  } catch (err) {
    console.warn('Erro ao gravar evento no Supabase, atualizando localmente:', err);
    savedItem = { ...item, id: item.id || `event-${Date.now()}` };
  }

  // Atualizar cache com ajuste de evento principal
  const updatedList = cachedList.map(e => {
    if (savedItem.is_main_event && e.id !== savedItem.id) {
      return { ...e, is_main_event: false };
    }
    return e;
  });

  const idx = updatedList.findIndex(e => e.id === savedItem.id);
  const finalList = idx >= 0
    ? updatedList.map(e => e.id === savedItem.id ? savedItem : e)
    : [savedItem, ...updatedList];

  saveCache(CACHE_KEYS.EVENTS, finalList);
  notifyUpdate('events');
  return savedItem;
}

export async function deletePortalEventItem(id: string): Promise<boolean> {
  try {
    if (!id.startsWith('event-')) {
      await supabase.from('portal_events').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Erro ao deletar evento no Supabase:', err);
  }

  const cachedList = loadCache<PortalEventItem[]>(CACHE_KEYS.EVENTS, [DEFAULT_MAIN_EVENT]);
  const filtered = cachedList.filter(e => e.id !== id);
  saveCache(CACHE_KEYS.EVENTS, filtered);
  notifyUpdate('events');
  return true;
}
