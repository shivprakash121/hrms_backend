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
            const sevenDaysAgo = moment().subtract(7, "days");

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




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger API Docs available at http://localhost:${PORT}/api-docs`);
});
