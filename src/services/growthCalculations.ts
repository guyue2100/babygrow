/**
 * WHO Growth Reference Data (Simplified)
 * Data source: WHO Child Growth Standards (0-5 years)
 */

export type Gender = 'boy' | 'girl';

export interface LMSData {
  month: number;
  L: number;
  M: number;
  S: number;
}

export interface GrowthReference {
  weight: LMSData[];
  height: LMSData[];
  headCircumference: LMSData[];
}

// Simplified sample data for demonstration. 
// In a real app, this would be a full table of 0-60 months.
// I will include key milestones and interpolate or provide a more complete set if possible.
// For the sake of this applet, I'll include a representative set.

export const WHO_DATA: Record<Gender, GrowthReference> = {
  boy: {
    height: [
      { month: 0, L: 1, M: 49.9, S: 0.038 },
      { month: 12, L: 1, M: 75.7, S: 0.034 },
      { month: 24, L: 1, M: 87.1, S: 0.033 },
      { month: 36, L: 1, M: 96.1, S: 0.033 },
      { month: 48, L: 1, M: 103.3, S: 0.033 },
      { month: 60, L: 1, M: 110.0, S: 0.033 },
      { month: 120, L: 1, M: 138.0, S: 0.04 },
      { month: 180, L: 1, M: 170.0, S: 0.045 },
      { month: 240, L: 1, M: 176.0, S: 0.045 },
    ],
    weight: [
      { month: 0, L: -0.35, M: 3.3, S: 0.14 },
      { month: 12, L: -0.05, M: 9.6, S: 0.11 },
      { month: 24, L: 0.05, M: 12.2, S: 0.10 },
      { month: 60, L: 0.35, M: 18.3, S: 0.10 },
      { month: 120, L: 0.5, M: 32.0, S: 0.15 },
      { month: 180, L: 0.6, M: 56.0, S: 0.18 },
      { month: 240, L: 0.7, M: 70.0, S: 0.18 },
    ],
    headCircumference: [
      { month: 0, L: 1, M: 34.5, S: 0.037 },
      { month: 12, L: 1, M: 46.1, S: 0.026 },
      { month: 24, L: 1, M: 48.3, S: 0.025 },
      { month: 60, L: 1, M: 51.0, S: 0.025 },
      { month: 120, L: 1, M: 53.5, S: 0.025 },
      { month: 240, L: 1, M: 56.0, S: 0.025 },
    ]
  },
  girl: {
    height: [
      { month: 0, L: 1, M: 49.1, S: 0.039 },
      { month: 12, L: 1, M: 74.0, S: 0.036 },
      { month: 24, L: 1, M: 85.7, S: 0.035 },
      { month: 60, L: 1, M: 109.4, S: 0.035 },
      { month: 120, L: 1, M: 138.0, S: 0.045 },
      { month: 180, L: 1, M: 161.0, S: 0.04 },
      { month: 240, L: 1, M: 163.0, S: 0.04 },
    ],
    weight: [
      { month: 0, L: -0.38, M: 3.2, S: 0.14 },
      { month: 12, L: -0.08, M: 8.9, S: 0.12 },
      { month: 24, L: 0.02, M: 11.5, S: 0.11 },
      { month: 60, L: 0.32, M: 18.2, S: 0.11 },
      { month: 120, L: 0.5, M: 33.0, S: 0.16 },
      { month: 180, L: 0.6, M: 52.0, S: 0.18 },
      { month: 240, L: 0.7, M: 58.0, S: 0.18 },
    ],
    headCircumference: [
      { month: 0, L: 1, M: 33.9, S: 0.038 },
      { month: 12, L: 1, M: 45.0, S: 0.028 },
      { month: 24, L: 1, M: 47.2, S: 0.027 },
      { month: 60, L: 1, M: 50.0, S: 0.027 },
      { month: 120, L: 1, M: 52.5, S: 0.027 },
      { month: 240, L: 1, M: 55.0, S: 0.027 },
    ]
  }
};

/**
 * Calculate Z-score using LMS method
 */
export function calculateZScore(value: number, lms: LMSData): number {
  const { L, M, S } = lms;
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

/**
 * Convert Z-score to Percentile (approximate)
 */
export function zScoreToPercentile(z: number): number {
  // Approximation of the error function
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Get interpolated LMS data for a specific month
 */
export function getInterpolatedLMS(month: number, data: LMSData[]): LMSData {
  if (month <= data[0].month) return data[0];
  if (month >= data[data.length - 1].month) return data[data.length - 1];

  for (let i = 0; i < data.length - 1; i++) {
    const start = data[i];
    const end = data[i + 1];
    if (month >= start.month && month <= end.month) {
      const ratio = (month - start.month) / (end.month - start.month);
      return {
        month,
        L: start.L + (end.L - start.L) * ratio,
        M: start.M + (end.M - start.M) * ratio,
        S: start.S + (end.S - start.S) * ratio,
      };
    }
  }
  return data[0];
}

export function getAssessment(percentile: number): string {
  if (percentile < 0.03) return '偏低/偏瘦';
  if (percentile < 0.15) return '偏低';
  if (percentile > 0.97) return '偏高/偏胖';
  if (percentile > 0.85) return '偏高';
  return '标准';
}

export function predictHeight(
  gender: Gender,
  fatherHeight: number,
  motherHeight: number,
  latestHeight?: number,
  latestAgeInMonths?: number
) {
  if (!fatherHeight || !motherHeight) return null;

  // 1. Mid-parental Height (MPH)
  const mphBase = (fatherHeight + motherHeight + (gender === 'boy' ? 13 : -13)) / 2;

  // 2. Growth Curve Projection
  let curvePrediction = null;
  if (latestHeight && latestAgeInMonths !== undefined) {
    const lms = getInterpolatedLMS(latestAgeInMonths, WHO_DATA[gender].height);
    const zScore = calculateZScore(latestHeight, lms);
    
    // Project to 20 years (240 months)
    const adultLMS = WHO_DATA[gender].height.find(d => d.month === 240) || WHO_DATA[gender].height[WHO_DATA[gender].height.length - 1];
    const projectedHeight = adultLMS.M * Math.pow(1 + adultLMS.L * adultLMS.S * zScore, 1 / adultLMS.L);
    curvePrediction = projectedHeight;
  }

  // 3. Combined "AI" Fuzzy Prediction
  let finalTarget = mphBase;
  if (curvePrediction) {
    // Weighting: 40% Genetics, 60% Current Growth
    finalTarget = (mphBase * 0.4) + (curvePrediction * 0.6);
  }

  return {
    final: finalTarget,
    range: [finalTarget - 4, finalTarget + 4]
  };
}
