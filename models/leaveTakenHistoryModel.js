const mongoose = require("mongoose");

const leaveTakenHistorySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  leaveType: {
    type: String,
    enum: ["casualLeave", "medicalLeave", "earnedLeave", "paternityLeave", "maternityLeave", "compOffLeave", "regularized", "shortLeave"],
    required: true,
  },
  leaveStartDate: { 
    type: String, 
    required: true,
  },
  leaveEndDate: { 
    type: String, 
    required: true,
  },
  totalDays: { 
    type: String,  
    min: "0.5", 
  },
  reason: { 
    type: String, 
    default: "", 
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },  
  approvedBy: {
    type: String, 
    required: true,
  },
  location:{
    type: String,
    default: ""
  },
  approvedDateTime: { type: String, default: "" },
  dateTime:{ type: String, default:"" },  
  createdAt: { type: Date, default: Date.now }, 
  updatedAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model("leaveTakenHistory", leaveTakenHistorySchema);
