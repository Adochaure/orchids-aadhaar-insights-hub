import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, PieChart as PieChartIcon, Maximize2, Minimize2 } from 'lucide-react';
import { ChartType } from '@/types/aadhaar';

interface ChartData {
  name: string;
  enrollments: number;
  demographics: number;
  biometrics: number;
}

interface ChartContainerProps {
  title: string;
  data: ChartData[];
  defaultType?: ChartType;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  '#22c55e',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ChartContainer({ title, data, defaultType = 'bar' }: ChartContainerProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultType);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartButtons = [
    { type: 'bar' as ChartType, icon: BarChart3, label: 'Bar' },
    { type: 'line' as ChartType, icon: LineChartIcon, label: 'Line' },
    { type: 'area' as ChartType, icon: AreaChartIcon, label: 'Area' },
    { type: 'pie' as ChartType, icon: PieChartIcon, label: 'Pie' },
  ];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const renderChart = (height: number) => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            <Bar dataKey="enrollments" fill={CHART_COLORS[0]} name="Enrollments" radius={[4, 4, 0, 0]} />
            <Bar dataKey="demographics" fill={CHART_COLORS[1]} name="Demographics" radius={[4, 4, 0, 0]} />
            <Bar dataKey="biometrics" fill={CHART_COLORS[2]} name="Biometrics" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="enrollments" stroke={CHART_COLORS[0]} strokeWidth={2} name="Enrollments" />
            <Line type="monotone" dataKey="demographics" stroke={CHART_COLORS[1]} strokeWidth={2} name="Demographics" />
            <Line type="monotone" dataKey="biometrics" stroke={CHART_COLORS[2]} strokeWidth={2} name="Biometrics" />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="enrollments" fill={CHART_COLORS[0]} stroke={CHART_COLORS[0]} fillOpacity={0.3} name="Enrollments" />
            <Area type="monotone" dataKey="demographics" fill={CHART_COLORS[1]} stroke={CHART_COLORS[1]} fillOpacity={0.3} name="Demographics" />
            <Area type="monotone" dataKey="biometrics" fill={CHART_COLORS[2]} stroke={CHART_COLORS[2]} fillOpacity={0.3} name="Biometrics" />
          </AreaChart>
        );
      case 'pie': {
        const pieData = [
          { name: 'Enrollments', value: data.reduce((sum, d) => sum + d.enrollments, 0) },
          { name: 'Demographics', value: data.reduce((sum, d) => sum + d.demographics, 0) },
          { name: 'Biometrics', value: data.reduce((sum, d) => sum + d.biometrics, 0) },
        ];
        const outerRadius = isFullscreen ? 150 : 70;
        const innerRadius = isFullscreen ? 80 : 40;
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: '10px' }}
            />
          </PieChart>
        );
      }
      default:
        return <div />;
    }
  };

  const renderCardContent = (fullscreen: boolean) => (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex gap-1">
          {chartButtons.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={chartType === type ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType(type)}
              className="h-8 w-8 p-0"
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0 ml-2"
            title={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={fullscreen ? 'flex-1' : ''}>
        <div className={fullscreen ? 'h-full w-full' : 'h-[300px] w-full'}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(fullscreen ? 500 : 300)}
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
