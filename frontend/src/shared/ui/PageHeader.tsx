interface PageHeaderProps {
  breadcrumbs: string[]
}

export function PageHeader({ breadcrumbs }: PageHeaderProps) {
  return (
    <header className="border-b border-border/70 bg-white/60 px-8 py-7 backdrop-blur-sm lg:px-10">
      <nav className="flex items-center gap-3 text-lg text-slate-400">
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb}-${index}`} className="flex items-center gap-3">
            <span className={index === breadcrumbs.length - 1 ? "text-slate-700" : ""}>
              {crumb}
            </span>
            {index < breadcrumbs.length - 1 ? <span>›</span> : null}
          </div>
        ))}
      </nav>
    </header>
  )
}
