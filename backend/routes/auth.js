import User from "./user.js"; // عدّل المسار إذا مختلف
import { sendOtpEmail } from "./mailtrapAPI.js"; // عدّل المسار إذا مختلف

// ===============================
// Send OTP
// ===============================
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // جلب المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // توليد OTP (6 أرقام)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ OTP + وقت الانتهاء
    user.emailOtp = otpCode;
    user.emailOtpExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
    await user.save();

    // إرسال OTP عبر Mailtrap API (HTTPS)
    await sendOtpEmail(user.email, otpCode);

    return res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      message: "Failed to send verification code",
    });
  }
};

// ===============================
// Verify OTP
// ===============================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // تحقق من انتهاء الصلاحية
    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (Date.now() > user.emailOtpExpires) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // تحقق من الكود
    if (user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // تفعيل الإيميل
    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      message: "Failed to verify OTP",
    });
  }
};
