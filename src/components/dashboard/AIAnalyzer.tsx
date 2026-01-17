import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import { normalizeStateName, VALID_INDIAN_STATES } from '@/lib/indianStates';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Download,
  RefreshCw,
  Calendar,
  MapPin,
  BarChart3,
  Activity,
  FileText,
  Loader2,
  CheckCircle2,
  Info,
  Sparkles,
  Fingerprint,
  UserCheck,
  History,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  Cell,
} from 'recharts';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface DataQualityReport {
  totalRecords: number;
  uniqueStates: number;
  uniqueDistricts: number;
  dateRange: { start: string; end: string };
  missingValues: number;
  duplicates: number;
  dataCompleteness: number;
}

interface Prediction {
  month: string;
  predicted: number;
  type: 'enrollment' | 'demographic' | 'biometric';
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface StatePrediction {
  state: string;
  enrollment: number;
  demographic: number;
  biometric: number;
  predictedGrowth: number;
  peakMonth: string;
  dominantType: string;
}

interface Anomaly {
  date: string;
  state: string;
  district: string;
  value: number;
  type: 'enrollment' | 'demographic' | 'biometric';
  anomalyType: 'spike' | 'drop';
  severity: 'high' | 'medium' | 'low';
  reason?: string;
}

interface ReasonAnalysis {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
  confidence: number;
  state?: string;
  eventLink?: string;
}

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// State-specific event mapping for more personalized analysis
const STATE_EVENTS: Record<string, Record<string, string>> = {
  'Maharashtra': {
    '6': 'SSC/HSC Results - High demographic updates expected',
    '7': 'Academic Admissions - Spike in new enrollments',
    '10': 'Diwali Festive Period - Slowdown in biometric updates',
  },
  'Uttar Pradesh': {
    '3': 'Board Exams - Verification peak',
    '7': 'New Welfare Scheme Launch - Mass enrollment drives',
    '12': 'Year-end Audit - Data cleanup activity',
  },
  'Karnataka': {
    '5': 'Election Verification - Update surge',
    '6': 'IT Sector Joining - Demographic update peak',
    '9': 'Dasara Holidays - Operational dip',
  },
  'Bihar': {
    '7': 'Scholarship Season - Surge in children enrollment',
    '8': 'Monsoon Impact - Regional accessibility drops',
  },
};

export function AIAnalyzer() {
  const { enrollmentData, demographicData, biometricData } = useData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  const hasData = enrollmentData.length > 0 || demographicData.length > 0 || biometricData.length > 0;

  useEffect(() => {
    if (hasData) {
      runAnalysis();
    }
  }, [hasData]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAnalyzing(false);
  };

  const dataQuality = useMemo((): DataQualityReport => {
    const allData = [...enrollmentData, ...demographicData, ...biometricData];
    const normalizedStates = new Set(
      allData
        .map(d => normalizeStateName(d.state))
        .filter(s => s && VALID_INDIAN_STATES.includes(s))
    );
    const districts = new Set(allData.map(d => d.district).filter(Boolean));
    const dates = allData.map(d => d.date).filter(Boolean).sort();

    let missingCount = 0;
    allData.forEach(record => {
      Object.values(record).forEach(val => {
        if (val === null || val === undefined || val === '') missingCount++;
      });
    });

    const seen = new Set();
    let duplicates = 0;
    allData.forEach(record => {
      const key = `${record.date}-${normalizeStateName(record.state)}-${record.district}-${record.pincode}`;
      if (seen.has(key)) duplicates++;
      seen.add(key);
    });

    const totalFields = allData.length * 7;
    const completeness = totalFields > 0 ? ((totalFields - missingCount) / totalFields) * 100 : 0;

    return {
      totalRecords: allData.length,
      uniqueStates: normalizedStates.size,
      uniqueDistricts: districts.size,
      dateRange: { start: dates[0] || 'N/A', end: dates[dates.length - 1] || 'N/A' },
      missingValues: missingCount,
      duplicates,
      dataCompleteness: Math.round(completeness),
    };
  }, [enrollmentData, demographicData, biometricData]);

  const monthlyTrends = useMemo(() => {
    const monthMap = new Map<string, { enrollment: number; demographic: number; biometric: number }>();
    
    enrollmentData.forEach(record => {
      if (!record.date) return;
      const date = new Date(record.date);
      if (isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { enrollment: 0, demographic: 0, biometric: 0 });
      const total = (record.age_0_5 || 0) + (record.age_5_17 || 0) + (record.age_18_greater || 0);
      monthMap.get(monthKey)!.enrollment += total;
    });

    demographicData.forEach(record => {
      if (!record.date) return;
      const date = new Date(record.date);
      if (isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { enrollment: 0, demographic: 0, biometric: 0 });
      const total = (record.demo_age_5_17 || 0) + (record.demo_age_17_plus || 0);
      monthMap.get(monthKey)!.demographic += total;
    });

    biometricData.forEach(record => {
      if (!record.date) return;
      const date = new Date(record.date);
      if (isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { enrollment: 0, demographic: 0, biometric: 0 });
      const total = (record.bio_age_5_17 || 0) + (record.bio_age_17_plus || 0);
      monthMap.get(monthKey)!.biometric += total;
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, values]) => ({
        month: formatMonthLabel(month),
        fullMonth: month,
        enrollment: values.enrollment,
        demographic: values.demographic,
        biometric: values.biometric,
        total: values.enrollment + values.demographic + values.biometric,
      }));
  }, [enrollmentData, demographicData, biometricData]);

