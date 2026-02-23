'use client'

interface LivePreviewProps {
  baseUrl: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
}

interface UrlPart {
  label: string
  value: string
  color: string
  bgColor: string
}

export default function LivePreview({
  baseUrl,
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
  utmTerm,
}: LivePreviewProps) {
  const parts: UrlPart[] = [
    { label: 'Base URL', value: baseUrl || 'https://yoursite.com/page', color: 'text-slate-700', bgColor: 'bg-slate-100' },
    { label: 'utm_source', value: utmSource, color: 'text-blue-700', bgColor: 'bg-blue-50' },
    { label: 'utm_medium', value: utmMedium, color: 'text-purple-700', bgColor: 'bg-purple-50' },
    { label: 'utm_campaign', value: utmCampaign, color: 'text-teal-700', bgColor: 'bg-teal-50' },
    { label: 'utm_content', value: utmContent, color: 'text-orange-700', bgColor: 'bg-orange-50' },
    ...(utmTerm ? [{ label: 'utm_term', value: utmTerm, color: 'text-pink-700', bgColor: 'bg-pink-50' }] : []),
  ]

  // Build the full URL display
  const buildFullUrl = () => {
    const base = baseUrl || 'https://yoursite.com/page'
    const paramParts: { label: string; param: string; value: string; color: string; bgColor: string }[] = []

    if (utmSource) paramParts.push({ label: 'utm_source', param: 'utm_source', value: utmSource, color: 'text-blue-700', bgColor: 'bg-blue-50' })
    if (utmMedium) paramParts.push({ label: 'utm_medium', param: 'utm_medium', value: utmMedium, color: 'text-purple-700', bgColor: 'bg-purple-50' })
    if (utmCampaign) paramParts.push({ label: 'utm_campaign', param: 'utm_campaign', value: utmCampaign, color: 'text-teal-700', bgColor: 'bg-teal-50' })
    if (utmContent) paramParts.push({ label: 'utm_content', param: 'utm_content', value: utmContent, color: 'text-orange-700', bgColor: 'bg-orange-50' })
    if (utmTerm) paramParts.push({ label: 'utm_term', param: 'utm_term', value: utmTerm, color: 'text-pink-700', bgColor: 'bg-pink-50' })

    return { base, paramParts }
  }

  const { base, paramParts } = buildFullUrl()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Live UTM Preview
        </h3>
      </div>

      {/* Colour-coded URL assembly */}
      <div className="bg-slate-950 rounded-xl p-4 font-mono text-sm leading-relaxed overflow-x-auto mb-5">
        <span className="text-slate-300">{base}</span>
        {paramParts.length > 0 && (
          <>
            <span className="text-slate-500">?</span>
            {paramParts.map((part, i) => (
              <span key={part.param}>
                {i > 0 && <span className="text-slate-500">&amp;</span>}
                <span className="text-slate-400">{part.param}=</span>
                <span className={
                  part.param === 'utm_source' ? 'text-blue-400' :
                  part.param === 'utm_medium' ? 'text-purple-400' :
                  part.param === 'utm_campaign' ? 'text-teal-400' :
                  part.param === 'utm_content' ? 'text-orange-400' :
                  'text-pink-400'
                }>{part.value}</span>
              </span>
            ))}
          </>
        )}
        {paramParts.length === 0 && (
          <span className="text-slate-600"> ← fill in the form to see your UTM URL build here</span>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Parameter legend</p>
        <div className="flex flex-wrap gap-2">
          {parts.map(part => (
            <div key={part.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${part.bgColor} ${part.color}`}>
              <span className="font-semibold">{part.label}:</span>
              <span className="font-mono opacity-80 truncate max-w-[140px]">
                {part.value || <em className="opacity-50">not set</em>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GA4 hint */}
      {(utmSource || utmMedium) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            In GA4 this will appear under{' '}
            <strong>
              {utmSource === 'google' ? 'Paid Search' :
               utmSource === 'youtube' ? 'Video' :
               utmMedium === 'email' || utmMedium === 'newsletter' ? 'Email' :
               utmMedium === 'paid_social' ? 'Paid Social' :
               utmMedium === 'organic_social' ? 'Organic Social' :
               utmMedium === 'display' ? 'Display' :
               'Traffic Sources'}
            </strong>
            {' '}channel grouping.
          </p>
        </div>
      )}
    </div>
  )
}
