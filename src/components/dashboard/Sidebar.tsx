import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CSVUploader } from './CSVUploader';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Upload,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Brain,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-analyzer', label: 'AI Analyzer', icon: Brain },
    { id: 'upload', label: 'Upload Data', icon: Upload },
  ];

  return (
    <div
      className={`flex flex-col h-screen border-r bg-sidebar transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <Fingerprint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">Aadhaar</h1>
              <p className="text-xs text-sidebar-foreground/60">Analytics</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent ${isCollapsed ? 'px-2' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {!isCollapsed && activeView === 'upload' && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <p className="text-xs font-medium text-sidebar-foreground/60 px-2">
                DATA SOURCES
              </p>
              <CSVUploader type="enrollment" />
              <CSVUploader type="demographic" />
              <CSVUploader type="biometric" />
            </div>
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}>
          {!isCollapsed && (
            <Button variant="ghost" className="justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
