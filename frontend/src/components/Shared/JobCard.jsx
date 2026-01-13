// frontend/src/components/Shared/JobCard.jsx
// This is an OPTIONAL component - the job cards are already built into JobSearch.jsx
// You only need this if you want to refactor and reuse the job card elsewhere

import { MapPin, Briefcase, Clock, TrendingUp } from 'lucide-react'

const JobCard = ({ job, onAction, actionLabel, actionDisabled, showMatch = true }) => {
  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.jobTitle}</h3>
          <p className="text-lg text-gray-700 mb-3">{job.companyName}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location.city}, {job.location.country}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Briefcase className="w-4 h-4" />
              <span className="capitalize">{job.experienceLevel.replace('-', ' ')}</span>
            </div>
            {job.workingHours && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{job.workingHours}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {job.workType.map(type => (
              <span key={type} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                {type.replace('-', ' ')}
              </span>
            ))}
          </div>

          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="mt-3">
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
        </div>

        <div className="ml-6 flex flex-col items-end space-y-3">
          {showMatch && job.matchScore !== undefined && (
            <div className={`px-4 py-2 rounded-lg font-semibold ${getMatchColor(job.matchScore)}`}>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-5 h-5" />
                <span>{job.matchScore}% Match</span>
              </div>
            </div>
          )}

          {onAction && (
            <button
              onClick={() => onAction(job._id)}
              disabled={actionDisabled}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLabel || 'Action'}
            </button>
          )}
        </div>
      </div>

      {/* Match Details */}
      {showMatch && job.matchingReasons && job.matchingReasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Why this job matches:</p>
          <ul className="space-y-1">
            {job.matchingReasons.map((reason, idx) => (
              <li key={idx} className="text-sm text-gray-600">{reason}</li>
            ))}
          </ul>
          {job.matchedSkills && job.matchedSkills.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Matching skills: {job.matchedSkills.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JobCard