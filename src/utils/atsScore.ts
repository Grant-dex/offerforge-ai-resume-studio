import type { ResumeData } from "../types/resume";

/**
 * Calculate ATS (Applicant Tracking System) compatibility score.
 * Evaluates resume completeness and keyword richness on a 0-100 scale.
 */
export function calcATSScore(resume: ResumeData): number {
  let score = 0;

  const { personal, skills, work, projects, education } = resume;

  // ── 1. Personal Info (25 pts) ──────────────────────────────────
  if (personal.name?.trim()) score += 5;
  if (personal.phone?.trim()) score += 5;
  if (personal.email?.trim()) score += 5;
  if (personal.city?.trim()) score += 3;
  if (personal.role?.trim()) score += 5;
  if ((personal.summary?.length ?? 0) > 20) score += 2;

  // ── 2. Work Experience (30 pts) ────────────────────────────────
  const validWork = work.filter((w) => w.company?.trim() || w.bullets.length > 0);
  if (validWork.length > 0) {
    // Number of experiences (up to 8 pts)
    score += Math.min(validWork.length, 3) * 2.5 + (validWork.length > 3 ? 0.5 : 0);

    // Bullet points detail (up to 10 pts)
    const totalBullets = validWork.reduce((sum, w) => sum + w.bullets.filter((b) => b.length > 5).length, 0);
    score += Math.min(totalBullets * 1.5, 10);

    // Quantified achievements — count digits/%/$ in bullets (up to 12 pts)
    const quantifiedCount = validWork.reduce((sum, w) =>
      sum + w.bullets.filter((b) => /\d/.test(b)).length, 0
    );
    score += Math.min(quantifiedCount * 2, 12);
  }

  // ── 3. Skills (15 pts) ─────────────────────────────────────────
  const skillCount = skills.filter((s) => s.trim()).length;
  score += Math.min(skillCount * 2, 15);

  // ── 4. Education (10 pts) ──────────────────────────────────────
  if (education.school?.trim()) score += 4;
  if (education.major?.trim()) score += 3;
  if (education.degree?.trim()) score += 3;

  // ── 5. Projects (10 pts) ───────────────────────────────────────
  const validProjects = projects.filter((p) => p.name?.trim() || p.bullets.length > 0);
  if (validProjects.length > 0) {
    score += Math.min(validProjects.length * 2, 5);
    const projectBullets = validProjects.reduce((sum, p) => sum + p.bullets.filter((b) => b.length > 5).length, 0);
    score += Math.min(projectBullets * 1, 5);
  }

  // ── 6. Keyword Tags (10 pts) ───────────────────────────────────
  const workTags = validWork.reduce((sum, w) => sum + (w.tags?.length ?? 0), 0);
  const projectTags = validProjects.reduce((sum, p) => sum + (p.tags?.length ?? 0), 0);
  const eduTags = education.tags?.length ?? 0;
  score += Math.min(workTags + projectTags + eduTags, 10);

  // ── Bonus: education description (up to 3 pts) ─────────────────
  if (education.description) {
    const descLines = education.description.split("\n").filter(Boolean);
    score += Math.min(descLines.length, 3);
  }

  return Math.min(100, Math.round(score));
}
