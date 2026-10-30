import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultResume, templateResumes } from "../data/defaultResume";
import type { Education, PersonalInfo, ProjectExperience, ResumeData, TemplateKey, WorkExperience } from "../types/resume";
import { calcATSScore } from "../utils/atsScore";
import { hydrateResumeState } from "../utils/draftLibrary";
import { applyExperienceMutation, moveExperience, restoreExperience, type RemovedExperience } from "../utils/experienceEditing";
import type { ResumeSectionKey } from "../data/resumeTemplates";
import { DEFAULT_ORDER_PRESET, DEFAULT_SECTION_ORDER, legacyOrderForTemplate, matchOrderPreset, normalizeSectionOrder, presetByKey, type FixedOrderPreset, type OrderPreset } from "../data/sectionOrder";

interface ResumeState {
  resume: ResumeData;
  template: TemplateKey;
  sectionOrder: ResumeSectionKey[];
  orderPreset: OrderPreset;
  lastTouched: string;
  updatePersonal: (patch: Partial<PersonalInfo>) => void;
  updateEducation: (patch: Partial<Education>) => void;
  updateWork: (id: string, patch: Partial<WorkExperience>) => void;
  addWork: () => string;
  moveWork: (id: string, direction: -1 | 1) => void;
  restoreWork: (entry: RemovedExperience<WorkExperience>, resumeId: string) => void;
  removeWork: (id: string) => void;
  updateProject: (id: string, patch: Partial<ProjectExperience>) => void;
  addProject: () => string;
  moveProject: (id: string, direction: -1 | 1) => void;
  restoreProject: (entry: RemovedExperience<ProjectExperience>, resumeId: string) => void;
  removeProject: (id: string) => void;
  updateSkills: (skills: string[]) => void;
  setTemplate: (template: TemplateKey) => void;
  setSectionOrder: (order: unknown) => void;
  moveSection: (key: ResumeSectionKey, direction: -1 | 1) => void;
  applyOrderPreset: (preset: FixedOrderPreset) => void;
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
    (set, get) => {
      const changeExperience = (update: (state: ResumeState) => Partial<ResumeState> | ResumeState) =>
        applyExperienceMutation(() => get().resume, () => set(update));
      return {
      resume: defaultResume,
      template: "focus",
      sectionOrder: DEFAULT_SECTION_ORDER,
      orderPreset: DEFAULT_ORDER_PRESET,
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
      addWork: () => {
        const id = `work-${crypto.randomUUID()}`;
        changeExperience((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            work: [...state.resume.work, { id, company: "", title: "", city: "", startDate: "", endDate: "", bullets: [], tags: [] }]
          })
        }));
        return id;
      },
      moveWork: (id, direction) => changeExperience(state => {
        const work = moveExperience(state.resume.work, id, direction);
        return work === state.resume.work ? state : { lastTouched: now(), resume: { ...state.resume, work } };
      }),
      restoreWork: (entry, resumeId) => changeExperience(state => {
        const work = restoreExperience(state.resume.work, entry, resumeId, state.resume.id);
        return work === state.resume.work ? state : { lastTouched: now(), resume: withATS({ ...state.resume, work }) };
      }),
      removeWork: (id) =>
        changeExperience((state) => ({
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
      addProject: () => {
        const id = `project-${crypto.randomUUID()}`;
        changeExperience((state) => ({
          lastTouched: now(),
          resume: withATS({
            ...state.resume,
            projects: [...state.resume.projects, { id, name: "", role: "", startDate: "", endDate: "", bullets: [], tags: [] }]
          })
        }));
        return id;
      },
      moveProject: (id, direction) => changeExperience(state => {
        const projects = moveExperience(state.resume.projects, id, direction);
        return projects === state.resume.projects ? state : { lastTouched: now(), resume: { ...state.resume, projects } };
      }),
      restoreProject: (entry, resumeId) => changeExperience(state => {
        const projects = restoreExperience(state.resume.projects, entry, resumeId, state.resume.id);
        return projects === state.resume.projects ? state : { lastTouched: now(), resume: withATS({ ...state.resume, projects }) };
      }),
      removeProject: (id) =>
        changeExperience((state) => ({
          lastTouched: now(),
          resume: withATS({ ...state.resume, projects: state.resume.projects.filter((item) => item.id !== id) })
        })),
      updateSkills: (skills) =>
        set((state) => ({
          lastTouched: now(),
          resume: withATS({ ...state.resume, skills })
        })),
      setTemplate: (template) => set({ template, lastTouched: now() }),
      setSectionOrder: (order) =>
        set({ sectionOrder: normalizeSectionOrder(order), orderPreset: "custom", lastTouched: now() }),
      moveSection: (key, direction) =>
        set((state) => {
          const index = state.sectionOrder.indexOf(key);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= state.sectionOrder.length) return state;
          const sectionOrder = [...state.sectionOrder];
          [sectionOrder[index], sectionOrder[target]] = [sectionOrder[target], sectionOrder[index]];
          return { sectionOrder, orderPreset: "custom", lastTouched: now() };
        }),
      applyOrderPreset: (preset) =>
        set({ sectionOrder: normalizeSectionOrder(presetByKey(preset).order), orderPreset: preset, lastTouched: now() }),
      loadTemplate: (template) => {
        const order = legacyOrderForTemplate(template);
        set({
          template,
          sectionOrder: order,
          orderPreset: matchOrderPreset(order),
          lastTouched: now(),
          resume: withATS(templateResumes[template] || defaultResume)
        });
      },
      resetResume: () =>
        set({
          resume: withATS(defaultResume),
          template: "focus",
          sectionOrder: DEFAULT_SECTION_ORDER,
          orderPreset: DEFAULT_ORDER_PRESET,
          lastTouched: now()
        })
      };
    },
    {
      name: "offerforge-react-resume",
      merge: (persisted, current) => {
        const restored = hydrateResumeState(persisted, current);
        return { ...restored, resume: withATS(restored.resume) };
      }
    }
  )
);
