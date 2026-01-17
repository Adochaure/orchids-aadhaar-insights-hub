import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { Upload, FileSpreadsheet, Users, Fingerprint, CheckCircle2 } from 'lucide-react';
import { EnrollmentData, DemographicData, BiometricData } from '@/types/aadhaar';
import { toast } from 'sonner';
import { normalizeStateName } from '@/lib/indianStates';

type DataType = 'enrollment' | 'demographic' | 'biometric';

interface CSVUploaderProps {
  type: DataType;
}

export function CSVUploader({ type }: CSVUploaderProps) {
  const { 
    setEnrollmentData, 
    setDemographicData, 
    setBiometricData,
    enrollmentData,
    demographicData,
    biometricData,
    addInsight
  } = useData();

  const config = {
    enrollment: {
      title: 'Enrollment Data',
      icon: FileSpreadsheet,
      color: 'bg-chart-1/10 text-chart-1',
      count: enrollmentData.length,
    },
    demographic: {
      title: 'Demographic Data',
      icon: Users,
      color: 'bg-chart-2/10 text-chart-2',
      count: demographicData.length,
    },
    biometric: {
      title: 'Biometric Data',
      icon: Fingerprint,
      color: 'bg-chart-3/10 text-chart-3',
      count: biometricData.length,
    },
  }[type];

  const parseCSV = useCallback((text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record;
    });
  }, []);

  const processFile = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const records = parseCSV(text);

          if (type === 'enrollment') {
            const data: EnrollmentData[] = records.map(r => ({
              date: r.date || '',
              state: normalizeStateName(r.state || ''),
              district: r.district || '',
              pincode: r.pincode || '',
              age_0_5: parseInt(r.age_0_5) || 0,
              age_5_17: parseInt(r.age_5_17) || 0,
              age_18_greater: parseInt(r.age_18_greater) || 0,
            }));
            setEnrollmentData(prev => [...prev, ...data]);
            const uniqueStates = new Set(data.map(d => d.state)).size;
            toast.success(`Loaded ${data.length} enrollment records from ${uniqueStates} states (${file.name})`);
            addInsight({
              type: 'insight',
              title: 'Enrollment Data Loaded',
              content: `Successfully loaded ${data.length} enrollment records covering ${uniqueStates} states from ${file.name}.`,
            });
          } else if (type === 'demographic') {
            const data: DemographicData[] = records.map(r => ({
              date: r.date || '',
              state: normalizeStateName(r.state || ''),
              district: r.district || '',
              pincode: r.pincode || '',
              demo_age_5_17: parseInt(r.demo_age_5_17) || 0,
              demo_age_17_plus: parseInt(r['demo_age_17_'] || r.demo_age_17_plus) || 0,
            }));
            setDemographicData(prev => [...prev, ...data]);
            const uniqueStates = new Set(data.map(d => d.state)).size;
            toast.success(`Loaded ${data.length} demographic records from ${uniqueStates} states (${file.name})`);
            addInsight({
              type: 'insight',
              title: 'Demographic Data Loaded',
              content: `Successfully loaded ${data.length} demographic records from ${uniqueStates} states from ${file.name}. Ready for cross-analysis.`,
            });
          } else if (type === 'biometric') {
            const data: BiometricData[] = records.map(r => ({
              date: r.date || '',
              state: normalizeStateName(r.state || ''),
              district: r.district || '',
              pincode: r.pincode || '',
              bio_age_5_17: parseInt(r.bio_age_5_17) || 0,
              bio_age_17_plus: parseInt(r['bio_age_17_'] || r.bio_age_17_plus) || 0,
            }));
            setBiometricData(prev => [...prev, ...data]);
            const uniqueStates = new Set(data.map(d => d.state)).size;
            toast.success(`Loaded ${data.length} biometric records from ${uniqueStates} states (${file.name})`);
            addInsight({
              type: 'insight',
              title: 'Biometric Data Loaded',
              content: `Successfully loaded ${data.length} biometric records from ${uniqueStates} states from ${file.name}.`,
            });
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }, [type, parseCSV, setEnrollmentData, setDemographicData, setBiometricData, addInsight]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      try {
        await processFile(file);
      } catch (error) {
        toast.error(`Failed to parse ${file.name}`);
        console.error(error);
      }
    }
    
    if (fileArray.length > 1) {
      toast.success(`Finished processing ${fileArray.length} files`);
    }
    
    event.target.value = '';
  }, [processFile]);

  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            {config.title}
          </CardTitle>
          {config.count > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {config.count} rows
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Input
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id={`csv-upload-${type}`}
            />
          <label htmlFor={`csv-upload-${type}`}>
            <Button variant="outline" className="w-full cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV(s)
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
