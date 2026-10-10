import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Instagram, 
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Heart,
  Github
} from "lucide-react";
import { getPortalSettings, DEFAULT_CONTACT_INFO, DEFAULT_SOCIAL_LINKS } from "@/services/portalSettingsService";
import { PortalContactInfo, PortalSocialLinks } from "@/types/portal";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [contactData, setContactData] = useState<PortalContactInfo>(DEFAULT_CONTACT_INFO);
  const [socialData, setSocialData] = useState<PortalSocialLinks>(DEFAULT_SOCIAL_LINKS);

  const fetchFooterSettings = async () => {
    try {
      const settings = await getPortalSettings();
      if (settings?.contact_info) setContactData(settings.contact_info);
      if (settings?.social_links) setSocialData(settings.social_links);
    } catch (err) {
      console.warn("Erro ao buscar dados do footer:", err);
    }
  };

  useEffect(() => {
    fetchFooterSettings();

    const handleUpdate = () => {
      fetchFooterSettings();
    };

    window.addEventListener("portal-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("portal-data-updated", handleUpdate);
    };
  }, []);

  const quickLinks = [
    { name: "Início", href: "/" },
    { name: "Disciplinas", href: "/disciplinas" },
    { name: "Projetos", href: "#projects" },
    { name: "Notícias", href: "#news" },
    { name: "Eventos", href: "/eventos" },
    { name: "Contato", href: "#contact" },
  ];

  const resources = [
    { name: "Biblioteca Digital", href: "#library" },
    { name: "Portal do Aluno", href: "/student" },
    { name: "Painel do Professor", href: "/teacher" },
    { name: "Calendário Acadêmico", href: "#calendar" }
  ];

  const socialLinks = [
    { icon: Instagram, href: socialData.instagram || "https://instagram.com", name: "Instagram" },
    { icon: Github, href: socialData.github || "https://github.com", name: "GitHub" },
    { icon: Youtube, href: socialData.youtube || "https://youtube.com", name: "YouTube" },
    { icon: Linkedin, href: socialData.linkedin || "#", name: "LinkedIn" },
  ];

  return (
    <footer className="bg-gradient-to-b from-primary/5 to-primary/10 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">TechPortal</h3>
                <p className="text-sm text-muted-foreground">Informática</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Formando os profissionais de tecnologia do futuro com ensino de qualidade, 
              infraestrutura moderna e metodologia inovadora.
            </p>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  asChild
                >
                  <a href={social.href} aria-label={social.name}>
                    <social.icon className="w-5 h-5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">
              Recursos
            </h4>
            <ul className="space-y-3">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <a
                    href={resource.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">
              Contato
            </h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-muted-foreground">
                  <p>{contactData.school_name} - {contactData.address}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{contactData.whatsapp || contactData.phone}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{contactData.email}</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <h5 className="text-md font-medium text-foreground mb-3">
                Receba Novidades
              </h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-l-lg focus:outline-none focus:border-primary"
                />
                <Button variant="hero" size="sm" className="rounded-l-none">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground">
                © {currentYear} TechPortal - Curso Técnico em Informática. Todos os direitos reservados.
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#privacy" className="hover:text-primary transition-colors">
                Política de Privacidade
              </a>
              <a href="#terms" className="hover:text-primary transition-colors">
                Termos de Uso
              </a>
              <div className="flex items-center space-x-1">
                <span>Feito com</span>
                <Heart className="w-4 h-4 text-red-500" />
                <span>para educação</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
