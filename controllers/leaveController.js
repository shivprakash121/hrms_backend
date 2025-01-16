const express = require("express");
const mongoose = require("mongoose");
const employeeModel = require("../models/employeeModel");
const redisClient = require("../config/redisClient");
// console.log(redisClient)
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const blacklist = require("../utils/blacklist");
const leaveTakenHistoryModel = require("../models/leaveTakenHistoryModel");
const holidaysModel = require("../models/holidayModel");
// console.log(process.env.JWT_SECRET)
const moment = require("moment");
const CompOff = require("../models/compOffHistoryModel");
const AttendanceLogModel = require("../models/attendanceLogModel");


const applyLeave = async (req, res) => {
    try {
        const schema = Joi.object({
            leaveType: Joi.string().valid("medicalLeave", "earnedLeave", "paternityLeave", "maternityLeave", "casualLeave", "compOffLeave").required(),
            leaveStartDate: Joi.string().required(),
            leaveEndDate: Joi.string().allow("").optional(),
            totalDays: Joi.number().required(),
            reason: Joi.string().required(),
            approvedBy: Joi.string().allow("").optional(),
            shift: Joi.string().allow("").optional(),
        });
        let result = schema.validate(req.body);
        // console.log(req.body)
        // console.log(req.body)  
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }

        let { leaveStartDate, leaveEndDate, totalDays, reason, approvedBy, leaveType, shift } = req.body;
        // Check if end date is not provided
        if (!leaveEndDate || leaveEndDate.trim() === "" || leaveEndDate === "undefined") {
            leaveEndDate = leaveStartDate;
        }


        // fun to validate leaves dates
        const validateLeaveDates = (leaveStartDate, leaveEndDate, leaveType) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0)  // normalize to midnight

            // convert normal input string into date obj
            const startDate = new Date(leaveStartDate);
            const endDate = new Date(leaveEndDate);

            // check date condition  
            if (startDate > endDate) {
                return {
                    isValid: false,
                    message: `${leaveStartDate} must be less than or equal to ${leaveEndDate}`
                }
            }

            // Restrict past dates for specific leave types
            const restrictedLeaveTypes = ["casualLeave", "earnedLeave"]
            if (restrictedLeaveTypes.includes(leaveType)) {
                if (startDate < today || endDate < today) {
                    return {
                        isValid: false,
                        message: `For ${leaveType}, you can only select the current date or future dates.`
                    }
                }
            }
            return {
                isValid: true,
                message: "Dates are valid"
            }
        }

        const leaveRes = validateLeaveDates(leaveStartDate, leaveEndDate, leaveType);
        if (!leaveRes.isValid) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: leaveRes.message,
            });
        }

        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }
        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }
        // console.log(decoded)
        // get current date and time
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime()

        // check already exists
        const isAlreadyExists = await leaveTakenHistoryModel.find({
            $and: [
                { employeeId: req.params.employeeId },
                // { leaveType: req.body.leaveType },
                { $or: [{ status: "Approved" }, { status: "Pending" }] },
                {
                    $or: [
                        {
                            $and: [
                                { leaveStartDate: { $lte: leaveEndDate } },
                                { leaveEndDate: { $gte: leaveStartDate } },
                            ]
                        },
                        {
                            $and: [
                                { leaveStartDate: { $lte: leaveStartDate } },
                                { leaveEndDate: { $gte: leaveEndDate } },
                            ]
                        }
                    ]
                }
            ]
        });

        // console.log(!!isAlreadyExists.length)
        if (!!isAlreadyExists.length > 0) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "You have already applied leave on same date",
                statusMessage: "You have already applied leave on same date",
            });
        }
        // console.log(decoded)

        const bodyDoc = new leaveTakenHistoryModel({
            employeeId: req.params.employeeId,
            leaveType: leaveType,
            leaveStartDate: leaveStartDate,
            leaveEndDate: leaveEndDate,
            totalDays: totalDays.toString(),
            reason: reason,
            approvedBy: approvedBy || "NA",
            status: "Pending",
            dateTime: dateTime,
            shift:req.body.shift || ""
        })

        const saveDoc = await bodyDoc.save();
        if (saveDoc) {
            return res.status(201).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Leave applied successfully.",
            });
        }
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message,
        });
    }
}


