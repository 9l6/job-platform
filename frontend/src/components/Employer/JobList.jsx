import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Edit, UploadCloud, ExternalLink } from 'lucide-react'

const EmployerJobList = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])

  const fetchJobs = async () => {
    try {
      setError('')
      setLoading(true)
      const { data } = await api.get('/jobs/mine')
      setJobs(data?.jobs || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const publishJob = async (id) => {
    try {
      await api.post(`/jobs/${id}/publish`)
      fetchJobs()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to publish')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-600 mt-1">Create and manage your job postings.</p>
        </div>
        <Link
          to="/employer/jobs/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6">{error}</div>}

      {jobs.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow text-center text-gray-600">No jobs yet.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id} className="border-t">
                  <td className="px-4 py-3 font-medium text-gray-900">{j.jobTitle}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {j?.location?.city}, {j?.location?.country}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${j.status === 'published' ? 'bg-green-50 text-green-700' : j.status === 'closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {j?.slug && j.status === 'published' && (
                        <Link
                          to={`/company-jobs/${j.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50"
                          title="View public job page"
                        >
                          <ExternalLink className="w-4 h-4" /> View
                        </Link>
                      )}
                      <Link
                        to={`/employer/jobs/${j._id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </Link>
                      {j.status !== 'published' && (
                        <button
                          onClick={() => publishJob(j._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <UploadCloud className="w-4 h-4" /> Publish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EmployerJobList
