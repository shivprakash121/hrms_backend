const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');
const leaveController = require("../controllers/leaveController");

// Leave routes
router.post('/apply-leave/:employeeId', leaveController.applyLeave);
router.put('/action-for-leave-application/:id', authMiddleware, leaveController.actionForLeavApplication);

router.delete('/delete-leave-application/:id', leaveController.deleteLeavApplication);

router.get('/get-employee-leave/:employeeId', leaveController.getLeavesTakenByEmpId);
router.get('/get-all-leaves', authMiddleware, leaveController.getAllLeaves);

router.get('/get-all-pending-leaves', authMiddleware, leaveController.getAllPendingLeaves);

// for apply regularization
router.post('/apply-for-regularization/:employeeId', authMiddleware, leaveController.applyForRegularization);

// req for compoff
router.post('/generate-compoff/:employeeId', leaveController.requestCompOff);
router.get('/get-all-pending-compoff', authMiddleware, leaveController.getAllPendingCompoff);
router.put('/action-for-compoff-request/:id', leaveController.actionCompOff);

// accept or reject 
router.put('/action-for-regularization/:id', leaveController.actionForRegularization);


module.exports = router;