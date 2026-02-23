// Utility functions for UTM building and GA4 compliance

export const BRAND_NAME = 'Brand Name' // Placeholder — update this to your actual brand name

export const UTM_SOURCES = [
  { value: 'facebook', label: 'Facebook', ga4Channel: 'Paid Social / Organic Social' },
  { value: 'instagram', label: 'Instagram', ga4Channel: 'Paid Social / Organic Social' },
  { value: 'google', label: 'Google', ga4Channel: 'Paid Search / Display' },
  { value: 'youtube', label: 'YouTube', ga4Channel: 'Video / Paid Video' },
  { value: 'linkedin', label: 'LinkedIn', ga4Channel: 'Paid Social / Organic Social' },
  { value: 'email', label: 'Email', ga4Channel: 'Email' },
] as const

export const MEDIUM_MAP: Record<string, { value: string; label: string }[]> = {
  facebook: [
    { value: 'paid_social', label: 'paid_social' },
    { value: 'organic_social', label: 'organic_social' },
  ],
  instagram: [
    { value: 'paid_social', label: 'paid_social' },
    { value: 'organic_social', label: 'organic_social' },
  ],
  google: [
    { value: 'cpc', label: 'cpc' },
    { value: 'display', label: 'display' },
  ],
  youtube: [
    { value: 'video', label: 'video' },
    { value: 'cpc', label: 'cpc' },
  ],
  linkedin: [
    { value: 'paid_social', label: 'paid_social' },
    { value: 'organic_social', label: 'organic_social' },
  ],
  email: [
    { value: 'email', label: 'email' },
    { value: 'newsletter', label: 'newsletter' },
  ],
}

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
]

// Convert text to GA4-compliant format: lowercase + underscores
export function toGA4Format(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// Strip existing UTM parameters from a URL
export function stripUTMParams(url: string): string {
  try {
    const parsed = new URL(url)
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    utmParams.forEach(p => parsed.searchParams.delete(p))
    // Rebuild cleanly
    let clean = parsed.origin + parsed.pathname
    const remaining = parsed.searchParams.toString()
    if (remaining) clean += '?' + remaining
    return clean
  } catch {
    return url
  }
}

// Build the full UTM URL from parts
export function buildUTMUrl(params: {
  baseUrl: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term?: string
}): string {
  if (!params.baseUrl || !params.utm_source) return ''
  try {
    const url = new URL(params.baseUrl)
    if (params.utm_source) url.searchParams.set('utm_source', params.utm_source)
    if (params.utm_medium) url.searchParams.set('utm_medium', params.utm_medium)
    if (params.utm_campaign) url.searchParams.set('utm_campaign', params.utm_campaign)
    if (params.utm_content) url.searchParams.set('utm_content', params.utm_content)
    if (params.utm_term) url.searchParams.set('utm_term', params.utm_term)
    return url.toString()
  } catch {
    return ''
  }
}

// Validate base URL
export function validateBaseUrl(url: string): string | null {
  if (!url) return 'Base URL is required'
  if (!url.startsWith('https://')) return 'URL must start with https://'
  try {
    new URL(url)
    return null
  } catch {
    return 'Please enter a valid URL (e.g. https://example.com/page)'
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
