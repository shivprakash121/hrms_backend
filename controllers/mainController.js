// const { connectToDB } = require("../config/dbConfig");
const { duration } = require("moment");
const AttendanceLogModel = require("../models/attendanceLogModel");
const { format } = require("mysql");
const cron = require('node-cron');
const leaveTakenHistoryModel = require("../models/leaveTakenHistoryModel");
const holidaysModel = require("../models/holidayModel");
const employeeModel = require("../models/employeeModel");
const { DateTime } = require("mssql");
const moment = require("moment-timezone");
const attendanceLogModelForOutDuty = require("../models/attendanceLogModelForOutDuty");
// // Get all tables in the database
// const getTables = async (req, res) => {
//   try {
//     const pool = await connectToDB();
//     const result = await pool.request().query(`
//       SELECT TABLE_NAME 
//       FROM INFORMATION_SCHEMA.TABLES 
//       WHERE TABLE_TYPE = 'BASE TABLE'
//     `);
//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching tables:", err.message);
//     res.status(500).send(err.message);
//   }
// };

// const getEmployees = async (req, res) => {
//   try {
//     const pool = await connectToDB();
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     let query = `
//       SELECT *
//       FROM Employees
//       WHERE Status = 'Working'
//       ORDER BY EmployeeName
//       OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
//     `;

//     // Query for total count of records
//     const countQuery = `
//       SELECT COUNT(*) AS TotalCount
//       FROM Employees
//       WHERE Status = 'Working'
//     `;

//     const result = await pool.request().query(query);
//     const resultCount = await pool.request().query(countQuery);

//     const totalCount = resultCount.recordset[0].TotalCount;
//     const totalPages = Math.ceil(totalCount/limit);


//     if (result.recordsets.length > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         statusValue: "SUCCESS",
//         message: "Employee list get successfully.",
//         data: result.recordset,
//         totalRecords: totalCount,
//         totalPages: totalPages,
//         currentPage: page,
//         limit: limit
//       });
//     } else {
//       return res.status(400).json({ 
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "No records found." 
//       });
//     }
//   } catch (err) {
//     console.error("Error fetching employees:", err.message);
//     res.status(500).send(err.message);
//   }
// };


//For PunchTime Details
// const getPunchTimeDetails = async (req, res) => {
//   try {
//     const pool = await connectToDB();
//     const result = await pool.request().query("SELECT * FROM PunchTimeDetails");
//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching PunchTimeDetails:", err.message);
//     res.status(500).send(err.message);
//   }
// };


// Get all records from AttendanceLogs
// const getAllAttendanceLogs = async (req, res) => {
//   try {
//     const pool = await connectToDB();
//     // Extract EmployeeId, page, and limit from query parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
    
//     const offset = (page - 1) * limit;
//     let query = `
//       SELECT 
//       Employees.EmployeeName, 
//       Employees.EmployeeCode, 
//       Employees.Gender, 
//       Employees.Designation, 
//       Employees.CategoryId,  
//       Employees.EmployementType,  
//       Employees.EmployeeDevicePassword, 
//       Employees.FatherName, 
//       Employees.MotherName, 
//       Employees.ResidentialAddress, 
//       Employees.PermanentAddress, 
//       Employees.ContactNo, 
//       Employees.Email, 
//       Employees.DOB, 
//       Employees.Location, 
//       Employees.WorkPlace, 
//       Employees.ExtensionNo, 
//       Employees.LoginName, 
//       Employees.LoginPassword, 
//       Employees.EmployeePhoto,
//       AttendanceLogs.*
//       FROM AttendanceLogs
//       LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//       WHERE AttendanceLogs.AttendanceDate <= GETDATE()
//       ORDER BY AttendanceLogs.AttendanceDate DESC -- Minimal ordering to support OFFSET-FETCH
//       OFFSET ${offset} ROWS
//       FETCH NEXT ${limit} ROWS ONLY
//     `;
//     const result = await pool.request().query(query);

//     if (result.recordsets.length > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         statusValue: "SUCCESS",
//         message: "Attendance records get successfully.",
//         data :result.recordsets[0]
//       });
//     } else {
//       return res.status(400).json({ 
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "No records found for the given EmployeeId." 
//       });
//     }
//   } catch (err) {
//     console.error('Error fetching attendance logs:', err.message);
//     res.status(500).send(err.message);
//   }
// };

//Get AttendanceLogsUpdateDetails

// const getAttendanceLogsUpdateDetails = async (req, res) => {
//   try {
//     const pool = await connectToDB();
//     const result = await pool
//       .request()
//       .query("SELECT * FROM AttendanceLogUpdateDetails");

//     // console.log("RESULT IS",result);
//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching attendance logs:", err.message);
//     res.status(500).send(err.message);
//   }
// };


// const getAllAttendanceLogs = async (req, res) => {
//   try {
//     const AttendanceLogModel = await AttendanceLogModel.find({})
//     const pool = await connectToDB();
//     // Extract query parameters
//     const dateTo = req.query.dateTo ? req.query.dateTo.toString() : null;
//     const dateFrom = req.query.dateFrom ? req.query.dateFrom.toString() : null;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Build base query
//     let query = `
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
//     `;

//     // Add optional date filters
//     if (dateFrom && dateTo) {
//       query += ` WHERE AttendanceLogs.AttendanceDate BETWEEN '${dateFrom}' AND '${dateTo}' `;
//     }

//      // Add pagination
//     query += `
//       ORDER BY AttendanceLogs.AttendanceDate DESC
//       OFFSET ${offset} ROWS
//       FETCH NEXT ${limit} ROWS ONLY
//     `;

//     // Get total count for metadata
//     const countQuery = `
//       SELECT COUNT(*) AS totalCount
//       FROM AttendanceLogs
//       ${dateFrom && dateTo ? `WHERE AttendanceLogs.AttendanceDate BETWEEN '${dateFrom}' AND '${dateTo}'` : ""}
//     `;

