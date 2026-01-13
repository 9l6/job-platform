import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, Clock, ArrowLeft, AlertCircle, Building2, BadgeCheck, Mail } from 'lucide-react'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const safeText = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

export default function CompanyJobDetails() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyMsg, setApplyMsg] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await api.get(`/jobs/slug/${encodeURIComponent(slug)}`)
        setJob(data?.job || null)
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

  const locationText = useMemo(() => {
    const city = safeText(job?.location?.city)
    const country = safeText(job?.location?.country)
    return [city, country].filter(Boolean).join(', ')
  }, [job])

  const salaryText = useMemo(() => {
    const s = job?.salary
    if (!s) return ''
    if (s.negotiable) return 'Negotiable'
    const parts = []
    if (typeof s.min === 'number') parts.push(s.min.toLocaleString())
    if (typeof s.max === 'number') parts.push(s.max.toLocaleString())
    const range = parts.length ? parts.join(' - ') : ''
    const currency = safeText(s.currency)
    const period = safeText(s.period)
    return [range, currency, period ? `/${period}` : ''].filter(Boolean).join(' ')
  }, [job])

  const canApply = user?.role === 'jobseeker'
  const onApply = async () => {
    if (!job?._id) return
    setApplyMsg('')
    if (!user) {
      navigate('/login')
      return
    }
    if (!canApply) {
      setApplyMsg('Only jobseekers can apply to jobs.')
      return
    }
    try {
      setApplyLoading(true)
      const { data } = await api.post('/applications/apply', { jobId: job._id })
      setApplyMsg(data?.message || 'Application submitted successfully')
    } catch (e) {
      console.error(e)
      setApplyMsg(e?.response?.data?.message || 'Failed to apply')
    } finally {
      setApplyLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8 animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded w-full" />
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
            <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {safeText(job.jobTitle, 'Untitled Job')}
            </h1>

            <div className="mt-2 flex flex-wrap gap-4 text-gray-700">
              <span className="inline-flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {safeText(job.companyName, 'Company')}
              </span>
              {locationText && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {locationText}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job?.workMode && (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 inline-flex items-center gap-2 capitalize">
                  <Briefcase className="w-4 h-4" />
                  {job.workMode}
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

          <div className="flex flex-col gap-3 md:min-w-[260px]">
            <button
              onClick={onApply}
              disabled={applyLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {applyLoading ? 'Applying...' : 'Apply (send CV by email)'}
            </button>
            {applyMsg && (
              <div className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded p-3">
                {applyMsg}
              </div>
            )}
            <div className="text-xs text-gray-500">
              HR Email: {safeText(job.hrEmail, 'Not provided')}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Job description</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{safeText(job.description, 'No description.')}</p>
          </section>

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

          {Array.isArray(job.preferred) && job.preferred.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Preferred</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {job.preferred.map((x, i) => (
                  <li key={i}>{String(x)}</li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                    {String(s)}
                  </span>
                ))}
              </div>
            </section>
          )}

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
