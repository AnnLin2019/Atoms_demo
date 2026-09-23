import type { Project, User } from './types'

const LS = {
  users: 'atoms.users',
  session: 'atoms.session',
  projects: 'atoms.projects',
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota errors in demo */
  }
}

/* ---------------- users ---------------- */

export function getUsers(): User[] {
  return read<User[]>(LS.users, [])
}

export function findUser(email: string): User | undefined {
  const e = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === e)
}

export function registerUser(name: string, email: string, password: string): { ok: boolean; error?: string; user?: User } {
  if (findUser(email)) return { ok: false, error: '该邮箱已注册,请直接登录' }
  const users = getUsers()
  const user: User = {
    id: uid(),
    name: name.trim(),
    email: email.trim(),
    password,
    createdAt: Date.now(),
  }
  users.push(user)
  write(LS.users, users)
  setSession(user.id)
  return { ok: true, user }
}

export function loginUser(email: string, password: string): { ok: boolean; error?: string; user?: User } {
  const u = findUser(email)
  if (!u) return { ok: false, error: '账号不存在,请先注册' }
  if (u.password !== password) return { ok: false, error: '密码错误,请重试' }
  setSession(u.id)
  return { ok: true, user: u }
}

/* ---------------- session ---------------- */

export function setSession(userId: string) {
  write(LS.session, { userId })
}

export function getSessionUser(): User | null {
  const s = read<{ userId: string } | null>(LS.session, null)
  if (!s) return null
  return getUsers().find((u) => u.id === s.userId) ?? null
}

export function clearSession() {
  try {
    localStorage.removeItem(LS.session)
  } catch {
    /* ignore */
  }
}

/* ---------------- projects ---------------- */

export function getProjects(userId: string): Project[] {
  return read<Project[]>(LS.projects, [])
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getProject(id: string): Project | undefined {
  return read<Project[]>(LS.projects, []).find((p) => p.id === id)
}

export function saveProject(project: Project) {
  const all = read<Project[]>(LS.projects, [])
  const idx = all.findIndex((p) => p.id === project.id)
  if (idx >= 0) all[idx] = project
  else all.push(project)
  write(LS.projects, all)
}

export function deleteProject(id: string) {
  const all = read<Project[]>(LS.projects, []).filter((p) => p.id !== id)
  write(LS.projects, all)
}

/* ---------------- 项目导入 / 导出 ---------------- */

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function serializeProjects(projects: Project[]): string {
  return JSON.stringify(projects, null, 2)
}

export function importProjectJson(
  json: string,
  userId: string,
): { ok: boolean; count: number; error?: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    return { ok: false, count: 0, error: '文件不是有效的 JSON:' + (e as Error).message }
  }

  const list = Array.isArray(parsed) ? parsed : [parsed]
  const all = read<Project[]>(LS.projects, [])
  let count = 0

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Partial<Project>
    if (!r.idea && !r.name && !r.appName) continue

    const imported: Project = {
      id: uid(),
      userId,
      name: r.name || r.appName || '导入的项目',
      appName: r.appName || r.name || '导入的项目',
      idea: r.idea || r.name || '',
      templateId: r.templateId || 'generic',
      generator: r.generator === 'ai' ? 'ai' : 'template',
      accent: r.accent || '#7c5cff',
      createdAt: r.createdAt || Date.now(),
      status: r.preview ? 'ready' : r.status === 'building' ? 'building' : 'ready',
      files: Array.isArray(r.files) ? r.files : [],
      activity: Array.isArray(r.activity) ? r.activity : [],
      messages: Array.isArray(r.messages) ? r.messages : [],
      deployUrl: r.deployUrl || '',
      preview: r.preview || '',
      aiPart: r.aiPart,
    }
    all.push(imported)
    count++
  }

  write(LS.projects, all)
  if (count === 0) return { ok: false, count: 0, error: '未在文件中找到有效的项目数据' }
  return { ok: true, count }
}