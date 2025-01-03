// const cron = require("node-cron");
// const { connectToDB } = require("../config/dbConfig");
// const AttendanceLogModel = require("../models/attendanceLogModel");

// const fetchAndInsertAttendanceLogs = async () => {
//   try {
//     const pool = await connectToDB();

//     // Query to fetch all records from AttendanceLogs
//     const query = `
//       SELECT 
//           Employees.EmployeeName, 
//           Employees.EmployeeCode, 
//           Employees.Gender, 
//           Employees.Designation, 
//           Employees.CategoryId,  
//           Employees.EmployementType,  
//           Employees.EmployeeDevicePassword, 
//           Employees.FatherName, 
//           Employees.MotherName, 
//           Employees.ResidentialAddress, 
//           Employees.PermanentAddress, 
//           Employees.ContactNo, 
//           Employees.Email, 
//           Employees.DOB, 
//           Employees.Location, 
//           Employees.WorkPlace, 
//           Employees.ExtensionNo, 
//           Employees.LoginName, 
//           Employees.LoginPassword, 
//           Employees.EmployeePhoto,
//           AttendanceLogs.*
//       FROM AttendanceLogs
//       LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//       ORDER BY AttendanceLogs.AttendanceDate DESC
//     `;

//     const result = await pool.request().query(query);

//     if (result.recordset.length > 0) {
//       console.log(`Fetched ${result.recordset.length} records from AttendanceLogs`);

//       // Insert records into MongoDB
//       const insertPromises = result.recordset.map((record) => {
//         const newLog = new AttendanceLogModel({
//           EmployeeName: record.EmployeeName,
//           EmployeeCode: record.EmployeeCode,
//           Gender: record.Gender,
//           Designation: record.Designation,
//           CategoryId: record.CategoryId,
//           EmployementType: record.EmployementType,
//           EmployeeDevicePassword: record.EmployeeDevicePassword,
//           FatherName: record.FatherName,
//           MotherName: record.MotherName,
//           ResidentialAddress: record.ResidentialAddress,
//           PermanentAddress: record.PermanentAddress,
//           ContactNo: record.ContactNo,
//           Email: record.Email,
//           DOB: record.DOB,
//           Location: record.Location,
//           WorkPlace: record.WorkPlace,
//           ExtensionNo: record.ExtensionNo,
//           LoginName: record.LoginName,
//           LoginPassword: record.LoginPassword,
//           EmployeePhoto: record.EmployeePhoto,
//           AttendanceLogId: record.AttendanceLogId,
//           AttendanceDate: record.AttendanceDate,
//           EmployeeId: record.EmployeeId,
//           InTime: record.InTime,
//           InDeviceId: record.InDeviceId,
//           OutTime: record.OutTime,
//           OutDeviceId: record.OutDeviceId,
//           Duration: record.Duration,
//           LateBy: record.LateBy,
//           EarlyBy: record.EarlyBy,
//           IsOnLeave: record.IsOnLeave,
//           LeaveType: record.LeaveType,
//           LeaveDuration: record.LeaveDuration,
//           WeeklyOff: record.WeeklyOff,
//           Holiday: record.Holiday,
//           LeaveRemarks: record.LeaveRemarks,
//           PunchRecords: record.PunchRecords,
//           ShiftId: record.ShiftId,
//           Present: record.Present,
//           Absent: record.Absent,
//           Status: record.Status,
//           StatusCode: record.StatusCode,
//           P1Status: record.P1Status,
//           P2Status: record.P2Status,
//           P3Status: record.P3Status,
//           IsonSpecialOff: record.IsonSpecialOff,
//           SpecialOffType: record.SpecialOffType,
//           SpecialOffRemark: record.SpecialOffRemark,
//           SpecialOffDuration: record.SpecialOffDuration,
//           OverTime: record.OverTime,
//           OverTimeE: record.OverTimeE,
//           MissedOutPunch: record.MissedOutPunch,
//           Remarks: record.Remarks,
//           MissedInPunch: record.MissedInPunch,
//           C1: record.C1,
//           C2: record.C2,
//           C3: record.C3,
//           C4: record.C4,
//           C5: record.C5,
//           C6: record.C6,
//           C7: record.C7,
//           LeaveTypeId: record.LeaveTypeId,
//           LossOfHours: record.LossOfHours
//         });

//         return newLog.save();
//       });

//       // Wait for all insert operations to complete
//       await Promise.all(insertPromises);

//       console.log("All records inserted into MongoDB.");
//     } else {
//       console.log("No records found.");
//     }
//   } catch (err) {
//     console.error("Error fetching and inserting attendance logs:", err.message);
//   }
// };

