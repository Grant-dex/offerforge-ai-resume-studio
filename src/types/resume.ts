export type StepKey = "basic" | "work" | "projects" | "skills" | "export";

export type TemplateKey = "focus" | "stack" | "lead";

export interface PersonalInfo {
  resumeTitle: string;
  name: string;
  role: string;
  seniority: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  avatar?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  city: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  tags: string[];
}

export interface ProjectExperience {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  tags: string[];
}

export interface Education {
  school: string;
  major: string;
  degree: string;
  years: string;
  description?: string;
  tags: string[];
}

export interface ResumeData {
  id: string;
  title: string;
  subtitle: string;
  lastSaved: string;
  personal: PersonalInfo;
  skills: string[];
  work: WorkExperience[];
  projects: ProjectExperience[];
  education: Education;
  aiScore: number;
  atsScore: number;
}
