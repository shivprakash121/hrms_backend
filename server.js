const express = require("express")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const connectToMongoDB = require("./config/mongoConfig");
// const {connectToDB} = require("./config/dbConfig");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
// for swagger
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config();
const cors = require("cors")
const cron = require('node-cron');
const fs = require("fs");
const path = require("path");
// const {startAttendanceCronJob, startUpdateAttendanceCronJob} = require("./utils/attendanceCronJob.js");
const { startRemoveAttendanceDuplicateRecords } = require("./controllers/mainController.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

connectToMongoDB();  // for mongo conn
// connectToDB();  // for sql conn  


// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "HRMS API's",
            version: "1.0.0",
            description: "API documentation for managing projects, tasks, and employee data",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Local Development Server",
            },
            {
                url: `http://172.23.100.211:${PORT}`,
                description: "Production Server",
            },
        ],
    },
    apis: ["./routes/*.js"], // Ensure all your route files have Swagger annotations
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// end swagger 

// Route
const mainRoutes = require('./routes/mainRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const leaveRoutes = require('./routes/leaveRoutes.js');
const commonRoutes = require("./routes/commonRoutes.js");
const indexRoutes = require("./routes/index.js");
const taskRoutes = require("./routes/taskRoutes.js");


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
app.use('/api/common', commonRoutes);
app.use('/api/s3', indexRoutes);
app.use('/api/task', taskRoutes);

// cron job
const employeeModel = require("./models/employeeModel");
const CompOff = require("./models/compOffHistoryModel.js");
const moment = require("moment");
const AttendanceLogModel = require("./models/attendanceLogModel.js");
const leaveTakenHistoryModel = require("./models/leaveTakenHistoryModel.js");
const AttendanceLogForOutDuty = require("./models/attendanceLogModelForOutDuty.js");
const holidaysModel = require("./models/holidayModel.js");

// Backup dir
const BACKUP_DIR = path.join(__dirname, "db_backup");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Function to back up a collection in JSON format
const backupCollectionToJson = async (Model, fileName) => {
    try {
        const data = await Model.find().lean();
        if (data.length === 0) {
            console.log(`No data to back up for ${fileName}`);
            return;
        }

        const backupFilePath = path.join(BACKUP_DIR, `${fileName}_${moment().format("YYYY-MM-DD")}.json`);
        fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));

        console.log(`Backup successful: ${backupFilePath}`);
    } catch (error) {
        console.error(`Error backing up ${fileName}:`, error);
    }
}


