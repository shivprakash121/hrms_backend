const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const { required } = require("joi");


const leaveBalanceSchema = new mongoose.Schema({
  casualLeave: { type: String, default: "0" },
  medicalLeave: { type: String, default: "0" },
  earnedLeave: { type: String, default: "0" },
  paternityLeave: { type: String, default: "0" },
  maternityLeave: { type: String, default: "0" },
  compOffLeave: { type: String, default: "0" },
});

const employeeSchema = new mongoose.Schema({
  employeeId: { type: Number, unique:true, required: true },
  employeeName: { type: String, required: true },
  employeeCode: { type: String, default: "" },
  gender: { type: String, enum: ["Male", "Female", "Other", "NA"], default: "Male" },
  departmentId: { type: Number, default: 0 },
  designation: { type: String, default: "" },
  doj: { type: String, default: "" },
  dor: { type: String, default: "" },
  doc:{ type: String, default: "" },
  employeeCodeInDevice: { type: String, default: "NA" },
  employmentType: { type: String, enum:["Permanent", "Contractual", "Internship", "Part-Time", "Freelance", "NA"], default: "Permanent", required: true },
  employeeStatus: { type: String, enum: ["Working", "Resigned", "Retired"], default: "Working" },
  accountStatus: { type: String, enum: ["Active", "Pending", "Inactive", "Disabled"], default: "Active" },
  employeeDevicePassword: { type: String },
  employeeDeviceGroup: { type: String },
  fatherName: { type: String, default: "" },
  motherName: { type: String, default: "" },
  residentialAddress: { type: String, default: "" },
  permanentAddress: { type: String, default: "" },
  contactNo: { type: String, default: "" },
  email: { type: String, unique: true, required: true },
  dob: { type: String, default: "" }, // Date of Birth
  placeOfBirth: { type: String, default: "" },
  recordStatus: { type: Number, default: 1 },
  bloodGroup: { type: String, default: "" },
  workPlace: { type: String, default: "" },
  extensionNo: { type: String, default: "" },
  loginPassword: { type: String, default: "12345" },
  team: { type: String, default: "" },
  shiftTime: {
    startAt:{ type: String, default: "" },
    endAt:{ type: String, default: "" }
  },
  aadhaarNumber: { type: String, default: "" },
  employeePhoto: { type: String, default: "" },
  masterDeviceId: { type: Number, default: 0 },
  maritalStatus: { type: String, default: "" },
  nationality: { type: String, default: "" },
  overallExperience: { type: String, default: "" },    
  qualifications: { type: String, default: "" },
  emergencyContact: { type: String, default: "" },  
  managerId: { type: String, default: "" },
  teamLeadId: { type: String, default: "" },
  leaveBalance: { type: leaveBalanceSchema, default: () => ({}) },
  role: {
    type: String,
    enum: ["Super-Admin", "Admin", "HR-Admin", "Manager", "Employee", "Team-Lead"],
    default: "Employee",
  },
},{
    timestamps: true
});

// Pre-save hook to hash password
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('loginPassword')) return next();
  this.loginPassword = await bcrypt.hash(this.loginPassword, 10);
  next();
});   

// Method to compare password
employeeSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.loginPassword);
};

const employeeModel = mongoose.model("employee", employeeSchema)  
module.exports = employeeModel