// // Schedule the cron job to run every 5 minutes
// const startAttendanceCronJob = () => {
//   cron.schedule("*/5 * * * *", () => {
//     console.log("Running cron job: Fetching and inserting attendance logs...");
//     fetchAndInsertAttendanceLogs();
//   });
// };


// const fetchAndUpdateAttendanceLogs = async () => {
//     try {
//       const pool = await connectToDB();
  
//       // Get the current date in 'YYYY-MM-DD' format
//       const currentDate = new Date().toISOString().split('T')[0];
  
//       // Get the date 5 days before the current date
//       const fiveDaysAgo = new Date();
//       fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5); // Subtract 5 days
//       const fiveDaysAgoString = fiveDaysAgo.toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD'
  
//       console.log("Current Date:", currentDate);
//       console.log("Date 5 Days Ago:", fiveDaysAgoString);
  
//       // Query to fetch records from AttendanceLogs based on 5 days ago
//       const query = `
//         SELECT 
//             Employees.EmployeeName, 
//             Employees.EmployeeCode, 
//             Employees.Gender, 
//             Employees.Designation, 
//             Employees.CategoryId,  
//             Employees.EmployementType,  
//             Employees.EmployeeDevicePassword, 
//             Employees.FatherName, 
//             Employees.MotherName, 
//             Employees.ResidentialAddress, 
//             Employees.PermanentAddress, 
//             Employees.ContactNo, 
//             Employees.Email, 
//             Employees.DOB, 
//             Employees.Location, 
//             Employees.WorkPlace, 
//             Employees.ExtensionNo, 
//             Employees.LoginName, 
//             Employees.LoginPassword, 
//             Employees.EmployeePhoto,
//             AttendanceLogs.*
//         FROM AttendanceLogs
//         LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//         WHERE CAST(AttendanceLogs.AttendanceDate AS DATE) = '${fiveDaysAgoString}'
//         ORDER BY AttendanceLogs.AttendanceDate DESC
//       `;
  
//       const result = await pool.request().query(query);
  
//       if (result.recordset.length > 0) {
//         console.log(`Fetched ${result.recordset.length} records for 5 days ago from AttendanceLogs`);
  
//         // Update or insert records into MongoDB
//         const updatePromises = result.recordset.map(async (record) => {
//           // Check if the record already exists in MongoDB
//           const existingLog = await AttendanceLogModel.findOne({ AttendanceLogId: record.AttendanceLogId });
  
//           if (existingLog) {
//             // Update the existing record
//             existingLog.EmployeeName = record.EmployeeName;
//             existingLog.EmployeeCode = record.EmployeeCode;
//             existingLog.Gender = record.Gender;
//             existingLog.Designation = record.Designation;
//             existingLog.CategoryId = record.CategoryId;
//             existingLog.EmployementType = record.EmployementType;
//             existingLog.EmployeeDevicePassword = record.EmployeeDevicePassword;
//             existingLog.FatherName = record.FatherName;
//             existingLog.MotherName = record.MotherName;
//             existingLog.ResidentialAddress = record.ResidentialAddress;
//             existingLog.PermanentAddress = record.PermanentAddress;
//             existingLog.ContactNo = record.ContactNo;
//             existingLog.Email = record.Email;
//             existingLog.DOB = record.DOB;
//             existingLog.Location = record.Location;
//             existingLog.WorkPlace = record.WorkPlace;
//             existingLog.ExtensionNo = record.ExtensionNo;
//             existingLog.LoginName = record.LoginName;
//             existingLog.LoginPassword = record.LoginPassword;
//             existingLog.EmployeePhoto = record.EmployeePhoto;
//             existingLog.InTime = record.InTime;
//             existingLog.InDeviceId = record.InDeviceId;
//             existingLog.OutTime = record.OutTime;
//             existingLog.OutDeviceId = record.OutDeviceId;
//             existingLog.Duration = record.Duration;
//             existingLog.LateBy = record.LateBy;
//             existingLog.EarlyBy = record.EarlyBy;
//             existingLog.IsOnLeave = record.IsOnLeave;
//             existingLog.LeaveType = record.LeaveType;
//             existingLog.LeaveDuration = record.LeaveDuration;
//             existingLog.WeeklyOff = record.WeeklyOff;
//             existingLog.Holiday = record.Holiday;
//             existingLog.LeaveRemarks = record.LeaveRemarks;
//             existingLog.PunchRecords = record.PunchRecords;
//             existingLog.ShiftId = record.ShiftId;
//             existingLog.Present = record.Present;
//             existingLog.Absent = record.Absent;
//             existingLog.Status = record.Status;
//             existingLog.StatusCode = record.StatusCode;
//             existingLog.P1Status = record.P1Status;
//             existingLog.P2Status = record.P2Status;
//             existingLog.P3Status = record.P3Status;
//             existingLog.IsonSpecialOff = record.IsonSpecialOff;
//             existingLog.SpecialOffType = record.SpecialOffType;
//             existingLog.SpecialOffRemark = record.SpecialOffRemark;
//             existingLog.SpecialOffDuration = record.SpecialOffDuration;
//             existingLog.OverTime = record.OverTime;
//             existingLog.OverTimeE = record.OverTimeE;
//             existingLog.MissedOutPunch = record.MissedOutPunch;
//             existingLog.Remarks = record.Remarks;
//             existingLog.MissedInPunch = record.MissedInPunch;
//             existingLog.C1 = record.C1;
//             existingLog.C2 = record.C2;
//             existingLog.C3 = record.C3;
//             existingLog.C4 = record.C4;   
//             existingLog.C5 = record.C5;
//             existingLog.C6 = record.C6;
//             existingLog.C7 = record.C7;
//             existingLog.LeaveTypeId = record.LeaveTypeId;
//             existingLog.LossOfHours = record.LossOfHours;
  