// Function to delete backups older than 7 days
const deleteOldBackups = () => {
    const files = fs.readdirSync(BACKUP_DIR);

    files.forEach(file => {
        // Extract date from filename (assuming format: "fileName_YYYY-MM-DD.json")
        const match = file.match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
            const fileDate = moment(match[0], "YYYY-MM-DD");
            const sevenDaysAgo = moment().subtract(10, "days");

            if (fileDate.isBefore(sevenDaysAgo)) {
                const filePath = path.join(BACKUP_DIR, file);
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${filePath}`);
            }
        }
    });
};


// Schedule the backup cron job (Runs daily at midnight)
cron.schedule("50 17 * * *", async () => {
    console.log("Starting daily backup...");

    await backupCollectionToJson(employeeModel, "employeeModel_backup");
    await backupCollectionToJson(CompOff, "compOffHistoryModel_backup");
    await backupCollectionToJson(AttendanceLogModel, "attendanceLogModel_backup");
    await backupCollectionToJson(leaveTakenHistoryModel, "leaveTakenHistoryModel_backup");

    console.log("Daily JSON backup completed.");

    // Run cleanup after backup
    deleteOldBackups();
});

const backupAllCollections = async () => {
    console.log("Starting daily backup..."); 

    await backupCollectionToJson(employeeModel, "employeeModel_backup");
    await backupCollectionToJson(CompOff, "compOffHistoryModel_backup");
    await backupCollectionToJson(AttendanceLogModel, "attendanceLogModel_backup");
    await backupCollectionToJson(leaveTakenHistoryModel, "leaveTakenHistoryModel_backup");

    console.log("Daily JSON backup completed.");

    // Run cleanup after backup
    deleteOldBackups();
};

// Call this function whenever you want to backup
// backupAllCollections();


const filePatterns = [
    "employeeModel_backup_",
    "compOffHistoryModel_backup_",
    "leaveTakenHistoryModel_backup_"
];
const backupDir = path.join(__dirname, "db_backup");

// GET API to fetch JSON data by date
app.get("/api/get-json", (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({
            message: "Date query parameter is required (yyyy-mm-dd)",
            statusCode: 400,
            statusValue: "error"
        });
    }

    let results = [];
    let errors = [];

    // Read all matching files
    filePatterns.forEach((pattern) => {
        const jsonFilePath = path.join(backupDir, `${pattern}${date}.json`);

        if (fs.existsSync(jsonFilePath)) {
            try {
                const data = fs.readFileSync(jsonFilePath, "utf8");
                results.push({
                    filename: path.basename(jsonFilePath),
                    data: JSON.parse(data)
                });
            } catch (err) {
                errors.push({
                    filename: path.basename(jsonFilePath),
                    error: err.message
                });
            }
        } else {
            errors.push({
                filename: `${pattern}${date}.json`,
                error: "File not found"
            });
        }
    });

    res.status(200).json({
        message: "JSON data fetched successfully",
        statusCode: 200,
        statusValue: "success",
        data: results,
        errors: errors.length > 0 ? errors : undefined
    });
});



// startUpdateAttendanceCronJob();
startRemoveAttendanceDuplicateRecords();

// Cron job for automatic approved regularization request
// Schedule the cron job to run every day at midnight
// cron.schedule("0 0 * * *", async () => {
//     try {
//         // Get today's date minus 3 days, formatted as YYYY-MM-DD
//         const threeDaysAgo = moment().subtract(3, "days").format("YYYY-MM-DD");

//         // Find all comp-off requests with compOffDate older than or equal to 3 days ago and still pending
//         const compOffRequests = await CompOff.find({
//             compOffDate: { $lte: threeDaysAgo },
//             status: "Pending"
//         });

//         for (const compOff of compOffRequests) {
//             // Approve the comp-off request
//             const updatedCompOff = await CompOff.findByIdAndUpdate(
//                 compOff._id,
//                 {
//                     status: "Approved",
//                     approvedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
//                     comments: "Action taken automatically after 3 days"
//                 },
//                 { new: true }
//             );

//             // Update the employee's leave balance
//             await Employee.updateOne(
//                 { employeeId: compOff.employeeId },
//                 {
//                     $set: {
//                         "leaveBalance.earnedLeave": {
//                             $toString: {
//                                 $add: [
//                                     { $toInt: "$leaveBalance.earnedLeave" },
//                                     parseInt(compOff.totalDays, 10)
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             );

//             console.log(`CompOff request approved for employee ID: ${compOff.employeeId}`);
//         }

//         console.log("Cron job completed successfully.");
//     } catch (error) {
//         console.error("Error during cron job execution:", error);
//     }
// });


// run cron job daily at mid night 12:30 for auto regularization
cron.schedule("30 0 * * *", async () => {
    try {
        const threeDaysAgo = moment().subtract(3, "days").format("YYYY-MM-DD");
        console.log("running job")
        // Find all regularization requests older than or equal to 3 days ago and still pending
        const regularizationRequests = await leaveTakenHistoryModel.find({
            leaveStartDate: { $lte: threeDaysAgo },
            leaveType: "regularized",
            status: "Pending",
        });

        for (const regReq of regularizationRequests) {
            // Approve the regularization request
            const updatedReq = await leaveTakenHistoryModel.findByIdAndUpdate(
                regReq._id,
                {
                    status: "Approved",
                    approvedDateTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                    remarks: "Action taken automatically after 3 days",
                },
                { new: true }
            );

            // Update the employee's leave balance only if maxRegularization is less than or equal to 2
            const employee = await employeeModel.findOne({ employeeId: regReq.employeeId });

            if (employee && parseInt(employee.maxRegularization) <= 2) {
                await employeeModel.updateOne(
                    { employeeId: regReq.employeeId },
                    {
                        $set: {
                            maxRegularization: (
                                parseInt(employee.maxRegularization) - 1
                            ).toString(),
                        },
                    }
                );
            }

            console.log(
                `Regularization request approved for employee ID: ${regReq.employeeId}`
            );
        }

        console.log("Cron job completed successfully.");
    } catch (error) {
        console.error("Error during cron job execution:", error);
    }
});

// run cron job daily at mid night 12:35 for auto approved shortLeave req
cron.schedule("35 0 * * *", async () => {
    try {
        console.log("Running auto-approval cron job...");

        // Get the date 3 days ago as an ISO string
        const threeDaysAgo = moment().subtract(3, "days").startOf("day").toISOString();

        // Approve all pending short leave requests older than 3 days
        const updatedRequests = await leaveTakenHistoryModel.updateMany(
            {
                leaveStartDate: { $lte: threeDaysAgo },
                leaveType: "shortLeave",
                status: "Pending",
            },
            {
                $set: {
                    status: "Approved",
                    approvedDateTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                    remarks: "Action taken automatically after 3 days",
                },
            }
        );

        console.log(`Total short leave requests approved: ${updatedRequests.modifiedCount}`);

        // Reduce maxShortLeave for employees whose request was approved
        if (updatedRequests.modifiedCount > 0) {
            const employeesToUpdate = await leaveTakenHistoryModel.distinct("employeeId", {
                leaveStartDate: { $lte: threeDaysAgo },
                leaveType: "shortLeave",
                status: "Approved",
            });

            await employeeModel.updateMany(
                { employeeId: { $in: employeesToUpdate }, maxShortLeave: "1" },
                { $set: { maxShortLeave: "0" } }
            );

            console.log(`Updated maxShortLeave for employees: ${employeesToUpdate.length}`);
        }

        console.log("Cron job completed successfully.");
    } catch (error) {
        console.error("Error during cron job execution:", error);
    }
});



// Cron job for getting 1 maxShortLeave and 2 maxRegularization 
// Schedule a cron job to run at midnight on the first day of every month
cron.schedule('40 0 1 * *', async () => {
    console.log('Running cron job to reset maxRegularization and maxShortLeave...');

    try {
        const result = await employeeModel.updateMany(
            {},
            {
                $set: {
                    'maxShortLeave': '1',
                    'maxRegularization': '2'
                }
            }
        );

        console.log(`Successfully updated maxRegularization and maxShortLeave for ${result.modifiedCount} employees.`);
    } catch (error) {
        console.error('Error updating maxRegularization and maxShortLeave:', error);
    }
});

// Cron job for auto credited medicalLeave in jan by 6
// Cron job for January 1st at midnight
// cron.schedule('0 0 1 1 *', async () => {
//     console.log('Running cron job to reset medicalLeave to 6 on January 1st...');

//     try {
//         // Update all employees' medicalLeave to 6
//         const result = await employeeModel.updateMany(
//             {},
//             { $set: { 'leaveBalance.medicalLeave': '6' } }
//         );

//         console.log(`Successfully updated medicalLeave to 6 for ${result.nModified} employees.`);
//     } catch (error) {
//         console.error('Error updating medicalLeave on January 1st:', error);
//     }
// });

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

// GET API to reset medical leave
app.get('/api/reset-medical-leaves', async (req, res) => {
    console.log('Running function to reset medicalLeave to 6 on July 1st...');

    try {
        // Update all employees' medicalLeave to 6
        const result = await employeeModel.updateMany(
            {},
            { $set: { 'leaveBalance.medicalLeave': '6' } }
        );

        console.log(`Successfully updated medicalLeave to 6 for ${result.modifiedCount} employees.`);
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: `Successfully updated medicalLeave to 6 for ${result.modifiedCount} employees.`,
            data: { modifiedCount: result.modifiedCount }
        });

    } catch (error) {
        console.error('Error updating medicalLeave on July 1st:', error);
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message
        });
    }
});


// GET API to credit earned leaves
// Cron job for auto incremented earnedLeave quaterly by 4
// cron.schedule('30 0 1 1,4,7,10 *', async () => {
//     console.log('Running cron job to credit 4 earned leaves...');

//     try {
//         await employeeModel.updateMany(
//             { 'leaveBalance.earnedLeave': { $exists: false } },
//             { $set: { 'leaveBalance.earnedLeave': '0' } } // Initialize as string
//         );

//         // Increment earnedLeave and ensure it is stored as a string
//         const result = await employeeModel.updateMany(
//             {},
//             [
//                 {
//                     $set: {
//                         'leaveBalance.earnedLeave': {
//                             $toString: {
//                                 $add: [
//                                     { $toInt: '$leaveBalance.earnedLeave' },
//                                     4
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             ]
//         );

//         console.log(`Successfully credited 4 earned leaves for ${result.modifiedCount} employees.`);
//     } catch (error) {
//         console.error('Error crediting earned leaves:', error);
//     }
// });



// Cron job for auto incremented casualLeave quaterly by 2
// cron.schedule('30 0 1 1,4,7,10 *', async () => {
//     console.log('Running cron job to credit 2 casual leaves...');

//     try {
//         await employeeModel.updateMany(
//             { 'leaveBalance.casualLeave': { $exists: false } },
//             { $set: { 'leaveBalance.casualLeave': '0' } } // Initialize as string
//         );

//         // Increment earnedLeave and ensure it is stored as a string
//         const result = await employeeModel.updateMany(
//             {},
//             { $set: { 'leaveBalance.casualLeave': '2' } }
//         );

//         console.log(`Successfully credited 2 casual leaves for ${result.modifiedCount} employees.`);
//     } catch (error) {
//         console.error('Error crediting casual leaves:', error);
//     }
// });        


// GET API to trigger casual leave crediting
// GET API to credit earned leaves
app.post('/api/credit-earned-leaves', async (req, res) => {
    console.log('Running function to credit 4 earned leaves...');

    try {
        // Initialize leave balance if not set
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
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: `Successfully credited 4 earned leaves for ${result.modifiedCount} employees.`,
            data: { modifiedCount: result.modifiedCount }
        });

    } catch (error) {
        console.error('Error crediting earned leaves:', error);
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message
        });
    }
});


app.post('/api/credit-casual-leaves', async (req, res) => {
    console.log('Running function to credit 2 casual leaves...');

    try {
        // Initialize leave balance if not set
        await employeeModel.updateMany(
            { 'leaveBalance.casualLeave': { $exists: false } },
            { $set: { 'leaveBalance.casualLeave': '0' } } // Initialize as string
        );

        // Update casual leave balance
        const result = await employeeModel.updateMany(
            {},
            { $set: { 'leaveBalance.casualLeave': '2' } }
        );

        console.log(`Successfully credited 2 casual leaves for employees.`);
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: `Successfully credited 2 casual leaves for employees.`,
            // data: { modifiedCount: result.modifiedCount }
        });

    } catch (error) {
        console.error('Error crediting casual leaves:', error);
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message
        });
    }
});



// Cron Job: Runs every 30 minutes to remove duplicate records from leave history
cron.schedule("*/45 * * * *", async () => {
    console.log("Running duplicate removal job for leave history...");

    try {
        const duplicates = await leaveTakenHistoryModel.aggregate([
            {
                $group: {
                    _id: {
                        employeeId: "$employeeId",
                        leaveStartDate: "$leaveStartDate",
                        leaveEndDate: "$leaveEndDate"
                    },
                    ids: { $push: "$_id" },
                    count: { $sum: 1 } 
                }
            },
            {
                $match: {
                    count: { $gt: 1 } 
                }
            }
        ]);

        // Extract IDs to delete (keeping the first occurrence)
        const idsToDelete = duplicates.flatMap(doc => doc.ids.slice(1));

        if (idsToDelete.length > 0) {
            await leaveTakenHistoryModel.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${idsToDelete.length} duplicate records.`);
        } else {
            console.log("No duplicates found.");
        }
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});

