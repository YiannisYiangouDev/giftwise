'use client'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastCtx { toast: (msg: string, type?: 'success' | 'error') => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(Ctx)

let n = 0
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([])
  const add = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = n++
    setList(p => [...p, { id, msg, type }])
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3000)
  }, [])
  return (
    <Ctx.Provider value={{ toast: add }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {list.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {t.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {t.msg}
            <button onClick={() => setList(p => p.filter(x => x.id !== t.id))} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
