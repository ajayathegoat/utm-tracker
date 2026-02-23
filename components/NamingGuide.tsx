'use client'

import { UTM_SOURCES, MEDIUM_MAP } from '@/lib/utm-utils'

interface NamingGuideProps {
  isOpen: boolean
  onClose: () => void
}

export default function NamingGuide({ isOpen, onClose }: NamingGuideProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <h2 className="font-bold text-base">GA4 Naming Guide</h2>
              <p className="text-xs text-slate-400">UTM best practices for your team</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Example URL */}
          <div className="bg-slate-950 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">Example well-formed UTM URL</p>
            <div className="font-mono text-xs leading-relaxed break-all">
              <span className="text-slate-300">https://yoursite.com/landing</span>
              <span className="text-slate-500">?</span>
              <span className="text-slate-400">utm_source=</span><span className="text-blue-400">facebook</span>
              <span className="text-slate-500">&amp;</span>
              <span className="text-slate-400">utm_medium=</span><span className="text-purple-400">paid_social</span>
              <span className="text-slate-500">&amp;</span>
              <span className="text-slate-400">utm_campaign=</span><span className="text-teal-400">lead_generation_summer_promo_2025</span>
              <span className="text-slate-500">&amp;</span>
              <span className="text-slate-400">utm_content=</span><span className="text-orange-400">video_v1</span>
            </div>
          </div>

          {/* Rule 1 */}
          <Rule
            number="1"
            title="Always use lowercase"
            color="blue"
            description="GA4 is case-sensitive. 'Facebook' and 'facebook' are treated as two different traffic sources. Always use lowercase for all UTM values."
            good="utm_source=facebook"
            bad="utm_source=Facebook"
          />

          {/* Rule 2 */}
          <Rule
            number="2"
            title="Underscores, not spaces or hyphens"
            color="purple"
            description="Spaces break URLs and hyphens create inconsistencies in GA4 reports. Always use underscores to separate words."
            good="utm_campaign=summer_promo_2025"
            bad="utm_campaign=summer promo 2025"
          />

          {/* Rule 3 — Sources */}
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <h3 className="font-bold text-slate-800">Approved UTM Sources → GA4 Channel</h3>
            </div>
            <div className="space-y-2">
              {UTM_SOURCES.map(source => (
                <div key={source.value} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                  <code className="font-mono text-teal-700 font-semibold">{source.value}</code>
                  <span className="text-slate-500 text-xs">→ {source.ga4Channel}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-teal-700 mt-3 font-medium">Only use these exact values. Never create new sources.</p>
          </div>

          {/* Rule 4 — Mediums */}
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">4</div>
              <h3 className="font-bold text-slate-800">Approved UTM Mediums by Source</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(MEDIUM_MAP).map(([source, mediums]) => (
                <div key={source}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{source}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mediums.map(m => (
                      <code key={m.value} className="text-xs bg-white px-2 py-1 rounded-lg font-mono text-purple-700 border border-purple-100">{m.value}</code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule 5 */}
          <Rule
            number="5"
            title="UTM Content = A/B test variant identifier"
            color="orange"
            description="Use utm_content to distinguish between different ad creatives for the same campaign. This lets you see in GA4 exactly which version of an ad is driving conversions."
            good="utm_content=video_v1  |  utm_content=carousel_red_cta  |  utm_content=static_headline_a"
            bad="utm_content=ad1"
          />

          {/* Rule 6 */}
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">6</div>
              <h3 className="font-bold text-slate-800 text-red-900">Never edit a live UTM URL</h3>
            </div>
            <p className="text-sm text-red-800">
              Once a UTM URL is in use (running in an ad, sent in an email), <strong>never change it</strong>. Changing a live URL breaks your historical GA4 data. Instead:
            </p>
            <ol className="text-sm text-red-800 mt-2 space-y-1 list-decimal list-inside">
              <li>Create a new UTM link with the corrected details</li>
              <li>Mark the old link as <strong>Ended</strong></li>
              <li>Update your ad/email to use the new link</li>
            </ol>
          </div>

          {/* Supabase Setup */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Supabase Database Setup Guide
            </h3>
            <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
              <li>Go to <strong>supabase.com</strong> and sign up for a free account</li>
              <li>Click <strong>"New project"</strong> → name it <em>utm-tracker</em></li>
              <li>Choose a region close to your team</li>
              <li>Once created, go to <strong>SQL Editor</strong> (left sidebar)</li>
              <li>Paste and run the SQL schema shown below</li>
              <li>Go to <strong>Settings → API</strong> to get your keys</li>
              <li>Copy <strong>Project URL</strong> and <strong>anon public key</strong></li>
              <li>Add them to your <code className="bg-slate-200 px-1 rounded">.env.local</code> file</li>
            </ol>
            <div className="mt-3 bg-slate-950 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto">
              <p className="text-slate-500 mb-2">-- Run this in Supabase SQL Editor:</p>
              <pre>{`CREATE TABLE utm_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  brand TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_content TEXT NOT NULL,
  utm_term TEXT,
  base_url TEXT NOT NULL,
  full_utm_url TEXT NOT NULL,
  campaign_status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  tags TEXT
);`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Rule({
  number, title, color, description, good, bad
}: {
  number: string
  title: string
  color: 'blue' | 'purple' | 'teal' | 'orange' | 'pink'
  description: string
  good: string
  bad: string
}) {
  const colorMap = {
    blue: 'bg-blue-500 border-blue-100 bg-blue-50',
    purple: 'bg-purple-500 border-purple-100 bg-purple-50',
    teal: 'bg-teal-500 border-teal-100 bg-teal-50',
    orange: 'bg-orange-500 border-orange-100 bg-orange-50',
    pink: 'bg-pink-500 border-pink-100 bg-pink-50',
  }
  const bg = colorMap[color].split(' ')[2]
  const border = colorMap[color].split(' ')[1]
  const btnBg = colorMap[color].split(' ')[0]

  return (
    <div className={`rounded-xl border ${border} ${bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full ${btnBg} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>{number}</div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-700 mb-3">{description}</p>
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 text-xs">
          <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">✓ GOOD</span>
          <code className="text-green-800 bg-green-50 px-2 py-0.5 rounded font-mono break-all">{good}</code>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">✗ BAD</span>
          <code className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-mono line-through break-all">{bad}</code>
        </div>
      </div>
    </div>
  )
}
