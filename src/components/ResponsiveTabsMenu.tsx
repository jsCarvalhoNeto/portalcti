import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, BookOpen, Users, BarChart3, Settings, Calendar, GraduationCap, FileText, Shield, Edit, Eye, Trash2, Plus } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResponsiveTabsMenuProps {
 tabs: Array<{
    value: string;
    label: string;
    icon: React.ElementType;
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export default function ResponsiveTabsMenu({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = "max-w-4xl mx-auto mb-8"
}: ResponsiveTabsMenuProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Icones para cada tipo de tab
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'BookOpen': return BookOpen;
      case 'Users': return Users;
      case 'BarChart3': return BarChart3;
      case 'Settings': return Settings;
      case 'Calendar': return Calendar;
      case 'GraduationCap': return GraduationCap;
      case 'FileText': return FileText;
      case 'Shield': return Shield;
      case 'Edit': return Edit;
      case 'Eye': return Eye;
      case 'Trash2': return Trash2;
      case 'Plus': return Plus;
      default: return BookOpen;
    }
  };

  return (
    <div className={className}>
      {/* Desktop: Tabs normais */}
      <div className="hidden md:grid grid-cols-6 gap-3">
        {tabs.map((tab) => {
          const IconComponent = tab.icon || getIcon(tab.value);
          return (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === tab.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-xs">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </div>

      {/* Mobile: Menu hamburger */}
      <div className="md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Menu className="w-4 h-4 mr-2" />
              Menu
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                {tabs.find(tab => tab.value === activeTab)?.label}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-0">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Navegação</h3>
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon || getIcon(tab.value);
                  return (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "outline"}
                      className="h-12 flex flex-col items-center justify-center gap-1"
                      onClick={() => {
                        onTabChange(tab.value);
                        setSheetOpen(false);
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs">{tab.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