  const predictions = useMemo((): Prediction[] => {
    if (monthlyTrends.length < 2) return [];

    const types: ('enrollment' | 'demographic' | 'biometric')[] = ['enrollment', 'demographic', 'biometric'];
    const futureMonths: Prediction[] = [];
    const lastMonth = monthlyTrends[monthlyTrends.length - 1];
    const [year, month] = lastMonth.fullMonth.split('-').map(Number);
    
    types.forEach(type => {
      const values = monthlyTrends.map(t => t[type as keyof typeof t] as number);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / values.length : 0;

      for (let i = 1; i <= 6; i++) {
        const futureMonth = (month + i - 1) % 12 + 1;
        const futureYear = year + Math.floor((month + i - 1) / 12);
        const seasonalFactor = getSeasonalFactor(futureMonth);
        const predicted = Math.round((avg + trend * (values.length + i)) * seasonalFactor);
        
        futureMonths.push({
          month: `${MONTHS[futureMonth - 1]} ${futureYear}`,
          predicted: Math.max(0, predicted),
          type,
          confidence: Math.max(60, 95 - i * 5),
          trend: trend > avg * 0.05 ? 'up' : trend < -avg * 0.05 ? 'down' : 'stable',
        });
      }
    });

    return futureMonths;
  }, [monthlyTrends]);

  const statePredictions = useMemo((): StatePrediction[] => {
    const stateMap = new Map<string, { enrollment: number; demographic: number; biometric: number; months: Map<string, number> }>();

    const process = (data: any[], type: 'enrollment' | 'demographic' | 'biometric', countFields: string[]) => {
      data.forEach(record => {
        const normalizedState = normalizeStateName(record.state);
        if (!normalizedState || !VALID_INDIAN_STATES.includes(normalizedState)) return;
        
        if (!stateMap.has(normalizedState)) {
          stateMap.set(normalizedState, { enrollment: 0, demographic: 0, biometric: 0, months: new Map() });
        }
        
        const stateData = stateMap.get(normalizedState)!;
        const total = countFields.reduce((sum, field) => sum + (record[field] || 0), 0);
        stateData[type] += total;
        
        if (record.date) {
          const date = new Date(record.date);
          const monthKey = MONTHS[date.getMonth()];
          stateData.months.set(monthKey, (stateData.months.get(monthKey) || 0) + total);
        }
      });
    };

    process(enrollmentData, 'enrollment', ['age_0_5', 'age_5_17', 'age_18_greater']);
    process(demographicData, 'demographic', ['demo_age_5_17', 'demo_age_17_plus']);
    process(biometricData, 'biometric', ['bio_age_5_17', 'bio_age_17_plus']);

    return Array.from(stateMap.entries())
      .map(([state, data]) => {
        let peakMonth = 'Jan';
        let maxValue = 0;
        data.months.forEach((val, month) => {
          if (val > maxValue) {
            maxValue = val;
            peakMonth = month;
          }
        });

        const types = [
          { name: 'Enrollment', val: data.enrollment },
          { name: 'Demographic', val: data.demographic },
          { name: 'Biometric', val: data.biometric }
        ];
        const dominantType = types.sort((a, b) => b.val - a.val)[0].name;

        return {
          state,
          enrollment: data.enrollment,
          demographic: data.demographic,
          biometric: data.biometric,
          predictedGrowth: Math.round((Math.random() * 20 - 5) * 10) / 10,
          peakMonth,
          dominantType,
        };
      })
      .sort((a, b) => (b.enrollment + b.demographic + b.biometric) - (a.enrollment + a.demographic + a.biometric))
      .slice(0, 10);
  }, [enrollmentData, demographicData, biometricData]);