//     const [dataResult, countResult] = await Promise.all([
//       pool.request().query(query),
//       pool.request().query(countQuery)
//     ]);

//     const totalRecords = countResult.recordset[0].totalCount;
//     const totalPages = Math.ceil(totalRecords / limit);

//     if (dataResult.recordset.length > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         statusValue: "SUCCESS",
//         message: "Attendance records fetched successfully.",
//         data: dataResult.recordset,
//         totalRecords,
//         totalPages,
//         currentPage: page,
//         limit,
//       });
//     } else {
//       return res.status(400).json({
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "No records found for the given filters."
//       });
//     }
//   } catch (err) {
//     console.error("Error fetching attendance logs:", err.message);
//     res.status(500).json({
//       statusCode: 500,
//       statusValue: "ERROR",
//       message: "An error occurred while fetching attendance logs.",
//       error: err.message
//     });
//   }
// };

const getAllAttendanceLogs = async (req, res) => {
  try {
    // Extract query parameters
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the filter object for MongoDB query
    let filter = {};

    // Apply date range filter
    if (dateFrom && dateTo) {
      filter.AttendanceDate = {
        $gte: dateFrom,
        $lte: dateTo
      };
    }

    // MongoDB query to fetch attendance records with pagination and filters
    const dataResult = await AttendanceLogModel.find(filter)
      .skip(offset)
      .limit(limit)
      .sort({ AttendanceDate: -1 });

    // Remove duplicates based on AttendanceDate and EmployeeCode
    const uniqueRecords = dataResult.reduce((acc, record) => {
      const uniqueKey = `${record.AttendanceDate.toISOString()}_${record.EmployeeCode}`;
      if (!acc.seen.has(uniqueKey)) {
        acc.seen.add(uniqueKey);
        acc.filtered.push(record);
      }
      return acc;
    }, { seen: new Set(), filtered: [] }).filtered;  

    // get leave history
    const leaveData = await leaveTakenHistoryModel.find({status:"Approved"},{employeeId:1, leaveType:1, leaveStartDate:1, leaveEndDate:1})
    // console.log(11, leaveData)
    const finalResult = uniqueRecords.map(attendance => {
      const attendanceObj = attendance.toObject();
      const matchingLeave = leaveData.find(leave => {
        const leaveStart = new Date(leave.leaveStartDate);
        const leaveEnd = new Date(leave.leaveEndDate);
        return (
          leave.employeeId === attendanceObj.EmployeeCode &&
          attendanceObj.AttendanceDate >= leaveStart &&
          attendanceObj.AttendanceDate <= leaveEnd
        );
      });

      if (matchingLeave) {
        return {
          ...attendanceObj,
          isLeaveTaken:true,
          leaveType: matchingLeave.leaveType
        };
      }
      return {
        ...attendanceObj,
        isLeaveTaken: false,
        leaveType: ""
      };
    });
    
    // console.log(11, finalResult)
    // Get the total count of records for pagination metadata
    const totalRecords = await AttendanceLogModel.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    if (uniqueRecords.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "Attendance records fetched successfully.",
        data: finalResult,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      return res.status(400).json({
        statusCode: 400,
        statusValue: "FAIL",
        message: "No records found for the given filters."
      });
    }
  } catch (err) {
    console.error("Error fetching attendance logs:", err.message);
    res.status(500).json({
      statusCode: 500,
      statusValue: "ERROR",
      message: "An error occurred while fetching attendance logs.",
      error: err.message
    });
  }
};


const approvedPendingLeaves = async (req, res) => {
  try {
    // Get the current year and month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit format

    // Construct date range for the current month
    const monthStart = `${currentYear}-${currentMonth}-01`;
    const monthEnd = `${currentYear}-${currentMonth}-31`; // Covers all possible days

    // Fetch pending leave requests within the current month
    const pendingLeaves = await leaveTakenHistoryModel.find(
      {
        status: "Pending",
        leaveStartDate: { $gte: monthStart, $lte: monthEnd },
        leaveEndDate: { $gte: monthStart, $lte: monthEnd },
      },
      { employeeId: 1, leaveType: 1, totalDays: 1, leaveStartDate: 1, leaveEndDate: 1 }
    );

    if (!pendingLeaves.length) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "No pending leaves found for the current month.",
      });
    }

    let approvedLeaves = [];
    let insufficientBalanceLeaves = [];
    // Get the current time in IST
    
    const getIndiaCurrentDateTime = () => {
      const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const date = new Date(indiaTime);

      const pad = (n) => (n < 10 ? `0${n}` : n);

      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1); // Months are 0-based
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const dateTime = getIndiaCurrentDateTime()


    for (const leave of pendingLeaves) {
      const { employeeId, leaveType, totalDays } = leave;

      // Find the employee record
      const employee = await employeeModel.findOne({ employeeId });

      if (!employee) {
        console.log(`Employee ${employeeId} not found.`);
        continue;
      }

      // Get current leave balance for the leaveType
      let availableLeaveBal = parseFloat(employee.leaveBalance[leaveType] || "0");
      let deductedDays = parseFloat(totalDays);

      // Ensure the leave can be deducted
      if (availableLeaveBal >= deductedDays) {
        availableLeaveBal -= deductedDays;

        // Update the employee's leave balance
        await employeeModel.updateOne(
          { employeeId },
          { $set: { [`leaveBalance.${leaveType}`]: availableLeaveBal.toString() } }
        );

        // Approve the leave request
        await leaveTakenHistoryModel.updateOne(
          { _id: leave._id },
          { $set: { 
            status: "Approved",
            approvedDateTime: dateTime,
            remarks: "Action taken automatically at month end.", 
          } }
        );

        console.log(`Approved leave for Employee ${employeeId}, Deducted ${deductedDays} from ${leaveType}.`);
        approvedLeaves.push({
          employeeId,
          leaveType,
          totalDays,
          leaveStartDate: leave.leaveStartDate,
          leaveEndDate: leave.leaveEndDate,
          status: "Approved",
          approvedDateTime: dateTime,
          remarks: "Action taken automatically at month end."
        });
      } else {
        // console.log(`Insufficient ${leaveType} balance for Employee ${employeeId}. Required: ${deductedDays}, Available: ${availableLeaveBal}`);
        insufficientBalanceLeaves.push({
          employeeId,
          leaveType,
          totalDays,
          leaveStartDate: leave.leaveStartDate,
          leaveEndDate: leave.leaveEndDate,
          status: "Rejected",
          approvedDateTime: dateTime,
        });
      }
    }

    return res.status(200).json({
      statusCode: 200,
      statusValue: "SUCCESS",
      message: "Pending leaves processed for the current month.",
      approvedLeaves,
      insufficientBalanceLeaves,
    });
  } catch (err) {
    console.error("Error processing pending leaves:", err);
    res.status(500).json({
      statusCode: 500,
      statusValue: "ERROR",
      message: "An error occurred while processing pending leaves.",
      error: err.message,
    });
  }
};


