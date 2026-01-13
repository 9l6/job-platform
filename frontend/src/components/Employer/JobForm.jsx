import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Trash2, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

const Section = ({ title, children }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
    {children}
  </div>
)

const ListEditor = ({ label, items, setItems, placeholder }) => {
  const [val, setVal] = useState('')
  const add = () => {
    const t = val.trim()
    if (!t) return
    setItems([...(items || []), t])
    setVal('')
  }
  const remove = (idx) => setItems((items || []).filter((_, i) => i !== idx))
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-md">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {(items || []).length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between gap-2 bg-gray-50 border rounded-md px-3 py-2">
              <span className="text-sm text-gray-800">{it}</span>
              <button type="button" onClick={() => remove(idx)} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const EmployerJobForm = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [form, setForm] = useState({
    companyName: '',
    jobTitle: '',
    contractType: 'full-time',
    workMode: 'onsite',
    location: { country: 'Saudi Arabia', city: '', address: '' },
    experienceLevel: 'junior',
    experienceYearsMin: '',
    experienceYearsMax: '',
    description: '',
    responsibilities: [],
    requirements: [],
    preferred: [],
    benefits: [],
    requiredSkills: [],
    salary: { min: '', max: '', currency: 'SAR', period: 'monthly', negotiable: false },
    hrEmail: '',
    status: 'draft'
  })

  const canSubmit = useMemo(() => {
    return form.companyName.trim() && form.jobTitle.trim() && form.description.trim() && form.location.country.trim() && form.location.city.trim() && form.hrEmail.trim()
  }, [form])

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      try {
        const { data } = await api.get(`/jobs/${id}`)
        setForm((prev) => ({ ...prev, ...data.job }))
      } catch (e) {
        setMessage({ type: 'error', text: 'Failed to load job' })
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const setLoc = (k, v) => setForm((p) => ({ ...p, location: { ...p.location, [k]: v } }))
  const setSalary = (k, v) => setForm((p) => ({ ...p, salary: { ...p.salary, [k]: v } }))

  const onSave = async (publishAfter = false) => {
    if (!canSubmit) {
      setMessage({ type: 'error', text: 'Please fill required fields (company, title, description, country, city, HR email).' })
      return
    }
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = {
        ...form,
        experienceYearsMin: form.experienceYearsMin === '' ? undefined : Number(form.experienceYearsMin),
        experienceYearsMax: form.experienceYearsMax === '' ? undefined : Number(form.experienceYearsMax),
        salary: {
          ...form.salary,
          min: form.salary.min === '' ? undefined : Number(form.salary.min),
          max: form.salary.max === '' ? undefined : Number(form.salary.max)
        }
      }

      let job
      if (isEdit) {
        const { data } = await api.put(`/jobs/${id}`, payload)
        job = data.job
      } else {
        const { data } = await api.post('/jobs', payload)
        job = data.job
      }

      if (publishAfter) {
        await api.post(`/jobs/${job._id}/publish`)
      }

      setMessage({ type: 'success', text: publishAfter ? 'Job saved and published ✅' : 'Job saved ✅' })
      setTimeout(() => navigate('/employer/jobs'), 800)
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to save job' })
    } finally {
      setSaving(false)
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Job' : 'Create Job'}</h1>
          <p className="text-gray-600 mt-1">Each section is saved separately for clean storage and matching.</p>
        </div>
        <Link to="/employer/jobs" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <Section title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
            <select value={form.contractType} onChange={(e) => set('contractType', e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="temporary">Temporary</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
            <select value={form.workMode} onChange={(e) => set('workMode', e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Location">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input value={form.location.country} onChange={(e) => setLoc('country', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input value={form.location.city} onChange={(e) => setLoc('city', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <input value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>
      </Section>

      <Section title="Job Description">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={6} className="w-full px-3 py-2 border rounded-md" />
      </Section>

      <Section title="Responsibilities">
        <ListEditor label="Responsibilities" items={form.responsibilities} setItems={(v) => set('responsibilities', v)} placeholder="e.g. Prepare monthly financial reports" />
      </Section>

      <Section title="Requirements">
        <ListEditor label="Must-have requirements" items={form.requirements} setItems={(v) => set('requirements', v)} placeholder="e.g. Bachelor degree in Accounting" />
      </Section>

      <Section title="Preferred">
        <ListEditor label="Nice-to-have" items={form.preferred} setItems={(v) => set('preferred', v)} placeholder="e.g. CPA is a plus" />
      </Section>

      <Section title="Skills">
        <ListEditor label="Skills (tags)" items={form.requiredSkills} setItems={(v) => set('requiredSkills', v)} placeholder="e.g. Excel" />
      </Section>

      <Section title="Experience">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
            <select value={form.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="no-experience">No experience</option>
              <option value="junior">Junior</option>
              <option value="mid-level">Mid-level</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min years (optional)</label>
            <input type="number" value={form.experienceYearsMin} onChange={(e) => set('experienceYearsMin', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max years (optional)</label>
            <input type="number" value={form.experienceYearsMax} onChange={(e) => set('experienceYearsMax', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>
      </Section>

      <Section title="Salary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
            <input type="number" value={form.salary.min} onChange={(e) => setSalary('min', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
            <input type="number" value={form.salary.max} onChange={(e) => setSalary('max', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input value={form.salary.currency} onChange={(e) => setSalary('currency', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select value={form.salary.period} onChange={(e) => setSalary('period', e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={!!form.salary.negotiable} onChange={(e) => setSalary('negotiable', e.target.checked)} />
          Negotiable
        </label>
      </Section>

      <Section title="Benefits">
        <ListEditor label="Benefits" items={form.benefits} setItems={(v) => set('benefits', v)} placeholder="e.g. Medical insurance" />
      </Section>

      <Section title="Application">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HR Email *</label>
          <input type="email" value={form.hrEmail} onChange={(e) => set('hrEmail', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
        </div>
      </Section>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(false)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-60"
        >
          <Save className="w-5 h-5" /> Save as Draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Save className="w-5 h-5" /> Save & Publish
        </button>
      </div>
    </div>
  )
}

export default EmployerJobForm
