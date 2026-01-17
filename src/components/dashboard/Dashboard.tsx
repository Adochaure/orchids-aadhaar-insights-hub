import { StatCard } from './StatCard';
import { ChartContainer } from './ChartContainer';
import { IndiaChoroplethMap } from './IndiaChoroplethMap';

import { AgeDistributionChart } from './AgeDistributionChart';
import { TrendChart } from './TrendChart';
import { CSVUploader } from './CSVUploader';
import { AIAnalyzer } from './AIAnalyzer';
import { useData } from '@/contexts/DataContext';
import { Users, FileCheck, Fingerprint, Building2 } from 'lucide-react';
import { normalizeStateName, VALID_INDIAN_STATES } from '@/lib/indianStates';

interface DashboardProps {
  view: string;
}

export function Dashboard({ view }: DashboardProps) {
  const { enrollmentData, demographicData, biometricData, getAggregatedStateData } = useData();

  const totalEnrollments = enrollmentData.reduce(
    (sum, d) => sum + d.age_0_5 + d.age_5_17 + d.age_18_greater,
    0
  );
  const totalDemographics = demographicData.reduce(
    (sum, d) => sum + d.demo_age_5_17 + d.demo_age_17_plus,
    0
  );
  const totalBiometrics = biometricData.reduce(
    (sum, d) => sum + d.bio_age_5_17 + d.bio_age_17_plus,
    0
  );

  const uniqueStates = new Set(
    [...enrollmentData, ...demographicData, ...biometricData]
      .map((d) => normalizeStateName(d.state))
      .filter((s) => s && VALID_INDIAN_STATES.includes(s))
  ).size;

  const stateChartData = getAggregatedStateData()
    .slice(0, 10)
    .map((state) => ({
      name: state.name.length > 10 ? state.name.substring(0, 10) + '...' : state.name,
      enrollments: state.enrollments,
      demographics: state.demographics,
      biometrics: state.biometrics,
    }));

  if (view === 'ai-analyzer') {
    return <AIAnalyzer />;
  }

  if (view === 'analytics') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Detailed Analytics</h2>
          <p className="text-muted-foreground">
            In-depth analysis of enrollment, demographic, and biometric data
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartContainer
            title="State-wise Comparison"
            data={stateChartData}
            defaultType="bar"
          />
          <ChartContainer
            title="Data Distribution"
            data={stateChartData}
            defaultType="pie"
          />
          <AgeDistributionChart />
          <TrendChart />
        </div>

      </div>
    );
  }

  if (view === 'upload') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Upload Data</h2>
          <p className="text-muted-foreground">
            Import CSV files for enrollment, demographic, and biometric data
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <CSVUploader type="enrollment" />
          <CSVUploader type="demographic" />
          <CSVUploader type="biometric" />
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Expected CSV Formats</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Enrollment Data</h4>
              <code className="text-xs bg-muted p-2 rounded block">
                date, state, district, pincode, age_0_5, age_5_17, age_18_greater
              </code>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Demographic Data</h4>
              <code className="text-xs bg-muted p-2 rounded block">
                date, state, district, pincode, demo_age_5_17, demo_age_17_
              </code>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Biometric Data</h4>
              <code className="text-xs bg-muted p-2 rounded block">
                date, state, district, pincode, bio_age_5_17, bio_age_17_
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Dashboard View
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Aadhaar enrollment and update analytics across India
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Enrollments"
          value={totalEnrollments}
          icon={Users}
          subtitle="All age groups"
        />
        <StatCard
          title="Demographic Updates"
          value={totalDemographics}
          icon={FileCheck}
          subtitle="Address, name changes"
        />
        <StatCard
          title="Biometric Updates"
          value={totalBiometrics}
          icon={Fingerprint}
          subtitle="Fingerprint, iris updates"
        />
        <StatCard
          title="States Covered"
          value={uniqueStates}
          icon={Building2}
          subtitle="States & UTs with data"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Top States by Activity"
          data={stateChartData}
          defaultType="bar"
        />
        <IndiaChoroplethMap />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart />
        <AgeDistributionChart />
      </div>


    </div>
  );
}
