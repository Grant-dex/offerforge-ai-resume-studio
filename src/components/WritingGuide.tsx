import { ArrowRight, BookOpen, Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type Guide = { title: string; intro: string; steps: string[]; example: string; questions: string[]; note: string };
const guides: Record<string, Guide> = {
  "/basic": {
    title: "让招聘者快速认识你", intro: "基本信息保持简洁，个人简介用经历说明你能解决什么问题。",
    steps: ["明确目标岗位与相关能力", "用一段经历支持你的能力", "填写可以联系到你的电话与邮箱"],
    example: "具备［相关领域］经验，曾在［项目或工作］中负责［具体任务］，能够运用［技能］完成［岗位相关工作］。",
    questions: ["简介里的每项能力，有实际经历可以说明吗？", "求职意向与目标职位是否一致？", "邮箱和电话是否完整、有效？"],
    note: "简介建议控制在 2–3 句话。少用“学习能力强”等没有经历支持的描述。",
  },
  "/work": {
    title: "把工作经历写成贡献", intro: "围绕目标岗位，先说清你负责的工作，再说明方法与结果。",
    steps: ["面对什么业务问题", "你负责了哪些具体行动", "带来了什么可验证的结果"],
    example: "针对［业务问题］，负责［你的工作范围］，通过［方法或工具］完成［交付内容］，以［真实记录或反馈］验证结果。",
    questions: ["读者能分清团队成果和你个人的贡献吗？", "有没有说明采用的方法，而不只是罗列职责？", "数据能否说明来源与比较范围？"],
    note: "没有可靠数据时，可以写交付范围、上线情况或用户反馈，不必为每条经历编造百分比。",
  },
  "/projects": {
    title: "让项目体现你的能力", intro: "挑选与目标岗位相关的项目，让问题、行动与结果连在一起。",
    steps: ["为谁解决了什么问题", "你负责的模块与技术选择", "如何验证完成效果"],
    example: "为［用户或场景］开发［项目］，负责［模块］，采用［技术与方法］完成［关键功能］，通过［测试、上线或反馈］验证。",
    questions: ["你具体负责哪部分，为什么选择这种方法？", "是否说明测试方式、判断标准或真实结果？", "演示地址或项目链接是否能正常访问？"],
    note: "课程项目和个人项目也可以体现能力。写清实际完成的范围，避免把计划中的功能写成已有成果。",
  },
  "/skills": {
    title: "让每项技能都有依据", intro: "技能与教育背景共同支持你的岗位定位，保留最相关的内容。",
    steps: ["优先填写实际使用过的技能", "对应到具体项目或使用场景", "核对学校、学历与就读时间"],
    example: "［技能或工具］：在［项目］中用于［具体任务］，能够独立完成［实际掌握的范围］。",
    questions: ["面试时，你能用哪段经历解释这项技能？", "技能清单是否与岗位要求相关？", "教育经历的起止时间、学校和专业是否准确？"],
    note: "避免没有标准的熟练度星级。应届生可补充相关课程和真实荣誉，已有工作经验时可保持教育信息简洁。",
  },
  "/export": {
    title: "投递前做最后一次检查", intro: "用实际导出的文件检查内容与版式，确保招聘者看到完整的简历。",
    steps: ["核对姓名、电话、邮箱与链接", "检查经历时间、职责与成果", "打开导出文件检查分页和文字"],
    example: "文件名可以使用：［姓名］-［目标岗位］-简历。导出后检查最后一页，确认没有缺字、截断或多余空白页。",
    questions: ["是否清除了示例与占位内容？", "项目标题是否与正文一起出现在合适的页面？", "文件是否可以正常打开，链接是否可用？"],
    note: "最终以导出文件为准。不同格式的分页可能有差异，投递前请实际打开检查。",
  },
};

export function WritingGuide() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const path = guides[pathname] ? pathname : "/basic";
  const guide = guides[path];
  function returnToEditor() {
    navigate(path, { state: { editorTab: "edit" } });
    window.dispatchEvent(new CustomEvent("offerforge:open-editor", { detail: { path } }));
  }
  return (
    <section className="offerforge-writing-guide min-w-0 space-y-6 text-neutral-800" aria-labelledby="writing-guide-heading">
      <div><p className="mb-3 flex items-center gap-1.5 text-xs text-neutral-500"><BookOpen size={14} />跟着结构写，更容易</p><h2 id="writing-guide-heading" className="text-lg font-semibold tracking-tight">{guide.title}</h2><p className="mt-2 text-xs leading-6 text-neutral-500">{guide.intro}</p></div>
      <ol className="space-y-4">{guide.steps.map((step, index) => <li key={step} className="flex items-start gap-3 text-sm leading-6"><span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-600">{index + 1}</span>{step}</li>)}</ol>
      <div><h3 className="mb-3 text-xs font-medium text-neutral-500">表达结构参考</h3><blockquote className="border-l-2 border-neutral-500 pl-4 text-sm leading-7 text-neutral-700">{guide.example}</blockquote><p className="mt-2 text-[11px] leading-5 text-neutral-500">将方括号替换为自己的真实经历。</p></div>
      <div className="border-t border-neutral-200 pt-5"><h3 className="mb-3 text-sm font-medium">填写前想一想</h3><ul className="space-y-3">{guide.questions.map((question) => <li key={question} className="flex gap-2 text-xs leading-6 text-neutral-600"><Check size={14} className="mt-1 shrink-0 text-neutral-400" />{question}</li>)}</ul></div>
      <div className="rounded-lg bg-neutral-50 p-4 text-xs leading-6 text-neutral-600">{guide.note}</div>
      <button type="button" onClick={returnToEditor} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50">返回编辑这一章节<ArrowRight size={14} /></button>
    </section>
  );
}
