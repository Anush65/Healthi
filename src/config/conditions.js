export const DefaultMetrics = {
  temperature: {
    id: 'temperature',
    name: 'Body Temperature',
    metrics: [
      {
        id: 'temperature',
        label: 'Temperature (°F)',
        type: 'number',
        placeholder: 'e.g., 98.6',
        patientLoggable: true,
        chartConfig: { label: 'Temperature Trend', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
      }
    ]
  },
  oxygen_level: {
    id: 'oxygen_level',
    name: 'Oxygen Level',
    metrics: [
      {
        id: 'spo2',
        label: 'SpO2 (%)',
        type: 'number',
        placeholder: 'e.g., 98',
        patientLoggable: true,
        chartConfig: { label: 'Oxygen Saturation', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' }
      }
    ]
  },
  body_weight: {
    id: 'body_weight',
    name: 'Body Weight',
    metrics: [
      {
        id: 'weight',
        label: 'Weight (lbs)',
        type: 'number',
        placeholder: 'e.g., 150',
        patientLoggable: true,
        chartConfig: { label: 'Weight Trend', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' }
      }
    ]
  }
};

export const ConditionRegistry = {
  diabetes: {
    id: 'diabetes',
    name: 'Diabetes',
    description: 'Track your blood sugar and HbA1c levels.',
    metrics: [
      {
        id: 'blood_sugar',
        label: 'Blood Sugar (mg/dL)',
        type: 'number',
        placeholder: 'e.g., 105',
        patientLoggable: true,
        chartConfig: { label: 'Blood Sugar Trend', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' }
      },
      {
        id: 'hba1c',
        label: 'HbA1c (%)',
        type: 'number',
        placeholder: 'e.g., 6.5',
        patientLoggable: false, // Only doctor
        chartConfig: { label: 'HbA1c Trend', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' }
      }
    ]
  },
  hypertension: {
    id: 'hypertension',
    name: 'Hypertension',
    description: 'Track your blood pressure.',
    metrics: [
      {
        id: 'systolic',
        label: 'Systolic (mmHg)',
        type: 'number',
        placeholder: 'e.g., 120',
        patientLoggable: true,
        chartConfig: { label: 'Systolic Pressure', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' }
      },
      {
        id: 'diastolic',
        label: 'Diastolic (mmHg)',
        type: 'number',
        placeholder: 'e.g., 80',
        patientLoggable: true,
        chartConfig: { label: 'Diastolic Pressure', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' }
      }
    ]
  },
  asthma: {
    id: 'asthma',
    name: 'Asthma / COPD',
    description: 'Track lung function and peak flow.',
    metrics: [
      {
        id: 'peak_flow',
        label: 'Peak Flow (L/min)',
        type: 'number',
        placeholder: 'e.g., 400',
        patientLoggable: true,
        chartConfig: { label: 'Peak Flow Trend', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.1)' }
      },
      {
        id: 'fev1',
        label: 'FEV1 (Liters)',
        type: 'number',
        placeholder: 'e.g., 2.5',
        patientLoggable: false, // Lab test
        chartConfig: { label: 'FEV1 Trend', color: '#0284c7', bgColor: 'rgba(2, 132, 199, 0.1)' }
      }
    ]
  },
  heart_disease: {
    id: 'heart_disease',
    name: 'Heart Disease',
    description: 'Track heart rate and cholesterol.',
    metrics: [
      {
        id: 'heart_rate',
        label: 'Resting Heart Rate (bpm)',
        type: 'number',
        placeholder: 'e.g., 72',
        patientLoggable: true,
        chartConfig: { label: 'Heart Rate Trend', color: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.1)' }
      },
      {
        id: 'ldl_cholesterol',
        label: 'LDL Cholesterol (mg/dL)',
        type: 'number',
        placeholder: 'e.g., 100',
        patientLoggable: false, // Lab test
        chartConfig: { label: 'LDL Trend', color: '#be123c', bgColor: 'rgba(190, 18, 60, 0.1)' }
      }
    ]
  },
  ckd: {
    id: 'ckd',
    name: 'Chronic Kidney Disease',
    description: 'Track fluid intake and eGFR.',
    metrics: [
      {
        id: 'fluid_intake',
        label: 'Daily Fluid Intake (ml)',
        type: 'number',
        placeholder: 'e.g., 1500',
        patientLoggable: true,
        chartConfig: { label: 'Fluid Intake', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' }
      },
      {
        id: 'egfr',
        label: 'eGFR (mL/min)',
        type: 'number',
        placeholder: 'e.g., 60',
        patientLoggable: false, // Lab test
        chartConfig: { label: 'eGFR Trend', color: '#1d4ed8', bgColor: 'rgba(29, 78, 216, 0.1)' }
      }
    ]
  }
};

/**
 * Returns the registry object for a given condition string (case-insensitive).
 * Checks both ConditionRegistry and DefaultMetrics.
 */
export function getConditionConfig(conditionName) {
  const normalized = conditionName.trim().toLowerCase();
  for (const key in ConditionRegistry) {
    if (ConditionRegistry[key].name.toLowerCase() === normalized || key === normalized) {
      return ConditionRegistry[key];
    }
  }
  for (const key in DefaultMetrics) {
    if (DefaultMetrics[key].name.toLowerCase() === normalized || key === normalized) {
      return DefaultMetrics[key];
    }
  }
  return null;
}
