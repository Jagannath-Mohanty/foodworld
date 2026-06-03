//@ts-check

import express from 'express';
import Otp from '../model/otpSchema.js';

const router = express.Router();

router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  // Logic to generate and send OTP to the provided phone number
  // You can use a service like Twilio to send the OTP
  res.json({ message: `OTP sent to ${phone}` });
});
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Find valid OTP
    const existingOtp = await Otp.findOne({
      otp,
      isExpiry: false
    });

    if (!existingOtp) {
      return res.status(400).json({
        error: "Invalid or expired OTP"
      });
    }

    // Mark OTP as used/expired
    existingOtp.isExpiry = true;

    await existingOtp.save();

    res.json({
      message: `OTP verified for ${phone}`
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Server error"
    });
  }
});
export default router;