cron.schedule("*/10 * * * *", async () => {
    console.log("Running EmployeeCode update job...");

    try {
        const updateOperations = [
            { EmployeeId: 2564, EmployeeCode: "2564" },
            { EmployeeId: 2751, EmployeeCode: "2751" },
            { EmployeeId: 2717, EmployeeCode: "2717" },
            { EmployeeId: 2716, EmployeeCode: "2716" }
        ];

        await AttendanceLogModel.updateMany({EmployeeId:2564},{$set:{EmployeeCode:"2564"}})
        await AttendanceLogModel.updateMany({EmployeeId:2751},{$set:{EmployeeCode:"2751"}})
        await AttendanceLogModel.updateMany({EmployeeId:2717},{$set:{EmployeeCode:"2717"}})
        await AttendanceLogModel.updateMany({EmployeeId:2716},{$set:{EmployeeCode:"2716"}})

    } catch (error) {
        console.error("Error in EmployeeCode update job:", error);
    }
});

// const updateHolidayStatus = async () => {
//     try {
//       const holidayList = await holidaysModel.find({}, { holidayDate: 1 });
  
//       const holidayDates = holidayList.map((holiday) => 
//         new Date(`${holiday.holidayDate}T00:00:00.000Z`) 
//       );

//       const attendanceUpdate = await AttendanceLogModel.updateMany(
//         { 
//           AttendanceDate: { $in: holidayDates },
//           $or: [{ PunchRecords: null }, { PunchRecords: "" }]
//         },
//         { $set: { Status: "Holiday", Holiday: 1, StatusCode:"H" } }
//       );
  
