// frontend/src/components/JobAggregator/JobAggregator.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { 
  Search, Filter, MapPin, Briefcase, Clock, 
  ExternalLink, TrendingUp, Building2, Calendar 
} from 'lucide-react'

const JobAggregator = () => {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    workType: '',
    contractType: '',
    city: '',
    page: 1
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchJobs()
    fetchStats()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const { data } = await api.get(`/aggregated-jobs?${params.toString()}`)
      setJobs(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/aggregated-jobs/stats')
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now - d)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Browse All Jobs
        </h1>
        <p className="text-gray-600">
          {stats && `${stats.total.toLocaleString()} active job listings from multiple sources`}
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search job title, company, or keywords..."
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filters:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {stats?.byCategory.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat._id} ({cat.count})
              </option>
            ))}
          </select>

          <select
            value={filters.workType}
            onChange={(e) => handleFilterChange('workType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Work Types</option>
            <option value="remote">Remote</option>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <select
            value={filters.contractType}
            onChange={(e) => handleFilterChange('contractType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Contract Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>

          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Cities</option>
            {stats?.byLocation.map(loc => (
              <option key={loc._id} value={loc._id}>
                {loc._id} ({loc.count})
              </option>
            ))}
          </select>
        </div>
      </div>

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
        <>
          <div className="space-y-4">
            {jobs.map(job => (
              <Link
                key={job._id}
                to={`/jobs/${job.slug}`}
                className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                      {job.jobTitle}
                    </h3>
                    
                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{job.companyName}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location.city}, {job.location.country}</span>
                      </div>

                      <div className="flex items-center space-x-1 capitalize">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.workType}</span>
                      </div>

                      <div className="flex items-center space-x-1 capitalize">
                        <Clock className="w-4 h-4" />
                        <span>{job.contractType}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.postedDate)}</span>
                      </div>
                    </div>

                    {job.salary?.displayText && (
                      <div className="text-green-600 font-semibold mb-3">
                        {job.salary.displayText}
                      </div>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {job.description}
                    </p>

                    <div className="flex items-center space-x-3">
                      {job.category && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {job.category}
                        </span>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        via {job.source.name}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default JobAggregator