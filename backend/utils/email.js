// backend/utils/email.js

/**
 * ⚠️ هذا الملف مُعطّل عمدًا
 * ------------------------------------
 * Render لا يدعم SMTP (nodemailer) ويؤدي إلى ETIMEDOUT
 * لذلك تم إيقاف كل وظائف الإيميل المعتمدة على SMTP
 *
 * استخدم:
 *  - mailtrapAPI.js  (HTTPS Email API)
 * لإرسال OTP أو أي رسائل.
 */

// ❌ تم تعطيل nodemailer نهائيًا
export async function sendEmail() {
  throw new Error(
    "sendEmail is disabled. SMTP/Nodemailer is not supported on this environment. " +
    "Use Mailtrap API (HTTPS) instead."
  );
}

// ❌ تعطيل إرسال التحقق القديم
export async function sendVerificationEmail() {
  throw new Error(
    "sendVerificationEmail is disabled. Use Mailtrap API (sendOtpEmail) instead."
  );
}

// ❌ تعطيل إرسال الوظائف بالبريد
export async function sendMatchedJobsEmail() {
  throw new Error(
    "sendMatchedJobsEmail is disabled. Use Email API (HTTPS) instead of SMTP."
  );
}