//       console.log(`${attendanceUpdate.modifiedCount} records updated.`);
//     } catch (error) {
//       console.error("Error updating holiday status in AttendanceLogModel:", error);
//     }
// };
  
// updateHolidayStatus();

// For update attendance log for holiday status

cron.schedule("*/50 * * * *", async () => {
    console.log("Running Holiday Status update job...");

    try {
        const holidayList = await holidaysModel.find({}, { holidayDate: 1 });
    
        const holidayDates = holidayList.map((holiday) => 
          new Date(`${holiday.holidayDate}T00:00:00.000Z`) 
        );
  
        const attendanceUpdate = await AttendanceLogModel.updateMany(
          { 
            AttendanceDate: { $in: holidayDates },
            $or: [{ PunchRecords: null }, { PunchRecords: "" }]
          },
          { $set: { Status: "Holiday", Holiday: 1, StatusCode:"H" } }
        );
    
        console.log(`${attendanceUpdate.modifiedCount} records updated.`);
    } catch (error) {
        console.error("Error updating holiday status in AttendanceLogModel:", error);
    }
});



const mergeAttendance = async (req, res) => {
    try {
        const moment2 = require("moment-timezone");
        // Get IST start and end times for the last 3 days
        const todayIST = moment2().tz("Asia/Kolkata").startOf("day");
        const todayStartUTC = todayIST.clone().subtract(5, "hours").subtract(30, "minutes").toDate();
        const todayEndUTC = moment2().tz("Asia/Kolkata").endOf("day").subtract(5, "hours").subtract(30, "minutes").toDate();

        const yesterdayIST = todayIST.clone().subtract(2, "day");
        const yesterdayStartUTC = yesterdayIST.clone().subtract(5, "hours").subtract(30, "minutes").toDate();
        const yesterdayEndUTC = yesterdayIST.clone().endOf("day").subtract(5, "hours").subtract(30, "minutes").toDate();

        const twoDaysAgoIST = todayIST.clone().subtract(3, "day");
        const twoDaysAgoStartUTC = twoDaysAgoIST.clone().subtract(5, "hours").subtract(30, "minutes").toDate();
        const twoDaysAgoEndUTC = twoDaysAgoIST.clone().endOf("day").subtract(5, "hours").subtract(30, "minutes").toDate();

        // Fetch punch-in attendance logs
        const punchInAttendanceLogs = await AttendanceLogForOutDuty.find({
            AttendanceDate: { $gte: twoDaysAgoStartUTC, $lt: todayEndUTC }
        }, { employeeId: 1, AttendanceDate: 1, InTime: 1, OutTime: 1 });
        
        // Fetch attendance logs
        const attendanceLogs = await AttendanceLogModel.find({
            AttendanceDate: { $gte: twoDaysAgoStartUTC, $lt: todayEndUTC }
        }, { EmployeeCode: 1, AttendanceDate: 1, Status: 1, InTime: 1, OutTime: 1, PunchRecords: 1 });
        
        function getCommonAttendanceLogs(attendanceLogs, punchInAttendanceLogs) {
            return attendanceLogs
                .map(attendance => attendance.toJSON ? attendance.toJSON() : attendance) // Convert Mongoose documents to plain objects
                .filter(attendance => 
                    punchInAttendanceLogs.some(punch => 
                        punch.employeeId === attendance.EmployeeCode && 
                        new Date(punch.InTime).toISOString().split('T')[0] === new Date(attendance.AttendanceDate).toISOString().split('T')[0]
                    )
                )
                .map(attendance => {
                    const matches = punchInAttendanceLogs.filter(punch => 
                        punch.employeeId === attendance.EmployeeCode && 
                        new Date(punch.InTime).toISOString().split('T')[0] === new Date(attendance.AttendanceDate).toISOString().split('T')[0]
                    );
                    
                    const inTimes = [attendance.InTime, ...matches.map(m => m.InTime)].filter(time => time && time !== "1900-01-01 00:00:00");
                    const outTimes = [attendance.OutTime, ...matches.map(m => m.OutTime)].filter(Boolean);
                    const punchRecords = [...attendance.PunchRecords || [], ...matches.map(m => `${m.InTime}:in(IN),${m.OutTime}:out(OUT)`)];
                    
                    return {
                        _id: attendance._id,
                        InTime: inTimes.length ? inTimes.sort()[0] : null, // Get the earliest InTime
                        OutTime: outTimes.length ? outTimes.sort().reverse()[0] : null, // Get the latest OutTime
                        Status: "Present", // Set status to 'Present' if a match is found
                        PunchRecords: punchRecords.join(',')
                    };
                });
        }
        
        const commonAttendanceLogs = getCommonAttendanceLogs(attendanceLogs, punchInAttendanceLogs);
        
        for (const log of commonAttendanceLogs) {
            await AttendanceLogModel.updateOne(
                { _id: log._id }, 
                { $set: { InTime: log.InTime, OutTime: log.OutTime, Status: log.Status, PunchRecords: log.PunchRecords } }
            );
        }

        console.log("Attendance logs updated successfully");
    } catch (error) {
        console.error("Error in attendance update job:", error);
    }
}

