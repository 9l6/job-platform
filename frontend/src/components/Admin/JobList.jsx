// frontend/src/components/Admin/JobList.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { Edit, Trash2, MapPin, Briefcase, AlertCircle } from 'lucide-react'

const JobList = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/jobs')
      setJobs(data.jobs)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load jobs' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return

    try {
      await api.delete(`/jobs/${id}`)
      setMessage({ type: 'success', text: 'Job deleted successfully' })
      fetchJobs()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete job' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{message.text}</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No jobs posted yet. Create your first job listing!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map(job => (
            <div key={job._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.jobTitle}</h3>
                  <p className="text-lg text-gray-700 mb-3">{job.companyName}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location.city}, {job.location.country}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="capitalize">{job.experienceLevel.replace('-', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.workType.map(type => (
                      <span key={type} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                        {type.replace('-', ' ')}
                      </span>
                    ))}
                  </div>

                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-600">
                    HR Email: {job.hrEmail}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Posted: {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="ml-6 flex space-x-2">
                  <button
                    onClick={() => navigate(`/admin/jobs/edit/${job._id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobList