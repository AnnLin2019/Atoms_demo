import type { Agent } from './types'

export const AGENTS: Agent[] = [
  {
    id: 'mike',
    name: 'Mike',
    role: 'Team Leader',
    roleCn: '团队负责人',
    emoji: '🧭',
    color: '#8b7cff',
    description: '统筹全局,拆解任务并驱动团队交付',
  },
  {
    id: 'iris',
    name: 'Iris',
    role: 'Deep Researcher',
    roleCn: '深度研究员',
    emoji: '🔍',
    color: '#38bdf8',
    description: '洞察真实用户需求与市场机会',
  },
  {
    id: 'emma',
    name: 'Emma',
    role: 'Product Manager',
    roleCn: '产品经理',
    emoji: '📋',
    color: '#f472b6',
    description: '把想法转化为清晰的产品需求',
  },
  {
    id: 'bob',
    name: 'Bob',
    role: 'Architect',
    roleCn: '架构师',
    emoji: '🏗️',
    color: '#f59e0b',
    description: '设计可扩展、高可靠的系统蓝图',
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Engineer',
    roleCn: '工程师',
    emoji: '⚙️',
    color: '#34d399',
    description: '编写全栈代码并构建可运行应用',
  },
  {
    id: 'david',
    name: 'David',
    role: 'Data Analyst',
    roleCn: '数据分析师',
    emoji: '📊',
    color: '#a78bfa',
    description: '制定增长方案与数据埋点策略',
  },
]

export function agentById(id: string): Agent {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0]
}