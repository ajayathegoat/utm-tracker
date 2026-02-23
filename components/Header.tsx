'use client'

interface HeaderProps {
  userName: string
  onChangeName: () => void
  onOpenGuide: () => void
}

export default function Header({ userName, onChangeName, onOpenGuide }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + App Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">UTM Manager</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">GA4-ready campaign tracking</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Naming guide button */}
            <button
              onClick={onOpenGuide}
              className="hidden sm:flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Naming Guide
            </button>

            {/* User badge */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-100 max-w-[120px] truncate hidden sm:block">
                {userName}
              </span>
              <button
                onClick={onChangeName}
                className="text-xs text-slate-400 hover:text-teal-400 transition-colors ml-1 whitespace-nowrap"
                title="Change your name"
              >
                Not you?
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