// mergeAttendance();


// // create has map
// function groupedAnagrams(arr) {
//    if (arr.length < 1) return "array data is required"; 
//    let anagramMap = new Map();

//    for (let word of arr) {
//       let sortedWord = word.split("").sort().join("");

//       if(!anagramMap.has(sortedWord)) {
//         anagramMap.set(sortedWord, []);  // key => value   emptyarray
//       }
//       anagramMap.get(sortedWord).push(word);
//    }

//    return Array.from(anagramMap.values());
// }

// console.log(groupedAnagrams(["eat","tea","tan","ant"]))

// function quickSort(arr) {
//     if (arr.length <= 1) return arr;

//     let pivotIndex = Math.floor(arr.length/2);
//     let pivot = arr[pivotIndex];

//     let left = [];
//     let right = [];
//     let mid = [];

//     for(let i = 0; i < arr.length; i++) {
//         if (arr[i] < pivot) {
//             left.push(arr[i])
//         } else if (arr[i] > pivot) {
//             right.push(arr[i])
//         } else {
//             mid.push(arr[i])
//         }
//     }
//     return [...quickSort(left), ...mid, ...quickSort(right)]
// }

// console.log(quickSort([1,4,2,7,3,9,5,33]))

// function findMaxKthItem(arr, k) {
//    if (arr.length < 1) return "empty array";
//    arr.sort((a,b) => b-a);
//    return arr[k-1];
// }