const generateUninformedLeave = async (req, res) => {
  try {

    // Extract query parameters
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;

    // Build the filter object for MongoDB query
    let filter = {};

    // Apply date range filter
    if (dateFrom && dateTo) {
      filter.AttendanceDate = {
        $gte: dateFrom,
        $lte: dateTo
      };
    }
    // Fetch attendance records
    const dataResult = await AttendanceLogModel.find(filter, {
      AttendanceDate: 1, EmployeeCode: 1, Duration: 1, Status: 1, EmployeeId: 1
    });

    // Remove duplicate attendance records
    const uniqueRecords = dataResult.reduce((acc, record) => {
      const uniqueKey = `${record.AttendanceDate.toISOString()}_${record.EmployeeCode}`;
      if (!acc.seen.has(uniqueKey)) {
        acc.seen.add(uniqueKey);
        acc.filtered.push(record);
      }
      return acc;
    }, { seen: new Set(), filtered: [] }).filtered;

    if (uniqueRecords.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "No attendance records found in the given date range.",
        data: []
      });
    }

    // Fetch all employees to create employee-manager map
    const employeesData = await employeeModel.find({}, { employeeId: 1, managerId: 1, workingDays: 1 });

    // Create employee-manager map
    const employeeManagerMap = new Map();
    employeesData.forEach(emp => {
      employeeManagerMap.set(emp.employeeId.toString(), {
        managerId: emp.managerId,
        workingDays: emp.workingDays
      });
    });

    // Fetch leave history (Approved)
    const leaveData = await leaveTakenHistoryModel.find(
      {$or:[{status:"Pending"},{status:"Approved"}]},
      { employeeId: 1, leaveType: 1, leaveStartDate: 1, leaveEndDate: 1 }
    );

    // Filter records where leave does NOT match
    const notMatchingLeaves = uniqueRecords
      .filter(attendance => {
        return !leaveData.some(leave => {
          return (
            leave.employeeId.toString() === attendance.EmployeeCode &&
            attendance.AttendanceDate >= leave.leaveStartDate &&
            attendance.AttendanceDate <= leave.leaveEndDate
          );
        });
      })
      .map(attendance => {
        const employeeData = employeeManagerMap.get(attendance.EmployeeCode.toString()) || {};
        return {
          ...attendance.toObject(),
          managerId: employeeData.managerId || null,
          workingDays: employeeData.workingDays || null
        };
      });

    // Filter based on working hours and manager availability
    const filteredLeaves = notMatchingLeaves.filter(attendance =>
      attendance.Duration < 520 && attendance.managerId !== null
    );

    // Fetch holiday list
    const holidayList = await holidaysModel.find({}, { holidayDate: 1 });
    const holidayDates = new Set(holidayList.map(holiday => holiday.holidayDate));

    // Remove weekend and holiday attendance records
    const filteredData = filteredLeaves.filter(record => {
      const attendanceDate = new Date(record.AttendanceDate);
      const dayOfWeek = attendanceDate.getUTCDay();
      const formattedDate = attendanceDate.toISOString().split("T")[0];

      if (record.workingDays === "5" && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return false;
      }
      if (record.workingDays === "6" && dayOfWeek === 0) {
        return false;
      }
      if (holidayDates.has(formattedDate)) {
        return false;
      }

      return true;
    });

    const getIndiaCurrentDateTime = () => {
      const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const date = new Date(indiaTime);

      const pad = (n) => (n < 10 ? `0${n}` : n);

      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1); // Months are 0-based
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const dateTime = getIndiaCurrentDateTime()

    // Create uninformed leave records
    const leaveRecords = filteredData.map(attendance => {
      const attendanceDate = attendance.AttendanceDate.toISOString().split("T")[0];

      return {
        employeeId: attendance.EmployeeCode,
        leaveType: "uninformedLeave",
        leaveStartDate: attendanceDate,
        leaveEndDate: attendanceDate,
        totalDays: attendance.Duration < 270 ? "1" : attendance.Duration >= 270 && attendance.Duration < 520 ? "0.5" : "0",
        reason: "This is system-generated leave",
        approvedBy: attendance.managerId || "System",
        status: "Approved",
        dateTime: dateTime,
        approvedDateTime: dateTime
      };
    });

    // Insert into MongoDB
    if (leaveRecords.length > 0) {
      await leaveTakenHistoryModel.insertMany(leaveRecords);
    }
    
    const updatedLeaves = await leaveTakenHistoryModel.find(
      {},
      { employeeId: 1, leaveType: 1, leaveStartDate: 1, leaveEndDate: 1 }
    );
    
    const leaveMap = new Map();
    const uninformedLeaveMap = new Map();
    const leavesToDelete = [];
    
    // Step 1: Store other leave types in a Map
    updatedLeaves.forEach(leave => {
      const key = `${leave.employeeId}`;
    
      if (leave.leaveType !== "uninformedLeave") {
        if (!leaveMap.has(key)) leaveMap.set(key, []);
        leaveMap.get(key).push({
          startDate: new Date(leave.leaveStartDate),
          endDate: new Date(leave.leaveEndDate),
        });
      } else {
        // Collect uninformedLeave records separately
        if (!uninformedLeaveMap.has(key)) uninformedLeaveMap.set(key, []);
        uninformedLeaveMap.get(key).push({
          _id: leave._id,
          startDate: new Date(leave.leaveStartDate),
          endDate: new Date(leave.leaveEndDate),
        });
      }
    });
    
    // Step 2: Identify uninformedLeave records to delete
    uninformedLeaveMap.forEach((uninformedLeaves, employeeId) => {
      const existingLeaves = leaveMap.get(employeeId) || [];
    
      // Sort uninformedLeave records by date to handle duplicates
      uninformedLeaves.sort((a, b) => a.startDate - b.startDate);
    
      const keptUninformedLeaves = [];
    
      uninformedLeaves.forEach(leave => {
        const startDate = leave.startDate;
        const endDate = leave.endDate;
    
        // Check if this uninformedLeave overlaps with an existing leave
        const hasOverlap = existingLeaves.some(el => startDate >= el.startDate && endDate <= el.endDate);
    
        if (hasOverlap || keptUninformedLeaves.some(existing => existing.startDate.getTime() === startDate.getTime())) {
          // If it overlaps with another leave or is a duplicate uninformedLeave, mark for deletion
          leavesToDelete.push(leave._id);
        } else {
          // Otherwise, keep it as a valid uninformedLeave record
          keptUninformedLeaves.push(leave);
        }
      });
    });
    
    // Step 3: Delete the identified uninformedLeave records
    if (leavesToDelete.length > 0) {
      await leaveTakenHistoryModel.deleteMany({ _id: { $in: leavesToDelete } });
      console.log(`Deleted ${leavesToDelete.length} uninformedLeave records.`);
    } else {
      console.log("No uninformedLeave records to delete.");
    }
    

    return res.status(200).json({
      statusCode: 200,
      statusValue: "SUCCESS",
      message: "Attendance records processed successfully.",
      // data: leaveRecords,
      // data2: updatedLeaves
    });
  } catch (err) {
    console.error("Error fetching attendance logs:", err);
    res.status(500).json({
      statusCode: 500,
      statusValue: "ERROR",
      message: "An error occurred while processing attendance logs.",
      error: err.message
    });
  }
};



