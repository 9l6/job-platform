// frontend/src/components/JobAggregator/JobDetails.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { 
  ArrowLeft, MapPin, Briefcase, Clock, Building2, 
  Calendar, ExternalLink, Share2, Eye, CheckCircle 
} from 'lucide-react'

const JobDetails = () => {
  const { slug } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJob()
  }, [slug])

  const fetchJob = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/aggregated-jobs/${slug}`)
      setJob(data.data)
    } catch (err) {
      setError('Job not found')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!job) return

    // Track application
    try {
      await api.post(`/aggregated-jobs/${job._id}/track-application`)
    } catch (err) {
      console.error('Failed to track application:', err)
    }

    // Open application URL
    window.open(job.applicationUrl, '_blank')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.jobTitle,
          text: `${job.jobTitle} at ${job.companyName}`,
          url
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
        <p className="text-gray-600 mb-6">
          This job may have expired or been removed.
        </p>
        <Link
          to="/browse-jobs"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/browse-jobs"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to all jobs
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        {/* Header */}
        <div className="border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {job.jobTitle}
          </h1>

          <div className="flex items-center space-x-2 text-xl text-gray-700 mb-4">
            <Building2 className="w-6 h-6" />
            <span className="font-semibold">{job.companyName}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600 mb-6">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>{job.location.fullLocation}</span>
            </div>

            <div className="flex items-center space-x-2 capitalize">
              <Briefcase className="w-5 h-5" />
              <span>{job.workType}</span>
            </div>

            <div className="flex items-center space-x-2 capitalize">
              <Clock className="w-5 h-5" />
              <span>{job.contractType}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Posted {formatDate(job.postedDate)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>{job.viewCount} views</span>
            </div>
          </div>

          {job.salary?.displayText && (
            <div className="inline-block px-4 py-2 bg-green-50 text-green-700 rounded-md font-semibold mb-4">
              {job.salary.displayText}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleApply}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Apply Now</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-line">
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
            <ul className="space-y-2">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h2>
            <ul className="space-y-2">
              {job.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply Section */}
        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Apply</h2>
          <p className="text-gray-700 mb-4">
            Click the "Apply Now" button to be redirected to the application page on{' '}
            <span className="font-semibold">{job.source.name}</span>.
          </p>
          <button
            onClick={handleApply}
            className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Apply on {job.source.name}</span>
          </button>
        </div>

        {/* Source */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Job originally posted on{' '}
            <a
              href={job.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {job.source.name}
            </a>
            {' · '}
            Last updated: {formatDate(job.lastUpdated)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default JobDetails