// console.log(findMaxKthItem([1,33,55,22,11,4,66], 2))


// function mergeTwoSortedArr(arr1, arr2) {
//     let i = 0;
//     let j = 0;
//     let result = [];

//     while(i < arr1.length && j < arr2.length) {
//         if(arr1[i] < arr2[j]) {
//             result.push(arr1[i]);
//             i++;
//         } else {
//             result.push(arr2[j]);
//             j++;
//         }
//     }

//     while(i < arr1.length) {
//         result.push(arr1[i++]);
//     }
//     while(j < arr2.length) {
//         result.push(arr2[j++]);
//     }
//     return result;
// }

// console.log(mergeTwoSortedArr([1,3,5,7,9],[2,4,6,8]))


// function removeDuplicateObj(arr, key) {
//     let map = new Map();

//     for (let obj of arr) {
//         map.set(obj[key], obj)  // obj[key] is a value on obj key and obj treated as value
//     }
//     return Array.from(map.values());
// }

// const data = [
//     { id:1, name: "shiv" },
//     { id:2, name: "rohan" },
//     { id:2, name: "rohan" }
// ]

// console.log(removeDuplicateObj(data, "id"));


// function removeDuplicateObj(arr, key) {
//     let set = new Set();

//     return arr.filter(obj => {
//         if(set.has(obj[key])) return false;
//         set.add(obj[key]);
//         return true;
//     })
// }

