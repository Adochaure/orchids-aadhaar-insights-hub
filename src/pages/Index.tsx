import { useState } from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Chatbot } from '@/components/dashboard/Chatbot';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Dashboard view={activeView} />
        </ScrollArea>
      </main>
      <Chatbot />
    </div>
  );
};

export default Index;
