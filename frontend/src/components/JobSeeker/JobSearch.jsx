// frontend/src/components/JobSeeker/JobSearch.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Search, MapPin, Briefcase, Clock, TrendingUp } from 'lucide-react'

const JobSearch = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    city: '',
    workType: '',
    experienceLevel: ''
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v && String(v).trim()) params.append(k, String(v).trim())
    })
    return params.toString()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setError('')
      setLoading(true)
      const { data } = await api.get(`/aggregated-jobs?${queryString}`)

      // Backend sometimes returns {data: {jobs: []}} or {data: []}
      const list = Array.isArray(data?.data) ? data.data : (data?.data?.jobs || data?.jobs || [])
      setJobs(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Failed to fetch jobs:', e)
      setError(e?.response?.data?.message || 'Failed to fetch jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const safeText = (v, fallback = 'Not specified') => {
    const s = (typeof v === 'string' ? v : v == null ? '' : String(v)).trim()
    return s || fallback
  }

  const getMatchColor = (score) => {
    const n = Number(score)
    if (!Number.isFinite(n)) return 'text-gray-600 bg-gray-50'
    if (n >= 80) return 'text-green-600 bg-green-50'
    if (n >= 60) return 'text-blue-600 bg-blue-50'
    if (n >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Job</h1>
        <p className="text-gray-600 mt-1">Search jobs aggregated from multiple sources.</p>
      </div>

      {/* Filters (search bar must ALWAYS render) */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleChange}
                placeholder="Job title or company..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <input
            type="text"
            name="country"
            value={filters.country}
            onChange={handleChange}
            placeholder="Country"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />

          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No jobs found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => {
            const city = job?.location?.city
            const country = job?.location?.country
            const workTypes = Array.isArray(job?.workType)
              ? job.workType
              : job?.workType
                ? [job.workType]
                : []

            const exp = job?.experienceLevel
            const workingHours = job?.workingHours
            const salary = job?.salary
            const desc = typeof job?.description === 'string' ? job.description.trim() : ''

            return (
              <div key={job._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate">
                      {safeText(job?.jobTitle, 'Untitled job')}
                    </h3>

                    <p className="text-gray-700 mb-3">{safeText(job?.companyName, 'Company Not Specified')}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{safeText(city, 'Not specified')}, {safeText(country, 'Not specified')}</span>
                      </div>

                      {exp && (
                        <div className="flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span className="capitalize">{String(exp).replace(/-/g, ' ')}</span>
                        </div>
                      )}

                      {workingHours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{workingHours}</span>
                        </div>
                      )}

                      {salary && (
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Salary:</span>
                          <span>{salary}</span>
                        </div>
                      )}
                    </div>

                    {workTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {workTypes.map((type) => (
                          <span
                            key={type}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                          >
                            {String(type).replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {desc && (
                      <p className="mt-3 text-sm text-gray-600">
                        {desc.length > 180 ? desc.slice(0, 180) + '...' : desc}
                      </p>
                    )}

                    <div className="mt-3">
                      <Link to={`/jobs/${job.slug}`} className="text-blue-600 hover:underline text-sm font-medium">
                        View Details →
                      </Link>
                    </div>
                  </div>

                  {job?.matchScore !== undefined && (
                    <div className={`shrink-0 px-4 py-2 rounded-lg font-semibold ${getMatchColor(job.matchScore)}`}>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-5 h-5" />
                        <span>{job.matchScore}% Match</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default JobSearch
