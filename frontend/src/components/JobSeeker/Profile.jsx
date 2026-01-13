// frontend/src/components/JobSeeker/Profile.jsx - ENHANCED VERSION
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { Save, Upload, AlertCircle, CheckCircle, X } from 'lucide-react'
import { 
  getCountries, 
  getCitiesForCountry, 
  getPhoneCodeForCountry,
  getAllJobTitles,
  getJobTitlesByCategory
} from '../../utils/data'

const Profile = () => {
  const { user, checkAuth } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [availableCities, setAvailableCities] = useState([])
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // ✅ Email verification (OTP only)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // ✅ Matching + email preferences (separate from profile form)
  const [prefs, setPrefs] = useState({
    emailJobsConsent: false,
    emailJobsMinScore: 60,
    emailJobsMaxResults: 10,
    preferredWorkMode: 'any',
    yearsExperience: '',
    matchWeights: {
      title: 40,
      skills: 30,
      city: 15,
      country: 5,
      workMode: 5,
      experience: 5
    }
  })
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [sendingMatches, setSendingMatches] = useState(false)

  const countries = getCountries()
  const jobTitlesCategories = getJobTitlesByCategory()
  const allJobTitles = getAllJobTitles()

  const workTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'half-day', label: 'Half-day' },
    { value: 'quarter-day', label: 'Quarter-day' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'remote', label: 'Remote' }
  ]

  const experienceLevels = [
    { value: 'no-experience', label: 'No Experience' },
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid-level', label: 'Mid-Level (2-5 years)' },
    { value: 'senior', label: 'Senior (5+ years)' }
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/jobseeker/profile')
      setProfile(data.profile)

      // load preferences (with safe defaults)
      setPrefs({
        emailJobsConsent: !!data.profile.emailJobsConsent,
        emailJobsMinScore: Number(data.profile.emailJobsMinScore ?? 60),
        emailJobsMaxResults: Number(data.profile.emailJobsMaxResults ?? 10),
        preferredWorkMode: data.profile.preferredWorkMode || 'any',
        yearsExperience: data.profile.yearsExperience ?? '',
        matchWeights: {
          title: Number(data.profile.matchWeights?.title ?? 40),
          skills: Number(data.profile.matchWeights?.skills ?? 30),
          city: Number(data.profile.matchWeights?.city ?? 15),
          country: Number(data.profile.matchWeights?.country ?? 5),
          workMode: Number(data.profile.matchWeights?.workMode ?? 5),
          experience: Number(data.profile.matchWeights?.experience ?? 5)
        }
      })
      
      // Set phone code and number if phone exists
      if (data.profile.phone) {
        const phoneMatch = data.profile.phone.match(/^(\+\d+)(.*)$/)
        if (phoneMatch) {
          setPhoneCode(phoneMatch[1])
          setPhoneNumber(phoneMatch[2].trim())
        } else {
          setPhoneNumber(data.profile.phone)
        }
      }
      
      // Load cities if country is set
      if (data.profile.country) {
        const cities = getCitiesForCountry(data.profile.country)
        setAvailableCities(cities)
        const code = getPhoneCodeForCountry(data.profile.country)
        if (!phoneCode) {
          setPhoneCode(code)
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile({ ...profile, [name]: value })
  }

  const handleCountryChange = (e) => {
    const country = e.target.value
    setProfile({ ...profile, country, city: '' })
    
    // Update available cities
    const cities = getCitiesForCountry(country)
    setAvailableCities(cities)
    
    // Update phone code
    const code = getPhoneCodeForCountry(country)
    setPhoneCode(code)
  }

  const handlePhoneNumberChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '')
    setPhoneNumber(value)
  }

  const handleWorkTypeChange = (type) => {
    const workType = profile.workType || []
    if (workType.includes(type)) {
      setProfile({ ...profile, workType: workType.filter(t => t !== type) })
    } else {
      setProfile({ ...profile, workType: [...workType, type] })
    }
  }

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const skills = profile.skills || []
      if (!skills.includes(skillInput.trim())) {
        setProfile({ ...profile, skills: [...skills, skillInput.trim()] })
      }
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill) => {
    setProfile({ 
      ...profile, 
      skills: (profile.skills || []).filter(s => s !== skill) 
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!profile.age || profile.age < 18) {
      setMessage({ type: 'error', text: 'Age must be 18 or older' })
      return
    }

    if (!profile.country) {
      setMessage({ type: 'error', text: 'Please select a country' })
      return
    }

    if (!profile.city) {
      setMessage({ type: 'error', text: 'Please select a city' })
      return
    }

    if (!profile.desiredJobTitle) {
      setMessage({ type: 'error', text: 'Please select a desired job title' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    // Combine phone code and number
    const fullPhone = phoneCode && phoneNumber ? `${phoneCode} ${phoneNumber}` : ''

    try {
      await api.put('/jobseeker/profile', {
        ...profile,
        phone: fullPhone
      })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append(type === 'cv' ? 'cv' : 'profileImage', file)

    try {
      const endpoint = type === 'cv' ? '/jobseeker/upload-cv' : '/jobseeker/upload-profile-image'
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (type === 'cv') {
        const parsed = !!data?.cvParsed
        setMessage({ type: 'success', text: parsed ? 'CV uploaded and parsed successfully!' : 'CV uploaded successfully! (parsing not available for this file)' })
      } else {
        setMessage({ type: 'success', text: 'Profile image uploaded successfully!' })
      }
      fetchProfile()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' })
    }
  }

  const sendOtp = async () => {
    try {
      setSendingOtp(true)
      await api.post('/auth/send-otp')
      setMessage({ type: 'success', text: 'Verification code sent to your email.' })
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to send code' })
    } finally {
      setSendingOtp(false)
    }
  }

  const verifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setMessage({ type: 'error', text: 'Enter the 6-digit code.' })
      return
    }
    try {
      setVerifyingOtp(true)
      await api.post('/auth/verify-otp', { code: otpCode.trim() })
      setMessage({ type: 'success', text: 'Email verified successfully!' })
      setOtpCode('')
      await checkAuth()
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to verify code' })
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handlePrefChange = (e) => {
    const { name, value, type, checked } = e.target
    setPrefs((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleWeightChange = (key, value) => {
    setPrefs((prev) => ({
      ...prev,
      matchWeights: { ...prev.matchWeights, [key]: Number(value) }
    }))
  }

  const savePreferences = async () => {
    setSavingPrefs(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = {
        ...prefs,
        emailJobsMinScore: Number(prefs.emailJobsMinScore),
        emailJobsMaxResults: Number(prefs.emailJobsMaxResults),
        yearsExperience: prefs.yearsExperience === '' ? undefined : Number(prefs.yearsExperience)
      }
      await api.put('/jobseeker/preferences', payload)
      setMessage({ type: 'success', text: 'Preferences saved successfully.' })
      await fetchProfile()
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to save preferences' })
    } finally {
      setSavingPrefs(false)
    }
  }

  const sendMatchedJobsToEmail = async () => {
    setSendingMatches(true)
    setMessage({ type: '', text: '' })
    try {
      const { data } = await api.post('/jobseeker/send-matched-jobs')
      setMessage({ type: 'success', text: data?.message || 'Email sent.' })
      await fetchProfile()
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to send matched jobs' })
    } finally {
      setSendingMatches(false)
    }
  }

  const submitOnboarding = async () => {
    setMessage({ type: '', text: '' })
    if (!privacyAccepted) {
      setMessage({ type: 'error', text: 'You must accept the privacy policy to continue.' })
      return
    }
    setSubmitting(true)
    try {
      await api.post('/jobseeker/submit', { privacyAccepted: true })
      await checkAuth()
      setMessage({ type: 'success', text: 'Profile submitted. Check your email to verify your address.' })
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to submit profile' })
    } finally {
      setSubmitting(false)
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ✅ Onboarding gate */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Unlock Job Browsing</h2>
        <p className="text-sm text-gray-600 mt-1">
          Flow: Create account → Fill profile + upload CV → Accept privacy policy → Verify email → Browse jobs.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Email verification</span>
            <span className={user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}>
              {user?.emailVerified ? 'Verified' : 'Not verified'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Profile submitted</span>
            <span className={user?.profileCompleted ? 'text-green-600' : 'text-yellow-600'}>
              {user?.profileCompleted ? 'Submitted' : 'Not submitted'}
            </span>
          </div>
        </div>

        {!user?.emailVerified && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">Verify your email (OTP)</div>
            <div className="text-xs text-gray-600 mt-1">
              Click “Send code”, then enter the 6-digit code you receive by email.
            </div>

            <div className="mt-3 flex flex-col md:flex-row gap-2">
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50"
              >
                {sendingOtp ? 'Sending...' : 'Send code'}
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="px-3 py-2 border border-gray-300 rounded text-sm w-40"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={verifyingOtp}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3">
          <input
            id="privacyAccepted"
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="privacyAccepted" className="text-sm text-gray-700">
            I agree to the Privacy Policy and Terms. My data will be stored securely and used to match me with jobs.
          </label>
        </div>

        <button
          type="button"
          onClick={submitOnboarding}
          disabled={submitting}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit profile & unlock jobs'}
        </button>
      </div>

      {/* ✅ Email + Matching preferences */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Email & Matching Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Jobs are sent only when you click the button below. To prevent spam, we send again only after you change & save your profile/preferences.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="emailJobsConsent"
              checked={!!prefs.emailJobsConsent}
              onChange={handlePrefChange}
            />
            <span>I agree to receive matched jobs by email</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum match score</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                name="emailJobsMinScore"
                value={prefs.emailJobsMinScore}
                onChange={handlePrefChange}
                className="w-full"
              />
              <div className="text-xs text-gray-600">{prefs.emailJobsMinScore}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max results per email</label>
              <input
                type="number"
                min="1"
                max="50"
                name="emailJobsMaxResults"
                value={prefs.emailJobsMaxResults}
                onChange={handlePrefChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred work mode</label>
              <select
                name="preferredWorkMode"
                value={prefs.preferredWorkMode}
                onChange={handlePrefChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience (optional)</label>
              <input
                type="number"
                min="0"
                max="60"
                name="yearsExperience"
                value={prefs.yearsExperience}
                onChange={handlePrefChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Matching weights (0–100)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'title', label: 'Job title' },
                { key: 'skills', label: 'Skills' },
                { key: 'city', label: 'City' },
                { key: 'country', label: 'Country' },
                { key: 'workMode', label: 'Work mode (remote/hybrid/onsite)' },
                { key: 'experience', label: 'Experience level' }
              ].map((w) => (
                <div key={w.key}>
                  <label className="block text-xs text-gray-700 mb-1">{w.label}: {prefs.matchWeights[w.key]}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={prefs.matchWeights[w.key]}
                    onChange={(e) => handleWeightChange(w.key, e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tip: We normalize weights automatically.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={savePreferences}
              disabled={savingPrefs}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              {savingPrefs ? 'Saving...' : 'Save preferences'}
            </button>

            <button
              type="button"
              onClick={sendMatchedJobsToEmail}
              disabled={sendingMatches || !user?.emailVerified || !user?.profileCompleted || !profile?.emailJobsConsent}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {sendingMatches ? 'Sending...' : 'Send matched jobs to my email'}
            </button>
          </div>

          {(prefs.emailJobsConsent !== !!profile?.emailJobsConsent ||
            Number(prefs.emailJobsMinScore) !== Number(profile?.emailJobsMinScore ?? 60) ||
            Number(prefs.emailJobsMaxResults) !== Number(profile?.emailJobsMaxResults ?? 10) ||
            (prefs.preferredWorkMode || 'any') !== (profile?.preferredWorkMode || 'any')) && (
            <p className="text-xs text-gray-500">
              You have unsaved changes in preferences — click “Save preferences” first.
            </p>
          )}

          {!user?.emailVerified && (
            <p className="text-xs text-yellow-700">
              Verify your email first to enable sending matched jobs.
            </p>
          )}

          {user?.emailVerified && user?.profileCompleted && !profile?.emailJobsConsent && (
            <p className="text-xs text-gray-600">
              Enable the consent checkbox and click “Save preferences” to unlock the send button.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Personal Information */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={profile?.fullName || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-600">*</span> (Must be 18+)
              </label>
              <input
                type="number"
                name="age"
                value={profile?.age || ''}
                onChange={handleChange}
                required
                min="18"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-600">*</span>
              </label>
              <select
                name="country"
                value={profile?.country || ''}
                onChange={handleCountryChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-600">*</span>
              </label>
              <select
                name="city"
                value={profile?.city || ''}
                onChange={handleChange}
                required
                disabled={!profile?.country}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {profile?.country ? 'Select City' : 'Select Country First'}
                </option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={phoneCode}
                  disabled
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-center font-semibold"
                />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="501234567"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {phoneCode && (
                <p className="text-xs text-gray-500 mt-1">
                  Format: {phoneCode} followed by your number
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Job Preferences */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desired Job Title <span className="text-red-600">*</span>
              </label>
              <select
                name="desiredJobTitle"
                value={profile?.desiredJobTitle || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Job Title</option>
                {Object.entries(jobTitlesCategories).map(([category, titles]) => (
                  <optgroup key={category} label={category}>
                    {titles.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Type Preferences <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {workTypes.map(type => (
                  <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(profile?.workType || []).includes(type.value)}
                      onChange={() => handleWorkTypeChange(type.value)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level <span className="text-red-600">*</span>
              </label>
              <select
                name="experienceLevel"
                value={profile?.experienceLevel || 'no-experience'}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a skill (e.g., JavaScript, Marketing)"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button type="button" onClick={() => handleRemoveSkill(skill)}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* File Uploads */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV (PDF or DOCX) <span className="text-red-600">* Required to apply</span>
              </label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Upload CV</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => handleFileUpload(e, 'cv')}
                    className="hidden"
                  />
                </label>
                {profile?.cvPath && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ CV uploaded{profile?.cvParsedAt ? ' • Parsed' : ''}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image (Optional)</label>
              <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md w-fit">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile