import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { MapPin, Briefcase, Clock, ExternalLink, ArrowLeft, AlertCircle, CalendarDays, Building2, BadgeCheck } from 'lucide-react'

const safeText = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const JobDetails = () => {
  const { slug } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await api.get(`/aggregated-jobs/${encodeURIComponent(slug)}`)
        setJob(data?.data || null)
      } catch (e) {
        console.error(e)
        setError(e?.response?.data?.message || 'Failed to load job')
        setJob(null)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [slug])

  const salaryText = useMemo(() => {
    const s = job?.salary
    if (!s) return ''
    if (safeText(s.displayText)) return s.displayText
    const parts = []
    if (typeof s.min === 'number') parts.push(s.min.toLocaleString())
    if (typeof s.max === 'number') parts.push(s.max.toLocaleString())
    const range = parts.length ? parts.join(' - ') : ''
    const currency = safeText(s.currency)
    const period = safeText(s.period)
    return [range, currency, period ? `/${period}` : ''].filter(Boolean).join(' ')
  }, [job])

  const locationText = useMemo(() => {
    const city = safeText(job?.location?.city)
    const country = safeText(job?.location?.country)
    return [city, country].filter(Boolean).join(', ')
  }, [job])

  const onApply = async () => {
    if (!job?._id) return
    const url = safeText(job.applicationUrl)
    if (!url || url === '#') return

    try {
      // Track click (optional)
      await api.post(`/aggregated-jobs/${job._id}/track-application`)
    } catch (e) {
      // لا نوقف المستخدم بسبب tracking
      console.warn('Track apply failed:', e?.message)
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-40 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!job || error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error || 'Job not found'}</span>
          </div>

          <div className="mt-6">
            <Link to="/browse-jobs" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back to jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to="/browse-jobs" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {safeText(job.jobTitle, 'Untitled Job')}
            </h1>

            <div className="mt-2 flex flex-wrap gap-4 text-gray-700">
              <span className="inline-flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {safeText(job.companyName, 'Company not specified')}
              </span>

              {locationText && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {locationText}
                </span>
              )}

              {job?.postedDate && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Posted: {formatDate(job.postedDate)}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job?.workType && (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 inline-flex items-center gap-2 capitalize">
                  <Briefcase className="w-4 h-4" />
                  {job.workType}
                </span>
              )}
              {job?.contractType && (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 inline-flex items-center gap-2 capitalize">
                  <Clock className="w-4 h-4" />
                  {job.contractType}
                </span>
              )}
              {job?.experienceLevel && (
                <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 inline-flex items-center gap-2 capitalize">
                  <BadgeCheck className="w-4 h-4" />
                  {job.experienceLevel}
                </span>
              )}
              {salaryText && (
                <span className="px-3 py-1 rounded-full text-sm bg-green-50 text-green-700">
                  Salary: {salaryText}
                </span>
              )}
            </div>
          </div>

          {/* Apply */}
          <div className="flex flex-col gap-3 md:min-w-[240px]">
            <button
              onClick={onApply}
              disabled={!safeText(job.applicationUrl) || job.applicationUrl === '#'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" />
              Apply
            </button>

            <div className="text-xs text-gray-500">
              Source: {safeText(job?.source?.name, 'Unknown')}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Job description</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {safeText(job.description, 'No description available.')}
            </p>
          </section>

          {/* Requirements */}
          {Array.isArray(job.requirements) && job.requirements.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {job.requirements.map((x, i) => (
                  <li key={i}>{String(x)}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Responsibilities */}
          {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {job.responsibilities.map((x, i) => (
                  <li key={i}>{String(x)}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Qualifications */}
          {Array.isArray(job.qualifications) && job.qualifications.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Qualifications</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {job.qualifications.map((x, i) => (
                  <li key={i}>{String(x)}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Required skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s, i) => (
                  <span key={i} className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm">
                    {String(s)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Benefits */}
          {Array.isArray(job.benefits) && job.benefits.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {job.benefits.map((x, i) => (
                  <li key={i}>{String(x)}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobDetails
