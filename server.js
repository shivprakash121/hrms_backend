const express = require("express")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const connectToMongoDB = require("./config/mongoConfig"); 
// const {connectToDB} = require("./config/dbConfig");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors")
const cron = require('node-cron');
// const {startAttendanceCronJob, startUpdateAttendanceCronJob} = require("./utils/attendanceCronJob.js");
const {startRemoveAttendanceDuplicateRecords} = require("./controllers/mainController.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
connectToMongoDB();  // for mongo conn
// connectToDB();  // for sql conn  

const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const commonRoutes = require("./routes/commonRoutes");
const indexRoutes = require("./routes/index");


const logRequestDetails = (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next(); // Pass control to the next middleware/handler
};

app.use(morgan("combined"));
// Middleware to log request details
app.use(logRequestDetails);
// Use the main route file


app.use('/api', mainRoutes);
app.use('/api/employee', authRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/common', commonRoutes)
app.use('/api/s3', indexRoutes);

// cron job
const employeeModel = require("./models/employeeModel");
const CompOff = require("./models/compOffHistoryModel.js");     
const moment = require("moment");
const AttendanceLogModel = require("./models/attendanceLogModel.js");

// cron job for dump sql data into mongodb
// startAttendanceCronJob()
// startUpdateAttendanceCronJob();
startRemoveAttendanceDuplicateRecords();

// Cron job for automatic approved compOff request
// Schedule the cron job to run every day at midnight
cron.schedule("0 0 * * *", async () => {
    try {
        // Get today's date minus 3 days, formatted as YYYY-MM-DD
        const threeDaysAgo = moment().subtract(3, "days").format("YYYY-MM-DD");

        // Find all comp-off requests with compOffDate older than or equal to 3 days ago and still pending
        const compOffRequests = await CompOff.find({
            compOffDate: { $lte: threeDaysAgo },
            status: "Pending"
        });

        for (const compOff of compOffRequests) {
            // Approve the comp-off request
            const updatedCompOff = await CompOff.findByIdAndUpdate(
                compOff._id,
                {
                    status: "Approved",
                    approvedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
                    comments: "Action taken automatically after 3 days"
                },
                { new: true }
            );

            // Update the employee's leave balance
            await Employee.updateOne(
                { employeeId: compOff.employeeId },
                {
                    $set: {
                        "leaveBalance.earnedLeave": {
                            $toString: {
                                $add: [
                                    { $toInt: "$leaveBalance.earnedLeave" },
                                    parseInt(compOff.totalDays, 10)
                                ]
                            }
                        }
                    }
                }
            );

            console.log(`CompOff request approved for employee ID: ${compOff.employeeId}`);
        }

        console.log("Cron job completed successfully.");
    } catch (error) {
        console.error("Error during cron job execution:", error);
    }
});

// Cron job for getting 1 maxShortLeave and 2 maxRegularization 
// Schedule a cron job to run at midnight on the first day of every month
cron.schedule('0 0 1 * *', async () => {
    console.log('Running cron job to reset maxRegularization and maxShortLeave...');

    try {
        // Update all employees' casualLeave to 1
        const result = await employeeModel.updateMany(
            {},
            { $set: { 
                'maxShortLeave': '1',
                'maxRegularization': '2'
            } }
        );

        console.log(`Successfully updated maxRegularization and maxShortLeave for ${result.nModified} employees.`);
    } catch (error) {
        console.error('Error updating maxRegularization and maxShortLeave:', error);
    }
});

// Cron job for auto credited medicalLeave in jan by 6
// Cron job for January 1st at midnight
cron.schedule('0 0 1 1 *', async () => {
    console.log('Running cron job to reset medicalLeave to 6 on January 1st...');

    try {
        // Update all employees' medicalLeave to 6
        const result = await employeeModel.updateMany(
            {},
            { $set: { 'leaveBalance.medicalLeave': '6' } }
        );

        console.log(`Successfully updated medicalLeave to 6 for ${result.nModified} employees.`);
    } catch (error) {
        console.error('Error updating medicalLeave on January 1st:', error);
    }
});

// Cron job for auto credited medicalLeave in july by 6
// Cron job for July 1st at midnight
cron.schedule('0 0 1 7 *', async () => {
    console.log('Running cron job to reset medicalLeave to 6 on July 1st...');

    try {
        // Update all employees' medicalLeave to 6
        const result = await employeeModel.updateMany(
            {},
            { $set: { 'leaveBalance.medicalLeave': '6' } }
        );

        console.log(`Successfully updated medicalLeave to 6 for ${result.nModified} employees.`);
    } catch (error) {
        console.error('Error updating medicalLeave on July 1st:', error);
    }
});

// Cron job for auto incremented earnedLeave quaterly by 4
cron.schedule('30 0 1 1,4,7,10 *', async () => {
    console.log('Running cron job to credit 4 earned leaves...');

    try {
        await employeeModel.updateMany(
            { 'leaveBalance.earnedLeave': { $exists: false } },
            { $set: { 'leaveBalance.earnedLeave': '0' } } // Initialize as string
        );

        // Increment earnedLeave and ensure it is stored as a string
        const result = await employeeModel.updateMany(
            {},
            [
                {
                    $set: {
                        'leaveBalance.earnedLeave': {
                            $toString: {
                                $add: [
                                    { $toInt: '$leaveBalance.earnedLeave' },  
                                    4
                                ]
                            }
                        }
                    }
                }
            ]
        );  

        console.log(`Successfully credited 4 earned leaves for ${result.modifiedCount} employees.`);
    } catch (error) {
        console.error('Error crediting earned leaves:', error);
    }
});

// Cron job for auto incremented casualLeave quaterly by 2
cron.schedule('30 0 1 1,4,7,10 *', async () => {
    console.log('Running cron job to credit 2 casual leaves...');

    try {
        await employeeModel.updateMany(
            { 'leaveBalance.casualLeave': { $exists: false } },
            { $set: { 'leaveBalance.casualLeave': '0' } } // Initialize as string
        );

        // Increment earnedLeave and ensure it is stored as a string
        const result = await employeeModel.updateMany(
            {},
            { $set: { 'leaveBalance.casualLeave': '2' } }    
        );  

        console.log(`Successfully credited 2 casual leaves for ${result.modifiedCount} employees.`);
    } catch (error) {
        console.error('Error crediting casual leaves:', error);
    }
});

const runJob = async (req, res) => {
    try {
        const yearMonth = "2025-01";
        const startOfMonth = new Date(`${yearMonth}-01T00:00:00.000Z`);
        const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1));

        const aggResult = await AttendanceLogModel.aggregate([
            {
                $match: {
                    EmployeeCode: "415",
                    AttendanceDate: {
                        $gte: startOfMonth,
                        $lt: endOfMonth,
                    },
                },
            },
            {
                $project: {
                    EmployeeCode: 1,
                    Duration: 1,
                    AttendanceDate: 1,
                    Status: 1
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
        // console.log('check data', uniqueData)
    } catch (error) {
        console.log("catch error");
    }
}

// runJob();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