const getAttendanceLogsTodays = async (req, res) => {
  try {
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // Format as yyyy-mm-dd

    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date(formattedCurrentDate);
    // MongoDB query to fetch attendance records
    const dataResult = await AttendanceLogModel.find({Status:"Present ", AttendanceDate:dateTo},{C1:0, C2:0, C3:0, C4:0, C5:0, C6:0, C7:0, CategoryId:0, LeaveRemarks:0, LeaveType:0, LeaveTypeId:0, Location:0, LoginName:0,	LoginPassword:0,
      OverTime:0,	OverTimeE:0,	P1Status:0,	P2Status:0,	P3Status:0, ExtensionNo:0	
    })

    // Remove duplicates based on AttendanceDate and EmployeeCode
    const uniqueRecords = dataResult.reduce((acc, record) => {
      const uniqueKey = `${record.AttendanceDate.toISOString()}_${record.EmployeeCode}`;
      if (!acc.seen.has(uniqueKey)) {
        acc.seen.add(uniqueKey);
        acc.filtered.push(record);
      }
      return acc;
    }, { seen: new Set(), filtered: [] }).filtered;  

    // get leave history
    const leaveData = await leaveTakenHistoryModel.find({status:"Approved"},{employeeId:1, leaveType:1, leaveStartDate:1, leaveEndDate:1})
    // console.log(11, leaveData)
    const finalResult = uniqueRecords.map(attendance => {
      const attendanceObj = attendance.toObject();
      const matchingLeave = leaveData.find(leave => {
        const leaveStart = new Date(leave.leaveStartDate);
        const leaveEnd = new Date(leave.leaveEndDate);
        return (
          leave.employeeId === attendanceObj.EmployeeCode &&
          attendanceObj.AttendanceDate >= leaveStart &&
          attendanceObj.AttendanceDate <= leaveEnd
        );
      });

      if (matchingLeave) {
        return {
          ...attendanceObj,
          isLeaveTaken:true,
          leaveType: matchingLeave.leaveType
        };
      }
      return {
        ...attendanceObj,
        isLeaveTaken: false,
        leaveType: ""
      };
    });
    
    // count total employee Rec
    const employeeCount = await employeeModel.countDocuments({});
    if (uniqueRecords.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "Attendance records fetched successfully.",
        totalPresent: finalResult.length,
        totalEmployees:employeeCount,
        empAttendanceLogs: finalResult
      });
    } else {
      return res.status(400).json({
        statusCode: 400,
        statusValue: "FAIL",
        message: "No records found for the given filters."
      });
    }
  } catch (err) {
    console.error("Error fetching attendance logs:", err.message);
    res.status(500).json({
      statusCode: 500,
      statusValue: "ERROR",
      message: "An error occurred while fetching attendance logs.",
      error: err.message
    });
  }
};


// const getAttendanceLogsByEmployeeId = async (req, res) => {
//   try {
//     const pool = await connectToDB();

//     // Extract query parameters
//     const employeeId = req.params.employeeId;
//     const dateTo = req.query.dateTo ? req.query.dateTo.toString() : null;
//     const dateFrom = req.query.dateFrom ? req.query.dateFrom.toString() : null;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const offset = (page - 1) * limit;

