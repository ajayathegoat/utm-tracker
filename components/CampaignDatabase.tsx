'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, UTMLink } from '@/lib/supabase'
import { UTM_SOURCES, CAMPAIGN_STATUSES, formatDate, formatDateTime, toGA4Format } from '@/lib/utm-utils'

interface CampaignDatabaseProps {
  refreshTrigger: number
  userName: string
}

const PAGE_SIZE = 25

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '3months', label: 'Last 3 months' },
  { value: 'all', label: 'All time' },
]

function getDateFilter(range: string): string | null {
  const now = new Date()
  if (range === 'today') {
    const start = new Date(now); start.setHours(0,0,0,0)
    return start.toISOString()
  }
  if (range === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7)
    return start.toISOString()
  }
  if (range === 'month') {
    const start = new Date(now); start.setMonth(now.getMonth() - 1)
    return start.toISOString()
  }
  if (range === '3months') {
    const start = new Date(now); start.setMonth(now.getMonth() - 3)
    return start.toISOString()
  }
  return null
}

const STATUS_COLORS: Record<string, string> = {
  active: 'border-l-green-500 bg-green-50/30',
  paused: 'border-l-yellow-500 bg-yellow-50/30',
  ended: 'border-l-slate-400 bg-slate-50/30',
  draft: 'border-l-blue-500 bg-blue-50/30',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  ended: 'bg-slate-100 text-slate-600',
  draft: 'bg-blue-100 text-blue-800',
}

