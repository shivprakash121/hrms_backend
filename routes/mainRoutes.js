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
    getHolidayList ,
    updateAttendanceLogByEmployeeCodeAndDate
} = require('../controllers/mainController');

const attendanceCronJob = require("../utils/attendanceCronJob")
const router = express.Router();

// Route to fetch all tables
router.get('/tables', getTables);  // temp-used
router.get('/attendanceLogUpdateDetails',getAttendanceLogsUpdateDetails); // un-used

// Route to fetch attendance logs
router.get('/attendance-logs-v2', getAllAttendanceLogsSQL); // used for sql
router.get('/attendance-logs', getAllAttendanceLogs);
router.get('/attendance-logs/:employeeId', getAttendanceLogsByEmployeeId); // used

router.post('/calculate-attendance-logs', attendanceCronJob.fetchAndSyncAttendanceLogsLast5days);



router.get('/holidays-list', getHolidayList);




router.get('/punchTime',getPunchTimeDetails);  // temp-used

// Employee routes
router.get('/employees',getEmployees);  // used
router.put('/update-employee-details', updateEmployeeDetailsByEmployeeId); // used
router.put('/update-employee-details-v2', updateAttendanceLogByEmployeeCodeAndDate); 


module.exports = router;
