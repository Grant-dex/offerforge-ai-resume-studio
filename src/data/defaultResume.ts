import type { ResumeData } from "../types/resume";

export const defaultResume: ResumeData = {
  id: "resume-sales-growth",
  title: "销售增长版简历",
  subtitle: "高级销售经理 · sales",
  lastSaved: "10:30",
  aiScore: 86,
  atsScore: 92,
  personal: {
    resumeTitle: "销售增长版简历",
    name: "陈一诺",
    role: "高级销售经理",
    seniority: "5年ToB销售与客户增长经验",
    email: "chenyinuo@email.com",
    phone: "138-0013-8000",
    city: "上海",
    summary:
      "擅长重点客户开拓、方案销售和年度业绩达成，连续两年完成并超额营收目标。",
    avatar: ""
  },
  skills: ["客户开发", "方案销售", "CRM", "商务谈判", "数据复盘", "团队管理"],
  work: [
    {
      id: "work-1",
      company: "销售增长科技",
      title: "高级销售经理",
      city: "上海",
      startDate: "2021-06",
      endDate: "至今",
      bullets: [
        "连续两年达成并超额完成年度营收目标",
        "建立并优化销售流程，提升转化率 30%+",
        "成功拓展多家重点客户，长期合作率 90%+"
      ],
      tags: ["B2B销售", "CRM", "客户成功"]
    },
    {
      id: "work-2",
      company: "云启软件",
      title: "销售工程师 → 销售主管",
      city: "上海",
      startDate: "2019-07",
      endDate: "2021-05",
      bullets: [
        "负责重点行业客户管理，沉淀标准化商机推进方法",
        "带领团队完成季度销售目标，推动跨部门协同交付"
      ],
      tags: ["团队管理", "商机推进"]
    }
  ],
  projects: [
    {
      id: "project-1",
      name: "华东制造业客户拓展计划",
      role: "项目负责人",
      startDate: "2022-03",
      endDate: "2023-05",
      bullets: ["建立行业线索策略，提升转化率 30%+", "成功拓展多渠道客户，长期合作率 90%+"],
      tags: ["线索策略", "渠道拓展", "转化率提升"]
    },
    {
      id: "project-2",
      name: "重点客户复购提升计划",
      role: "核心成员",
      startDate: "2022-06",
      endDate: "2023-02",
      bullets: ["搭建客户分层运营机制，提升复购效率"],
      tags: ["CRM", "客户成功"]
    }
  ],
  education: {
    school: "上海交通大学 (SJTU)",
    major: "市场营销专业",
    degree: "本科",
    years: "2015 - 2019",
    tags: []
  }
};

// Template resume for 技术类 (Stack)
export const stackResume: ResumeData = {
  id: "resume-stack-tech",
  title: "技术进阶版简历",
  subtitle: "高级前端工程师 · tech",
  lastSaved: "10:30",
  aiScore: 88,
  atsScore: 90,
  personal: {
    resumeTitle: "技术进阶版简历",
    name: "李泽远",
    role: "高级前端工程师",
    seniority: "6年前端开发与全栈经验",
    email: "lizeyuan@email.com",
    phone: "139-0015-7000",
    city: "北京",
    summary: "专注 React 生态与前端工程化，主导过多个大型 B 端产品架构设计与性能优化，具备全栈交付能力。",
    avatar: ""
  },
  skills: ["React", "TypeScript", "Next.js", "Node.js", "性能优化", "系统架构"],
  work: [
    {
      id: "work-stack-1",
      company: "某头部互联网公司",
      title: "高级前端工程师",
      city: "北京",
      startDate: "2022-03",
      endDate: "至今",
      bullets: [
        "主导电商中台前端架构升级，首屏加载时间从 4.2s 降至 1.1s",
        "搭建组件库与 CI/CD 流水线，覆盖 12 条业务线，复用率 85%+",
        "推动 TypeScript 全量迁移，线上 Bug 率下降 40%"
      ],
      tags: ["React", "TypeScript", "性能优化"]
    },
    {
      id: "work-stack-2",
      company: "某 FinTech 创业公司",
      title: "前端开发工程师",
      city: "杭州",
      startDate: "2019-07",
      endDate: "2022-02",
      bullets: [
        "负责交易系统前端从 0 到 1 搭建，支撑日均 50 万+ 笔交易",
        "设计微前端架构方案，实现 3 个业务团队独立部署与协作"
      ],
      tags: ["Vue.js", "微前端", "Node.js"]
    }
  ],
  projects: [
    {
      id: "project-stack-1",
      name: "企业级组件库 Pluto",
      role: "技术负责人",
      startDate: "2023-01",
      endDate: "2023-06",
      bullets: ["从零搭建 60+ 组件，支持主题定制与国际化", "NPM 周下载量 3000+，被 5 个团队采用"],
      tags: ["React", "Monorepo", "Storybook"]
    },
    {
      id: "project-stack-2",
      name: "全栈 CMS 管理平台",
      role: "全栈开发",
      startDate: "2022-06",
      endDate: "2022-12",
      bullets: ["基于 Next.js + Prisma 构建，实现可视化页面搭建", "集成 AI 内容生成，运营效率提升 60%"],
      tags: ["Next.js", "PostgreSQL", "AI"]
    }
  ],
  education: {
    school: "浙江大学 (ZJU)",
    major: "计算机科学与技术",
    degree: "硕士",
    years: "2017 - 2019",
    tags: []
  }
};

