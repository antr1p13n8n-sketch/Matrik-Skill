export type SkillCategory = 
  | 'cad_design'
  | 'structural_fea'
  | 'thermal_cfd'
  | 'materials_mfg'
  | 'mechatronics'
  | 'quality_reliability'
  | 'standards_compliance';

export interface SkillCategoryInfo {
  id: SkillCategory;
  name: string;
  nameId: string;
  shortName: string;
  description: string;
  iconName: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  nameId: string;
  category: SkillCategory;
  description: string;
  unitOrStandard?: string;
  targetByRole: {
    junior: number;
    mid: number;
    senior: number;
    lead: number;
  };
  certifications: string[];
}

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const SKILL_LEVEL_LABELS: Record<SkillLevel, { label: string; labelId: string; desc: string; color: string; bg: string }> = {
  0: { label: 'None', labelId: 'Belum Ada', desc: 'No baseline training or exposure yet', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  1: { label: 'Novice', labelId: 'Dasar (L1)', desc: 'Fundamental theoretical understanding; requires direct senior supervision', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  2: { label: 'Developing', labelId: 'Berkembang (L2)', desc: 'Can execute standard tasks with occasional guidance and design reviews', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  3: { label: 'Competent', labelId: 'Mandiri (L3)', desc: 'Autonomous execution of complex engineering workflows without supervision', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  4: { label: 'Advanced', labelId: 'Mahir (L4)', desc: 'Deep domain mastery; solves non-standard anomalies, conducts design audits', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  5: { label: 'Expert', labelId: 'Ahli / Mentor (L5)', desc: 'Industry-level authority; defines technical standards, trains and mentors team', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40' },
};

export type RoleBenchmark = 'junior_mechanical' | 'mid_mechanical' | 'senior_mechanical' | 'lead_specialist';

export interface CertificateAttachment {
  id: string;
  name: string;
  issuer: string;
  year: number | string;
  fileUrl?: string; // Data URL or external link
  fileName?: string;
  fileSize?: string;
  hasFile?: boolean;
}

export interface Engineer {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  avatarUrl: string;
  email: string;
  experienceYears: number;
  targetBenchmark: RoleBenchmark;
  skills: Record<string, SkillLevel>;
  certificates?: CertificateAttachment[];
  selfAssessments?: Record<string, {
    proposedLevel: SkillLevel;
    notes: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
}

export type UserRoleType = 'viewer' | 'supervisor' | 'manager';

export interface CurrentUser {
  id: string;
  name: string;
  roleType: UserRoleType;
  title: string;
  email: string;
  engineerId?: string; // If bound to specific engineer record
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  engineerId: string;
  engineerName: string;
  skillId: string;
  skillName: string;
  previousLevel: SkillLevel;
  newLevel: SkillLevel;
  updatedBy: string;
  reason?: string;
}

export interface DevelopmentReport {
  engineerId: string;
  engineerName: string;
  roleTitle: string;
  generatedDate: string;
  summary: {
    totalSkillsTracked: number;
    averageScore: number;
    targetScore: number;
    gapCount: number;
    strengthCount: number;
  };
  radarDomainScores: Array<{
    category: SkillCategory;
    categoryName: string;
    actualScore: number;
    targetScore: number;
    gap: number;
  }>;
  criticalGaps: Array<{
    skillId: string;
    skillName: string;
    categoryName: string;
    currentLevel: SkillLevel;
    requiredLevel: number;
    deficit: number;
    recommendedMentors: string[];
    certificationPath: string[];
  }>;
  actionPlan: {
    phase30Days: string[];
    phase60Days: string[];
    phase90Days: string[];
  };
  managerRemarks?: string;
}

export interface PendingProfileChange {
  id: string;
  engineerId: string;
  engineerName: string;
  submittedBy: string;
  submittedAt: string;
  summary: string;
  proposedData: Partial<Engineer>;
}

