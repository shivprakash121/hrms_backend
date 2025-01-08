const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');


// Employee routes
router.post('/register', authController.registerEmployee);    
router.post('/login', authController.employeeLogin);
router.post('/logout', authMiddleware, authController.logout);

router.post('/reset-password', authController.resetForgetPassword);  // reset password step 1
router.post("/verify-otp", authController.verifyOtp);  // reset password step 2
router.put("/generate-newpassword", authController.generateNewPassword);  // reset password step final   


router.put('/update/:employeeId', authController.updateEmployeeById);  
router.get('/get-all', authController.getAllEmployeeList);
router.get('/get-emp-list-by-manager', authMiddleware, authController.getEmployeeListByManagerId); 
router.get('/get-employee-details/:employeeId', authController.getEmpDetailsById);
router.delete('/delete-employee/:employeeId', authController.deleteEmpById);
router.delete('/delete-employee/:employeeId', authController.deleteEmpById);   

// get employee list on today
router.get('/get-today-onleave-emp-list', authController.getTodayOnleaveList);






// holidays route
// router.post('/', authMiddleware, authController.logout);





module.exports = router;