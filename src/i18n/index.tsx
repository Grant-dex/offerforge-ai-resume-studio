import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// ============================================================
// Translations
// ============================================================

const zh = {
  // App / Brand
  "app.name": "OfferForge",
  "app.subtitle": "AI Resume Studio",

  // StepTabs
  "step.basic": "基本信息",
  "step.work": "工作经历",
  "step.projects": "项目经历",
  "step.skills": "技能与教育",
  "step.export": "预览与导出",

  // TopBar
  "topbar.saved": "已自动保存",
  "topbar.aiScore": "AI评分",
  "topbar.suggestions": "优化建议",
  "topbar.export": "导出简历",
  "topbar.scoreTitle": "AI 简历评分",
  "topbar.analyzing": "AI 正在分析你的简历...",
  "topbar.keywordMatch": "关键词匹配度",
  "topbar.formatNorm": "格式规范性",
  "topbar.contentComplete": "内容完整度",
  "topbar.quantified": "量化成果",
  "topbar.overall": "整体竞争力",
  "topbar.totalScore": "综合评分",
  "topbar.excellent": "简历整体质量优秀，竞争力强",
  "topbar.good": "简历质量良好，仍有优化空间",
  "topbar.needsWork": "建议按提示优化，提升匹配度",
  "topbar.aiTips": "AI 改进建议",
  "topbar.sugTitle": "AI 优化建议",
  "topbar.generating": "AI 正在生成优化建议...",
  "topbar.original": "原文：",
  "topbar.optimized": "优化：",
  "topbar.apply": "一键应用",
  "topbar.priority": "优先级",
  "topbar.priorityHigh": "高",
  "topbar.priorityMid": "中",
  "topbar.priorityLow": "低",
  "topbar.applied": "已应用：",

  // BasicInfo
  "basic.title": "基本信息",
  "basic.subtitle": "完善基本信息，让招聘者快速了解你",
  "basic.templateFocus": "Focus 销售类",
  "basic.templateStack": "Stack 技术类",
  "basic.templateLead": "Lead 管理类",
  "basic.templateFocusDesc": "销售岗位专属优化",
  "basic.templateStackDesc": "技术岗位专属优化",
  "basic.templateLeadDesc": "管理岗位专属优化",
  "basic.proOnly": "Pro 用户专享",
  "basic.aiRemaining": "剩余 {n} 次 AI 优化",
  "basic.uploadAvatar": "点击上传头像",
  "basic.avatarLabel": "个人头像",
  "basic.avatarHint": "支持 JPG、PNG 格式，建议 200×200 以上",
  "basic.removeAvatar": "移除头像",
  "basic.personalInfo": "个人信息",
  "basic.resumeName": "简历名称",
  "basic.targetRole": "目标岗位",
  "basic.name": "姓名",
  "basic.seniority": "资历",
  "basic.phone": "电话",
  "basic.email": "邮箱",
  "basic.city": "所在城市",
  "basic.summary": "个人简介",
  "basic.currentStep": "当前步骤",
  "basic.prev": "上一步",
  "basic.next": "下一步 →",

  // WorkExperience
  "work.title": "工作经历",
  "work.subtitle": "添加你的工作经历，突出核心成就",
  "work.company": "公司名称",
  "work.jobTitle": "工作称号",
  "work.startDate": "开始时间",
  "work.city": "城市",
  "work.descHint": "工作描述 · 每行自动转为 bullet",
  "work.aiFill": "AI智能填充",
  "work.keywordTags": "关键词标签",
  "work.tagPlaceholder": "输入标签，回车添加",
  "work.add": "添加",
  "work.deleteItem": "删除此经历",
  "work.addItem": "+ 添加工作经历",
  "work.confirmDelete": "确定删除这条工作经历？",
  "work.optimizeResult": "AI 优化结果确认",
  "work.beforeOptimize": "优化前",
  "work.afterOptimize": "AI 优化后",
  "work.cancel": "取消",
  "work.applyOptimize": "应用优化",
  "work.optimizeApplied": "AI 优化已应用",
  "work.optimizeFailed": "AI 优化失败",
  "work.fillContentFirst": "请先填写工作描述内容",
  "work.tagSeparatorHint": "输入标签，回车添加",

  // ProjectExperience
  "project.title": "项目经历 (Project Experience)",
  "project.subtitle": "展示你的代表性项目、结果突破能力",
  "project.name": "项目名称",
  "project.role": "担任角色",
  "project.startDate": "开始时间",
  "project.endDate": "项目时间",
  "project.confirmDelete": "确定删除这条项目经历？",

  // SkillsEducation
  "skills.title": "技能与教育 (Skills & Education)",
  "skills.subtitle": "完善技能标签与教育背景，提升简历专业感",
  "skills.keywordTags": "关键词标签",
  "skills.featured": "精选",
  "skills.beginner": "入门",
  "skills.proficient": "精通",
  "skills.expert": "专家",
  "skills.placeholder": "输入技能，回车添加",
  "skills.add": "添加",
  "skills.aiRecommend": "AI推荐技能",
  "skills.education": "Education",
  "skills.school": "学校名称",
  "skills.major": "专业",
  "skills.degree": "学历",
  "skills.years": "起止时间",
  "skills.eduTags": "教育关键词标签",
  "skills.addEdu": "+ 添加教育经历",

  // PreviewExport
  "preview.title": "预览与导出 (Preview & Export)",
  "preview.subtitle": "选择模板，导出你的专属简历",
  "preview.exportPdf": "导出 PDF",
  "preview.exportWord": "导出 Word",
  "preview.copyLink": "复制链接分享",

  // LivePreview
  "preview.live": "实时预览",
  "preview.templateFocus": "销售类 / Focus",
  "preview.templateStack": "技术类 / Stack",
  "preview.templateLead": "管理类 / Lead",
  "preview.coreSkills": "核心技能",
  "preview.workExperience": "工作经历",
  "preview.projectExperience": "项目经历",
  "preview.education": "教育背景",
  "preview.atsScore": "ATS匹配度",

  // Sidebar
  "sidebar.myResume": "我的简历",
  "sidebar.rename": "重命名",
  "sidebar.delete": "删除",
  "sidebar.completeness": "简历完整度",
  "sidebar.newResume": "新建简历",
  "sidebar.settings": "设置",
  "sidebar.jobTracker": "求职追踪",
  "sidebar.add": "添加",
  "sidebar.noJobs": "暂无投递记录",
  "sidebar.companyPlaceholder": "公司名称",
  "sidebar.rolePlaceholder": "岗位名称",
  "sidebar.confirmAdd": "确认添加",
  "sidebar.cancel": "取消",
  "sidebar.statusPending": "待回复",
  "sidebar.statusInterview": "面试中",
  "sidebar.statusRejected": "已拒绝",
  "sidebar.dailyTip": "每日贴士",
  "sidebar.upgradePro": "升级 Pro",
  "sidebar.proFeature1": "无限次 AI 优化",
  "sidebar.proFeature2": "专属简历模板",
  "sidebar.proFeature3": "导出高清 PDF",
  "sidebar.upgradeNow": "立即升级",
  "sidebar.proModalTitle": "升级到 OfferForge Pro",
  "sidebar.proAnnual": "Pro 年费订阅",
  "sidebar.proPrice": "¥198",
  "sidebar.proPerYear": "/年",
  "sidebar.proAll1": "无限次 AI 优化",
  "sidebar.proAll2": "所有专属简历模板",
  "sidebar.proAll3": "导出高清 PDF（无水印）",
  "sidebar.proAll4": "ATS 深度分析报告",
  "sidebar.proAll5": "7 天无理由退款",
  "sidebar.confirmUpgrade": "确认升级",
  "sidebar.securePayment": "安全支付 · 7 天无理由退款",
  "sidebar.subThanks": "感谢订阅！Pro 功能已解锁。",
  "sidebar.renameTitle": "重命名简历",
  "sidebar.renameLabel": "请输入新名称",
  "sidebar.renamed": "简历名称已更新",
  "sidebar.deleteTitle": "删除简历",
  "sidebar.deleteMsg": "确定要删除当前简历吗？此操作不可恢复。",
  "sidebar.deleteLabel": "删除",
  "sidebar.newTitle": "新建简历",
  "sidebar.newMsg": "将基于空白模板创建一份新的简历。",
  "sidebar.newLabel": "新建",
  "sidebar.switchTitle": "切换简历",
  "sidebar.switchMsg": "切换到\"{name}\"？当前未保存的更改将丢失。",
  "sidebar.switchLabel": "切换",
  "sidebar.created": "已创建新简历",
  "sidebar.switchedTo": "已切换到\"{name}\"",
  "sidebar.deleted": "简历已删除",
  "sidebar.deletedEntry": "已删除\"{name}\"",

  // Settings Modal
  "settings.title": "设置",
  "settings.language": "语言",
  "settings.languageDesc": "切换界面显示语言",
  "settings.theme": "主题色",
  "settings.themeDesc": "选择界面主题颜色",
  "settings.aiModel": "AI 模型偏好",
  "settings.aiModelDesc": "选择 AI 优化使用的模型",
  "settings.fastMode": "快速模式（deepseek-v4-flash）",
  "settings.preciseMode": "精准模式（deepseek-v4-pro）",
  "settings.clearData": "清除本地数据",
  "settings.clearDataDesc": "清除所有保存在本地的数据",
  "settings.clearBtn": "清除数据",
  "settings.clearConfirm": "确定要清除所有本地数据吗？此操作不可恢复。",
  "settings.cleared": "本地数据已清除",
  "settings.account": "账号信息",
  "settings.notLoggedIn": "未登录",
  "settings.login": "登录",
  "settings.loginHint": "登录后可同步数据到云端",

  // Daily tips
  "tip.1": "用数字量化成果，如'提升销售额30%'比'提升销售额'更有说服力",
  "tip.2": "简历中的关键词要与目标岗位JD高度匹配，ATS系统会优先筛选",
  "tip.3": "每段工作经历控制在3-5个要点，聚焦最核心的成就",
  "tip.4": "项目经历用STAR法则描述：情境、任务、行动、结果",
  "tip.5": "简历不要超过一页A4纸，HR平均只花6秒浏览一份简历",
  "tip.6": "使用行业专业术语，但避免过于生僻的缩写",
  "tip.7": "简历命名格式：姓名_岗位_工作年限.pdf，方便HR归档",
  "tip.8": "定期更新简历，即使不找工作也能保持对自身成长的感知",
  "tip.9": "在LinkedIn上保持与简历一致的经历描述，增加可信度",
  "tip.10": "简历开头用一句话总结核心竞争力，形成强烈的第一印象",

  // Misc
  "misc.apiKeyError": "未配置 API Key，请在 .env 文件中设置 VITE_ANTHROPIC_AUTH_TOKEN",
  "misc.timeout": "请求超时，请重试",
  "misc.aiFailed": "AI 请求失败",
  "misc.parseFailed": "AI 返回数据解析失败，请重试",
  "misc.noSuggestions": "AI 未返回有效的优化建议，请重试",
  "misc.scoreFailed": "AI 评分失败",
  "misc.sugFailed": "获取建议失败",
};