const applyForRegularization = async (req, res) => {
    try {
        const schema = Joi.object({
            leaveType: Joi.string().valid("regularized", "shortLeave").required(),
            leaveStartDate: Joi.string().required(),
            reason: Joi.string().required(),
            approvedBy: Joi.string().allow("").optional(),
        });
        let result = schema.validate(req.body);
        // console.log(req.body) 
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }
        
        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }
        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }
        const getUser = await employeeModel.findOne({ employeeId: decoded.employeeId })
        // end user

        let { leaveStartDate, reason, approvedBy, leaveType } = req.body;
        if (!leaveStartDate || !moment(leaveStartDate, "YYYY-MM-DD", true).isValid()) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: "Invalid date format for leaveStartDate. Use 'YYYY-MM-DD'.",
            });
        }
        
        const today = moment().startOf('day'); // Current date
        const maxDate = today.clone().subtract(1, 'day'); // Yesterday
        const minDate = today.clone().subtract(7, 'days');  // 7 days before today (excluding today)
        
        const leaveDate = moment(leaveStartDate, "YYYY-MM-DD", true);
        
        if(leaveType === "regularized") {
            if (leaveDate.isBefore(minDate) || leaveDate.isAfter(maxDate)) {
                return res.status(400).json({
                    statusValue: "FAIL",
                    statusCode: 400,
                    message: "leaveStartDate must be within the past 7 days (excluding today).",
                });
            }
        } else if (leaveType === "shortLeave") {
            if (!leaveDate.isSame(today, 'day')) {
                return res.status(400).json({
                    statusCode: 400,
                    statusValue: "FAIL",
                    message: "Short leave can only be applied for the current date.",
                });
            }
        }
        // Get current month start and end dates
        const startOfMonth = moment().startOf("month").toDate();
        const endOfMonth = moment().endOf("month").toDate();

        // Fetch employee's leave data for the current month
        const checkMaxLimitReg = await leaveTakenHistoryModel.find({
            employeeId: req.params.employeeId,
            leaveType: leaveType, 
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }, 
        });

        // Check if the count exceeds the limit
        if(leaveType === "regularized") {
            if (checkMaxLimitReg.length >= 2) {
                return res.status(400).json({
                    message: "You have already reached the maximum regularization limit for this month.",
                    statusCode: 400,
                    statusValue: "LIMIT_EXCEEDED",
                });
            }
        } else if (leaveType === "shortLeave") {
            if (checkMaxLimitReg.length >= 1) {
                return res.status(400).json({
                    message: "You have already reached the maximum short leave limit for this month.",
                    statusCode: 400,
                    statusValue: "LIMIT_EXCEEDED",
                });
            }
        }

        // get current date and time
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime()
        // check attendance for employee
        const checkAttendance = await AttendanceLogModel.findOne({$and:[
            {AttendanceDate:new Date(req.body.leaveStartDate)},
            {EmployeeCode:req.params.employeeId},
        ]})
        // console.log(checkAttendance.Status)
        if (!checkAttendance) {
            return res.status(400).json({
                message: "We don't have your attendance log on this date.",
                statusCode: 400,
                statusValue: "false",
            });
        }
        // console.log(12, checkAttendance)
        const bodyDoc = new leaveTakenHistoryModel({
            employeeId: req.params.employeeId,
            leaveType: leaveType,
            leaveStartDate: leaveStartDate,
            leaveEndDate: leaveStartDate,
            totalDays: "1",
            reason: reason,
            approvedBy: getUser.managerId,  
            status: "Pending",
            dateTime: dateTime
        })

        const saveDoc = await bodyDoc.save();
        if (saveDoc) {
            return res.status(201).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Leave applied successfully.",
            });
        }
        return res.status(400).json({
            message: "You have provided wrong id",
            statusCode: 400,
            statusValue: "FAIL",
        });
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message,
        });
    }
}


const requestCompOff = async (req, res) => {
    try {
        const { compOffDate, reason } = req.body;

        // Validate required fields
        if (!req.params.employeeId || !compOffDate || !reason) {
            return res.status(400).json({
                message: 'Employee ID, Comp Off Date, and Reason are required.',
                statusCode: 400,
                statusValue: 'error',
            });
        }

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }

        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }
        // check already applied for the same date
        const existingCompOff = await CompOff.findOne({
            employeeId: req.params.employeeId,
            compOffDate: compOffDate
        });
        
        if (existingCompOff) {
            return res.status(400).json({
                message: "Compensatory off already applied for the same date.",
                statusCode: 400,
                statusValue: "error"
            });
        }

        const getUser = await employeeModel.findOne({ employeeId: decoded.employeeId })
        // Get current date and time in IST
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime();
        // Create a new Comp Off request
        const compOffRequest = new CompOff({
            employeeId: req.params.employeeId,
            compOffDate,
            reason,
            approvedBy: getUser.managerId || "",
            appliedDate:dateTime,
            totalDays:"1",
            // comments:"Approved by manager"
        });

        // Save to the database
        const savedCompOff = await compOffRequest.save();
        if (!savedCompOff) {
            return res.status(400).json({
                message: 'Compoff not generated.',
                statusCode: 400,
                statusValue: 'error',
            });
        }
        return res.status(201).json({
            message: 'Comp Off request created successfully.',
            statusCode: 201,
            statusValue: 'success',
            data: savedCompOff,
        });
    } catch (error) {
        res.status(500).json({
            message: 'An error occurred while requesting Comp Off.',
            statusCode: 500,
            statusValue: 'error',
            error: error.message,
        });
    }
};


