export interface GenerationOptions {
  maxIterations: number;
  timeoutMinutes: number;
  prioritizeTeacherPreferences: boolean;
  allowPartialSolutions: boolean;
  balanceCognitiveLoad: boolean;
  maxCognitiveLoad: number;
}

export interface JobStats {
  avgCognitiveLoad?: number;
  completionRate?: number;
  conflicts?: number;
  dayDistribution?: Record<string, number>;
  highestLoadTeacher?: string;
  assignedLectures?: number;
  totalLectures?: number;
}

export type JobStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  status: string; // Backend returns string, will be cast to JobStatus
  progress: number;
  error?: string | null;
  result?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface JobStatusData {
  id: string;
  status: string; // Backend returns string, will be cast to JobStatus when needed
  progress: number;
  error?: string | null;
  result?: {
    assignments?: any[];
    stats?: JobStats;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