//     // Validate employeeId
//     if (!employeeId) {
//       return res.status(400).json({
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "EmployeeId is required to fetch attendance logs.",
//       });
//     }

//     // Build base query
//     let query = `
//     SELECT 
//         Employees.EmployeeName, 
//         Employees.EmployeeCode, 
//         Employees.Gender, 
//         Employees.Designation, 
//         Employees.CategoryId,  
//         Employees.EmployementType,  
//         Employees.EmployeeDevicePassword, 
//         Employees.FatherName, 
//         Employees.MotherName, 
//         Employees.ResidentialAddress, 
//         Employees.PermanentAddress, 
//         Employees.ContactNo, 
//         Employees.Email, 
//         Employees.DOB, 
//         Employees.Location, 
//         Employees.WorkPlace, 
//         Employees.ExtensionNo, 
//         Employees.LoginName, 
//         Employees.LoginPassword, 
//         Employees.EmployeePhoto,
//         AttendanceLogs.*
//         FROM AttendanceLogs
//         LEFT JOIN Employees 
//           ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//         WHERE 
//           (Employees.EmployeeId = '${employeeId}' OR Employees.EmployeeCode = '${employeeId}')
//       `;

//     // Add optional date filters
//     if (dateFrom && dateTo) {
//       query += ` AND AttendanceLogs.AttendanceDate BETWEEN '${dateFrom}' AND '${dateTo}' `;
//     }

//     // Add pagination
//     query += `
//       ORDER BY AttendanceLogs.AttendanceDate DESC
//       OFFSET ${offset} ROWS
//       FETCH NEXT ${limit} ROWS ONLY
//     `;

//     // Get total count for metadata
//     const countQuery = `
//       SELECT COUNT(*) AS totalCount
//       FROM AttendanceLogs
//       LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//       WHERE (Employees.EmployeeId = '${employeeId}' OR Employees.EmployeeCode = '${employeeId}')
//       ${dateFrom && dateTo ? `AND AttendanceLogs.AttendanceDate BETWEEN '${dateFrom}' AND '${dateTo}'` : ""}
//     `;

//     const [dataResult, countResult] = await Promise.all([
//       pool.request().query(query),
//       pool.request().query(countQuery),
//     ]);

//     const totalRecords = countResult.recordset[0].totalCount;
//     const totalPages = Math.ceil(totalRecords / limit);

//     if (dataResult.recordset.length > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         statusValue: "SUCCESS",
//         message: "Attendance records fetched successfully.",
//         data: dataResult.recordset,
//         totalRecords,
//         totalPages,
//         currentPage: page,
//         limit,
//       });
//     } else {
//       return res.status(404).json({
//         statusCode: 404,
//         statusValue: "FAIL",
//         message: "No records found for the given employee or filters.",
//       });
//     }
//   } catch (err) {
//     console.error("Error fetching attendance logs:", err.message);
//     res.status(500).json({
//       statusCode: 500,
//       statusValue: "ERROR",
//       message: "An error occurred while fetching attendance logs.",
//       error: err.message,
//     });
//   }
// };

// const getAttendanceLogsByEmployeeId = async (req, res) => {
//   try {
//     const pool = await connectToDB();

//     // Extract query parameters
//     const employeeId = req.params.employeeId;
//     const dateTo = req.query.dateTo
//       ? new Date(req.query.dateTo).toISOString().split("T")[0]
//       : new Date().toISOString().split("T")[0]; // Default to current date if dateTo is not provided
//     const dateFrom = req.query.dateFrom
//       ? new Date(req.query.dateFrom).toISOString().split("T")[0]
//       : null; // No default for dateFrom
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const offset = (page - 1) * limit;

//     // Validate employeeId
//     if (!employeeId) {
//       return res.status(400).json({
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "EmployeeId is required to fetch attendance logs.",
//       });
//     }

//     // Ensure dateTo does not exceed the current date
//     const currentDate = new Date().toISOString().split("T")[0];
//     if (dateTo > currentDate) {
//       return res.status(400).json({
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "dateTo cannot be greater than the current date.",
//       });
//     }

//     // Build base query
//     let query = `
//     SELECT 
//         Employees.EmployeeName, 
//         Employees.EmployeeCode, 
//         Employees.Gender, 
//         Employees.Designation, 
//         Employees.CategoryId,  
//         Employees.EmployementType,  
//         Employees.EmployeeDevicePassword, 
//         Employees.FatherName, 
//         Employees.MotherName, 
//         Employees.ResidentialAddress, 
//         Employees.PermanentAddress, 
//         Employees.ContactNo, 
//         Employees.Email, 
//         Employees.DOB, 
//         Employees.Location, 
//         Employees.WorkPlace, 
//         Employees.ExtensionNo, 
//         Employees.LoginName, 
//         Employees.LoginPassword, 
//         Employees.EmployeePhoto,
//         AttendanceLogs.*
//         FROM AttendanceLogs
//         LEFT JOIN Employees 
//           ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//         WHERE 
//           (Employees.EmployeeId = '${employeeId}' OR Employees.EmployeeCode = '${employeeId}')
//           AND AttendanceLogs.AttendanceDate <= '${dateTo}'
//       `;

//     // Add optional dateFrom filter
//     if (dateFrom) {
//       query += ` AND AttendanceLogs.AttendanceDate >= '${dateFrom}' `;
//     }

//     // Add pagination
//     query += `
//       ORDER BY AttendanceLogs.AttendanceDate DESC
//       OFFSET ${offset} ROWS
//       FETCH NEXT ${limit} ROWS ONLY
//     `;