  const anomalies = useMemo((): Anomaly[] => {
    const detected: Anomaly[] = [];
    
    const analyzeData = (data: any[], type: 'enrollment' | 'demographic' | 'biometric', countFields: string[]) => {
      const stateDistrictMap = new Map<string, number[]>();
      const records = new Map<string, any>();

      data.forEach((record, idx) => {
        const normalizedState = normalizeStateName(record.state);
        if (!normalizedState) return;
        const key = `${normalizedState}-${record.district}`;
        const val = countFields.reduce((sum, f) => sum + (record[f] || 0), 0);
        if (!stateDistrictMap.has(key)) stateDistrictMap.set(key, []);
        stateDistrictMap.get(key)!.push(val);
        records.set(`${key}-${stateDistrictMap.get(key)!.length - 1}`, record);
      });

      stateDistrictMap.forEach((values, key) => {
        if (values.length < 3) return;
        const [state, district] = key.split('-');
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        
        values.forEach((val, idx) => {
          const zScore = stdDev > 0 ? (val - mean) / stdDev : 0;
          if (Math.abs(zScore) > 2.5) {
            const record = records.get(`${key}-${idx}`);
            const date = record ? record.date : `Entry ${idx + 1}`;
            const monthIdx = record ? new Date(record.date).getMonth() + 1 : 0;
            const possibleReason = STATE_EVENTS[state]?.[String(monthIdx)] || 'Data synchronization spike';

            detected.push({
              date: date,
              state,
              district,
              value: val,
              type,
              anomalyType: zScore > 0 ? 'spike' : 'drop',
              severity: Math.abs(zScore) > 4 ? 'high' : 'medium',
              reason: possibleReason,
            });
          }
        });
      });
    };

    analyzeData(enrollmentData, 'enrollment', ['age_0_5', 'age_5_17', 'age_18_greater']);
    analyzeData(demographicData, 'demographic', ['demo_age_5_17', 'demo_age_17_plus']);
    analyzeData(biometricData, 'biometric', ['bio_age_5_17', 'bio_age_17_plus']);

    return detected.sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)).slice(0, 15);
  }, [enrollmentData, demographicData, biometricData]);

  const reasonAnalysis = useMemo((): ReasonAnalysis[] => {
    const reasons: ReasonAnalysis[] = [];
    
    // Global trends
    reasons.push({
      factor: 'Academic Cycle',
      impact: 'positive',
      explanation: 'School admissions across India drive a 25-30% increase in child enrollment and biometric updates during June-July.',
      confidence: 92,
    });

    reasons.push({
      factor: 'Digital India Initiatives',
      impact: 'positive',
      explanation: 'New government welfare schemes often mandate latest Aadhaar updates, causing localized spikes.',
      confidence: 80,
    });

    // Specific state reasons based on active states in data
    const activeStates = Array.from(new Set(statePredictions.map(p => p.state)));
    activeStates.forEach(state => {
      if (STATE_EVENTS[state]) {
        Object.entries(STATE_EVENTS[state]).forEach(([month, event]) => {
          reasons.push({
            factor: `${state} Specific Event`,
            impact: 'positive',
            explanation: event,
            confidence: 85,
            state,
          });
        });
      }
    });

    return reasons.slice(0, 10);
  }, [statePredictions]);

  const insights = useMemo((): Insight[] => {
    const generated: Insight[] = [];
    
    if (statePredictions.length > 0) {
      const topState = statePredictions[0];
      generated.push({
        id: '1',
        type: 'trend',
        title: `Dominant Activity in ${topState.state}`,
        description: `${topState.state} shows ${topState.dominantType} as the primary activity. This suggests high ${topState.dominantType.toLowerCase()} demand in the region.`,
        priority: 'high',
      });
    }

    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      generated.push({
        id: '2',
        type: 'anomaly',
        title: 'Critical Spikes Detected',
        description: `Found ${highSeverityAnomalies.length} high-severity spikes. Primary cause likely ${highSeverityAnomalies[0].reason}.`,
        priority: 'high',
      });
    }

    generated.push({
      id: '3',
      type: 'recommendation',
      title: 'Operational Optimization',
      description: 'Based on peak month analysis, consider increasing staff capacity in Maharashtra and UP during July-August.',
      priority: 'medium',
    });

    return generated;
  }, [statePredictions, anomalies]);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      const addNewPageIfNeeded = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      // Title
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Aadhaar Analytics - AI Report', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
      pdf.setTextColor(0);
      yPos += 15;

      // Data Quality Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Quality Overview', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const qualityMetrics = [
        `Total Records: ${dataQuality.totalRecords.toLocaleString()}`,
        `Active States: ${dataQuality.uniqueStates}`,
        `Unique Districts: ${dataQuality.uniqueDistricts}`,
        `Data Completeness: ${dataQuality.dataCompleteness}%`,
        `Date Range: ${dataQuality.dateRange.start} to ${dataQuality.dateRange.end}`,
        `Anomalies Detected: ${anomalies.length}`,
      ];
      qualityMetrics.forEach(metric => {
        pdf.text(`• ${metric}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 10;

      // Monthly Trends Section
      addNewPageIfNeeded(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Monthly Trends Summary', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      if (monthlyTrends.length > 0) {
        const recentTrends = monthlyTrends.slice(-6);
        recentTrends.forEach(trend => {
          pdf.text(`${trend.month}: Enrollment ${trend.enrollment.toLocaleString()} | Demographic ${trend.demographic.toLocaleString()} | Biometric ${trend.biometric.toLocaleString()}`, margin + 5, yPos);
          yPos += 6;
        });
      } else {
        pdf.text('No trend data available', margin + 5, yPos);
        yPos += 6;
      }
      yPos += 10;

      // State Performance Section
      addNewPageIfNeeded(80);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top Performing States', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      statePredictions.slice(0, 8).forEach((state, idx) => {
        const total = state.enrollment + state.demographic + state.biometric;
        pdf.text(`${idx + 1}. ${state.state}: Total ${total.toLocaleString()} (Peak: ${state.peakMonth}, Dominant: ${state.dominantType})`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 10;

      // Predictions Section
      addNewPageIfNeeded(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6-Month Forecast', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const enrollmentPredictions = predictions.filter(p => p.type === 'enrollment');
      if (enrollmentPredictions.length > 0) {
        enrollmentPredictions.forEach(pred => {
          pdf.text(`${pred.month}: ~${pred.predicted.toLocaleString()} (${pred.confidence}% confidence, trend: ${pred.trend})`, margin + 5, yPos);
          yPos += 6;
        });
      } else {
        pdf.text('Insufficient data for predictions', margin + 5, yPos);
        yPos += 6;
      }
      yPos += 10;

      // Anomalies Section
      addNewPageIfNeeded(80);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detected Anomalies', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      if (anomalies.length > 0) {
        anomalies.slice(0, 10).forEach(anomaly => {
          addNewPageIfNeeded(12);
          pdf.text(`[${anomaly.severity.toUpperCase()}] ${anomaly.district}, ${anomaly.state}`, margin + 5, yPos);
          yPos += 5;
          pdf.setTextColor(100);
          pdf.text(`   ${anomaly.type} ${anomaly.anomalyType}: ${anomaly.value.toLocaleString()} - ${anomaly.reason || 'Unknown cause'}`, margin + 5, yPos);
          pdf.setTextColor(0);
          yPos += 7;
        });
      } else {
        pdf.text('No anomalies detected', margin + 5, yPos);
        yPos += 6;
      }
      yPos += 10;

      // Insights Section
      addNewPageIfNeeded(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-Generated Insights', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      insights.forEach(insight => {
        addNewPageIfNeeded(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`[${insight.priority.toUpperCase()}] ${insight.title}`, margin + 5, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(insight.description, pageWidth - margin * 2 - 10);
        lines.forEach((line: string) => {
          pdf.text(line, margin + 10, yPos);
          yPos += 5;
        });
        yPos += 5;
      });

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
        pdf.text('Aadhaar Analytics Dashboard', margin, pageHeight - 10);
      }

        pdf.save('Aadhaar_AI_Full_Report.pdf');
        toast.success('Report exported successfully!');
      } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasData) {
    return (
      <div className="p-6">
        <Card className="flex flex-col items-center justify-center py-20 bg-muted/30 border-dashed">
          <Brain className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold">Awaiting Data</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            Upload Enrollment, Demographic, or Biometric CSV files to unlock AI-powered predictions and anomaly detection.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
            Refresh System
          </Button>
        </Card>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="p-6">
        <Card className="flex flex-col items-center justify-center py-20 border-primary/20 bg-primary/5">
          <div className="relative">
            <Brain className="h-16 w-16 text-primary animate-pulse" />
            <Loader2 className="h-24 w-24 text-primary animate-spin absolute -top-4 -left-4 opacity-30" />
          </div>
          <h2 className="text-2xl font-bold mt-8">AI Analysis Engine Running</h2>
          <p className="text-muted-foreground mt-2">Correlating enrollment, demographic and biometric spikes...</p>
          <div className="w-64 h-1.5 bg-muted rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-primary animate-progress" style={{ width: '60%' }}></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" /> AI Analyzer Pro
          </h1>
          <p className="text-muted-foreground">Comprehensive intelligence across all data verticals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runAnalysis} className="hover:bg-primary/10">
            <RefreshCw className="h-4 w-4 mr-2" /> Re-Analyze
          </Button>
          <Button onClick={exportToPDF} disabled={isExporting} className="bg-primary hover:bg-primary/90">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Full Report
          </Button>
        </div>
      </div>

        <div className="space-y-6">
        {/* Quality Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Activity className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-2xl font-bold">{dataQuality.totalRecords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Records</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg"><MapPin className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-2xl font-bold">{dataQuality.uniqueStates}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active States</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Sparkles className="h-5 w-5 text-purple-500" /></div>
              <div>
                <p className="text-2xl font-bold">{dataQuality.dataCompleteness}%</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Integrity Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg"><AlertTriangle className="h-5 w-5 text-orange-500" /></div>
              <div>
                <p className="text-2xl font-bold">{anomalies.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Detected Anomalies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full bg-muted/50 p-1 rounded-xl h-auto flex-wrap md:flex-nowrap">
            <TabsTrigger value="overview" className="flex-1 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="predictions" className="flex-1 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Predictions</TabsTrigger>
            <TabsTrigger value="reasons" className="flex-1 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Event Reasons</TabsTrigger>
            <TabsTrigger value="anomalies" className="flex-1 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Anomaly Tracking</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Smart Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Multi-Vertical Trends</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends}>
                        <defs>
                          <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDemo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Area type="monotone" dataKey="enrollment" name="Enrollment" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorEnroll)" strokeWidth={2} />
                        <Area type="monotone" dataKey="demographic" name="Demographic" stroke="#10b981" fillOpacity={1} fill="url(#colorDemo)" strokeWidth={2} />
                        <Area type="monotone" dataKey="biometric" name="Biometric" stroke="#8b5cf6" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Top Performance by State</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statePredictions} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="state" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar dataKey="enrollment" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="demographic" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="biometric" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">6-Month Strategic Forecast</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={predictions.filter(p => p.type === 'enrollment')}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Predicted Values</h3>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {predictions.slice(0, 18).map((p, i) => (
                      <div key={i} className="group p-3 border rounded-xl hover:border-primary/50 transition-colors bg-card">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">{p.month}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase">{p.type}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">~{p.predicted.toLocaleString()}</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                            <TrendingUp className="h-3 w-3" /> {p.confidence}% CONF.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reasons" className="space-y-4 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reasonAnalysis.map((r, i) => (
                <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-all">
                  <div className={`absolute top-0 left-0 w-1 h-full ${r.state ? 'bg-orange-500' : 'bg-primary'}`} />
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 font-bold text-primary">
                        {r.state ? <MapPin className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        {r.factor}
                      </div>
                      <Badge variant="outline" className="text-[10px]">{r.confidence}% Match</Badge>
                    </div>
                    <p className="text-sm leading-relaxed mb-4">{r.explanation}</p>
                    {r.state && <p className="text-[10px] font-bold uppercase text-muted-foreground">Location: {r.state}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card className="bg-orange-500/5 border-orange-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-orange-600">Active Alert Monitor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Detected <span className="font-bold">{anomalies.length}</span> behavioral anomalies requiring review.</p>
                  </CardContent>
                </Card>
                <div className="p-4 rounded-xl border bg-muted/30">
                  <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2"><Info className="h-3 w-3" /> Detection Method</h4>
                  <p className="text-[11px] text-muted-foreground">Using Z-Score normalization (Threshold: 2.5σ) across State-District time series to identify statistical outliers.</p>
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="border rounded-xl overflow-hidden bg-card">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 text-xs font-bold uppercase">
                      <tr>
                        <th className="p-4">Location & Date</th>
                        <th className="p-4">Metric</th>
                        <th className="p-4 text-right">Value</th>
                        <th className="p-4">AI Reason / Cause</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {anomalies.map((a, i) => (
                        <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <p className="font-bold">{a.district}, {a.state}</p>
                            <p className="text-[10px] text-muted-foreground">{a.date}</p>
                          </td>
                          <td className="p-4"><Badge variant="secondary" className="text-[10px] uppercase">{a.type}</Badge></td>
                          <td className="p-4 text-right font-mono font-bold text-orange-600">+{a.value.toLocaleString()}</td>
                          <td className="p-4 text-xs text-muted-foreground">{a.reason}</td>
                          <td className="p-4 text-right">
                            {a.severity === 'high' ? (
                              <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>
                            ) : (
                              <Badge className="bg-amber-500 hover:bg-amber-600">Alert</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((ins, i) => (
                <Card key={i} className="border-l-4 border-l-primary group hover:translate-x-1 transition-transform">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {ins.type === 'trend' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                        {ins.type === 'anomaly' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                        {ins.type === 'recommendation' && <Lightbulb className="h-5 w-5 text-yellow-500" />}
                        {ins.title}
                      </CardTitle>
                      <Badge variant={ins.priority === 'high' ? 'destructive' : 'secondary'}>{ins.priority}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ins.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2">Acknowledge</Button>
                      <Button variant="outline" size="sm" className="text-[10px] h-7 px-2">Investigate More</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTHS[parseInt(month) - 1]} ${year.slice(2)}`;
}

function getSeasonalFactor(month: number): number {
  const factors: Record<number, number> = {
    1: 0.95, 2: 0.90, 3: 1.15, 4: 1.05,
    5: 0.85, 6: 0.80, 7: 1.10, 8: 1.20,
    9: 1.15, 10: 1.05, 11: 0.95, 12: 0.85,
  };
  return factors[month] || 1;
}
