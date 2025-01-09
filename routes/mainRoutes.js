const express = require('express');
const { 
    getAllAttendanceLogs,    
    getAttendanceLogsByEmployeeId,
    getAttendanceDaysByMonth,
    removeDuplicateAttendance 
} = require('../controllers/mainController');

const router = express.Router();

// Route to fetch all tables
// router.get('/tables', getTables);  // temp-used
// router.get('/attendanceLogUpdateDetails',getAttendanceLogsUpdateDetails); // un-used

// Route to fetch attendance logs
router.get('/attendance-logs', getAllAttendanceLogs); // used
router.get('/attendance-logs/:employeeId', getAttendanceLogsByEmployeeId); // used
router.get('/attendance-days-by-month/:employeeId', getAttendanceDaysByMonth); // used
router.get('/remove-duplicate-attendance-logs-by-month', removeDuplicateAttendance);


// router.get('/holidays-list', getHolidayList);




// router.get('/punchTime',getPunchTimeDetails);  // temp-used

// Employee routes
// router.get('/employees',getEmployees);  // used
// router.put('/update-employee-details', updateEmployeeDetailsByEmployeeId); // used

module.exports = router;
