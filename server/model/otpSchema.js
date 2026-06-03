import mongoose from "mongoose";


const otpSchema = new mongoose.Schema(
    {
        phone:{
            type: Number,
            required: true,
        },
        otp:{
            type: Number,
            default: null,
            required:true
        },
        isExpiry:{
            type: Boolean,
            default: false,
        },
        createdAt:{
            type: Date,
            default: Date.now,
           
        },
        updatedAt:{
            type: Date,
            default: Date.now,
        }
    }
)

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;