const actionCompOff = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Id is required",
            });
        }
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }
        const schema = Joi.object({
            status: Joi.string().valid("Approved", "Rejected").required(),
        });
        let result = schema.validate(req.body);
        // console.log(req.body) 
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }
        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }
        const getUser = await employeeModel.findOne({ employeeId: decoded.employeeId }).lean();
        // const test = await CompOff.find({});
        // console.log(11, test)

        if (!getUser) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "User not found.",
            });
        }

        if (getUser.role !== "Manager" || !getUser.role !== "HR-Admin") {
            return res.status(403).json({
                statusCode: 403,
                statusValue: "FAIL",
                message: "You don't have access to this feature.",
            });
        }
        // Get current date and time in IST
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime();
        const compOffData = await CompOff.findOne({_id: req.params.id})
        const empData = await employeeModel.findOne({employeeId:compOffData.employeeId})
        // Create a new Comp Off request
        const compOffRequest = await CompOff.findOneAndUpdate(
            {_id: req.params.id},
            { 
                status:req.body.status,
                approvedDate:dateTime,
                comments: "Action taken by manager",
                approvedBy:empData?.managerId || "NA"
            }
        );
        if (req.body.status === "Approved") {
            await employeeModel.updateOne(
                { employeeId: compOffData.employeeId },
                [
                    {
                        $set: {
                            "leaveBalance.compOffLeave": {
                                $toString: {
                                    $add: [
                                        { $toInt: "$leaveBalance.compOffLeave" },
                                        1,
                                    ],
                                },
                            },
                        },
                    },
                ]
            );
        }
        
        if (!compOffRequest) {
            return res.status(400).json({
                message: 'Compoff request not updated.',
                statusCode: 400,
                statusValue: 'error',
            });
        }
        return res.status(200).json({
            message: 'Comp Off request updated successfully.',
            statusCode: 200,
            statusValue: 'SUCCESS',
            data: compOffRequest,
        });
    } catch (error) {
        res.status(500).json({
            message: 'An error occurred while requesting Comp Off.',
            statusCode: 500,
            statusValue: 'error',
            error: error.message,
        });
    }
};



const actionForLeavApplication = async (req, res) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid("Approved", "Rejected").required(),
            remarks: Joi.string().allow("").optional(),
        });
        let result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }

        // Check leave data
        const leaveData = await leaveTakenHistoryModel.findOne({ _id: req.params.id });
        if (!leaveData) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Wrong id",
            });
        }

        // Get user leave balance
        const getUser = await employeeModel.findOne({ employeeId: leaveData.employeeId }, { leaveBalance: 1 });
        if (!getUser) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Employee not found.",
            });
        }

        // Get current date and time in IST
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime();

        // Check if status is "Approved" and update leave balance
        if (req.body.status === "Approved") {
            const { leaveType, totalDays } = leaveData;
            const leaveBalance = getUser.leaveBalance;

            // // Validate leaveType
            // if (!leaveBalance.hasOwnProperty(leaveType)) {
            //     return res.status(400).json({
            //         statusCode: 400,
            //         statusValue: "FAIL",
            //         message: `Invalid leave type: ${leaveType}`,
            //     });
            // }

            // Check sufficient balance
            const availableBalance = parseFloat(leaveBalance[leaveType]);
            const daysToDeduct = parseFloat(totalDays);

            if (availableBalance < daysToDeduct) {
                return res.status(400).json({
                    statusCode: 400,
                    statusValue: "FAIL",
                    message: `Insufficient balance for ${leaveType}. Available: ${availableBalance}, Required: ${daysToDeduct}`,
                });
            }

            // Deduct leave days
            const updatedBalance = (availableBalance - daysToDeduct).toString();

            // Update employee's leave balance
            const updateLeaveBalance = await employeeModel.findOneAndUpdate(
                { employeeId: leaveData.employeeId },
                { $set: { [`leaveBalance.${leaveType}`]: updatedBalance } }  
            );

            if (!updateLeaveBalance) {
                return res.status(500).json({
                    statusCode: 500,
                    statusValue: "FAIL",
                    message: "Failed to update leave balance.",
                });
            }
        }

        // Update leave application status
        const updateDoc = await leaveTakenHistoryModel.findOneAndUpdate(
            { _id: req.params.id },
            {
                status: req.body.status,
                approvedDateTime: dateTime,
                approvedBy: getUser.employeeId,
                remarks:req.body.remarks || ""
            }
        );

        if (updateDoc) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data updated successfully.",
            });
        }

        return res.status(400).json({
            statusCode: 400,
            statusValue: "FAIL",
            message: "Wrong id || Data not updated successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message,
        });
    }
};


