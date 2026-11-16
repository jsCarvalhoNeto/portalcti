import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from "@/components/ui/swipeable-sheet";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoCurso from "@/assets/logocurso.png";
import { getPortalSettings, DEFAULT_MENU_ITEMS } from "@/services/portalSettingsService";
import { PortalMenuItem } from "@/types/portal";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, signOut, isAdmin, isStudent, isTeacher } = useAuth();
  const [navigationItems, setNavigationItems] = useState<PortalMenuItem[]>(
    DEFAULT_MENU_ITEMS.filter((item) => item.is_active)
  );

  const fetchMenu = async () => {
    try {
      const settings = await getPortalSettings();
      if (settings?.menu_items) {
        const activeItems = settings.menu_items
          .filter((item) => item.is_active)
          .sort((a, b) => a.order - b.order);
        setNavigationItems(activeItems);
      }
    } catch (err) {
      console.warn("Erro ao carregar menu dinâmico:", err);
    }
  };

  useEffect(() => {
    fetchMenu();

    const handleUpdate = () => {
      fetchMenu();
    };

    window.addEventListener("portal-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("portal-data-updated", handleUpdate);
    };
  }, []);

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

          {/* Mobile menu button + SwipeableSheet */}
          <div className="md:hidden">
            <SwipeableSheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SwipeableSheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                  aria-expanded={isMenuOpen}
                  className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </SwipeableSheetTrigger>
              <SwipeableSheetContent side="right" className="w-[82vw] max-w-xs bg-primary text-white border-l border-white/20 p-6">
                <div className="flex items-center space-x-2 pb-4 border-b border-white/20">
                  <img
                    src={logoCurso}
                    alt="Logo do Curso"
                    className="w-9 h-9 rounded-lg object-contain border border-white/30"
                  />
                  <div>
                    <p className="text-base font-bold text-white leading-tight">Portal Informática</p>
                    <p className="text-xs text-white/80">Curso Técnico</p>
                  </div>
                </div>

                <nav aria-label="Navegação mobile" className="flex flex-col space-y-2 mt-6">
                  {navigationItems.map((item) => (
                    item.href.startsWith('/') ? (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-white hover:bg-white/15 rounded-lg px-3 py-2.5 transition-colors duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a
                        key={item.name}
                        href={item.href}
                        className="text-white hover:bg-white/15 rounded-lg px-3 py-2.5 transition-colors duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    )
                  ))}

                  <div className="flex flex-col space-y-2 pt-4 mt-2 border-t border-white/20">
                    {user ? (
                      <>
                        {isStudent && (
                          <Button
                            variant="outline"
                            className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10"
                            asChild
                          >
                            <Link to="/student" onClick={() => setIsMenuOpen(false)}>
                              <User className="w-4 h-4 mr-2" />
                              Área do Aluno
                            </Link>
                          </Button>
                        )}
                        {isTeacher && (
                          <Button
                            variant="outline"
                            className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10"
                            asChild
                          >
                            <Link to="/teacher" onClick={() => setIsMenuOpen(false)}>
                              <User className="w-4 h-4 mr-2" />
                              Painel do Professor
                            </Link>
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="outline"
                            className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10"
                            asChild
                          >
                            <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                              <User className="w-4 h-4 mr-2" />
                              Painel Admin
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full justify-start border-white/40 text-white hover:bg-white/20 bg-white/10"
                          onClick={() => {
                            setIsMenuOpen(false);
                            signOut();
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sair
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full justify-start bg-white/25 text-white border border-white/50 hover:bg-white/35" asChild>
                        <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Fazer Login</Link>
                      </Button>
                    )}
                  </div>
                </nav>
              </SwipeableSheetContent>
            </SwipeableSheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
