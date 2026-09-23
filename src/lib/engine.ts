import type {
  ActivityEvent,
  AgentId,
  ChatMessage,
  EventKind,
  Generator,
  Project,
  ProjectFile,
  ProjectStatus,
} from './types'
import { uid } from './store'
import { buildShareLink } from './share'
import {
  assemble,
  buildFilesFromPart,
  matchTemplate,
  type AppTemplate,
  type TemplatePart,
} from './templates'

export interface RunningState {
  status: ProjectStatus
  progress: number
  activity: ActivityEvent[]
  files: ProjectFile[]
  preview: string
  messages: ChatMessage[]
  deployUrl: string
}

export interface BuildHandle {
  cancel: () => void
  done: Promise<void>
}

type Step = {
  delay: number
  agent: AgentId | 'system'
  kind: EventKind
  text: string
  items?: string[]
  run?: (state: RunningState) => void
}

function ev(agent: AgentId | 'system', kind: EventKind, text: string, items?: string[]): ActivityEvent {
  return { id: uid(), agentId: agent, kind, text, items, ts: Date.now() }
}

/* ------------------------------------------------------------------ */
/* 想法 → 名称                                                          */
/* ------------------------------------------------------------------ */

const PREFIXES = [
  '请帮我做一个',
  '请帮我开发一个',
  '帮我做一个',
  '帮我开发一个',
  '麻烦帮我做一个',
  '我想要一个',
  '我想做一个',
  '我需要一个',
  '我要一个',
  '创建一个',
  '打造一个',
  '搭建一个',
  '开发一个',
  '生成一个',
  '给我做一个',
  '帮我做一个',
  '帮我做',
  '请帮我',
  '帮我',
  '做',
]

export function deriveAppName(idea: string): string {
  let s = idea.trim()
  for (const p of PREFIXES) {
    if (s.startsWith(p)) {
      s = s.slice(p.length)
      break
    }
  }
  s = s.replace(/^(一个|一款|个|名叫|叫做|叫)/, '').trim()
  s = s.replace(/[。.!！,，?？;；…\s]+$/g, '').trim()
  if (s.length > 14) s = s.slice(0, 14)
  return s || '我的应用'
}

export function createProject(userId: string, idea: string, generator: Generator = 'template'): Project {
  const template = matchTemplate(idea)
  const name = deriveAppName(idea)
  return {
    id: uid(),
    userId,
    name,
    appName: name,
    idea: idea.trim(),
    templateId: template.id,
    generator,
    accent: template.defaultAccent,
    createdAt: Date.now(),
    status: 'building',
    files: [],
    activity: [],
    messages: [
      {
        id: uid(),
        role: 'agent',
        agentId: 'mike',
        text:
          '你好!我是 Mike,负责统筹本次构建。已收到你的需求「' +
          idea.trim() +
          '」,团队马上就位' +
          (generator === 'ai' ? '。本次将由大模型为你实时生成专属代码。' : '。'),
        ts: Date.now(),
      },
    ],
    deployUrl: '',
    preview: '',
  }
}

/* ------------------------------------------------------------------ */
/* 构建流程                                                              */
/* ------------------------------------------------------------------ */