const deleteLeavApplication = async (req, res) => {
    try {
        // Update leave application status
        const updateDoc = await leaveTakenHistoryModel.findOneAndDelete({ _id: req.params.id });
        if (updateDoc) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data deleted successfully.",
            });
        }

        return res.status(400).json({
            statusCode: 400,
            statusValue: "FAIL",
            message: "Wrong id || Data not deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message,
        });
    }
};


const actionForRegularization = async (req, res) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid("Approved", "Rejected").required(),
        });
        let result = schema.validate(req.body);

        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }

        // Get current date and time
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime();
        const { status } = req.body;
        
        // check if given req is Pending
        // Check if already Approved
        const isExists = await leaveTakenHistoryModel.findOne({
            _id: req.params.id,
            status: "Approved",
        });

        if (isExists) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: "This request has already been approved.",
            });
        }

        const updateDoc = await leaveTakenHistoryModel.findOneAndUpdate(
            { _id: req.params.id },
            {
                status: req.body.status,
                approvedDateTime: dateTime,
            }
        );

        const leaveData = await leaveTakenHistoryModel.findOne({ _id: req.params.id });
        const employeeId = leaveData?.employeeId;
        if (status === "Approved") {
            if (leaveData.leaveType === "regularized") {
                const updatedEmployee = await employeeModel.findOneAndUpdate(
                    { employeeId: employeeId },
                    [
                        {
                            $set: {
                                maxRegularization: {
                                    $toString: { $subtract: [{ $toInt: "$maxRegularization" }, 1] },
                                },
                            },
                        },
                    ],
                    { new: true }
                );
                return res.status(200).json({
                    message: "Regularization updated successfully",
                    statusCode: 200,
                    statusValue: "Success",
                    data: updatedEmployee,
                });
            }
            const updatedEmployee = await employeeModel.findOneAndUpdate(
                { employeeId: employeeId },
                [
                    {
                        $set: {
                            maxShortLeave: {
                                $toString: { $subtract: [{ $toInt: "$maxShortLeave" }, 1] },
                            },
                        },
                    },
                ],
                { new: true }
            );

            if (updatedEmployee) {
                return res.status(200).json({
                    message: "Short leave updated successfully",
                    statusCode: 200,
                    statusValue: "Success",
                    data: updatedEmployee,
                });
            } else {
                return res.status(404).json({
                    message: "Employee not found",
                    statusCode: 404,
                    statusValue: "Error",
                });
            }
        } else if (status === "Rejected") {
            return res.status(200).json({
                message: "Status is Rejected, no changes made",
                statusCode: 200,
                statusValue: "Success",
            });
        }

        return res.status(400).json({
            statusCode: 400,
            statusValue: "FAIL",
            message: "Data not updated successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: error.message,
            error: error.message,
        });  
    }
};


const updateLeaveStatus = async (req, res) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid("medicalLeave", "earnedLeave", "paternityLeave", "maternityLeave").required(),
        });
        let result = schema.validate(req.body);
        // console.log(req.body)  
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }

        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }
        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,

                statusValue: "FAIL",
                message: "Invalid token",
            });
        }
        // get current date and time
        const getIndiaCurrentDateTime = () => {
            const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const date = new Date(indiaTime);

            const pad = (n) => (n < 10 ? `0${n}` : n);

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const dateTime = getIndiaCurrentDateTime()

        // check already exists
        const isAlreadyExists = await leaveTakenHistoryModel.find({
            $and: [
                { employeeId: req.params.employeeId },
                { leaveType: req.body.leaveType },
                { leaveStartDate: req.body.leaveStartDate },
                // { eaveEndDate:req.body.leaveEndDate },
                { status: "Pending" }
            ]
        });
        // console.log(!!isAlreadyExists.length)
        if (!!isAlreadyExists.length > 0) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "You have already applied leave on same date",
            });
        }
        // console.log(decoded)
        const bodyDoc = new leaveTakenHistoryModel({
            employeeId: req.params.employeeId,
            leaveType: req.body.leaveType,
            leaveStartDate: req.body.leaveStartDate,
            leaveEndDate: req.body.leaveEndDate,
            totalDays: (req.body.totalDays).toString(),
            reason: req.body.reason,
            approvedBy: !!req.body.approvedBy ? req.body.approvedBy : "NA",
            status: "Pending",
            dateTime: dateTime
        })

        const saveDoc = await bodyDoc.save();
        if (saveDoc) {
            return res.status(201).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Leave applied successfully.",
            });
        }

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "",
            error: error.message,
        });
    }
}