//             return existingLog.save(); // Update the existing record
//           } else {
//             // If record doesn't exist, create a new one
//             const newLog = new AttendanceLogModel({
//               EmployeeName: record.EmployeeName,
//               EmployeeCode: record.EmployeeCode,
//               Gender: record.Gender,
//               Designation: record.Designation,
//               CategoryId: record.CategoryId,
//               EmployementType: record.EmployementType,
//               EmployeeDevicePassword: record.EmployeeDevicePassword,
//               FatherName: record.FatherName,
//               MotherName: record.MotherName,
//               ResidentialAddress: record.ResidentialAddress,
//               PermanentAddress: record.PermanentAddress,
//               ContactNo: record.ContactNo,
//               Email: record.Email,
//               DOB: record.DOB,
//               Location: record.Location,
//               WorkPlace: record.WorkPlace,
//               ExtensionNo: record.ExtensionNo,
//               LoginName: record.LoginName,
//               LoginPassword: record.LoginPassword,
//               EmployeePhoto: record.EmployeePhoto,
//               AttendanceLogId: record.AttendanceLogId,
//               AttendanceDate: record.AttendanceDate,
//               EmployeeId: record.EmployeeId,
//               InTime: record.InTime,
//               InDeviceId: record.InDeviceId,
//               OutTime: record.OutTime,
//               OutDeviceId: record.OutDeviceId,
//               Duration: record.Duration,
//               LateBy: record.LateBy,
//               EarlyBy: record.EarlyBy,
//               IsOnLeave: record.IsOnLeave,
//               LeaveType: record.LeaveType,
//               LeaveDuration: record.LeaveDuration,
//               WeeklyOff: record.WeeklyOff,
//               Holiday: record.Holiday,
//               LeaveRemarks: record.LeaveRemarks,
//               PunchRecords: record.PunchRecords,
//               ShiftId: record.ShiftId,
//               Present: record.Present,
//               Absent: record.Absent,
//               Status: record.Status,
//               StatusCode: record.StatusCode,
//               P1Status: record.P1Status,
//               P2Status: record.P2Status,
//               P3Status: record.P3Status,
//               IsonSpecialOff: record.IsonSpecialOff,
//               SpecialOffType: record.SpecialOffType,
//               SpecialOffRemark: record.SpecialOffRemark,
//               SpecialOffDuration: record.SpecialOffDuration,
//               OverTime: record.OverTime,
//               OverTimeE: record.OverTimeE,
//               MissedOutPunch: record.MissedOutPunch,
//               Remarks: record.Remarks,
//               MissedInPunch: record.MissedInPunch,
//               C1: record.C1,
//               C2: record.C2,
//               C3: record.C3,
//               C4: record.C4,
//               C5: record.C5,
//               C6: record.C6,
//               C7: record.C7,
//               LeaveTypeId: record.LeaveTypeId,
//               LossOfHours: record.LossOfHours
//             });
  
//             return newLog.save(); // Insert new record
//           }
//         });
  
//         // Wait for all update/insert operations to complete
//         await Promise.all(updatePromises);
  
//         console.log("Attendance logs from 5 days ago are updated or inserted in MongoDB.");
//       } else {
//         console.log("No records found for 5 days ago.");
//       }
//     } catch (err) {
//       console.error("Error fetching and updating attendance logs:", err.message);
//     }
//   };
  
  
//   // Schedule the cron job to run every 1 hour
//   const startUpdateAttendanceCronJob = () => {  
//     cron.schedule("0 * * * *", () => {
//       console.log("Running cron job: Fetching and updating today's attendance logs...");
//       fetchAndUpdateAttendanceLogs();
//     });
//   };



// module.exports = { 
//     startAttendanceCronJob, 
//     startUpdateAttendanceCronJob 
// };
