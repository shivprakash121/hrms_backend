const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');


// Employee routes
router.post('/register', authController.registerEmployee);
router.post('/login', authController.employeeLogin);
router.post('/logout', authMiddleware, authController.logout);


router.put('/update/:employeeId', authController.updateEmployeeById);
router.get('/get-all', authController.getAllEmployeeList); 
router.get('/get-employee-details/:employeeId', authController.getEmpDetailsById);
router.delete('/delete-employee/:employeeId', authController.deleteEmpById);





module.exports = router;