const getLeavesTakenByEmpId = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }

        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('emp', decoded);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }

        // Extract pagination parameters
        const pageNumber = parseInt(req.query.page, 10) || 1; // Default page is 1
        const limitNumber = parseInt(req.query.limit, 10) || 10; // Default limit is 10
        const skip = (pageNumber - 1) * limitNumber;

        const aggregateLogic = [
            {
                $match: {
                    employeeId: req.params.employeeId,
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "employeeId",
                    as: "employeeInfo",
                },
            },
            {
                $unwind: {
                    path: "$employeeInfo",
                    preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                },
            },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                            ],
                            default: 4, // Fallback priority for unexpected statuses
                        },
                    },
                },
            },
            {
                $sort: { statusPriority: 1, createdAt: -1 },
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            "$$ROOT",
                            {
                                employeeInfo: {
                                    employeeName: "$employeeInfo.employeeName",
                                    employeeCode: "$employeeInfo.employeeCode",
                                    gender: "$employeeInfo.gender",
                                    departmentId: "$employeeInfo.departmentId",
                                    designation: "$employeeInfo.designation",
                                    doj: "$employeeInfo.doj",
                                    employmentType: "$employeeInfo.employmentType",
                                    employeeStatus: "$employeeInfo.employeeStatus",
                                    accountStatus: "$employeeInfo.accountStatus",
                                    residentialAddress: "$employeeInfo.residentialAddress",
                                    permanentAddress: "$employeeInfo.permanentAddress",
                                    contactNo: "$employeeInfo.contactNo",
                                    email: "$employeeInfo.email",
                                    dob: "$employeeInfo.dob",
                                    bloodGroup: "$employeeInfo.bloodGroup",
                                    workPlace: "$employeeInfo.workPlace",
                                    emergencyContact: "$employeeInfo.emergencyContact",
                                    managerId: "$employeeInfo.managerId",
                                    leaveBalance: "$employeeInfo.leaveBalance",
                                    role: "$employeeInfo.role",
                                },
                            },
                        ],
                    },
                },
            },
            {
                $project: {
                    employeeInfo: 1,
                    leaveType: 1,
                    leaveStartDate: 1,
                    leaveEndDate: 1,
                    totalDays: 1,
                    reason: 1,
                    status: 1,
                    approvedBy: 1,
                    approvedDateTime: 1,
                    dateTime: 1,
                    location:1,
                    remarks:1
                },
            },
            {
                $facet: {
                    metadata: [{ $count: "totalRecords" }],
                    data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                },
            },
        ];
        const aggResult = await leaveTakenHistoryModel.aggregate(aggregateLogic);
        const totalRecords = aggResult[0]?.metadata[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limitNumber);

        if (totalRecords > 0) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data fetched successfully.",
                data: aggResult[0].data,
                totalRecords,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            });
        }

        return res.status(400).json({
            statusCode: 400,
            statusValue: "FAIL",
            message: "No data found.",
            data: []
        });

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Internal server error.",
            error: error.message,
        });
    }
};

