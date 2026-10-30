import { getResumeTemplate, type ResumeSectionKey } from "../../data/resumeTemplates";
import { normalizeSectionOrder } from "../../data/sectionOrder";
import type { ResumeData, TemplateKey } from "../../types/resume";
import { DeepGreenTemplate } from "./DeepGreen";
import { EditorialTemplate } from "./Editorial";
import { SwissTemplate } from "./Swiss";
import { prepareResume, type EditSection } from "./shared";

/** Dispatches to the paper design that matches the selected template. */
export function ResumeDocument({
  resume, template = "focus", sectionOrder, activeSection, onEditSection, documentId = "resume-preview",
}: {
  resume: ResumeData;
  documentId?: string | null;
  template?: TemplateKey;
  sectionOrder?: ResumeSectionKey[];
  activeSection?: string;
  onEditSection?: EditSection;
}) {
  const model = prepareResume(resume);
  const order = normalizeSectionOrder(sectionOrder, getResumeTemplate(template).order);
  const props = { model, order, activeSection, onEditSection, documentId };
  if (template === "stack") return <SwissTemplate {...props} />;
  if (template === "lead") return <DeepGreenTemplate {...props} />;
  return <EditorialTemplate {...props} />;
}

export type { EditSection } from "./shared";
