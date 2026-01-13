// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Shared
import Navbar from './components/Shared/Navbar'

// Auth
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'

// JobSeeker
import Profile from './components/JobSeeker/Profile'
import JobSearch from './components/JobSeeker/JobSearch'
import JobDetails from './components/JobSeeker/JobDetails'

// Public company-created job details
import CompanyJobDetails from './components/Public/CompanyJobDetails'

// Employer
import EmployerJobList from './components/Employer/JobList'
import EmployerJobForm from './components/Employer/JobForm'

// Admin (لو موجودة عندك)
import JobList from './components/Admin/JobList'
import JobForm from './components/Admin/JobForm'

/**
 * Protected Route
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

/**
 * Jobseeker must finish onboarding before browsing jobs
 */
const JobseekerGate = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'jobseeker') {
    return <Navigate to="/" replace />
  }

  const ok = !!(user.emailVerified && user.profileCompleted && user.privacyAcceptedAt)
  if (!ok) return <Navigate to="/profile" replace />

  return children
}

/**
 * Admin Only Route
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

/**
 * Employer Only Route
 */
const EmployerRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'employer') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Home -> Browse Jobs */}
        <Route path="/" element={<Navigate to="/browse-jobs" replace />} />

        {/* Browse aggregated jobs */}
        <Route
          path="/browse-jobs"
          element={
            <JobseekerGate>
              <JobSearch />
            </JobseekerGate>
          }
        />

        {/* Public company job details by slug */}
        <Route path="/company-jobs/:slug" element={<CompanyJobDetails />} />

        {/* Job details by slug */}
        <Route
          path="/jobs/:slug"
          element={
            <JobseekerGate>
              <JobDetails />
            </JobseekerGate>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Admin routes (اختياري) */}
        <Route
          path="/admin/jobs"
          element={
            <AdminRoute>
              <JobList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jobs/new"
          element={
            <AdminRoute>
              <JobForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jobs/:id/edit"
          element={
            <AdminRoute>
              <JobForm />
            </AdminRoute>
          }
        />

        {/* Employer routes */}
        <Route
          path="/employer/jobs"
          element={
            <EmployerRoute>
              <EmployerJobList />
            </EmployerRoute>
          }
        />
        <Route
          path="/employer/jobs/new"
          element={
            <EmployerRoute>
              <EmployerJobForm />
            </EmployerRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/edit"
          element={
            <EmployerRoute>
              <EmployerJobForm />
            </EmployerRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/browse-jobs" replace />} />
      </Routes>
    </div>
  )
}
