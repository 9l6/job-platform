// backend/scripts/seedJobs.js
// Run this to add sample jobs for testing
// Usage: node scripts/seedJobs.js

const mongoose = require('mongoose');
const AggregatedJob = require('../models/AggregatedJob');
require('dotenv').config();

const sampleJobs = [
  {
    jobTitle: 'Senior Software Engineer',
    companyName: 'Saudi Aramco',
    location: {
      country: 'Saudi Arabia',
      city: 'Riyadh',
      fullLocation: 'Riyadh, Saudi Arabia'
    },
    workType: 'onsite',
    contractType: 'full-time',
    salary: {
      min: 15000,
      max: 25000,
      currency: 'SAR',
      period: 'monthly',
      displayText: '15,000 - 25,000 SAR/month'
    },
    description: 'We are seeking an experienced Senior Software Engineer to join our technology team. You will be responsible for designing, developing, and maintaining high-quality software solutions. This role requires strong technical skills, leadership abilities, and a passion for innovation.',
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      "5+ years of software development experience",
      "Proficiency in Java, Python, or C++",
      "Strong understanding of software design patterns",
      "Experience with cloud platforms (AWS, Azure, or GCP)"
    ],
    responsibilities: [
      "Design and develop scalable software applications",
      "Lead technical projects and mentor junior developers",
      "Collaborate with cross-functional teams",
      "Write clean, maintainable code",
      "Participate in code reviews and technical discussions"
    ],
    requiredSkills: ['Java', 'Python', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'Git'],
    experienceLevel: 'senior',
    category: 'Technology & IT',
    source: {
      name: 'Sample Data',
      url: 'https://example.com'
    },
    applicationUrl: 'https://example.com/apply',
    applicationMethod: 'external',
    postedDate: new Date(),
    isActive: true
  },
  {
    jobTitle: 'Marketing Manager',
    companyName: 'Al Rajhi Bank',
    location: {
      country: 'Saudi Arabia',
      city: 'Jeddah',
      fullLocation: 'Jeddah, Saudi Arabia'
    },
    workType: 'hybrid',
    contractType: 'full-time',
    salary: {
      min: 12000,
      max: 18000,
      currency: 'SAR',
      period: 'monthly',
      displayText: '12,000 - 18,000 SAR/month'
    },
    description: 'Leading financial institution is looking for a creative Marketing Manager to develop and implement marketing strategies. The ideal candidate will have a strong background in digital marketing and brand management.',
    requirements: [
      "Bachelor's degree in Marketing or Business",
      "3-5 years of marketing experience",
      "Strong understanding of digital marketing",
      "Excellent communication skills",
      "Experience in the banking sector is a plus"
    ],
    responsibilities: [
      "Develop and execute marketing campaigns",
      "Manage social media presence",
      "Analyze market trends and customer insights",
      "Coordinate with external agencies",
      "Monitor and report on campaign performance"
    ],
    requiredSkills: ['Digital Marketing', 'SEO', 'Social Media', 'Brand Management', 'Analytics'],
    experienceLevel: 'mid-level',
    category: 'Sales & Marketing',
    source: {
      name: 'Sample Data',
      url: 'https://example.com'
    },
    applicationUrl: 'https://example.com/apply',
    applicationMethod: 'external',
    postedDate: new Date(),
    isActive: true
  },
  {
    jobTitle: 'Data Analyst',
    companyName: 'STC - Saudi Telecom',
    location: {
      country: 'Saudi Arabia',
      city: 'Riyadh',
      fullLocation: 'Riyadh, Saudi Arabia'
    },
    workType: 'remote',
    contractType: 'full-time',
    salary: {
      min: 10000,
      max: 15000,
      currency: 'SAR',
      period: 'monthly',
      displayText: '10,000 - 15,000 SAR/month'
    },
    description: 'Join our data team as a Data Analyst. You will analyze large datasets, create reports, and provide insights to drive business decisions. This is a remote position with flexible working hours.',
    requirements: [
      "Bachelor's degree in Statistics, Mathematics, or related field",
      "2+ years of data analysis experience",
      "Proficiency in SQL and Python",
      "Experience with data visualization tools (Tableau, Power BI)",
      "Strong analytical and problem-solving skills"
    ],
    responsibilities: [
      "Analyze complex datasets and identify trends",
      "Create dashboards and reports",
      "Present findings to stakeholders",
      "Collaborate with business teams",
      "Maintain data quality and integrity"
    ],
    requiredSkills: ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics', 'Power BI'],
    experienceLevel: 'junior',
    category: 'Technology & IT',
    source: {
      name: 'Sample Data',
      url: 'https://example.com'
    },
    applicationUrl: 'https://example.com/apply',
    applicationMethod: 'external',
    postedDate: new Date(),
    isActive: true
  },
  {
    jobTitle: 'HR Manager',
    companyName: 'SABIC',
    location: {
      country: 'Saudi Arabia',
      city: 'Riyadh',
      fullLocation: 'Riyadh, Saudi Arabia'
    },
    workType: 'onsite',
    contractType: 'full-time',
    description: 'We are looking for an experienced HR Manager to lead our human resources department. You will be responsible for recruitment, employee relations, and HR policy implementation.',
    requirements: [
      "Bachelor's degree in Human Resources or related field",
      "5+ years of HR management experience",
      "Strong knowledge of Saudi labor law",
      "Excellent interpersonal skills",
      "Experience with HRIS systems"
    ],
    responsibilities: [
      "Oversee recruitment and onboarding",
      "Manage employee relations",
      "Develop HR policies and procedures",
      "Handle performance management",
      "Ensure compliance with labor laws"
    ],
    requiredSkills: ['HR Management', 'Recruitment', 'Employee Relations', 'Labor Law', 'HRIS'],
    experienceLevel: 'senior',
    category: 'Human Resources',
    source: {
      name: 'Sample Data',
      url: 'https://example.com'
    },
    applicationUrl: 'https://example.com/apply',
    applicationMethod: 'external',
    postedDate: new Date(),
    isActive: true
  },
  {
    jobTitle: 'Accountant',
    companyName: 'Ernst & Young',
    location: {
      country: 'Saudi Arabia',
      city: 'Jeddah',
      fullLocation: 'Jeddah, Saudi Arabia'
    },
    workType: 'onsite',
    contractType: 'full-time',
    salary: {
      min: 8000,
      max: 12000,
      currency: 'SAR',
      period: 'monthly',
      displayText: '8,000 - 12,000 SAR/month'
    },
    description: 'Join our accounting team to manage financial records, prepare reports, and ensure compliance with accounting standards. Great opportunity for career growth in a leading firm.',
    requirements: [
      "Bachelor's degree in Accounting or Finance",
      "2-4 years of accounting experience",
      "CPA or equivalent certification preferred",
      "Proficiency in accounting software",
      "Knowledge of IFRS and local tax regulations"
    ],
    responsibilities: [
      "Prepare financial statements and reports",
      "Manage accounts payable and receivable",
      "Conduct audits and reconciliations",
      "Assist with tax preparation",
      "Maintain accurate financial records"
    ],
    requiredSkills: ['Accounting', 'Financial Reporting', 'IFRS', 'Tax', 'Excel', 'SAP'],
    experienceLevel: 'mid-level',
    category: 'Finance & Accounting',
    source: {
      name: 'Sample Data',
      url: 'https://example.com'
    },
    applicationUrl: 'https://example.com/apply',
    applicationMethod: 'external',
    postedDate: new Date(),
    isActive: true
  }
];

async function seedJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing sample jobs
    await AggregatedJob.deleteMany({ 'source.name': 'Sample Data' });
    console.log('Cleared existing sample jobs');

    // Insert sample jobs
    for (const jobData of sampleJobs) {
      // Generate unique ID
      const uniqueId = AggregatedJob.generateUniqueId(jobData);
      
      // Generate slug
      const slug = AggregatedJob.generateSlug(
        jobData.jobTitle,
        jobData.companyName,
        uniqueId
      );

      const job = await AggregatedJob.create({
        ...jobData,
        uniqueId,
        slug
      });

      console.log(`✓ Created: ${job.jobTitle} at ${job.companyName}`);
    }

    console.log(`\n✅ Successfully added ${sampleJobs.length} sample jobs!`);
    console.log('Visit http://localhost:5173/browse-jobs to see them\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
}

seedJobs();