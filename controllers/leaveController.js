const express = require("express");
const mongoose = require("mongoose");
const employeeModel = require("../models/employeeModel");
const redisClient = require("../config/redisClient");
// console.log(redisClient)
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const blacklist = require("../utils/blacklist");
const leaveTakenHistoryModel = require("../models/leaveTakenHistoryModel");
// console.log(process.env.JWT_SECRET)


const applyLeave = async (req, res) => {
    try {
        const schema = Joi.object({
            leaveType: Joi.string().valid("medicalLeave", "earnedLeave", "paternityLeave", "maternityLeave").required(),
            leaveStartDate: Joi.string().required(),
            leaveEndDate: Joi.string().allow("").optional(),
            totalDays: Joi.number().required(),
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

        let leaveStartDate = req.body.leaveStartDate;
        let leaveEndDate = req.body.leaveEndDate;
        let leaveType = req.body.leaveType;
        if (!req.body.leaveEndDate || req.body.leaveEndDate.trim() === "") {
            req.body.leaveEndDate = req.body.leaveStartDate;
        }
        // Example usage
    
        const validateLeaveDates = (leaveStartDate, leaveEndDate) => {
            // Convert the strings to Date objects
            const startDate = new Date(leaveStartDate);
            const endDate = new Date(leaveEndDate);
        
            // Check if leaveStartDate is less than or equal to leaveEndDate
            if (startDate > endDate) {
                return {
                    isValid: false,
                    message: "`leaveStartDate` must be less than or equal to `leaveEndDate`."
                };
            }
        
            return {
                isValid: true,
                message: "Dates are valid."
            };
        };
        
        const leaveRes = validateLeaveDates(leaveStartDate, leaveEndDate);    
        // const result = validateLeaveDates(leaveStartDate, leaveEndDate);
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
            $and:[
                { employeeId:req.params.employeeId },
                { leaveType:req.body.leaveType},
                { leaveStartDate:req.body.leaveStartDate },  
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
            employeeId:req.params.employeeId,
            leaveType:req.body.leaveType,
            leaveStartDate:req.body.leaveStartDate,
            leaveEndDate:req.body.leaveEndDate,
            totalDays:(req.body.totalDays).toString(),
            reason:req.body.reason,
            approvedBy:!!req.body.approvedBy ? req.body.approvedBy : "NA",
            status:"Pending",
            dateTime:dateTime
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
            $and:[
                { employeeId:req.params.employeeId },
                { leaveType:req.body.leaveType},
                { leaveStartDate:req.body.leaveStartDate },  
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
            employeeId:req.params.employeeId,
            leaveType:req.body.leaveType,
            leaveStartDate:req.body.leaveStartDate,
            leaveEndDate:req.body.leaveEndDate,
            totalDays:(req.body.totalDays).toString(),
            reason:req.body.reason,
            approvedBy:!!req.body.approvedBy ? req.body.approvedBy : "NA",
            status:"Pending",
            dateTime:dateTime
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
        // console.log('emp', decoded);
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
                $match: { employeeId: decoded.employeeId }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "employeeId",
                    as: "employeeInfo"
                }
            },
            {
                $unwind: {
                    path: "$employeeInfo",
                    preserveNullAndEmptyArrays: false // Ensures no documents with empty employeeInfo are returned
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$$ROOT", "$employeeInfo"]
                    }
                }
            },
            {
                $project:{
                    "__v":0,
                    "createdAt":0,
                    "updatedAt":0,
                    "employeeInfo.dor": 0,
                    "employeeInfo.doc": 0,
                    "employeeInfo.__v":0
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "totalRecords" }],
                    data: [{ $skip: skip }, { $limit: limitNumber }] // Apply pagination
                }
            }
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
        
        // check role
        // if (decoded.role !== "HR-Admin" || decoded.role !== "Super-Admin" || decoded.role !== "Super-Admin" || decoded.role !== "Admin") {
        //     return res.status(403).json({
        //         statusCode: 403,
        //         statusValue: "FAIL",
        //         message: "Access forbidden || you don't have access permission.",
        //     });
        // }
        
        // Extract pagination parameters
        const pageNumber = parseInt(req.query.page, 10) || 1; // Default page is 1
        const limitNumber = parseInt(req.query.limit, 10) || 10; // Default limit is 10
        const skip = (pageNumber - 1) * limitNumber;
     
        const aggregateLogic = [
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "employeeId",
                    as: "employeeInfo"
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $unwind: {
                    path: "$employeeInfo",
                    preserveNullAndEmptyArrays: false // Ensures no documents with empty employeeInfo are returned
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$$ROOT", "$employeeInfo"]
                    }
                }
            },
            {
                $project: {
                    "__v": 0,
                    "createdAt": 0,
                    "updatedAt": 0,
                    "employeeInfo.dor": 0,
                    "employeeInfo.doc": 0,
                    "employeeInfo.__v": 0,
                    "employeeInfo.employeeId": 0,
                    "employeeInfo._id": 0
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "totalRecords" }],
                    data: [{ $skip: skip }, { $limit: limitNumber }] // Apply pagination
                }
            }
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



module.exports = {
    applyLeave,
    getLeavesTakenByEmpId,
    getAllLeaves
}