// const data = [
//     { id:1, name: "shiv" },
//     { id:2, name: "rohan" },
//     { id:2, name: "rohan" }
// ]
// console.log(removeDuplicateObj(data, "id"));

// function countOccurencesOfWords(str) {
//     let words = str.toLowerCase().replace(/[^a-zA-Z0-9]/g, " ").split(" ");
//     let map = new Map();

//     for (let word of words) {
//         if(word) {
//             map.set(word, (map.get(word) || 0) + 1);
//         }
//     }

//     return Object.fromEntries(map);
// }

// console.log(countOccurencesOfWords("hello howare ypou? hello"))

// // using reduce method
// function countOccurencesOfWords(str) {
//     let words = str.toLowerCase().replace(/[^a-zA-Z0-9]/g, " ").split(" ");

//     return words.reduce((acc, word) => {
//        if(word) acc[word] = (acc[word] || 0) + 1;
//        return acc;
//     }, {})
// }

// console.log(countOccurencesOfWords("hello how are you? hello"))

// function deepClone(obj) {
//     return structuredClone(obj);
// }

// const originalObj = {a:1, b:{c:3}};
// const clonedObj = deepClone(originalObj);
// clonedObj.b.c = 44;
// console.log(clonedObj)
// console.log(originalObj)


// function objToArray(obj) {
//     return Object.entries(obj);
// }
// const obj = {name:"Shiv", age: 28, address: "Noida sector 71"};
// console.log(objToArray(obj))

// function objToArray(obj) {
//     let result = [];

//     for (let key in obj) {
//         if (obj.hasOwnProperty(key)) {
//             result.push([key, obj[key]]);
//         }
//     }
//     return result;
// }

// const obj = {name:"Shiv", age: 28, address: "Noida sector 71"};
// console.log(objToArray(obj))


// function longestWord(sentence) {
//     let strToArray = sentence.split(" ");

//     return strToArray.reduce((acc, curr) =>  curr.length > acc.length ? curr: acc, "");
// }

// console.log(longestWord("Hello how are you doing?"))

// function findMostFrequentElem(arr) {
//     let freqMap = new Map();
//     let maxCount = 0;
//     let mostFreqElem = null;

//     for (let element of arr) {
//         freqMap.set(element, (freqMap.get(element) || 0) + 1);
//         if(freqMap.get(element) > maxCount) {
//             maxCount = freqMap.get(element);
//             mostFreqElem = element;
//         }
//     }
//     return mostFreqElem;
// }

// console.log(findMostFrequentElem([1,2,3,4,5,6,3,1,2,4,5,6,3,2]));

// time complexity : O(n), space compl : O(n)

// function findMostFrequentElem(arr) {
//     let freq = arr.reduce((acc, curr) => {
//         acc[curr] = (acc[curr] || 0) + 1;
//         return acc;
//     }, {});

//     return Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a: b))
// }

// console.log(findMostFrequentElem([1,2,3,4,5,6,3,1,2,4,5,6,3,2]));