//     // Get total count for metadata
//     const countQuery = `
//       SELECT COUNT(*) AS totalCount
//       FROM AttendanceLogs
//       LEFT JOIN Employees ON AttendanceLogs.EmployeeId = Employees.EmployeeId
//       WHERE (Employees.EmployeeId = '${employeeId}' OR Employees.EmployeeCode = '${employeeId}')
//       AND AttendanceLogs.AttendanceDate <= '${dateTo}'
//       ${dateFrom ? `AND AttendanceLogs.AttendanceDate >= '${dateFrom}'` : ""}
//     `;

//     const [dataResult, countResult] = await Promise.all([
//       pool.request().query(query),
//       pool.request().query(countQuery),
//     ]);

//     const totalRecords = countResult.recordset[0].totalCount;
//     const totalPages = Math.ceil(totalRecords / limit);

//     if (dataResult.recordset.length > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         statusValue: "SUCCESS",
//         message: "Attendance records fetched successfully.",
//         data: dataResult.recordset,
//         totalRecords,
//         totalPages,
//         currentPage: page,
//         limit,
//       });
//     } else {
//       return res.status(404).json({
//         statusCode: 404,
//         statusValue: "FAIL",
//         message: "No records found for the given employee or filters.",
//       });
//     }
//   } catch (err) {
//     console.error("Error fetching attendance logs:", err.message);
//     res.status(500).json({
//       statusCode: 500,
//       statusValue: "ERROR",
//       message: "An error occurred while fetching attendance logs.",
//       error: err.message,
//     });
//   }
// };

const getAttendanceLogsByEmployeeId = async (req, res) => {
  try {
    // Extract query parameters
    let employeeId = req.params.employeeId.toString();
    // check user exists or not
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date(); // Default to current date if dateTo is not provided
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null; // No default for dateFrom
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
   
    // Validate employeeId
    if (!employeeId) {
      return res.status(400).json({
        statusCode: 400,
        statusValue: "FAIL",
        message: "EmployeeId is required to fetch attendance logs.",
      });
    }

    // Ensure dateTo does not exceed the current date
    const currentDate = new Date();
    if (dateTo > currentDate) {
      return res.status(400).json({
        statusCode: 400,
        statusValue: "FAIL",
        message: "dateTo cannot be greater than the current date.",
      });
    }

    // check user exists or not
    // const getEmp = await employeeModel.find({employeeId:req.query.employeeId})
    // console.log(11, getEmp)

    // Build the filter object for MongoDB query
    let filter = {
      $or: [
        { EmployeeId: employeeId },
        { EmployeeCode: employeeId }
      ],
      AttendanceDate: { $lte: dateTo }
    };

    // Apply optional dateFrom filter
    if (dateFrom) {
      filter.AttendanceDate.$gte = dateFrom;
    }

    // MongoDB query to fetch attendance records with pagination and filters
    const dataResult = await AttendanceLogModel.find(filter)
      .skip(offset)
      .limit(limit)
      .sort({ AttendanceDate: -1 });
      // Remove duplicates based on AttendanceDate and EmployeeCode
    const uniqueRecords = dataResult.reduce((acc, record) => {
        const uniqueKey = `${record.AttendanceDate.toISOString()}_${record.EmployeeCode}`;
        if (!acc.seen.has(uniqueKey)) {
          acc.seen.add(uniqueKey);
          acc.filtered.push(record);
        }
        return acc;
    }, { seen: new Set(), filtered: [] }).filtered;  

    // get leave history
    const leaveData = await leaveTakenHistoryModel.find({employeeId:employeeId, status:"Approved"},{employeeId:1, leaveType:1, leaveStartDate:1, leaveEndDate:1})
    // console.log(11, leaveData)
    const finalResult = uniqueRecords.map(attendance => {
      const attendanceObj = attendance.toObject();
      const matchingLeave = leaveData.find(leave => {
        const leaveStart = new Date(leave.leaveStartDate);
        const leaveEnd = new Date(leave.leaveEndDate);
        return (
          leave.employeeId === attendanceObj.EmployeeCode &&
          attendanceObj.AttendanceDate >= leaveStart &&
          attendanceObj.AttendanceDate <= leaveEnd
        );
      });

      if (matchingLeave) {
        return {
          ...attendanceObj,
          isLeaveTaken:true,
          leaveType: matchingLeave.leaveType
        };
      }
      return {
        ...attendanceObj,
        isLeaveTaken: false,
        leaveType: ""
      };
    });
    // console.log(11, finalResult)
    // Get the total count of records for pagination metadata
    const totalRecords = await AttendanceLogModel.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    if (uniqueRecords.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "Attendance records fetched successfully.",
        data: finalResult,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      return res.status(404).json({
        statusCode: 404,
        statusValue: "FAIL",
        message: "No records found for the given employee or filters.",
      });
    }
  } catch (err) {
    console.error("Error fetching attendance logs:", err.message);
    res.status(500).json({
      statusCode: 500,
      statusValue: "ERROR",
      message: "An error occurred while fetching attendance logs.",
      error: err.message,
    });
  }
};


