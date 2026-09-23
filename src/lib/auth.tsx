import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from './types'
import * as store from './store'

export interface AuthValue {
  user: User | null
  login: (email: string, password: string) => { ok: boolean; error?: string }
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const Ctx = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => store.getSessionUser())

  const login = (email: string, password: string) => {
    const r = store.loginUser(email, password)
    if (r.ok && r.user) setUser(r.user)
    return r
  }
  const register = (name: string, email: string, password: string) => {
    const r = store.registerUser(name, email, password)
    if (r.ok && r.user) setUser(r.user)
    return r
  }
  const logout = () => {
    store.clearSession()
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>
}