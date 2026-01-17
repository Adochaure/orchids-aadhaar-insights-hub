import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';

export function TrendChart() {
  const { enrollmentData, demographicData, biometricData } = useData();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const trendData = useMemo(() => {
    const dateMap = new Map<string, { enrollments: number; demographics: number; biometrics: number }>();

    enrollmentData.forEach((d) => {
      if (!d.date || d.date === 'undefined' || d.date === 'null') return;
      const existing = dateMap.get(d.date) || { enrollments: 0, demographics: 0, biometrics: 0 };
      existing.enrollments += d.age_0_5 + d.age_5_17 + d.age_18_greater;
      dateMap.set(d.date, existing);
    });

    demographicData.forEach((d) => {
      if (!d.date || d.date === 'undefined' || d.date === 'null') return;
      const existing = dateMap.get(d.date) || { enrollments: 0, demographics: 0, biometrics: 0 };
      existing.demographics += d.demo_age_5_17 + d.demo_age_17_plus;
      dateMap.set(d.date, existing);
    });

    biometricData.forEach((d) => {
      if (!d.date || d.date === 'undefined' || d.date === 'null') return;
      const existing = dateMap.get(d.date) || { enrollments: 0, demographics: 0, biometrics: 0 };
      existing.biometrics += d.bio_age_5_17 + d.bio_age_17_plus;
      dateMap.set(d.date, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .filter(item => {
        const parsed = new Date(item.date);
        return !isNaN(parsed.getTime());
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [enrollmentData, demographicData, biometricData]);

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderCardContent = (fullscreen: boolean) => (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Activity Trends Over Time</CardTitle>
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
          {trendData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No date data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={formatDate}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    if (isNaN(date.getTime())) return label;
                    return date.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="enrollments" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={false}
                  name="Enrollments"
                />
                <Line 
                  type="monotone" 
                  dataKey="demographics" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                  name="Demographics"
                />
                <Line 
                  type="monotone" 
                  dataKey="biometrics" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                  name="Biometrics"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
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
