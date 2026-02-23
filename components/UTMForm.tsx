'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BRAND_NAME, UTM_SOURCES, MEDIUM_MAP, CAMPAIGN_STATUSES,
  toGA4Format, stripUTMParams, buildUTMUrl, validateBaseUrl
} from '@/lib/utm-utils'
import { supabase, UTMLink } from '@/lib/supabase'
import LivePreview from './LivePreview'

interface UTMFormProps {
  userName: string
  onUTMCreated: () => void
}

interface FormData {
  baseUrl: string
  campaignName: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
  campaignStatus: string
  tags: string
  notes: string
}

const initialForm: FormData = {
  baseUrl: '',
  campaignName: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  campaignStatus: 'draft',
  tags: '',
  notes: '',
}

export default function UTMForm({ userName, onUTMCreated }: UTMFormProps) {
  const [form, setForm] = useState<FormData>(initialForm)
  const [urlError, setUrlError] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [duplicateWarning, setDuplicateWarning] = useState<UTMLink | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successUrl, setSuccessUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Auto-build utm_campaign from campaign_type + campaign_name
  useEffect(() => {
    if (form.campaignName) {
      setForm(f => ({
        ...f,
        utmCampaign: `lead_generation_${form.campaignName}`,
      }))
    }
  }, [form.campaignName])

  // Reset medium when source changes
  useEffect(() => {
    setForm(f => ({ ...f, utmMedium: '' }))
  }, [form.utmSource])

  const availableMediums = form.utmSource ? (MEDIUM_MAP[form.utmSource] || []) : []

  const handleBaseUrlChange = (value: string) => {
    // Strip existing UTM params if pasting a URL that has them
    const stripped = value.includes('utm_') ? stripUTMParams(value) : value
    setForm(f => ({ ...f, baseUrl: stripped }))
    const err = validateBaseUrl(stripped)
    setUrlError(err || '')
  }

  const handleGA4Field = (field: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [field]: toGA4Format(value) }))
  }

  const handleUtmCampaignEdit = (value: string) => {
    setForm(f => ({ ...f, utmCampaign: toGA4Format(value) }))
  }

  const fullUrl = buildUTMUrl({
    baseUrl: form.baseUrl,
    utm_source: form.utmSource,
    utm_medium: form.utmMedium,
    utm_campaign: form.utmCampaign,
    utm_content: form.utmContent,
    utm_term: form.utmTerm || undefined,
  })

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.baseUrl) newErrors.baseUrl = 'Base URL is required'
    else if (urlError) newErrors.baseUrl = urlError
    if (!form.campaignName) newErrors.campaignName = 'Campaign name is required'
    if (!form.utmSource) newErrors.utmSource = 'Please select a source'
    if (!form.utmMedium) newErrors.utmMedium = 'Please select a medium'
    if (!form.utmCampaign) newErrors.utmCampaign = 'UTM Campaign is required'
    if (!form.utmContent) newErrors.utmContent = 'UTM Content is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkDuplicate = useCallback(async () => {
    if (!form.utmSource || !form.utmMedium || !form.utmCampaign) return null
    const { data } = await supabase
      .from('utm_links')
      .select('*')
      .eq('utm_source', form.utmSource)
      .eq('utm_medium', form.utmMedium)
      .eq('utm_campaign', form.utmCampaign)
      .limit(1)
    return data && data.length > 0 ? data[0] : null
  }, [form.utmSource, form.utmMedium, form.utmCampaign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Check for duplicates first
    const dupe = await checkDuplicate()
    if (dupe && !duplicateWarning) {
      setDuplicateWarning(dupe)
      return
    }

    await saveUTM()
  }

  const saveUTM = async () => {
    setIsSubmitting(true)
    setDuplicateWarning(null)

    try {
      const { error } = await supabase.from('utm_links').insert({
        created_by: userName,
        brand: BRAND_NAME,
        campaign_type: 'lead_generation',
        campaign_name: form.campaignName,
        utm_source: form.utmSource,
        utm_medium: form.utmMedium,
        utm_campaign: form.utmCampaign,
        utm_content: form.utmContent,
        utm_term: form.utmTerm || null,
        base_url: form.baseUrl,
        full_utm_url: fullUrl,
        campaign_status: form.campaignStatus,
        notes: form.notes || null,
        tags: form.tags || null,
      })

      if (error) throw error

      setSuccessUrl(fullUrl)
      setForm(initialForm)
      setErrors({})
      onUTMCreated()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Something went wrong saving your UTM link. Error: ${message}\n\nMake sure your Supabase credentials are set in .env.local`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetSuccess = () => {
    setSuccessUrl('')
    setCopied(false)
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {successUrl && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-green-900">UTM link created and saved!</h3>
              <p className="text-green-700 text-sm">It&apos;s now visible to your whole team in the database below.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 font-mono text-sm break-all text-slate-800">
            {successUrl}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleCopy(successUrl)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                copied ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {copied ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy URL</>
              )}
            </button>
            <button
              onClick={resetSuccess}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
            >
              Create another
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarning && (
        <div className="rounded-2xl bg-yellow-50 border border-yellow-300 p-5 animate-fade-in">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-900">Heads up — a similar UTM already exists.</h4>
              <p className="text-yellow-800 text-sm mt-1">
                A UTM with source <strong>{duplicateWarning.utm_source}</strong>, medium <strong>{duplicateWarning.utm_medium}</strong>,
                and campaign <strong>{duplicateWarning.utm_campaign}</strong> was already created by <strong>{duplicateWarning.created_by}</strong>.
              </p>
              <p className="text-yellow-700 text-sm mt-1">Are you sure you want to create another?</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveUTM}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Yes, create anyway
                </button>
                <button
                  onClick={() => setDuplicateWarning(null)}
                  className="px-4 py-2 bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  No, go back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Brand — locked */}
          <Field label="Brand" required>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">{BRAND_NAME}</span>
              <span className="text-xs text-slate-400 ml-auto">(locked)</span>
            </div>
          </Field>

          {/* Campaign Type — locked */}
          <Field label="Campaign Type" required>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">lead_generation</span>
              <span className="text-xs text-slate-400 ml-auto">(locked)</span>
            </div>
          </Field>
        </div>

        {/* Base URL */}
        <Field label="Base URL" required error={errors.baseUrl || urlError}>
          <input
            type="text"
            value={form.baseUrl}
            onChange={e => handleBaseUrlChange(e.target.value)}
            placeholder="https://yourwebsite.com/landing-page"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
              (errors.baseUrl || urlError) ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          {(errors.baseUrl || urlError) && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.baseUrl || urlError}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">Must start with https://. Any existing UTM params will be automatically stripped.</p>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* UTM Source */}
          <Field label="UTM Source" required error={errors.utmSource}>
            <select
              value={form.utmSource}
              onChange={e => setForm(f => ({ ...f, utmSource: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors appearance-none bg-white ${
                errors.utmSource ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            >
              <option value="">Select channel…</option>
              {UTM_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label} ({s.value})</option>
              ))}
            </select>
            {errors.utmSource && <p className="text-red-500 text-xs mt-1">{errors.utmSource}</p>}
          </Field>

          {/* UTM Medium */}
          <Field label="UTM Medium" required error={errors.utmMedium}>
            <select
              value={form.utmMedium}
              onChange={e => setForm(f => ({ ...f, utmMedium: e.target.value }))}
              disabled={!form.utmSource}
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.utmMedium ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            >
              <option value="">
                {form.utmSource ? 'Select medium…' : 'Select a source first'}
              </option>
              {availableMediums.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {errors.utmMedium && <p className="text-red-500 text-xs mt-1">{errors.utmMedium}</p>}
          </Field>
        </div>

        {/* Campaign Name */}
        <Field label="Campaign Name" required error={errors.campaignName}
          hint="Describe this campaign in plain English — it will be auto-converted to GA4 format below.">
          <input
            type="text"
            value={form.campaignName}
            onChange={e => handleGA4Field('campaignName', e.target.value)}
            placeholder="e.g. summer_promo_2025"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
              errors.campaignName ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          {form.campaignName && (
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Preview:</span>
              <code className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono">{form.campaignName}</code>
            </div>
          )}
          {errors.campaignName && <p className="text-red-500 text-xs mt-1">{errors.campaignName}</p>}
        </Field>

        {/* UTM Campaign — auto-populated but editable */}
        <Field label="UTM Campaign" required error={errors.utmCampaign}
          hint="Auto-built from Campaign Type + Campaign Name. You can edit it if needed.">
          <input
            type="text"
            value={form.utmCampaign}
            onChange={e => handleUtmCampaignEdit(e.target.value)}
            placeholder="lead_generation_your_campaign_name"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
              errors.utmCampaign ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          {errors.utmCampaign && <p className="text-red-500 text-xs mt-1">{errors.utmCampaign}</p>}
        </Field>

        {/* UTM Content */}
        <Field
          label="UTM Content"
          required
          error={errors.utmContent}
          tooltip="Use this field to identify specific ad creatives for A/B testing. For example: video_v1, carousel_red_cta, static_headline_a. In GA4, you can then compare which creative drives the most conversions."
          showTooltip={showTooltip}
          onTooltipToggle={() => setShowTooltip(v => !v)}
        >
          <input
            type="text"
            value={form.utmContent}
            onChange={e => handleGA4Field('utmContent', e.target.value)}
            placeholder="e.g. video_v1, carousel_blue_cta, static_headline_a"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
              errors.utmContent ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          {errors.utmContent && <p className="text-red-500 text-xs mt-1">{errors.utmContent}</p>}
        </Field>

        {/* UTM Term — only for Google */}
        {form.utmSource === 'google' && (
          <Field label="UTM Term" hint="Optional. For Google Ads keyword tracking only.">
            <input
              type="text"
              value={form.utmTerm}
              onChange={e => handleGA4Field('utmTerm', e.target.value)}
              placeholder="e.g. best_crm_software"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </Field>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign Status */}
          <Field label="Campaign Status" required>
            <select
              value={form.campaignStatus}
              onChange={e => setForm(f => ({ ...f, campaignStatus: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
            >
              {CAMPAIGN_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          {/* Tags */}
          <Field label="Tags" hint="Comma-separated labels for internal filtering (e.g. q4, retargeting, video)">
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. q4, retargeting, video"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </Field>
        </div>

        {/* Notes */}
        <Field label="Notes" hint="Optional context about this link (not visible in the URL)">
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. Used in the July Facebook campaign — hero video variant"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </Field>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Generate UTM Link
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Preview */}
      <LivePreview
        baseUrl={form.baseUrl}
        utmSource={form.utmSource}
        utmMedium={form.utmMedium}
        utmCampaign={form.utmCampaign}
        utmContent={form.utmContent}
        utmTerm={form.utmTerm}
      />
    </div>
  )
}

// Field wrapper component
function Field({
  label, required, children, error, hint, tooltip, showTooltip, onTooltipToggle
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
  hint?: string
  tooltip?: string
  showTooltip?: boolean
  onTooltipToggle?: () => void
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onClick={onTooltipToggle}
              className="w-4 h-4 rounded-full bg-slate-200 hover:bg-teal-100 text-slate-500 hover:text-teal-700 flex items-center justify-center text-xs font-bold transition-colors"
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-6 z-10 w-72 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl">
                {tooltip}
                <div className="absolute -top-1 left-1 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            )}
          </div>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}
