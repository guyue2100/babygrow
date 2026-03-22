import { Gender } from "./services/growthCalculations";

export interface Child {
  id: string;
  name: string;
  gender: Gender;
  birthday: string;
  fatherHeight?: string;
  motherHeight?: string;
  measurements: Measurement[];
}

export interface Measurement {
  date: string;
  height: string;
  weight: string;
}

export interface GrowthRecord {
  id: string;
  childId: string;
  date: string;
  ageInMonths: number;
  height: number;
  weight: number;
  headCircumference: number;
  heightPercentile?: number;
  weightPercentile?: number;
  headPercentile?: number;
}
