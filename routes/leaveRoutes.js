const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');
const leaveController = require("../controllers/leaveController");

// Leave routes
router.post('/apply-leave/:employeeId', leaveController.applyLeave);
router.get('/get-employee-leave/:employeeId', leaveController.getLeavesTakenByEmpId);
router.get('/get-all-leaves', leaveController.getAllLeaves);
router.put('/update-leave-status/:id', leaveController.applyLeave);





module.exports = router;