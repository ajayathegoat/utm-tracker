'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import WelcomeModal from '@/components/WelcomeModal'
import UTMForm from '@/components/UTMForm'
import BulkGenerator from '@/components/BulkGenerator'
import CampaignDatabase from '@/components/CampaignDatabase'
import NamingGuide from '@/components/NamingGuide'

const STORAGE_KEY = 'utm_manager_user_name'

type Tab = 'generator' | 'bulk'

export default function Home() {
  const [userName, setUserName] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('generator')
  const [guideOpen, setGuideOpen] = useState(false)
  const [dbRefresh, setDbRefresh] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Only run on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setUserName(stored)
    } else {
      setShowWelcome(true)
    }
  }, [])

  const handleNameSave = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name)
    setUserName(name)
    setShowWelcome(false)
  }

  const handleChangeName = () => {
    setShowWelcome(true)
  }

  const handleUTMCreated = () => {
    setDbRefresh(n => n + 1)
  }

  // Don't render until mounted to avoid SSR/client mismatch
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Welcome Modal */}
      {showWelcome && <WelcomeModal onSave={handleNameSave} />}

      {/* Header */}
      {userName && (
        <Header
          userName={userName}
          onChangeName={handleChangeName}
          onOpenGuide={() => setGuideOpen(true)}
        />
      )}

      {/* Naming Guide panel */}
      <NamingGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* Main content */}
      {userName && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Page title */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Campaign UTM Builder</h2>
            <p className="text-slate-500 text-sm mt-1">
              Create GA4-compliant UTM links for your team. Every link is saved to your shared database automatically.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
            <TabButton
              active={activeTab === 'generator'}
              onClick={() => setActiveTab('generator')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
            >
              UTM Generator
            </TabButton>
            <TabButton
              active={activeTab === 'bulk'}
              onClick={() => setActiveTab('bulk')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              }
            >
              Bulk Generator
            </TabButton>
          </div>

          {/* Generator or Bulk */}
          <section>
            {activeTab === 'generator' ? (
              <UTMForm userName={userName} onUTMCreated={handleUTMCreated} />
            ) : (
              <BulkGenerator userName={userName} onUTMsCreated={handleUTMCreated} />
            )}
          </section>

          {/* Section divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="text-sm font-semibold uppercase tracking-wide">Campaign Database</span>
            </div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Database section */}
          <section className="pb-12">
            <CampaignDatabase refreshTrigger={dbRefresh} userName={userName} />
          </section>
        </main>
      )}

      {/* Floating Guide button for mobile */}
      {userName && (
        <button
          onClick={() => setGuideOpen(true)}
          className="fixed bottom-6 right-6 sm:hidden w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Open Naming Guide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      )}
    </div>
  )
}

function TabButton({
  children, active, onClick, icon
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
