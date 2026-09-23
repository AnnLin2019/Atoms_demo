export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: number
}

export type AgentId = 'mike' | 'iris' | 'emma' | 'bob' | 'alex' | 'david'

export interface Agent {
  id: AgentId
  name: string
  role: string
  roleCn: string
  emoji: string
  color: string
  description: string
}

export type EventKind =
  | 'system'
  | 'plan'
  | 'research'
  | 'spec'
  | 'arch'
  | 'code'
  | 'build'
  | 'growth'
  | 'deliver'
  | 'info'

export interface ActivityEvent {
  id: string
  agentId: AgentId | 'system'
  kind: EventKind
  text: string
  ts: number
  /** bullet points / list items rendered under the event */
  items?: string[]
}

export interface ProjectFile {
  path: string
  language: string
  content: string
  writing?: boolean
  done?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  agentId?: AgentId
  text: string
  ts: number
}

export type ProjectStatus = 'building' | 'ready'

export type Generator = 'template' | 'ai'

export interface Project {
  id: string
  userId: string
  name: string
  appName: string
  idea: string
  templateId: string
  /** 生成方式:template = 内置模板,ai = 大模型实时生成 */
  generator: Generator
  accent: string
  createdAt: number
  status: ProjectStatus
  files: ProjectFile[]
  activity: ActivityEvent[]
  messages: ChatMessage[]
  deployUrl: string
  /** full srcdoc of the generated app */
  preview: string
  /** 大模型实时生成的原始三段代码(html/css/js),用于上线后的对话式迭代(如改主题)而不丢失 AI 产物 */
  aiPart?: { html: string; css: string; js: string }
}