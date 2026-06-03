import Otp from "./model/otpSchema.js";
import jwt from "jsonwebtoken";

const authToken = process.env.SECRET_KEY;

export const generateOTP = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log("Generated OTP:", otp);
  const otpInstance = new Otp({
    phone: phone,
    otp: otp,
    isExpiry: false,
  });
  await otpInstance.save();
  return otpInstance;
};

export const sendOTPViaSMS = async (phone, otp) => {
  // Implement your SMS sending logic here using an SMS gateway API
  console.log(`Sending OTP ${otp} to phone number ${phone}`);
  // Example: await smsGateway.sendSMS(phone, `Your OTP is: ${otp}`);
};

// export const verifyOTP = (otp, phone) => {
//   // Implement OTP verification logic here
//   console.log(otp, phone);
  
//   return inputOtp === actualOtp;
// }

export const generateAuthToken = (user) => {
  const token = jwt.sign(
    { id: user._id, phone: user.phone, role: user.role, name: user.name },
    authToken,
    { expiresIn: "7d" }
  );
  return token;
};

export const parsePagination = (req, { defaultLimit = 10, maxLimit = 50 } = {}) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(
    1,
    Math.min(parseInt(req.query.limit, 10) || defaultLimit, maxLimit)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPagination = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