const getAllLeaves = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }

        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }

        const getUser = await employeeModel.findOne({ employeeId: decoded.employeeId })
        // Extract pagination parameters
        const pageNumber = parseInt(req.query.page, 10) || 1; // Default page is 1
        const limitNumber = parseInt(req.query.limit, 10) || 10; // Default limit is 10
        const skip = (pageNumber - 1) * limitNumber;

        const aggregateLogic = [
            {
                $match: {
                    employeeId: getUser.employeeId,
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "employeeId",
                    as: "employeeInfo",
                },
            },
            {
                $unwind: {
                    path: "$employeeInfo",
                    preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                },
            },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                            ],
                            default: 4, // Fallback priority for unexpected statuses
                        },
                    },
                },
            },
            {
                $sort: { statusPriority: 1, createdAt: -1 },
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            "$$ROOT",
                            {
                                employeeInfo: {
                                    employeeName: "$employeeInfo.employeeName",
                                    employeeCode: "$employeeInfo.employeeCode",
                                    gender: "$employeeInfo.gender",
                                    departmentId: "$employeeInfo.departmentId",
                                    designation: "$employeeInfo.designation",
                                    doj: "$employeeInfo.doj",
                                    employmentType: "$employeeInfo.employmentType",
                                    employeeStatus: "$employeeInfo.employeeStatus",
                                    accountStatus: "$employeeInfo.accountStatus",
                                    residentialAddress: "$employeeInfo.residentialAddress",
                                    permanentAddress: "$employeeInfo.permanentAddress",
                                    contactNo: "$employeeInfo.contactNo",
                                    email: "$employeeInfo.email",
                                    dob: "$employeeInfo.dob",
                                    bloodGroup: "$employeeInfo.bloodGroup",
                                    workPlace: "$employeeInfo.workPlace",
                                    emergencyContact: "$employeeInfo.emergencyContact",
                                    managerId: "$employeeInfo.managerId",
                                    leaveBalance: "$employeeInfo.leaveBalance",
                                    role: "$employeeInfo.role",
                                },
                            },
                        ],
                    },
                },
            },
            {
                $project: {
                    employeeInfo: 1,
                    leaveType: 1,
                    leaveStartDate: 1,
                    leaveEndDate: 1,
                    totalDays: 1,
                    reason: 1,
                    status: 1,
                    approvedBy: 1,
                    approvedDateTime: 1,
                    dateTime: 1,
                    location:1,
                    remarks:1
                },
            },
            {
                $facet: {
                    metadata: [{ $count: "totalRecords" }],
                    data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                },
            },
        ];
        
        const aggResult = await leaveTakenHistoryModel.aggregate(aggregateLogic);
        
        
        
        // console.log('check', aggResult[0]?.metadata)

        const totalRecords = aggResult[0]?.metadata[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limitNumber);

        if (totalRecords > 0) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data fetched successfully.",
                data: aggResult[0].data,
                totalRecords,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            });
        }

        return res.status(404).json({
            statusCode: 404,
            statusValue: "FAIL",
            message: "No data found.",
            data: []
        });

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Internal server error.",
            error: error.message,
        });
    }
};


