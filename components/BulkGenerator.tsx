'use client'

import { useState } from 'react'
import { BRAND_NAME, UTM_SOURCES, MEDIUM_MAP, CAMPAIGN_STATUSES, toGA4Format, stripUTMParams, buildUTMUrl, validateBaseUrl } from '@/lib/utm-utils'
import { supabase } from '@/lib/supabase'

interface BulkGeneratorProps {
  userName: string
  onUTMsCreated: () => void
}

interface SourceRow {
  source: string
  medium: string
  enabled: boolean
}

interface BulkResult {
  source: string
  medium: string
  url: string
}

export default function BulkGenerator({ userName, onUTMsCreated }: BulkGeneratorProps) {
  const [baseUrl, setBaseUrl] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [utmContent, setUtmContent] = useState('')
  const [campaignStatus, setCampaignStatus] = useState('draft')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [urlError, setUrlError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<BulkResult[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [sources, setSources] = useState<SourceRow[]>(
    UTM_SOURCES.map(s => ({
      source: s.value,
      medium: MEDIUM_MAP[s.value]?.[0]?.value || '',
      enabled: false,
    }))
  )

  const toggleSource = (source: string) => {
    setSources(prev => prev.map(s => s.source === source ? { ...s, enabled: !s.enabled } : s))
  }

  const updateMedium = (source: string, medium: string) => {
    setSources(prev => prev.map(s => s.source === source ? { ...s, medium } : s))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const urlErr = validateBaseUrl(baseUrl)
    if (urlErr) newErrors.baseUrl = urlErr
    if (!campaignName) newErrors.campaignName = 'Campaign name is required'
    if (!utmContent) newErrors.utmContent = 'UTM Content is required'
    if (!sources.some(s => s.enabled)) newErrors.sources = 'Select at least one source'
    if (sources.filter(s => s.enabled).some(s => !s.medium)) newErrors.mediums = 'All selected sources need a medium'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validate()) return
    setIsGenerating(true)
    setResults([])

    const utmCampaign = `lead_generation_${campaignName}`
    const cleanBase = baseUrl.includes('utm_') ? stripUTMParams(baseUrl) : baseUrl
    const enabled = sources.filter(s => s.enabled)

    const built: BulkResult[] = enabled.map(row => ({
      source: row.source,
      medium: row.medium,
      url: buildUTMUrl({
        baseUrl: cleanBase,
        utm_source: row.source,
        utm_medium: row.medium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
      }),
    }))

    // Save all to Supabase
    try {
      const inserts = built.map(r => ({
        created_by: userName,
        brand: BRAND_NAME,
        campaign_type: 'lead_generation',
        campaign_name: campaignName,
        utm_source: r.source,
        utm_medium: r.medium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: null,
        base_url: cleanBase,
        full_utm_url: r.url,
        campaign_status: campaignStatus,
        notes: notes || null,
        tags: tags || null,
      }))

      const { error } = await supabase.from('utm_links').insert(inserts)
      if (error) throw error

      setResults(built)
      onUTMsCreated()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to save bulk UTMs: ${message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyOne = async (url: string, idx: number) => {
    await navigator.clipboard.writeText(url)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleCopyAll = async () => {
    const text = results.map(r => r.url).join('\n')
    await navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Bulk UTM Generator</h3>
            <p className="text-sm text-slate-500 mt-0.5">Generate one UTM per channel simultaneously from a single campaign. Perfect for multi-channel campaign launches.</p>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Base URL <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={baseUrl}
            onChange={e => {
              const val = e.target.value.includes('utm_') ? stripUTMParams(e.target.value) : e.target.value
              setBaseUrl(val)
              setUrlError(validateBaseUrl(val) || '')
            }}
            placeholder="https://yourwebsite.com/landing-page"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              errors.baseUrl ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          {errors.baseUrl && <p className="text-red-500 text-xs mt-1">{errors.baseUrl}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Campaign Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(toGA4Format(e.target.value))}
              placeholder="e.g. summer_promo_2025"
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.campaignName ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {campaignName && (
              <p className="text-xs text-teal-600 mt-1 font-mono">utm_campaign: lead_generation_{campaignName}</p>
            )}
            {errors.campaignName && <p className="text-red-500 text-xs mt-1">{errors.campaignName}</p>}
          </div>

          {/* UTM Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">UTM Content <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={utmContent}
              onChange={e => setUtmContent(toGA4Format(e.target.value))}
              placeholder="e.g. video_v1, carousel_blue_cta"
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.utmContent ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.utmContent && <p className="text-red-500 text-xs mt-1">{errors.utmContent}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={campaignStatus}
              onChange={e => setCampaignStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
            >
              {CAMPAIGN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="q4, retargeting"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional context"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Source + Medium checklist */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Channels <span className="text-red-400">*</span>
          </label>
          {errors.sources && <p className="text-red-500 text-xs mb-2">{errors.sources}</p>}
          {errors.mediums && <p className="text-red-500 text-xs mb-2">{errors.mediums}</p>}
          <div className="space-y-2">
            {sources.map(row => {
              const srcInfo = UTM_SOURCES.find(s => s.value === row.source)
              const mediums = MEDIUM_MAP[row.source] || []
              return (
                <div
                  key={row.source}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                    row.enabled ? 'border-teal-200 bg-teal-50' : 'border-slate-100 bg-slate-50 opacity-70'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer min-w-[130px]">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={() => toggleSource(row.source)}
                      className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800">{srcInfo?.label}</span>
                    <code className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">{row.source}</code>
                  </label>
                  <select
                    value={row.medium}
                    onChange={e => updateMedium(row.source, e.target.value)}
                    disabled={!row.enabled}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:opacity-40 disabled:cursor-not-allowed appearance-none"
                  >
                    <option value="">Select medium…</option>
                    {mediums.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating &amp; Saving…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Generate All UTMs
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-green-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-bold text-green-900">{results.length} UTMs generated and saved!</span>
            </div>
            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                copiedAll ? 'bg-green-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiedAll ? '✓ Copied all!' : 'Copy All URLs'}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-4">
                <div className="flex gap-1.5 items-center min-w-[180px]">
                  <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">{r.source}</code>
                  <code className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono">{r.medium}</code>
                </div>
                <div className="flex-1 font-mono text-xs text-slate-600 truncate" title={r.url}>{r.url}</div>
                <button
                  onClick={() => handleCopyOne(r.url, i)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                    copiedIdx === i ? 'bg-green-100 text-green-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedIdx === i ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
