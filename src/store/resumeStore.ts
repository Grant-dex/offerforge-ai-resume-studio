import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultResume, templateResumes } from "../data/defaultResume";
import type { Education, PersonalInfo, ProjectExperience, ResumeData, TemplateKey, WorkExperience } from "../types/resume";
import { calcATSScore } from "../utils/atsScore";
import { hydrateResumeState } from "../utils/draftLibrary";

interface ResumeState {
  resume: ResumeData;
  template: TemplateKey;
  lastTouched: string;
  updatePersonal: (patch: Partial<PersonalInfo>) => void;
  updateEducation: (patch: Partial<Education>) => void;
  updateWork: (id: string, patch: Partial<WorkExperience>) => void;
  addWork: () => void;
  removeWork: (id: string) => void;
  updateProject: (id: string, patch: Partial<ProjectExperience>) => void;
  addProject: () => void;
  removeProject: (id: string) => void;
  updateSkills: (skills: string[]) => void;
  setTemplate: (template: TemplateKey) => void;
  loadTemplate: (template: TemplateKey) => void;
  resetResume: () => void;
}

const now = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

const withATS = (resume: ResumeData): ResumeData => ({
  ...resume,
  atsScore: calcATSScore(resume)
});

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resume: defaultResume,
      template: "focus",
      lastTouched: defaultResume.lastSaved,
      updatePersonal: (patch) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            title: patch.resumeTitle ?? state.resume.title,
            personal: { ...state.resume.personal, ...patch }
          })
        })),
      updateEducation: (patch) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({ ...state.resume, education: { ...state.resume.education, ...patch } })
        })),
      updateWork: (id, patch) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            work: state.resume.work.map((item) => (item.id === id ? { ...item, ...patch } : item))
          })
        })),
      addWork: () =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            work: [...state.resume.work, { id: `work-${Date.now()}`, company: "", title: "", city: "", startDate: "", endDate: "", bullets: [], tags: [] }]
          })
        })),
      removeWork: (id) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({ ...state.resume, work: state.resume.work.filter((item) => item.id !== id) })
        })),
      updateProject: (id, patch) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            projects: state.resume.projects.map((item) => (item.id === id ? { ...item, ...patch } : item))
          })
        })),
      addProject: () =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            projects: [...state.resume.projects, { id: `project-${Date.now()}`, name: "", role: "", startDate: "", endDate: "", bullets: [], tags: [] }]
          })
        })),
      removeProject: (id) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({ ...state.resume, projects: state.resume.projects.filter((item) => item.id !== id) })
        })),
      updateSkills: (skills) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({ ...state.resume, skills })
        })),
      setTemplate: (template) => set({ template, lastTouched: now() }),
      loadTemplate: (template) =>
        set({
          template,
          lastTouched: now(),
          resume: withATS(templateResumes[template] || defaultResume)
        }),
      resetResume: () =>
        set({
          resume: withATS(defaultResume),
          template: "focus",
          lastTouched: now()
        })
    }),
    {
      name: "offerforge-react-resume",
      merge: (persisted, current) => {
        const restored = hydrateResumeState(persisted, current);
        return { ...restored, resume: withATS(restored.resume) };
      }
    }
  )
);
