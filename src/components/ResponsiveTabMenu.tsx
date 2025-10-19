import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, BookOpen, Users, BarChart3, Settings, Calendar, GraduationCap, FileText, Shield, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MenuItem {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface ResponsiveTabMenuProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
 menuItems: MenuItem[];
  className?: string;
  maxCols?: number;
}

export default function ResponsiveTabMenu({ 
  activeTab, 
  setActiveTab, 
 menuItems,
  className = '',
  maxCols = 6
}: ResponsiveTabMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mapear ícones para os valores de tab
  const getIconForTab = (value: string) => {
    const iconMap: Record<string, React.ElementType> = {
      overview: Home,
      subjects: BookOpen,
      activities: FileText,
      grades: BarChart3,
      calendar: Calendar,
      settings: Settings,
      students: Users,
      teachers: GraduationCap,
      users: Users,
      'grades-activities': BarChart3,
    };

    return iconMap[value] || BookOpen;
  };

 return (
    <>
      {/* Menu desktop - Tabs normais */}
      <div className="hidden md:block">
        <TabsList className={`grid w-full grid-cols-${maxCols} max-w-4xl mx-auto mb-8 gap-3 ${className}`}>
          {menuItems.map((item) => {
            const Icon = item.icon || getIconForTab(item.value);
            return (
              <TabsTrigger 
                key={item.value} 
                value={item.value}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Menu mobile - Sheet (hamburger) */}
      <div className="md:hidden">
        <div className="max-w-4xl mx-auto mb-8">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/100 transition-all duration-200">
                <span className="flex items-center gap-2">
                  {menuItems.find(item => item.value === activeTab) ? (
                    <>
                      {(() => {
                        const item = menuItems.find(item => item.value === activeTab);
                        const IconComponent = item?.icon || getIconForTab(activeTab);
                        return <IconComponent className="w-4 h-4" />;
                      })()}
                      <span className="font-medium">{menuItems.find(item => item.value === activeTab)?.label}</span>
                    </>
                  ) : (
                    <>
                      <Menu className="w-4 h-4" />
                      <span className="font-medium">Menu</span>
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full min-w-[24px] text-center font-mono">
                    {menuItems.length}
                  </span>
                  <div className="flex flex-col gap-1 transition-transform duration-200">
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                  </div>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Navegação</h3>
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon || getIconForTab(item.value);
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
    </>
  );
}