const getAllPendingLeaves = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }

        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }

        // Extract pagination parameters
        const pageNumber = parseInt(req.query.page, 10) || 1; // Default page is 1
        const limitNumber = parseInt(req.query.limit, 10) || 10; // Default limit is 10
        const skip = (pageNumber - 1) * limitNumber;

        // console.log(decoded)
        const getUser = await employeeModel.findOne({ employeeId: decoded.employeeId })
        // check Role
        let aggregateLogic;
        if (getUser.role == "Manager") {
            aggregateLogic = [
                {
                    $match: {
                        approvedBy: getUser.employeeId,
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "employeeId",
                        as: "employeeInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$employeeInfo",
                        preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                    },
                },
                {
                    $addFields: {
                        statusPriority: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                    { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                    { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                                ],
                                default: 4, // Fallback priority for unexpected statuses
                            },
                        },
                    },
                },
                {
                    $sort: { statusPriority: 1, createdAt: -1 },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$$ROOT",
                                {
                                    employeeInfo: {
                                        employeeName: "$employeeInfo.employeeName",
                                        employeeCode: "$employeeInfo.employeeCode",
                                        gender: "$employeeInfo.gender",
                                        departmentId: "$employeeInfo.departmentId",
                                        designation: "$employeeInfo.designation",
                                        doj: "$employeeInfo.doj",
                                        employmentType: "$employeeInfo.employmentType",
                                        employeeStatus: "$employeeInfo.employeeStatus",
                                        accountStatus: "$employeeInfo.accountStatus",
                                        residentialAddress: "$employeeInfo.residentialAddress",
                                        permanentAddress: "$employeeInfo.permanentAddress",
                                        contactNo: "$employeeInfo.contactNo",
                                        email: "$employeeInfo.email",
                                        dob: "$employeeInfo.dob",
                                        bloodGroup: "$employeeInfo.bloodGroup",
                                        workPlace: "$employeeInfo.workPlace",
                                        emergencyContact: "$employeeInfo.emergencyContact",
                                        managerId: "$employeeInfo.managerId",
                                        leaveBalance: "$employeeInfo.leaveBalance",
                                        role: "$employeeInfo.role",
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        employeeInfo: 1,
                        leaveType: 1,
                        leaveStartDate: 1,
                        leaveEndDate: 1,
                        totalDays: 1,
                        reason: 1,
                        status: 1,
                        approvedBy: 1,
                        approvedDateTime: 1,
                        dateTime: 1,
                        location:1,
                        remarks:1
                    },
                },
                {
                    $facet: {
                        metadata: [{ $count: "totalRecords" }],
                        data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                    },
                },
            ];

        } else if (getUser.role == "HR-Admin" || getUser.role == "Admin" || getUser.role == "Super-Admin") {
            aggregateLogic = [
                // {
                //   $match: {
                //     approvedBy: getUser.employeeId,
                //   },
                // },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "employeeId",
                        as: "employeeInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$employeeInfo",
                        preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                    },
                },
                {
                    $addFields: {
                        statusPriority: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                    { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                    { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                                ],
                                default: 4, // Fallback priority for unexpected statuses
                            },
                        },
                    },
                },
                {
                    $sort: { statusPriority: 1, createdAt: -1 },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$$ROOT",
                                {
                                    employeeInfo: {
                                        employeeName: "$employeeInfo.employeeName",
                                        employeeCode: "$employeeInfo.employeeCode",
                                        gender: "$employeeInfo.gender",
                                        departmentId: "$employeeInfo.departmentId",
                                        designation: "$employeeInfo.designation",
                                        doj: "$employeeInfo.doj",
                                        employmentType: "$employeeInfo.employmentType",
                                        employeeStatus: "$employeeInfo.employeeStatus",
                                        accountStatus: "$employeeInfo.accountStatus",
                                        residentialAddress: "$employeeInfo.residentialAddress",
                                        permanentAddress: "$employeeInfo.permanentAddress",
                                        contactNo: "$employeeInfo.contactNo",
                                        email: "$employeeInfo.email",
                                        dob: "$employeeInfo.dob",
                                        bloodGroup: "$employeeInfo.bloodGroup",
                                        workPlace: "$employeeInfo.workPlace",
                                        emergencyContact: "$employeeInfo.emergencyContact",
                                        managerId: "$employeeInfo.managerId",
                                        leaveBalance: "$employeeInfo.leaveBalance",
                                        role: "$employeeInfo.role",
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        employeeInfo: 1,
                        leaveType: 1,
                        leaveStartDate: 1,
                        leaveEndDate: 1,
                        totalDays: 1,
                        reason: 1,
                        status: 1,
                        approvedBy: 1,
                        approvedDateTime: 1,
                        dateTime: 1,
                        location:1,
                        remarks:1
                    },
                },
                {
                    $facet: {
                        metadata: [{ $count: "totalRecords" }],
                        data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                    },
                },
            ];

        }

        const aggResult = await leaveTakenHistoryModel.aggregate(aggregateLogic);
        // console.log('check', aggResult[0]?.metadata)

        const totalRecords = aggResult[0]?.metadata[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limitNumber);

        if (totalRecords > 0) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data fetched successfully.",
                data: aggResult[0].data,
                totalRecords,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            });
        }

        return res.status(404).json({
            statusCode: 404,
            statusValue: "FAIL",
            message: "No data found.",
            data: []
        });

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Internal server error.",
            error: error.message,
        });
    }
};


