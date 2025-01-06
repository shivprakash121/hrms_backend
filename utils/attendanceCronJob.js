const cron = require("node-cron");
const { connectToDB } = require("../config/dbConfig");
const AttendanceLogModel = require("../models/attendanceLogModel");
const moment = require('moment-timezone');

const fetchAndSyncAttendanceLogs = async () => {
  try {
    const pool = await connectToDB();
    const currentDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    console.log("Current Date:", currentDate);

    const query = `
      SELECT 
      Employees.EmployeeName, 
      Employees.EmployeeCode, 
      Employees.Gender, 
      Employees.Designation, 
      Employees.CategoryId,  
      Employees.EmployementType,  
      Employees.EmployeeDevicePassword, 
      Employees.FatherName, 
      Employees.MotherName, 
      Employees.ResidentialAddress, 
      Employees.PermanentAddress, 
      Employees.ContactNo, 
      Employees.Email, 
      Employees.DOB, 
      Employees.Location, 
      Employees.WorkPlace, 
      Employees.ExtensionNo, 
      Employees.LoginName, 
      Employees.LoginPassword, 
      Employees.EmployeePhoto,
      AttendanceLogs.*
      FROM AttendanceLogs
      LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
      WHERE CAST(AttendanceLogs.AttendanceDate AS DATE) = '${currentDate}'
      ORDER BY AttendanceLogs.AttendanceDate DESC
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length > 0) {
      console.log(`Fetched ${result.recordset.length} records for the current date.`);

      const updatePromises = result.recordset.map(async (record) => {
        try {
          await AttendanceLogModel.updateOne(
            { AttendanceLogId: record.AttendanceLogId, AttendanceDate: currentDate }, // Filter by unique ID and date
            { $set: record }, // Update fields
            { upsert: true } // Insert if not found
          );
        } catch (err) {
          console.error(`Error updating record ${record.AttendanceLogId}:`, err.message);
        }
      });

      await Promise.all(updatePromises);
      console.log("Attendance logs for the current date have been synced to MongoDB.");
    } else {
      console.log("No records found for the current date.");
    }
  } catch (err) {
    console.error("Error syncing attendance logs:", err.message);
  }
};  


const startAttendanceLogSyncCronJob = () => {
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running cron job: Syncing attendance logs...");
    await fetchAndSyncAttendanceLogs();
  });
};


const fetchAndSyncAttendanceLogsOnce = async () => {
  try {
    const pool = await connectToDB();
    const currentDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const sixMonthsAgoDate = moment().tz("Asia/Kolkata").subtract(6, "months").format("YYYY-MM-DD");

    console.log("Date Range:", { currentDate, sixMonthsAgoDate });

    const query = `
      SELECT 
      Employees.EmployeeName, 
      Employees.EmployeeCode, 
      Employees.Gender, 
      Employees.Designation, 
      Employees.CategoryId,  
      Employees.EmployementType,  
      Employees.EmployeeDevicePassword, 
      Employees.FatherName, 
      Employees.MotherName, 
      Employees.ResidentialAddress, 
      Employees.PermanentAddress, 
      Employees.ContactNo, 
      Employees.Email, 
      Employees.DOB, 
      Employees.Location, 
      Employees.WorkPlace, 
      Employees.ExtensionNo, 
      Employees.LoginName, 
      Employees.LoginPassword, 
      Employees.EmployeePhoto,
      AttendanceLogs.*
      FROM AttendanceLogs
      LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
      WHERE CAST(AttendanceLogs.AttendanceDate AS DATE) BETWEEN '${sixMonthsAgoDate}' AND '${currentDate}'
      ORDER BY AttendanceLogs.AttendanceDate DESC
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length > 0) {
      console.log(`Fetched ${result.recordset.length} records for the date range.`);

      const updatePromises = result.recordset.map(async (record) => {
        try {
          await AttendanceLogModel.updateOne(
            { AttendanceLogId: record.AttendanceLogId }, // Filter by unique ID
            { $set: record }, // Update fields
            { upsert: true } // Insert if not found
          );
        } catch (err) {
          console.error(`Error updating record ${record.AttendanceLogId}:`, err.message);
        }
      });

      await Promise.all(updatePromises);
      console.log("Attendance logs for the last 6 months have been synced to MongoDB.");
    } else {
      console.log("No records found for the date range.");
    }
  } catch (err) {
    console.error("Error syncing attendance logs:", err.message);
  }
};

const startAttendanceLogSyncCronJobOnce = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running cron job: Syncing attendance logs for the last 6 months...");
    await fetchAndSyncAttendanceLogsOnce();
  });
};


const fetchAndSyncAttendanceLogsLast5days = async () => {
  try {
    const pool = await connectToDB();
    const currentDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const fiveDaysAgoDate = moment().tz("Asia/Kolkata").subtract(5, "days").format("YYYY-MM-DD");

    console.log("Date Range:", { currentDate, fiveDaysAgoDate });

    const query = `
      SELECT 
      Employees.EmployeeName, 
      Employees.EmployeeCode, 
      Employees.Gender, 
      Employees.Designation, 
      Employees.CategoryId,  
      Employees.EmployementType,  
      Employees.EmployeeDevicePassword, 
      Employees.FatherName, 
      Employees.MotherName, 
      Employees.ResidentialAddress, 
      Employees.PermanentAddress, 
      Employees.ContactNo, 
      Employees.Email, 
      Employees.DOB, 
      Employees.Location, 
      Employees.WorkPlace, 
      Employees.ExtensionNo, 
      Employees.LoginName, 
      Employees.LoginPassword, 
      Employees.EmployeePhoto,
      AttendanceLogs.*
      FROM AttendanceLogs
      LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
      WHERE CAST(AttendanceLogs.AttendanceDate AS DATE) BETWEEN '${fiveDaysAgoDate}' AND '${currentDate}'
      ORDER BY AttendanceLogs.AttendanceDate DESC
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length > 0) {
      console.log(`Fetched ${result.recordset.length} records for the last 5 days.`);

      const updatePromises = result.recordset.map(async (record) => {
        try {
          await AttendanceLogModel.updateOne(
            { AttendanceLogId: record.AttendanceLogId }, // Filter by unique ID
            { $set: record }, // Update fields
            { upsert: true } // Insert if not found
          );
        } catch (err) {
          console.error(`Error updating record ${record.AttendanceLogId}:`, err.message);
        }
      });

      await Promise.all(updatePromises);
      console.log("Attendance logs for the last 5 days have been synced to MongoDB.");
    } else {
      console.log("No records found for the last 5 days.");
    }
  } catch (err) {
    console.error("Error syncing attendance logs:", err.message);
  }
};

const startAttendanceLogSyncCronJobLast5days = () => {
  cron.schedule("0 1 * * *", async () => {
    console.log("Running cron job: Syncing attendance logs for the last 5 days...");
    await fetchAndSyncAttendanceLogsLast5days();
  });
};

// startAttendanceLogSyncCronJob();



module.exports = { 
  startAttendanceLogSyncCronJob,
  startAttendanceLogSyncCronJobOnce,
  startAttendanceLogSyncCronJobLast5days
};
