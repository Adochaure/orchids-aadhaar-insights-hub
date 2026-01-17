import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnrollmentData, DemographicData, BiometricData, StateData, InsightMessage } from '@/types/aadhaar';
import { normalizeStateName, VALID_INDIAN_STATES } from '@/lib/indianStates';

interface DataContextType {
  enrollmentData: EnrollmentData[];
  demographicData: DemographicData[];
  biometricData: BiometricData[];
  setEnrollmentData: (data: EnrollmentData[] | ((prev: EnrollmentData[]) => EnrollmentData[])) => void;
  setDemographicData: (data: DemographicData[] | ((prev: DemographicData[]) => DemographicData[])) => void;
  setBiometricData: (data: BiometricData[] | ((prev: BiometricData[]) => BiometricData[])) => void;
  selectedState: string | null;
  setSelectedState: (state: string | null) => void;
  selectedDistrict: string | null;
  setSelectedDistrict: (district: string | null) => void;
  insights: InsightMessage[];
  addInsight: (insight: Omit<InsightMessage, 'id' | 'timestamp'>) => void;
  getAggregatedStateData: () => StateData[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  const [demographicData, setDemographicData] = useState<DemographicData[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightMessage[]>([]);

  const addInsight = (insight: Omit<InsightMessage, 'id' | 'timestamp'>) => {
    const newInsight: InsightMessage = {
      ...insight,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setInsights((prev) => [newInsight, ...prev].slice(0, 10));
  };

  const getAggregatedStateData = (): StateData[] => {
    const stateMap = new Map<string, StateData>();

    enrollmentData.forEach((item) => {
      const normalizedState = normalizeStateName(item.state);
      if (!normalizedState || !VALID_INDIAN_STATES.includes(normalizedState)) return;
      
      if (!stateMap.has(normalizedState)) {
        stateMap.set(normalizedState, {
          name: normalizedState,
          enrollments: 0,
          demographics: 0,
          biometrics: 0,
          districts: [],
        });
      }
      const state = stateMap.get(normalizedState)!;
      state.enrollments += item.age_0_5 + item.age_5_17 + item.age_18_greater;
    });

    demographicData.forEach((item) => {
      const normalizedState = normalizeStateName(item.state);
      if (!normalizedState || !VALID_INDIAN_STATES.includes(normalizedState)) return;
      
      if (!stateMap.has(normalizedState)) {
        stateMap.set(normalizedState, {
          name: normalizedState,
          enrollments: 0,
          demographics: 0,
          biometrics: 0,
          districts: [],
        });
      }
      const state = stateMap.get(normalizedState)!;
      state.demographics += item.demo_age_5_17 + item.demo_age_17_plus;
    });

    biometricData.forEach((item) => {
      const normalizedState = normalizeStateName(item.state);
      if (!normalizedState || !VALID_INDIAN_STATES.includes(normalizedState)) return;
      
      if (!stateMap.has(normalizedState)) {
        stateMap.set(normalizedState, {
          name: normalizedState,
          enrollments: 0,
          demographics: 0,
          biometrics: 0,
          districts: [],
        });
      }
      const state = stateMap.get(normalizedState)!;
      state.biometrics += item.bio_age_5_17 + item.bio_age_17_plus;
    });

    return Array.from(stateMap.values());
  };

  return (
    <DataContext.Provider
      value={{
        enrollmentData,
        demographicData,
        biometricData,
        setEnrollmentData,
        setDemographicData,
        setBiometricData,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        insights,
        addInsight,
        getAggregatedStateData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
