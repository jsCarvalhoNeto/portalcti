// Teste de responsividade dos menus
// Este arquivo é apenas para verificar que todos os imports estão corretos

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, BookOpen, Users, BarChart3, Settings, Calendar, GraduationCap, FileText } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ResponsiveMenuTest = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { value: 'overview', label: 'Visão Geral', icon: Home },
    { value: 'subjects', label: 'Minhas Disciplinas', icon: BookOpen },
    { value: 'activities', label: 'Atividades', icon: FileText },
    { value: 'grades', label: 'Notas & Desempenho', icon: BarChart3 },
    { value: 'calendar', label: 'Calendário', icon: Calendar },
    { value: 'settings', label: 'Configurações', icon: Settings },
  ];

  const getTabLabel = (tabValue: string) => {
    const labels: Record<string, string> = {
      overview: 'Visão Geral',
      subjects: 'Minhas Disciplinas',
      activities: 'Atividades',
      grades: 'Notas & Desempenho',
      calendar: 'Calendário',
      settings: 'Configurações',
      users: 'Usuários',
      students: 'Estudantes',
      teachers: 'Professores',
    };
    return labels[tabValue] || tabValue;
  };

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <TabsList className="hidden md:grid w-full grid-cols-6 gap-3">
        {menuItems.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {/* Menu mobile - Sheet (hamburger) */}
      <div className="md:hidden">
        <div className="w-full">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  {getTabLabel(activeTab)}
                </span>
                <Menu className="w-4 h-4 ml-2" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Navegação</h3>
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.value}
                        variant={activeTab === item.value ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab(item.value);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};