export function runBuild(input: {
  idea: string
  template: AppTemplate
  appName: string
  accent: string
  /** 大模型生成结果,存在时优先使用(替代模板内容) */
  ai?: { part: TemplatePart; research: string[]; spec: string[]; arch: string[] }
  /** 回退到模板时的提示 */
  warn?: string
  initial?: RunningState
  tick: (state: RunningState) => void
}): BuildHandle {
  let cancelled = false
  let resolveDone: () => void = () => {}
  const done = new Promise<void>((r) => (resolveDone = r))

  const { template, appName, accent, idea } = input
  const state: RunningState = input.initial ?? {
    status: 'building',
    progress: 2,
    activity: [],
    files: [],
    preview: '',
    messages: [],
    deployUrl: '',
  }

  if (input.warn) {
    state.activity.push(ev('system', 'info', '⚠️ ' + input.warn))
  }

  const part = input.ai?.part ?? template.part
  const description = input.ai ? '由大模型为「' + appName + '」实时生成的应用' : template.description
  const files = buildFilesFromPart(part, appName, accent, description, input.ai?.spec ?? template.features)
  const three: ProjectFile[] = [] // index.html / styles.css / app.js
  const rest: ProjectFile[] = []
  for (const f of files) {
    if (['index.html', 'styles.css', 'app.js'].includes(f.path)) three.push(f)
    else rest.push(f)
  }

  const researchItems = input.ai?.research ?? [
    '目标人群:' + template.audience,
    '需求洞察:用户期待低门槛、即开即用的体验,同时看重视觉与交互品质',
    '市场机会:该细分场景仍存在优化空间,具备差异化切入机会',
  ]
  const specItems = input.ai?.spec ?? template.features
  const archItems = input.ai?.arch ?? [
    '技术栈:' + template.stack.join(' + '),
    '模块划分:' + template.components.join('、'),
    '设计原则:模块化、可扩展、本地数据持久化',
  ]
  const growthItems = [
    '埋点方案:关键行为(新建 / 完成 / 分享)全链路打点',
    '增长策略:内容营销 + 邀请裂变,冷启动聚焦单一核心卖点',
    '北极星指标:单用户单周活跃天数(WWA)',
  ]

  const steps: Step[] = [
    {
      delay: 600,
      agent: 'mike',
      kind: 'plan',
      text: '收到需求,我先拆解任务并组建团队。',
      items: ['确认产品目标', '制定交付计划(SOP)', '分配团队成员职责'],
      run: (s) => {
        s.progress = 6
      },
    },
    {
      delay: 900,
      agent: 'iris',
      kind: 'research',
      text: '正在进行深度调研,分析目标用户与市场机会…',
      run: (s) => (s.progress = 12),
    },
    {
      delay: 1300,
      agent: 'iris',
      kind: 'research',
      text: '调研完成,核心结论如下:',
      items: researchItems,
      run: (s) => (s.progress = 22),
    },
    {
      delay: 1100,
      agent: 'emma',
      kind: 'spec',
      text: '正在把想法转化为产品需求文档(PRD)…',
      run: (s) => (s.progress = 28),
    },
    {
      delay: 1200,
      agent: 'emma',
      kind: 'spec',
      text: '需求已明确,功能清单:',
      items: specItems,
      run: (s) => (s.progress = 38),
    },
    {
      delay: 1000,
      agent: 'bob',
      kind: 'arch',
      text: '正在设计系统架构,选择最合适的技术方案…',
      run: (s) => (s.progress = 44),
    },
    {
      delay: 1200,
      agent: 'bob',
      kind: 'arch',
      text: '架构方案确定:',
      items: archItems,
      run: (s) => (s.progress = 52),
    },
    {
      delay: 1000,
      agent: 'alex',
      kind: 'code',
      text: '开始编写代码,正在构建应用…',
      run: (s) => (s.progress = 56),
    },
  ]

  // 逐文件「写入」
  let p = 60
  three.forEach((f, idx) => {
    steps.push({
      delay: 800,
      agent: 'alex',
      kind: 'code',
      text: '编写 ' + f.path + ' (' + Math.round(f.content.length / 1024) + ' KB)…',
      run: (s) => {
        const writing: ProjectFile = { ...f, writing: true, done: false, content: '' }
        s.files.push(writing)
        s.progress = p
      },
    })
    steps.push({
      delay: 700,
      agent: 'alex',
      kind: 'code',
      text: '✓ ' + f.path + ' 完成',
      run: (s) => {
        const target = s.files.find((x) => x.path === f.path)
        if (target) {
          target.writing = false
          target.done = true
          target.content = f.content
        }
        p += 9
        s.progress = p
      },
    })
    void idx
  })

  // 配置与文档
  steps.push({
    delay: 700,
    agent: 'alex',
    kind: 'code',
    text: '补齐 package.json 与 README.md,整理项目配置…',
    run: (s) => {
      rest.forEach((r) => s.files.push({ ...r, done: true }))
      s.preview = assemble(part, appName, accent)
      s.progress = 88
    },
  })
  steps.push({
    delay: 1000,
    agent: 'david',
    kind: 'growth',
    text: '正在制定增长与数据埋点方案…',
    run: (s) => (s.progress = 92),
  })
  steps.push({
    delay: 1100,
    agent: 'david',
    kind: 'growth',
    text: '增长方案已就绪:',
    items: growthItems,
    run: (s) => (s.progress = 96),
  })
  steps.push({
    delay: 900,
    agent: 'mike',
    kind: 'deliver',
    text: '全部质检通过,正在部署上线…',
    run: (s) => (s.progress = 99),
  })
  steps.push({
    delay: 1000,
    agent: 'system',
    kind: 'system',
    text: '🎉 「' + appName + '」已上线!你可以在右侧实时体验,或继续和团队沟通来迭代它。',
    run: (s) => {
      s.progress = 100
      s.status = 'ready'
      s.deployUrl = buildShareLink(s.preview)
      s.messages.push({
        id: uid(),
        role: 'agent',
        agentId: 'mike',
        text: '🎉 「' + appName + '」已经构建并上线完成,请在右侧预览体验。有任何想调整的地方,随时告诉我。',
        ts: Date.now(),
      })
    },
  })

  let i = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function next() {
    if (cancelled) return
    if (i >= steps.length) {
      resolveDone()
      return
    }
    const step = steps[i++]
    timer = setTimeout(() => {
      if (cancelled) return
      const a = ev(step.agent, step.kind, step.text, step.items)
      state.activity.push(a)
      step.run?.(state)
      input.tick({ ...state, activity: [...state.activity], files: [...state.files], messages: [...state.messages] })
      next()
    }, step.delay)
  }

  next()

  return {
    cancel() {
      cancelled = true
      if (timer) clearTimeout(timer)
    },
    done,
  }
}