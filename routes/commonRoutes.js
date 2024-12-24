const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');
const commonController = require("../controllers/commonController");

// holiday route
router.post('/add-holiday', commonController.addNewHoliday);
router.get('/get-holiday-list', commonController.getHolidayList);
router.put('/update-holiday/:holiday_id', commonController.updateHoliday);
router.delete('/delete-holiday/:holiday_id', commonController.deleteHoliday);


module.exports = router;