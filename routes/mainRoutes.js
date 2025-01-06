const express = require('express');
const { 
    getTables, 
    getAllAttendanceLogs, 
    getAttendancePaginatedLogs, 
    getAllAttendanceLogsSQL,
    getEmployees, 
    getPunchTimeDetails, 
    getAttendanceLogsUpdateDetails, 
    getAttendanceLogsByEmployeeId,
    updateEmployeeDetailsByEmployeeId,
    getHolidayList 
} = require('../controllers/mainController');

const router = express.Router();

// Route to fetch all tables
router.get('/tables', getTables);  // temp-used
router.get('/attendanceLogUpdateDetails',getAttendanceLogsUpdateDetails); // un-used

// Route to fetch attendance logs
router.get('/attendance-logs-v2', getAllAttendanceLogsSQL); // used for sql
router.get('/attendance-logs', getAllAttendanceLogs);
router.get('/attendance-logs/:employeeId', getAttendanceLogsByEmployeeId); // used

router.get('/holidays-list', getHolidayList);




router.get('/punchTime',getPunchTimeDetails);  // temp-used

// Employee routes
router.get('/employees',getEmployees);  // used
router.put('/update-employee-details', updateEmployeeDetailsByEmployeeId); // used

module.exports = router;
