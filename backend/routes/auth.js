import express from "express";
import User from "../models/User.js"; // ✅ عدّل الاسم إذا كان User.js بحرف كبير
import { sendOtpEmail } from "../services/mailtrapApi.js";

const router = express.Router();

/**
 * POST /api/auth/send-otp
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOtp = otpCode;
    user.emailOtpExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
    await user.save();

    await sendOtpEmail(user.email, otpCode);

    return res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

/**
 * POST /api/auth/verify-otp
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({ message: "No OTP found" });
    }

    if (Date.now() > user.emailOtpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});

export default router;
