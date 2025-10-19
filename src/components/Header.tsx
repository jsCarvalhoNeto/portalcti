import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoCurso from "@/assets/logocurso.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, signOut, isAdmin, isStudent, isTeacher } = useAuth();

  const navigationItems = [
    { name: "Início", href: "/" },
    { name: "Disciplinas", href: "/disciplinas" },
    { name: "Projetos", href: "#projects" },
    { name: "Notícias", href: "#news" },
    { name: "Eventos", href: "#events" },
    { name: "Contato", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary/30 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg">
            <img 
              src={logoCurso} 
              alt="Logo do Curso" 
              className="w-10 h-10 rounded-lg object-contain backdrop-blur-sm border border-white/30"
            />
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-sm">Portal Informática</h1>
              <p className="text-xs text-white/90 drop-shadow-sm">Curso Técnico</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              item.href.startsWith('/') ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-white hover:text-white/80 transition-colors duration-200 font-medium text-sm drop-shadow-sm hover:drop-shadow-md"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-white/80 transition-colors duration-200 font-medium text-sm drop-shadow-sm hover:drop-shadow-md"
                >
                  {item.name}
                </a>
              )
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isStudent && (
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm" asChild>
                    <Link to="/student">
                      <User className="w-4 h-4 mr-2" />
                      Área do Aluno
                    </Link>
                  </Button>
                )}
                {isTeacher && (
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm" asChild>
                    <Link to="/teacher">
                      <User className="w-4 h-4 mr-2" />
                      Painel do Professor
                    </Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm" asChild>
                    <Link to="/admin">
                      <User className="w-4 h-4 mr-2" />
                      Painel Admin
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button className="bg-white/25 backdrop-blur-sm text-white border border-white/50 hover:bg-white/35 hover:border-white/70 shadow-lg" asChild>
                <Link to="/auth">Fazer Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/30 animate-fade-in bg-primary/90 backdrop-blur-md">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                item.href.startsWith('/') ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-white hover:text-white/80 transition-colors duration-200 font-medium py-2 drop-shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-white hover:text-white/80 transition-colors duration-200 font-medium py-2 drop-shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                )
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-white/30">
                {user ? (
                  <>
                    {isStudent && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                        asChild
                      >
                        <Link to="/student">
                          <User className="w-4 h-4 mr-2" />
                          Área do Aluno
                        </Link>
                      </Button>
                    )}
                    {isTeacher && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                        asChild
                      >
                        <Link to="/teacher">
                          <User className="w-4 h-4 mr-2" />
                          Painel do Professor
                        </Link>
                      </Button>
                    )}
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                        asChild
                      >
                        <Link to="/admin">
                          <User className="w-4 h-4 mr-2" />
                          Painel Admin
                        </Link>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                      onClick={signOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <Button className="w-full justify-start bg-white/25 backdrop-blur-sm text-white border border-white/50 hover:bg-white/35 hover:border-white/70" asChild>
                    <Link to="/auth">Fazer Login</Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