export default function CampaignDatabase({ refreshTrigger, userName }: CampaignDatabaseProps) {
  const [links, setLinks] = useState<UTMLink[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterMedium, setFilterMedium] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCreatedBy, setFilterCreatedBy] = useState('')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editLink, setEditLink] = useState<UTMLink | null>(null)
  const [deleteLink, setDeleteLink] = useState<UTMLink | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, topMember: '', lastCreated: '' })
  const [allFilteredLinks, setAllFilteredLinks] = useState<UTMLink[]>([])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('utm_links')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filterSource) query = query.eq('utm_source', filterSource)
      if (filterMedium) query = query.eq('utm_medium', filterMedium)
      if (filterStatus) query = query.eq('campaign_status', filterStatus)
      if (filterCreatedBy) query = query.eq('created_by', filterCreatedBy)

      const dateFilter = getDateFilter(filterDateRange)
      if (dateFilter) query = query.gte('created_at', dateFilter)

      if (search.trim()) {
        const s = search.trim()
        query = query.or(`campaign_name.ilike.%${s}%,created_by.ilike.%${s}%,tags.ilike.%${s}%,notes.ilike.%${s}%,utm_content.ilike.%${s}%`)
      }

      // Fetch all filtered for export
      const { data: allData } = await query
      setAllFilteredLinks(allData || [])

      // Paginated slice
      const { data, count, error } = await query
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      setLinks(data || [])
      setTotal(count || 0)
    } catch {
      // silently handle — user may not have connected Supabase yet
    } finally {
      setLoading(false)
    }
  }, [search, filterSource, filterMedium, filterStatus, filterCreatedBy, filterDateRange, page])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await supabase.from('utm_links').select('*').order('created_at', { ascending: false })
      if (!data) return
      const active = data.filter(l => l.campaign_status === 'active').length
      const memberCount: Record<string, number> = {}
      data.forEach(l => { memberCount[l.created_by] = (memberCount[l.created_by] || 0) + 1 })
      const topMember = Object.entries(memberCount).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'
      const last = data[0]
      const lastCreated = last ? `${last.created_by} · ${formatDate(last.created_at)}` : '—'
      const members = [...new Set(data.map(l => l.created_by))]
      setTeamMembers(members)
      setStats({ total: data.length, active, topMember, lastCreated })
    } catch {
      // silently handle
    }
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks, refreshTrigger])
  useEffect(() => { fetchStats() }, [fetchStats, refreshTrigger])
  useEffect(() => { setPage(0) }, [search, filterSource, filterMedium, filterStatus, filterCreatedBy, filterDateRange])

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExport = () => {
    if (allFilteredLinks.length === 0) return
    const headers = ['Date Created', 'Created By', 'Brand', 'Campaign Type', 'Campaign Name',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term',
      'Base URL', 'Full UTM URL', 'Campaign Status', 'Tags', 'Notes']
    const rows = allFilteredLinks.map(l => [
      formatDateTime(l.created_at), l.created_by, l.brand, l.campaign_type, l.campaign_name,
      l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content, l.utm_term || '',
      l.base_url, l.full_utm_url, l.campaign_status, l.tags || '', l.notes || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'_')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `utm_export_${date}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!deleteLink || deleteConfirm !== 'DELETE') return
    await supabase.from('utm_links').delete().eq('id', deleteLink.id)
    setDeleteLink(null); setDeleteConfirm('')
    fetchLinks(); fetchStats()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="🔗" label="Total UTMs" value={stats.total.toString()} />
        <StatCard icon="✅" label="Active Campaigns" value={stats.active.toString()} />
        <StatCard icon="🏆" label="Most Active" value={stats.topMember || '—'} />
        <StatCard icon="🕐" label="Last Created" value={stats.lastCreated || '—'} small />
      </div>

      {/* Search + Filters + Export */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaign name, creator, tags, notes…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder-slate-400"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={allFilteredLinks.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <FilterSelect value={filterSource} onChange={v => setFilterSource(v)} placeholder="All Sources">
            {UTM_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </FilterSelect>
          <FilterSelect value={filterMedium} onChange={v => setFilterMedium(v)} placeholder="All Mediums">
            {['paid_social','organic_social','cpc','display','video','email','newsletter'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={filterStatus} onChange={v => setFilterStatus(v)} placeholder="All Statuses">
            {CAMPAIGN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </FilterSelect>
          <FilterSelect value={filterCreatedBy} onChange={v => setFilterCreatedBy(v)} placeholder="All Team Members">
            {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
          </FilterSelect>
          <FilterSelect value={filterDateRange} onChange={v => setFilterDateRange(v)} placeholder="All Time">
            {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </FilterSelect>
          {(search || filterSource || filterMedium || filterStatus || filterCreatedBy || filterDateRange !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterSource(''); setFilterMedium(''); setFilterStatus(''); setFilterCreatedBy(''); setFilterDateRange('all') }}
              className="text-xs text-slate-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Count */}
        <p className="text-xs text-slate-500">
          {loading ? 'Loading…' : `Showing ${links.length === 0 ? 0 : page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total} UTMs`}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading campaigns…
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No UTMs found</p>
            <p className="text-sm mt-1">
              {(search || filterSource || filterStatus) ? 'Try adjusting your filters.' : 'Generate your first UTM link above!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Date', 'Created By', 'Campaign Name', 'Source', 'Medium', 'Content', 'Status', 'Tags', 'Full URL', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {links.map((link, i) => (
                  <tr
                    key={link.id}
                    className={`border-l-4 ${STATUS_COLORS[link.campaign_status] || 'border-l-slate-200'} ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-teal-50/30 transition-colors`}
                  >
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{formatDate(link.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {link.created_by.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs">{link.created_by}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[180px]">
                      <div className="truncate" title={link.campaign_name}>{link.campaign_name}</div>
                      {link.notes && <div className="text-slate-400 truncate text-xs mt-0.5" title={link.notes}>{link.notes}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{link.utm_source}</code>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">{link.utm_medium}</code>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-orange-700 max-w-[140px]">
                      <div className="truncate" title={link.utm_content}>{link.utm_content}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[link.campaign_status] || 'bg-slate-100 text-slate-600'}`}>
                        {link.campaign_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px]">
                      {link.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {link.tags.split(',').map(t => (
                            <span key={t} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">{t.trim()}</span>
                          ))}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="font-mono text-xs text-slate-500 truncate" title={link.full_utm_url}>
                        {link.full_utm_url}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(link.full_utm_url, link.id)}
                          className={`p-1.5 rounded-lg transition-colors ${copiedId === link.id ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-500'}`}
                          title="Copy URL"
                        >
                          {copiedId === link.id ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
                          )}
                        </button>
                        <button
                          onClick={() => setEditLink(link)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => { setDeleteLink(link); setDeleteConfirm('') }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => setPage(p => Math.max(0, p-1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Prev</button>
            <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p+1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next →</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editLink && (
        <EditModal
          link={editLink}
          onClose={() => setEditLink(null)}
          onSaved={() => { setEditLink(null); fetchLinks(); fetchStats() }}
        />
      )}

      {/* Delete Modal */}
      {deleteLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete this UTM link?</h3>
                <p className="text-sm text-slate-500">This shared database record will be permanently removed for the whole team.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs font-mono text-slate-600 break-all">
              {deleteLink.full_utm_url}
            </div>
            <p className="text-sm text-slate-700 mb-2">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE'}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Yes, delete permanently
              </button>
              <button
                onClick={() => { setDeleteLink(null); setDeleteConfirm('') }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditModal({ link, onClose, onSaved }: { link: UTMLink; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    campaign_status: link.campaign_status,
    utm_content: link.utm_content,
    tags: link.tags || '',
    notes: link.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('utm_links').update(form).eq('id', link.id)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-lg">Edit UTM Link</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs font-mono text-slate-600 break-all">
          {link.full_utm_url}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Campaign Status</label>
            <select
              value={form.campaign_status}
              onChange={e => setForm(f => ({ ...f, campaign_status: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
            >
              {CAMPAIGN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">UTM Content</label>
            <input
              type="text"
              value={form.utm_content}
              onChange={e => setForm(f => ({ ...f, utm_content: toGA4Format(e.target.value) }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="q4, retargeting, video"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Cancel
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center mt-3">
          ⚠️ Per GA4 best practice, only status, content, tags &amp; notes can be edited. To change source/medium/campaign, create a new link and mark this one as Ended.
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, small }: { icon: string; label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`font-bold text-slate-900 ${small ? 'text-sm' : 'text-2xl'} truncate`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function FilterSelect({ value, onChange, placeholder, children }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white appearance-none"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  )
}