// Template resume for 管理类 (Lead) — PRO
export const leadResume: ResumeData = {
  id: "resume-lead-mgmt",
  title: "管理进阶版简历",
  subtitle: "产品总监 · management",
  lastSaved: "10:30",
  aiScore: 91,
  atsScore: 94,
  personal: {
    resumeTitle: "管理进阶版简历",
    name: "张明远",
    role: "产品总监",
    seniority: "10年产品管理与团队领导经验",
    email: "zhangmingyuan@email.com",
    phone: "136-0018-9000",
    city: "深圳",
    summary: "10 年互联网产品经验，曾主导多款千万级用户产品从 0 到 1，擅长产品战略规划、跨部门资源整合与高绩效团队建设。",
    avatar: ""
  },
  skills: ["产品战略", "用户增长", "数据分析", "团队管理", "OKR", "跨部门协作"],
  work: [
    {
      id: "work-lead-1",
      company: "某头部科技公司",
      title: "产品总监",
      city: "深圳",
      startDate: "2020-03",
      endDate: "至今",
      bullets: [
        "管理 25 人产品团队，制定年度产品路线图，带领团队交付 3 条核心产品线",
        "主导 AIGC 产品从 0 到 1，上线 6 个月 DAU 突破 200 万，营收贡献 1.2 亿/年",
        "建立数据驱动的产品决策机制，需求上线后复盘覆盖率从 30% 提升至 95%"
      ],
      tags: ["产品战略", "AIGC", "团队管理"]
    },
    {
      id: "work-lead-2",
      company: "某知名 SaaS 公司",
      title: "高级产品经理",
      city: "广州",
      startDate: "2016-07",
      endDate: "2020-02",
      bullets: [
        "负责企业 SaaS 产品规划与迭代，客户续费率从 72% 提升至 91%",
        "推动落地混合云部署方案，拿下 3 个百万级大客户",
        "培养 4 名初级 PM 成长为独立项目负责人"
      ],
      tags: ["SaaS", "企业服务", "人才培养"]
    }
  ],
  projects: [
    {
      id: "project-lead-1",
      name: "AIGC 智能助手产品",
      role: "产品负责人",
      startDate: "2023-02",
      endDate: "2023-12",
      bullets: ["定义产品 MVP 并推进落地，0 投放实现 50 万自然用户", "搭建 A/B 实验体系，关键转化指标提升 35%"],
      tags: ["0到1", "AI产品", "增长"]
    },
    {
      id: "project-lead-2",
      name: "集团数字化转型项目",
      role: "项目总监",
      startDate: "2021-05",
      endDate: "2022-08",
      bullets: ["协调 6 个部门 80+ 人完成核心系统改造", "项目周期缩短 30%，获 CEO 特别奖"],
      tags: ["项目管理", "数字化转型"]
    }
  ],
  education: {
    school: "北京大学 (PKU)",
    major: "工商管理 (MBA)",
    degree: "硕士",
    years: "2014 - 2016",
    tags: []
  }
};

export const templateResumes: Record<string, ResumeData> = {
  focus: defaultResume,
  stack: stackResume,
  lead: leadResume
};

export const recommendedSkills = [
  "销售漏斗管理",
  "KPI达成",
  "客户成功",
  "B2B销售",
  "市场分析",
  "Excel数据分析"
];
