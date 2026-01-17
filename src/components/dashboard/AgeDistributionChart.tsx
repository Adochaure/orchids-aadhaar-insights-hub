import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';

export function AgeDistributionChart() {
  const { enrollmentData } = useData();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const ageData = [
    {
      name: '0-5 Years',
      count: enrollmentData.reduce((sum, d) => sum + d.age_0_5, 0),
    },
    {
      name: '5-17 Years',
      count: enrollmentData.reduce((sum, d) => sum + d.age_5_17, 0),
    },
    {
      name: '18+ Years',
      count: enrollmentData.reduce((sum, d) => sum + d.age_18_greater, 0),
    },
  ];

  const renderCardContent = (fullscreen: boolean) => (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Age Distribution (Enrollments)
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 p-0"
          title={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className={fullscreen ? 'flex-1' : ''}>
        <div className={fullscreen ? 'h-full w-full' : 'h-[250px]'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--chart-1))" 
                name="Count" 
                radius={[0, 4, 4, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </>
  );

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-4">
          <Card className="h-full flex flex-col">
            {renderCardContent(true)}
          </Card>
        </div>
      )}
      <Card>
        {renderCardContent(false)}
      </Card>
    </>
  );
}
