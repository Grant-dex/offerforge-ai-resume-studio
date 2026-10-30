import { isValidEmail, validateExperienceDates } from "./formValidation";
import type { ResumeData } from "../types/resume";
export interface ResumeCheck { id: string; title: string; detail: string; path: string; action: string; }
export function getResumeChecks(resume: ResumeData): ResumeCheck[] {
  const personal = resume.personal;
  const missing = [!personal.name.trim() && '姓名', !personal.role.trim() && '目标岗位', !personal.email.trim() && '邮箱', !personal.phone.trim() && '电话'].filter(Boolean);
  const emailInvalid = personal.email.trim() && !isValidEmail(personal.email);
  const hasExperience = resume.work.some(item=>item.company.trim() && item.bullets.some(line=>line.trim())) || resume.projects.some(item=>item.name.trim() && item.bullets.some(line=>line.trim()));
  const workDates = resume.work.some(item => validateExperienceDates(item.startDate, item.endDate).invalid);
  const projectDates = resume.projects.some(item => validateExperienceDates(item.startDate, item.endDate).invalid);
  const invalidDates = workDates || projectDates;
  return [
    {id:'contact',title:missing.length || emailInvalid ? '联系信息待完善' : '确认联系信息',detail:missing.length ? `待填写：${missing.join('、')}` : emailInvalid ? '邮箱格式需要检查。' : '姓名与联系方式已填写，请核对是否准确。',path:'/basic',action:'查看基本信息'},
    {id:'experience',title:invalidDates ? '经历时间需检查' : hasExperience ? '核对经历与成果' : '补充经历内容',detail:invalidDates ? '存在日期格式错误或结束时间早于开始时间，请修正后投递。' : hasExperience ? '核对职责、时间、数据与实际贡献，删除不属于你的示例内容。' : '至少补充一段有实际职责或成果的工作、项目经历。',path:invalidDates ? (workDates ? '/work' : '/projects') : resume.work.length ? '/work' : '/projects',action:'检查经历'},
    {id:'export',title:'确认文件排版',detail:'导出后检查分页、联系方式、长段落与内容是否完整。',path:'/export',action:'预览与导出'}
  ];
}
