const mongoose = require("mongoose");

const employeeSalarySchema = new mongoose.Schema({
  employeeName: { type: String, default:"" },
  employeeId: { type: String, default: "" },
  employeeCode: { type: String, default: "" },
  deptName: { type: String, default: "" },
  month: { type: String, required: true },
  EL: { type: Number, default: 0.0 },
  CL: { type: Number, default: 0.0 },
  ML: { type: Number, default: 0.0 },
  D_EL: { type: Number, default: 0.0 },
  D_CL: { type: Number, default: 0.0 },
  D_ML: { type: Number, default: 0.0 },
  regularisation: { type: Number, default: 0.0 },
  shortLeave: { type: Number, default: 0.0 },
  halfDay: { type: Number, default: 0.0 },
  absent: { type: Number, default: 0.0 },
  workedDays: { type: Number, default: 0.0 },
  SD: { type: Number, default: 0.0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


const employeeSalaryModel = mongoose.model("employee_salaries", employeeSalarySchema);

module.exports = employeeSalaryModel;
