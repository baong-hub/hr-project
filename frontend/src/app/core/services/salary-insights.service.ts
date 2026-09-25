import api from './api.service';

export interface SalaryBenchmark {
  title: string;
  minSalaryMillionVnd: number;
  maxSalaryMillionVnd: number;
  medianSalaryMillionVnd: number;
  p25MillionVnd: number;
  p75MillionVnd: number;
  sampleCount: number;
}

export interface SkillSalary {
  skill: string;
  medianSalaryMillionVnd: number;
  jobCount: number;
}

export interface CategorySalary {
  category: string;
  medianSalaryMillionVnd: number;
  minSalaryMillionVnd: number;
  maxSalaryMillionVnd: number;
  jobCount: number;
}

export interface SalaryInsightsResult {
  queryCategory: string;
  queryLocation: string;
  overallAverageMillionVnd: number;
  overallMedianMillionVnd: number;
  overallP25MillionVnd: number;
  overallP75MillionVnd: number;
  totalJobsAnalyzed: number;
  byExperienceLevel: SalaryBenchmark[];
  byCategory: CategorySalary[];
  topPayingSkills: SkillSalary[];
}

export const salaryInsightsService = {
  async getSalaryInsights(category?: string, location?: string): Promise<SalaryInsightsResult> {
    const res = await api.get('/salary-insights', {
      params: { category, location }
    });
    return res.data?.data;
  }
};