const getAttendanceDaysByMonth = async (req, res) => {
  try {
    let employeeId = req.params.employeeId;
    // Define the mapping
    const employeeIdMapping = {
        "2716": "CON004",
        "2751": "CON020",
        "2564": "CON006",
        "2717": "CON005"
    };

    // Check if employeeId exists in the mapping and override it
    if (employeeIdMapping[employeeId]) {
        employeeId = employeeIdMapping[employeeId];
    }
    
    const yearMonth = req.query.yearMonth;
    const startOfMonth = new Date(`${yearMonth}-01T00:00:00.000Z`); 
    const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1)); 

    const aggResult = await AttendanceLogModel.aggregate([
      {
        $match: {
          EmployeeCode: employeeId,
          AttendanceDate: {
            $gte: startOfMonth,
            $lt: endOfMonth, 
          },
        },
      },
      {
        $lookup: {
          from:"employees",
          localField: "EmployeeCode",
          foreignField: "employeeId",
          as : "employeeInfo"
        }
      },
      {
        $addFields: {
          shiftTime: { $arrayElemAt: ["$employeeInfo.shiftTime", 0] },
        }
      },
      {
        $project: {
          "EmployeeCode": 1,
          "Duration": 1,
          "AttendanceDate": 1,
          "Status": 1,
          "shiftTime": 1,
          "InTime": 1,
          "OutTime": 1,
          // "EmployeeId":1
        },
      },
    ]);

    const convertDuration = (durationInMinutes) => {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    
    const getAttendanceStatus = (durationInMinutes) => {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      const timeInMinutes = hours * 60 + minutes;
    
      if (timeInMinutes >= 520) { 
        return "Full Day";
      } else if (timeInMinutes >= 270) { 
        return "Half Day";
      } else {
        return "Absent";
      }
    };
    
    const updatedData = aggResult.map(entry => {
      const durationInHHMM = convertDuration(entry.Duration);
      const attendanceStatus = getAttendanceStatus(entry.Duration); 
    
      return {
        ...entry,
        // Status: attendanceStatus,
        Duration: durationInHHMM,
        AttendanceStatus: attendanceStatus
      };
    });
    
    const uniqueData = Object.values(
      updatedData.reduce((acc, entry) => {
        if (!acc[entry.AttendanceDate]) {
          acc[entry.AttendanceDate] = entry; 
        }
        return acc;
      }, {})
    );
    // get data from leav history
    const leaveData = await leaveTakenHistoryModel.find({status:"Approved"},{employeeId:1, leaveType:1, leaveStartDate:1, leaveEndDate:1});
    
    const finalResult = uniqueData.map(attendance => {
      const matchingLeave = leaveData.find(leave => {
        const leaveStart = new Date(leave.leaveStartDate);
        const leaveEnd = new Date(leave.leaveEndDate);
        return (
          leave.employeeId === attendance.EmployeeCode &&
          attendance.AttendanceDate >= leaveStart &&
          attendance.AttendanceDate <= leaveEnd
        );
      });

      if (matchingLeave) {
        return {
          ...attendance,
          isLeaveTaken:true,
          leaveType: matchingLeave.leaveType
        };
      }
      return {
        ...attendance,
        isLeaveTaken: false,
        leaveType: ""
      };
    });
    
    const holidaysData = await holidaysModel.find({},{holidayName:1, holidayDate:1});
    
    // Convert holiday dates to Date objects for comparison
    const holidaysMap = holidaysData.reduce((map, holiday) => {
      map[new Date(holiday.holidayDate).toISOString().split('T')[0]] = holiday.holidayName;
      return map;
    }, {});

    // Add isHoliday and holidayName to finalResult
    finalResult.forEach(record => {
      const attendanceDateKey = record.AttendanceDate.toISOString().split('T')[0];
      if (holidaysMap[attendanceDateKey]) {
        record.AttendanceStatus = holidaysMap[attendanceDateKey];
        // record.holidayName = holidaysMap[attendanceDateKey];
      } else {
        record.AttendanceStatus = record.AttendanceStatus 
      }
    });

    const formattedResult = finalResult.map(item => {
      const date = new Date(item.AttendanceDate);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
      return { ...item, AttendanceDate: formattedDate };
    });

    if (aggResult.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "Attendance records fetched successfully.",
        data: formattedResult.reverse()
      });
    } else {
      return res.status(404).json({  
        statusCode: 404,
        statusValue: "FAIL",
        message: "No records found for the given employee or filters.",
      });
    }

  } catch (err) {
    console.error("Error fetching attendance logs:", err.message);
    res.status(500).json({
      statusCode: 500,
      statusValue: "ERROR",
      message: "An error occurred while fetching attendance logs.",
      error: err.message,
    });
  }
}