// function findMedian(arr) {
//     arr.sort((a,b) => a-b);
//     let n = arr.length;
//     let mid = Math.floor(n/2);

//     return n % 2 !== 0 ? arr[mid] : (arr[mid] + arr[mid-1])/2;
// } 

// console.log(findMedian([1,2,3,4,5,6,3,1,2,4,5,6,3,2]))

// check two object are deep equal or not

// function deepEqual(obj1, obj2) {
//     if (obj1 === obj2) return true;

//     if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) {
//         return false;
//     }

//     let keys1 = Object.keys(obj1);
//     let keys2 = Object.keys(obj2);

//     if (keys1.length !== keys2.length) return false;

//     for (let key of keys1) {
//         if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
//             return false;
//         }
//     }
//     return true;
// }

// const obj1 = {a:1,b:2,c:{d:4}}
// const obj2 = {a:1,b:2,c:{d:4}}

// console.log(deepEqual(obj1, obj2))



// function deepEqual(obj1, obj2) {
//     return JSON.stringify(obj1) === JSON.stringify(obj2);
// }

// const obj1 = {a:1,b:2,c:{d:4}}
// const obj2 = {a:1,b:2,c:{d:44}}

// console.log(deepEqual(obj1, obj2))


// function findLongestSubsequenceOfArray(arr) {
//    let n = arr.length;
//    if (n < 1) return 0;

//    let dp = new Array(n).fill(1)
//    for (let i = 1; i < n; i++) {
//     for (let j = 0; j < i; j++) {
//         if (arr[i] > arr[j]) {
//             dp[i] = Math.max(dp[i], dp[j]+1);
//         }
//     }
//    }

//    return Math.max(...dp);
// }

// const arr = [10,22,33,50,40,60,80] // Output: 6

// console.log(findLongestSubsequenceOfArray(arr))

// const fetchData = () => {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve("Data fetched successfully.")
//         }, 1000)
//     })
// }


// fetchData().then((data) => console.log(data)).catch((error) => console.error());



// function createCounter() {
//     let count = 0;

//     return function() {
//         count++;
//         console.log(count);
//     } 
// }

// const counter = createCounter();
// counter();
// counter();
// counter();

// function sumAll(...args) {
//     return args.reduce((acc, curr) => acc+curr, 0);
// }

// console.log(sumAll(1,2,3,4,5,6,7,33))

// (function (name) {
//     var msg = "Hello i am here";
//     console.log(`${msg} ${name}`);
// })("shiv")

// const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];

// fruits.forEach((item, index, array) => {
//     console.log(`${index}: ${item}`);
// });


// const nums = [10, 20, 30];
// let sum = 0;

// nums.forEach(num => {
//     sum = sum+num;
// })

// console.log(sum)

// const users = [
//     { name: "Shiv", age: 25 },
//     { name: "Amit", age: 30 },
//     { name: "Pooja", age: 28 }
// ];

// const res = users.find(item => item.name == "Amit" && item.age > 25)
// console.log(res);


// Remove items with quantity 0

// Find the most expensive item

// Create a summary with total price and item count

// const cart = [
//     { name: "Laptop", price: 50000, quantity: 1 },
//     { name: "Mouse", price: 500, quantity: 2 },
//     { name: "Keyboard", price: 1000, quantity: 0 },
//     { name: "Monitor", price: 12000, quantity: 1 }
// ];

// const validItems = cart.filter(item => item.quantity > 0)
// // console.log(validItems)

// const totalPrice = validItems.reduce((acc, curr) => {})

// const fs = require('fs');
// fs.readFile("file.txt", "utf8", (err, data) => {
//     if(err) {
//         console.error(err);
//         return;
//     }
//     console.log(data);
// })

// longest subsequence in an array 

// timers in node js
setTimeout(() => {
    console.log("execute after 1 seconds");
}, 1000)


let count = 0;

const intervalId = setInterval(() => {
    count++;
    console.log("repeating every seconds", count);
    if (count === 31) clearInterval(intervalId);
}, 1000)


























app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger API Docs available at http://localhost:${PORT}/api-docs`);
});
