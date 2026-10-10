export interface PortalMenuItem {
  id: string;
  name: string;
  href: string;
  is_active: boolean;
  order: number;
}

export interface PortalContactInfo {
  school_name: string;
  course_name: string;
  address: string;
  email: string;
  secondary_email?: string;
  phone: string;
  whatsapp?: string;
  business_hours: string;
}

export interface PortalSocialLinks {
  instagram: string;
  github: string;
  youtube: string;
  linkedin: string;
}

export interface PortalSettings {
  id: string;
  menu_items: PortalMenuItem[];
  contact_info: PortalContactInfo;
  social_links: PortalSocialLinks;
  featured_subjects: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PortalNewsItem {
  id?: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category: string;
  read_time: string;
  image_url?: string | null;
  author_name?: string | null;
  published_at: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PortalProjectItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  author_name?: string | null;
  repo_url?: string | null;
  demo_url?: string | null;
  image_url?: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export type PortalEventStatus = 'registration-open' | 'registration-closed' | 'upcoming' | 'finished';

export interface PortalEventItem {
  id?: string;
  title: string;
  subtitle?: string | null;
  description: string;
  start_date?: string | null;
  end_date?: string | null;
  location: string;
  attendees_count: number;
  event_type: string;
  status: PortalEventStatus;
  registration_url?: string | null;
  is_main_event: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}