const getAllPendingCompoff = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Token is required",
            });
        }

        // Decode the token to get employee details
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Invalid token",
            });
        }

        // Extract pagination parameters
        const pageNumber = parseInt(req.query.page, 10) || 1; // Default page is 1
        const limitNumber = parseInt(req.query.limit, 10) || 10; // Default limit is 10
        const skip = (pageNumber - 1) * limitNumber;

        // console.log(decoded)
        const getUser = await employeeModel.findOne({ employeeId: decoded.employeeId })
        // check Role
        let aggregateLogic;
        if (getUser.role == "Manager") {
            aggregateLogic = [
                {
                    $match: {
                        approvedBy: getUser.employeeId,
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "employeeId",
                        as: "employeeInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$employeeInfo",
                        preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                    },
                },
                {
                    $addFields: {
                        statusPriority: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                    { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                    { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                                ],
                                default: 4, // Fallback priority for unexpected statuses
                            },
                        },
                    },
                },
                {
                    $sort: { statusPriority: 1, createdAt: -1 },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$$ROOT",
                                {
                                    employeeInfo: {
                                        employeeName: "$employeeInfo.employeeName",
                                        employeeCode: "$employeeInfo.employeeCode",
                                        gender: "$employeeInfo.gender",
                                        departmentId: "$employeeInfo.departmentId",
                                        designation: "$employeeInfo.designation",
                                        doj: "$employeeInfo.doj",
                                        employmentType: "$employeeInfo.employmentType",
                                        employeeStatus: "$employeeInfo.employeeStatus",
                                        contactNo: "$employeeInfo.contactNo",
                                        email: "$employeeInfo.email",
                                        managerId: "$employeeInfo.managerId",
                                        leaveBalance: "$employeeInfo.leaveBalance",
                                        role: "$employeeInfo.role",
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        employeeInfo: 1,
                        appliedDate: 1,
                        compOffDate: 1,
                        reason: 1, 
                        status: 1,
                        comments: 1,
                        totalDays: 1,
                    },
                },
                {
                    $facet: {
                        metadata: [{ $count: "totalRecords" }],
                        data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                    },
                },
            ];

        } else if (getUser.role == "HR-Admin") {
            aggregateLogic = [
                // {
                //   $match: {
                //     approvedBy: getUser.employeeId,
                //   },
                // },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "employeeId",
                        as: "employeeInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$employeeInfo",
                        preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                    },
                },
                {
                    $addFields: {
                        statusPriority: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                    { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                    { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                                ],
                                default: 4, // Fallback priority for unexpected statuses
                            },
                        },
                    },
                },
                {
                    $sort: { statusPriority: 1, createdAt: -1 },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$$ROOT",
                                {
                                    employeeInfo: {
                                        employeeName: "$employeeInfo.employeeName",
                                        employeeCode: "$employeeInfo.employeeCode",
                                        gender: "$employeeInfo.gender",
                                        departmentId: "$employeeInfo.departmentId",
                                        designation: "$employeeInfo.designation",
                                        doj: "$employeeInfo.doj",
                                        employmentType: "$employeeInfo.employmentType",
                                        employeeStatus: "$employeeInfo.employeeStatus",
                                        contactNo: "$employeeInfo.contactNo",
                                        email: "$employeeInfo.email",
                                        managerId: "$employeeInfo.managerId",
                                        leaveBalance: "$employeeInfo.leaveBalance",
                                        role: "$employeeInfo.role",
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        employeeInfo: 1,
                        appliedDate: 1,
                        compOffDate: 1,
                        reason: 1, 
                        status: 1,
                        comments: 1,
                        totalDays: 1,
                    },
                },
                {
                    $facet: {
                        metadata: [{ $count: "totalRecords" }],
                        data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                    },
                },
            ];

        } else if (getUser.role == "Employee") {
            aggregateLogic = [
                {
                    $match: {
                        employeeId: getUser.employeeId,
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "employeeId",
                        as: "employeeInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$employeeInfo",
                        preserveNullAndEmptyArrays: false, // Ensures no documents with empty employeeInfo are returned
                    },
                },
                {
                    $addFields: {
                        statusPriority: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$status", "Pending"] }, then: 1 },
                                    { case: { $eq: ["$status", "Approved"] }, then: 2 },
                                    { case: { $eq: ["$status", "Rejected"] }, then: 3 },
                                ],
                                default: 4, // Fallback priority for unexpected statuses
                            },
                        },
                    },
                },
                {
                    $sort: { statusPriority: 1, createdAt: -1 },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$$ROOT",
                                {
                                    employeeInfo: {
                                        employeeName: "$employeeInfo.employeeName",
                                        employeeCode: "$employeeInfo.employeeCode",
                                        gender: "$employeeInfo.gender",
                                        departmentId: "$employeeInfo.departmentId",
                                        designation: "$employeeInfo.designation",
                                        doj: "$employeeInfo.doj",
                                        employmentType: "$employeeInfo.employmentType",
                                        employeeStatus: "$employeeInfo.employeeStatus",
                                        contactNo: "$employeeInfo.contactNo",
                                        email: "$employeeInfo.email",
                                        managerId: "$employeeInfo.managerId",
                                        leaveBalance: "$employeeInfo.leaveBalance",
                                        role: "$employeeInfo.role",
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        employeeInfo: 1,
                        appliedDate: 1,
                        compOffDate: 1,
                        reason: 1, 
                        status: 1,
                        comments: 1,
                        totalDays: 1,
                    },
                },
                {
                    $facet: {
                        metadata: [{ $count: "totalRecords" }],
                        data: [{ $skip: skip }, { $limit: limitNumber }], // Apply pagination
                    },
                },
            ];
        }

        const aggResult = await CompOff.aggregate(aggregateLogic);
        // console.log('check', aggResult[0]?.metadata)

        const totalRecords = aggResult[0]?.metadata[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limitNumber);

        if (totalRecords > 0) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data fetched successfully.",
                data: aggResult[0].data,
                totalRecords,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            });
        }

        return res.status(404).json({
            statusCode: 404,
            statusValue: "FAIL",
            message: "No data found.",
            data: []
        });

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Internal server error.",
            error: error.message,
        });
    }
};



module.exports = {
    applyLeave,
    getLeavesTakenByEmpId,
    getAllLeaves,
    applyForRegularization,
    actionForRegularization,
    actionForLeavApplication,
    getAllPendingLeaves,
    requestCompOff,
    getAllPendingCompoff,
    actionCompOff,
    deleteLeavApplication
}