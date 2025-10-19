import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Heart
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Sobre o Curso", href: "#about" },
    { name: "Disciplinas", href: "#courses" },
    { name: "Projetos", href: "#projects" },
    { name: "Processo Seletivo", href: "#admission" },
  ];

  const resources = [
    { name: "Biblioteca Digital", href: "#library" },
    { name: "Portal do Aluno", href: "#student" },
    { name: "Calendário Acadêmico", href: "#calendar" }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Twitter, href: "#", name: "Twitter" },
    { icon: Youtube, href: "#", name: "YouTube" },
    { icon: Linkedin, href: "#", name: "LinkedIn" },
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
                  <p>R. Leonor Rufino, 943 - Sol Nascente, Brejo Santo - CE, 63260-000</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">(88) 998499645</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">professorsantosbva@gmail.com</span>
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
