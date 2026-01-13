// backend/utils/email.js
const nodemailer = require('nodemailer');

// Create email transporter
// Supports BOTH legacy vars (EMAIL_USER/EMAIL_PASS) and SMTP_* vars (recommended)
const createTransporter = () => {
  // 1) Explicit SMTP config (recommended)
  if (process.env.SMTP_HOST) {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: user && pass ? { user, pass } : undefined,
      tls: { minVersion: 'TLSv1.2' }
    });
  }

  // 2) SendGrid via API key (legacy option)
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // 3) Gmail service (legacy option)
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: user && pass ? { user, pass } : undefined
  });
};

const getFromAddress = () => {
  return (
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    'no-reply@job-platform.local'
  );
};

// Optional: quick startup check
exports.verifyEmailTransport = async () => {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
};

// Send application email to company
exports.sendApplicationEmail = async (jobData, jobSeekerData, cvPath) => {
  const transporter = createTransporter();

  const coverMessage = `Dear Hiring Manager at ${jobData.companyName},

I am writing to express my interest in the ${jobData.jobTitle} position. With my background in ${jobSeekerData.desiredJobTitle} and skills in ${jobSeekerData.skills.join(', ')}, I believe I would be a great fit for your team.

I have ${jobSeekerData.experienceLevel} level experience and am looking for ${jobSeekerData.workType.join('/')} opportunities. I am particularly excited about this role because it aligns well with my career goals and skills.

Please find my CV attached for your review. I would welcome the opportunity to discuss how my experience and skills can contribute to your team.

Thank you for considering my application.

Best regards,
${jobSeekerData.fullName}
${jobSeekerData.email}
${jobSeekerData.phone || ''}
${jobSeekerData.city ? `${jobSeekerData.city}, ${jobSeekerData.country}` : jobSeekerData.country || ''}`;

  const mailOptions = {
    from: getFromAddress(),
    to: jobData.hrEmail,
    subject: `Job Application: ${jobData.jobTitle} - ${jobSeekerData.fullName}`,
    text: coverMessage,
    attachments: cvPath ? [{
      filename: `${jobSeekerData.fullName.replace(/\s+/g, '_')}_CV.pdf`,
      path: cvPath
    }] : []
  };

  await transporter.sendMail(mailOptions);
};

// Send confirmation email to job seeker
exports.sendConfirmationEmail = async (jobSeekerEmail, applicationData) => {
  const transporter = createTransporter();

  const message = `Dear ${applicationData.jobSeekerName},

Your application has been successfully submitted!

Application Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company: ${applicationData.companyName}
Position: ${applicationData.jobTitle}
Location: ${applicationData.location}
Submitted: ${new Date(applicationData.submittedAt).toLocaleString()}

Match Score: ${applicationData.matchPercentage}%

Matching Criteria:
${applicationData.matchingReasons.join('\n')}

${applicationData.matchedSkills.length > 0 ? `
Matched Skills:
${applicationData.matchedSkills.map(skill => `✓ ${skill}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your application has been sent to ${applicationData.hrEmail}.

Good luck with your application!

Best regards,
Job Platform Team`;

  await transporter.sendMail({
    from: getFromAddress(),
    to: jobSeekerEmail,
    subject: `Application Confirmation: ${applicationData.jobTitle} at ${applicationData.companyName}`,
    text: message
  });
};

// ✅ OTP email (NO LINKS)
exports.sendEmailOtp = async (toEmail, fullName, otpCode) => {
  const transporter = createTransporter();

  const message = `Dear ${fullName},

Your email verification code is:

${otpCode}

This code expires in 10 minutes.
If you did not request this, you can ignore this email.

Best regards,
Job Platform Team`;

  await transporter.sendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: 'Your verification code - Job Platform',
    text: message
  });
};

// ✅ Profile submission confirmation
exports.sendProfileSavedEmail = async (toEmail, fullName) => {
  const transporter = createTransporter();
  const message = `Dear ${fullName},

We received your information and saved it successfully.

Next steps:
1) Verify your email using the 6-digit code (OTP) from inside your Profile page.
2) After verification, you will be able to browse jobs inside the platform.

Best regards,
Job Platform Team`;

  await transporter.sendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: 'Your profile has been submitted - Job Platform',
    text: message
  });
};

// ✅ Send matched jobs list
exports.sendMatchedJobsEmail = async (toEmail, fullName, matches) => {
  const transporter = createTransporter();
  const lines = (matches || []).map((m, i) => {
    return `${i + 1}) ${m.jobTitle} — ${m.companyName} (${m.matchScore}% match)\n   Location: ${m.location}\n   Link: ${m.url}`;
  });

  const message = `Dear ${fullName},

Based on your profile, here are some suitable jobs we found:

${lines.join('\n\n') || 'No matches found yet. Try adjusting your preferences and sending again.'}

Best regards,
Job Platform Team`;

  await transporter.sendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: 'Jobs matched to your profile - Job Platform',
    text: message
  });
};
