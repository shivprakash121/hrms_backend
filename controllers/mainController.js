// const { connectToDB } = require("../config/dbConfig");
const AttendanceLogModel = require("../models/attendanceLogModel");

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

    // Get the total count of records for pagination metadata
    const totalRecords = await AttendanceLogModel.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    if (uniqueRecords.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "Attendance records fetched successfully.",
        data: dataResult,
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
    const employeeId = req.params.employeeId;
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

    // Get the total count of records for pagination metadata
    const totalRecords = await AttendanceLogModel.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    if (uniqueRecords.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        statusValue: "SUCCESS",
        message: "Attendance records fetched successfully.",
        data: uniqueRecords,
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


module.exports = {
  getAllAttendanceLogs,
  getAttendanceLogsByEmployeeId,
  removeDuplicateLogs
};