const en: typeof zh = {
  "app.name": "OfferForge",
  "app.subtitle": "AI Resume Studio",

  "step.basic": "Basic Info",
  "step.work": "Work",
  "step.projects": "Projects",
  "step.skills": "Skills & Edu",
  "step.export": "Export",

  "topbar.saved": "Auto saved",
  "topbar.aiScore": "AI Score",
  "topbar.suggestions": "Suggestions",
  "topbar.export": "Export",
  "topbar.scoreTitle": "AI Resume Score",
  "topbar.analyzing": "AI is analyzing your resume...",
  "topbar.keywordMatch": "Keywords",
  "topbar.formatNorm": "Format",
  "topbar.contentComplete": "Completeness",
  "topbar.quantified": "Quantified",
  "topbar.overall": "Overall",
  "topbar.totalScore": "Overall Score",
  "topbar.excellent": "Excellent resume quality, highly competitive",
  "topbar.good": "Good resume quality, room for improvement",
  "topbar.needsWork": "Follow suggestions to improve match rate",
  "topbar.aiTips": "AI Suggestions",
  "topbar.sugTitle": "AI Optimization Suggestions",
  "topbar.generating": "AI is generating suggestions...",
  "topbar.original": "Original: ",
  "topbar.optimized": "Optimized: ",
  "topbar.apply": "Apply",
  "topbar.priority": "Priority",
  "topbar.priorityHigh": "High",
  "topbar.priorityMid": "Mid",
  "topbar.priorityLow": "Low",
  "topbar.applied": "Applied: ",

  "basic.title": "Basic Info",
  "basic.subtitle": "Complete your basic information for recruiters",
  "basic.templateFocus": "Focus — Sales",
  "basic.templateStack": "Stack — Tech",
  "basic.templateLead": "Lead — Management",
  "basic.templateFocusDesc": "Optimized for sales roles",
  "basic.templateStackDesc": "Optimized for tech roles",
  "basic.templateLeadDesc": "Optimized for management roles",
  "basic.proOnly": "Pro Exclusive",
  "basic.aiRemaining": "{n} AI optimizations remaining",
  "basic.uploadAvatar": "Upload photo",
  "basic.avatarLabel": "Profile Photo",
  "basic.avatarHint": "JPG or PNG, recommended 200×200+",
  "basic.removeAvatar": "Remove photo",
  "basic.personalInfo": "Personal Info",
  "basic.resumeName": "Resume Name",
  "basic.targetRole": "Target Role",
  "basic.name": "Name",
  "basic.seniority": "Seniority",
  "basic.phone": "Phone",
  "basic.email": "Email",
  "basic.city": "City",
  "basic.summary": "Summary",
  "basic.currentStep": "Current Step",
  "basic.prev": "Previous",
  "basic.next": "Next →",

  "work.title": "Work Experience",
  "work.subtitle": "Add your work experience and highlight key achievements",
  "work.company": "Company",
  "work.jobTitle": "Job Title",
  "work.startDate": "Start Date",
  "work.city": "City",
  "work.descHint": "Job description · one bullet per line",
  "work.aiFill": "AI Fill",
  "work.keywordTags": "Keyword Tags",
  "work.tagPlaceholder": "Type tag, Enter to add",
  "work.add": "Add",
  "work.deleteItem": "Delete this experience",
  "work.addItem": "+ Add Work Experience",
  "work.confirmDelete": "Delete this work experience?",
  "work.optimizeResult": "AI Optimization Result",
  "work.beforeOptimize": "Before",
  "work.afterOptimize": "AI Optimized",
  "work.cancel": "Cancel",
  "work.applyOptimize": "Apply Optimization",
  "work.optimizeApplied": "AI optimization applied",
  "work.optimizeFailed": "AI optimization failed",
  "work.fillContentFirst": "Please fill in the job description first",
  "work.tagSeparatorHint": "Type tag, Enter to add",

  "project.title": "Project Experience",
  "project.subtitle": "Showcase your key projects and breakthrough results",
  "project.name": "Project Name",
  "project.role": "Role",
  "project.startDate": "Start Date",
  "project.endDate": "End Date",
  "project.confirmDelete": "Delete this project experience?",

  "skills.title": "Skills & Education",
  "skills.subtitle": "Add skills and education to enhance your resume",
  "skills.keywordTags": "Keyword Tags",
  "skills.featured": "Featured",
  "skills.beginner": "Beginner",
  "skills.proficient": "Proficient",
  "skills.expert": "Expert",
  "skills.placeholder": "Type skill, Enter to add",
  "skills.add": "Add",
  "skills.aiRecommend": "AI Recommended Skills",
  "skills.education": "Education",
  "skills.school": "School",
  "skills.major": "Major",
  "skills.degree": "Degree",
  "skills.years": "Period",
  "skills.eduTags": "Education Tags",
  "skills.addEdu": "+ Add Education",

  "preview.title": "Preview & Export",
  "preview.subtitle": "Choose a template and export your resume",
  "preview.exportPdf": "Export PDF",
  "preview.exportWord": "Export Word",
  "preview.copyLink": "Copy Share Link",

  "preview.live": "Live Preview",
  "preview.templateFocus": "Sales / Focus",
  "preview.templateStack": "Tech / Stack",
  "preview.templateLead": "Management / Lead",
  "preview.coreSkills": "Core Skills",
  "preview.workExperience": "Work Experience",
  "preview.projectExperience": "Project Experience",
  "preview.education": "Education",
  "preview.atsScore": "ATS Match Score",

  "sidebar.myResume": "My Resumes",
  "sidebar.rename": "Rename",
  "sidebar.delete": "Delete",
  "sidebar.completeness": "Completeness",
  "sidebar.newResume": "New Resume",
  "sidebar.settings": "Settings",
  "sidebar.jobTracker": "Job Tracker",
  "sidebar.add": "Add",
  "sidebar.noJobs": "No applications yet",
  "sidebar.companyPlaceholder": "Company name",
  "sidebar.rolePlaceholder": "Job title",
  "sidebar.confirmAdd": "Confirm",
  "sidebar.cancel": "Cancel",
  "sidebar.statusPending": "Pending",
  "sidebar.statusInterview": "Interview",
  "sidebar.statusRejected": "Rejected",
  "sidebar.dailyTip": "Daily Tip",
  "sidebar.upgradePro": "Upgrade to Pro",
  "sidebar.proFeature1": "Unlimited AI Optimization",
  "sidebar.proFeature2": "Exclusive Templates",
  "sidebar.proFeature3": "HD PDF Export",
  "sidebar.upgradeNow": "Upgrade Now",
  "sidebar.proModalTitle": "Upgrade to OfferForge Pro",
  "sidebar.proAnnual": "Pro Annual Subscription",
  "sidebar.proPrice": "$28",
  "sidebar.proPerYear": "/year",
  "sidebar.proAll1": "Unlimited AI optimization",
  "sidebar.proAll2": "All exclusive resume templates",
  "sidebar.proAll3": "HD PDF export (no watermark)",
  "sidebar.proAll4": "ATS deep analysis report",
  "sidebar.proAll5": "7-day money-back guarantee",
  "sidebar.confirmUpgrade": "Confirm Upgrade",
  "sidebar.securePayment": "Secure payment · 7-day money-back",
  "sidebar.subThanks": "Thank you for subscribing! Pro features unlocked.",
  "sidebar.renameTitle": "Rename Resume",
  "sidebar.renameLabel": "Enter new name",
  "sidebar.renamed": "Resume renamed",
  "sidebar.deleteTitle": "Delete Resume",
  "sidebar.deleteMsg": "Are you sure you want to delete this resume? This cannot be undone.",
  "sidebar.deleteLabel": "Delete",
  "sidebar.newTitle": "New Resume",
  "sidebar.newMsg": "A new resume will be created from a blank template.",
  "sidebar.newLabel": "Create",
  "sidebar.switchTitle": "Switch Resume",
  "sidebar.switchMsg": "Switch to \"{name}\"? Unsaved changes will be lost.",
  "sidebar.switchLabel": "Switch",
  "sidebar.created": "New resume created",
  "sidebar.switchedTo": "Switched to \"{name}\"",
  "sidebar.deleted": "Resume deleted",
  "sidebar.deletedEntry": "Deleted \"{name}\"",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.languageDesc": "Switch interface language",
  "settings.theme": "Theme Color",
  "settings.themeDesc": "Choose interface theme color",
  "settings.aiModel": "AI Model Preference",
  "settings.aiModelDesc": "Choose the AI model for optimization",
  "settings.fastMode": "Fast Mode (deepseek-v4-flash)",
  "settings.preciseMode": "Precise Mode (deepseek-v4-pro)",
  "settings.clearData": "Clear Local Data",
  "settings.clearDataDesc": "Remove all locally saved data",
  "settings.clearBtn": "Clear Data",
  "settings.clearConfirm": "Are you sure you want to clear all local data? This cannot be undone.",
  "settings.cleared": "Local data cleared",
  "settings.account": "Account Info",
  "settings.notLoggedIn": "Not Logged In",
  "settings.login": "Log In",
  "settings.loginHint": "Log in to sync data to the cloud",

  "tip.1": "Quantify achievements with numbers — 'increased sales by 30%' is more convincing than 'increased sales'",
  "tip.2": "Match resume keywords to the target job description for better ATS screening",
  "tip.3": "Keep each work experience to 3-5 bullet points, focusing on key achievements",
  "tip.4": "Use the STAR method for projects: Situation, Task, Action, Result",
  "tip.5": "Keep your resume to one A4 page — recruiters spend an average of 6 seconds per resume",
  "tip.6": "Use industry terminology but avoid obscure abbreviations",
  "tip.7": "Name your resume file: Name_Role_Experience.pdf for easy HR filing",
  "tip.8": "Update your resume regularly, even when not job hunting, to stay aware of your growth",
  "tip.9": "Keep your LinkedIn profile consistent with your resume for credibility",
  "tip.10": "Open with a one-sentence summary of your core strengths for a strong first impression",

  "misc.apiKeyError": "API Key not configured. Set VITE_ANTHROPIC_AUTH_TOKEN in .env",
  "misc.timeout": "Request timed out, please retry",
  "misc.aiFailed": "AI request failed",
  "misc.parseFailed": "AI response parse failed, please retry",
  "misc.noSuggestions": "AI returned no valid suggestions, please retry",
  "misc.scoreFailed": "AI scoring failed",
  "misc.sugFailed": "Failed to get suggestions",
};

export type Locale = "zh" | "en";
export type TranslationKey = keyof typeof zh;

const translations: Record<Locale, typeof zh> = { zh, en };

// ============================================================
// Context & Hook
// ============================================================

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem("offerforge-locale");
    if (stored === "en" || stored === "zh") return stored;
  } catch { /* ignore */ }
  return "zh";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try { localStorage.setItem("offerforge-locale", next); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text = translations[locale][key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
