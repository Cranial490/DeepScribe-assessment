import { Sparkles, Users2 } from "lucide-react"
import type { ReactNode } from "react"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fc] text-foreground">
      <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[270px_1fr]">
        <aside className="flex flex-col border-r border-border/70 bg-white/80 backdrop-blur-sm lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div className="px-8 pb-6 pt-10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="text-3xl font-semibold tracking-tight">DeepScribe</span>
            </div>
          </div>

          <nav className="px-5">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-4 text-base font-semibold text-blue-600"
            >
              <Users2 className="h-5 w-5" />
              Patients
            </button>
          </nav>

          <div className="mt-auto border-t border-border/70 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700">
                GU
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Guest User</p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Guest</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:h-screen lg:overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
