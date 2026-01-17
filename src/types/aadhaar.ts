export interface EnrollmentData {
  date: string;
  state: string;
  district: string;
  pincode: string;
  age_0_5: number;
  age_5_17: number;
  age_18_greater: number;
}

export interface DemographicData {
  date: string;
  state: string;
  district: string;
  pincode: string;
  demo_age_5_17: number;
  demo_age_17_plus: number;
}

export interface BiometricData {
  date: string;
  state: string;
  district: string;
  pincode: string;
  bio_age_5_17: number;
  bio_age_17_plus: number;
}

export interface StateData {
  name: string;
  enrollments: number;
  demographics: number;
  biometrics: number;
  districts: DistrictData[];
}

export interface DistrictData {
  name: string;
  enrollments: number;
  demographics: number;
  biometrics: number;
  pincodes: PincodeData[];
}

export interface PincodeData {
  pincode: string;
  enrollments: number;
  demographics: number;
  biometrics: number;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export interface InsightMessage {
  id: string;
  type: 'insight' | 'prediction' | 'suggestion' | 'warning';
  title: string;
  content: string;
  timestamp: Date;
}