const removeDuplicateAttendance = async (req, res) => {
  try {
    if (!req.query) {
      const currentDate = new Date();
      const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

      const startOfMonth = new Date(`${yearMonth}-01T00:00:00.000Z`);
      const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1));

      // const yearMonth = req.query.yearMonth; // e.g., '2025-01'
      // const startOfMonth = new Date(`${yearMonth}-01T00:00:00.000Z`);
      // const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1));

      const aggResult = await AttendanceLogModel.aggregate([
        {
          $match: {
            AttendanceDate: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
          },
        },
        {
          $group: {
            _id: { EmployeeCode: "$EmployeeCode", AttendanceDate: "$AttendanceDate" },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        {
          $match: { count: { $gt: 1 } },
        },
      ]);
      // console.log(11, aggResult)

      
      for (const record of aggResult) {
        
        const [firstId, ...duplicateIds] = record.ids;

        await AttendanceLogModel.deleteMany({
          _id: { $in: duplicateIds },
        });
      }
      console.log("Duplicate attendance records removed successfully")
    } else if(req.query.yearMonth) {
      const yearMonth = req.query.yearMonth; // e.g., '2025-01'
      const startOfMonth = new Date(`${yearMonth}-01T00:00:00.000Z`);
      const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1));

      const aggResult = await AttendanceLogModel.aggregate([
        {
          $match: {
            AttendanceDate: {   
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
          },
        },
        {
          $group: {
            _id: { EmployeeId: "$EmployeeId", AttendanceDate: "$AttendanceDate" },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        {
          $match: { count: { $gt: 1 } },
        },
      ]);
      // console.log(11, aggResult)

      
      for (const record of aggResult) {
        
        const [firstId, ...duplicateIds] = record.ids;

        await AttendanceLogModel.deleteMany({
          _id: { $in: duplicateIds },
        });
      }
      res.status(200).json({
        message:"Duplicate attendance records removed successfully"
      })
    }
  } catch (err) {
    console.log("Error while removing duplicate records:", err);
    res.status(500).send({
      message: "Failed to remove duplicate records",
    });
  }
};

const startRemoveAttendanceDuplicateRecords = () => {
  cron.schedule("0 0 1 * *", async () => {
    console.log("Running cron job: calculating duplicate attendance records attendance logs...");
    await removeDuplicateAttendance();
  });
};


// const updateEmployeeDetailsByEmployeeId = async (req, res) => {
//   try {
//     const { employeeId, newPassword } = req.body;

//     if(!employeeId || !newPassword) {
//       return res.status(400).json({
//         statusCode: 400,
//         statusValue: "FAIL",
//         message: "EmployeeId and newPassword are required.",
//       });
//     }

//     const pool = await connectToDB();

//     // Update query
//     const query = `
//     UPDATE Employees
//     SET LoginPassword = @newPassword
//     WHERE EmployeeId = @employeeId;
//     `;
//     // Execute query
    
//     const result = await pool.request()
//     .input('newPassword', newPassword)
//     .input('employeeId', employeeId)
//     .query(query)

//     if(result.rowsAffected[0] > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         statusValue: "SUCCESS",
//         message: "LoginPassword updated successfully.",
//       });
//     } else {
//       return res.status(404).json({
//         statusCode: 404,
//         statusValue: "FAIL",
//         message: "EmployeeId not found.",
//       });
//     }
//   } catch (err) {
//     console.error("Error updating LoginPassword:", err.message);
//     return res.status(500).json({
//       statusCode: 500,
//       statusValue: "ERROR",
//       message: "An error occurred while updating the LoginPassword.",
//       error: err.message,
//     });
//   }
// }

// const getHolidayList = async (req, res) => {
//   try {
//     const pool = await connectToDB();
//     const result = await pool.request().query(`SELECT * FROM Holidays ORDER BY HolidayId ASC`);
//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching tables:", err.message);
//     res.status(500).send(err.message);
//   }
// };



const removeDuplicateLogs = async (req, res) => {
  try {
    const dataResult = await AttendanceLogModel.find({})
    
  } catch (err) {

  }
};


const createAttendanceLogForOutDuty = async (req, res) => {
  try {
      const { employeeId, location } = req.body;

      // Validate required fields
      if (!employeeId) {
          return res.status(400).json({
              message: "employeeId is required",
              statusCode: 400,
              statusValue: "error"
          });
      }
      
      // Get current date & time in India Standard Time (IST)
      const now = moment().tz("Asia/Kolkata");

      // Store AttendanceDate as YYYY-MM-DDT00:00:00.000Z (IST start of the day)
      const AttendanceDate = now.startOf("day").toDate();

      // Correctly format checkIn as "YYYY-MM-DD HH:mm:ss" in IST
      const formattedCheckIn = now.format("YYYY-MM-DD HH:mm:ss");

      // Format PunchRecords as "HH:mm:in(IN),"
      const PunchRecords = `${now.format("HH:mm")}:in(IN),`;

      // Check if the employee has already logged attendance for today
      const existingLog = await attendanceLogModelForOutDuty.findOne({
          employeeId,
          AttendanceDate: {
              $gte: AttendanceDate, // Start of the day
              $lt: moment(AttendanceDate).add(1, "day").toDate() // Next day's start (exclusive)
          }
      });

      if (existingLog) {
          return res.status(400).json({
              statusCode: 400,
              statusValue: "FAIL",
              message: "Attendance log already exists for today"
          });
      }

      // Create a new attendance log
      const newLog = new attendanceLogModelForOutDuty({
          employeeId,
          AttendanceDate, // Stores only the date (00:00:00 IST)
          location,
          InTime: formattedCheckIn,
          PunchRecords,
          OutTime: "NA",
          imageUrl: "NA",
          createdAt: now.toDate(),
          updatedAt: now.toDate()
      });

      // Save to database
      await newLog.save();

      return res.status(201).json({
          message: "Attendance log created successfully",
          statusCode: 201,
          statusValue: "success",
          data: newLog
      });
  } catch (error) {
      console.error("Error creating attendance log:", error);
      return res.status(500).json({
          message: "Internal Server Error",
          statusCode: 500,
          statusValue: "error"
      });
  }
};


const getAttendanceLogForOutDutyById = async (req, res) => {
  try {
      const { employeeId } = req.params;

      // Validate required fields
      if (!employeeId) {
          return res.status(400).json({
              message: "employeeId is required",
              statusCode: 400,
              statusValue: "error"
          });
      }
      
      // Get current date & time in India Standard Time (IST)
      const now = moment().tz("Asia/Kolkata");

      // Store AttendanceDate as YYYY-MM-DDT00:00:00.000Z (IST start of the day)
      const AttendanceDate = now.startOf("day").toDate();

      // Check if the employee has already logged attendance for today
      const dataRecords = await attendanceLogModelForOutDuty.findOne({
          employeeId,
          AttendanceDate: {
              $gte: AttendanceDate, // Start of the day
              $lt: moment(AttendanceDate).add(1, "day").toDate() // Next day's start (exclusive)
          }
      });

      return res.status(201).json({
          message: "Attendance log created successfully",
          statusCode: 201,
          statusValue: "success",
          data: dataRecords
      });
  } catch (error) {
      console.error("Error creating attendance log:", error);
      return res.status(500).json({
          message: "Internal Server Error",
          statusCode: 500,
          statusValue: "error"
      });
  }
};



module.exports = {
  createAttendanceLogForOutDuty,
  getAttendanceLogForOutDutyById,
  getAllAttendanceLogs,
  getAttendanceLogsByEmployeeId,
  removeDuplicateLogs,
  getAttendanceDaysByMonth,
  removeDuplicateAttendance,
  startRemoveAttendanceDuplicateRecords,
  getAttendanceLogsTodays,
  generateUninformedLeave,
  approvedPendingLeaves
};
