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
const eventModel = require("../models/eventModel");
const AttendanceLogModel = require("../models/attendanceLogModel");
// console.log(process.env.JWT_SECRET)
const moment = require('moment');


const addNewHoliday = async (req, res) => {
    try {
        const schema = Joi.object({
            holidayName: Joi.string().required(),
            holidayDate: Joi.string().required(),
            description: Joi.string().required(),
            holiday_id: Joi.string().required(),
            location: Joi.string().allow("").optional(),
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
        // check already added or not
        const isAlreadyExists = await holidaysModel.find({ holidayDate: req.body.holidayDate });
        if (isAlreadyExists.length > 0) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "List already added on same date",
            });
        }
        const bodyDoc = new holidaysModel({
            holidayName: req.body.holidayName,
            holidayDate: req.body.holidayDate,
            description: req.body.description,
            holiday_id: req.body.holiday_id,
            location: req.body.location
        })

        const saveDoc = await bodyDoc.save();
        if (saveDoc) {
            return res.status(201).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Leave applied successfully.",
                data: saveDoc
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


const updateHoliday = async (req, res) => {
    try {
        const holiday_id = req.params.holiday_id;
        if (!holiday_id) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Validation Error ! id is required.",
            });
        }
        const { holidayName, holidayDate, description, location } = req.body;
        // check already added or not
        const isAlreadyExists = await holidaysModel.findOne({holiday_id:holiday_id});
        if (!isAlreadyExists) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "You have provided wrong id",
            });
        }

        const updateDoc = await holidaysModel.findOneAndUpdate(
            {
                holiday_id:holiday_id
            },
            {
                holidayName: holidayName || isAlreadyExists.holidayName,
                holidayDate: holidayDate || isAlreadyExists.holidayDate,
                description: description || isAlreadyExists.description,
                location: location || isAlreadyExists.location,
            },
            { new: true }
        )
        if (updateDoc) {
            return res.status(201).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data updated successfully.",
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


const updateEventById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Validation Error! Event ID is required.",
            });
        }
        
        // Joi Schema for request validation
        const schema = Joi.object({
            title: Joi.string().optional(),
            description: Joi.string().optional(),
            location: Joi.string().allow("").optional(),
            dateTime: Joi.string().optional(),
            imageUrl: Joi.string().allow("").optional(),
        });
        
        let result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }

        // Check if event exists
        const existingEvent = await eventModel.findById(id); 
        if (!existingEvent) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "Event not found with the provided ID.",
            });
        }

        // Update the event
        const updatedEvent = await eventModel.findByIdAndUpdate(
            id,
            {
                title: req.body.title || existingEvent.title,
                description: req.body.description || existingEvent.description,
                location: req.body.location || existingEvent.location,
                dateTime: req.body.dateTime || existingEvent.dateTime,
                imageUrl: req.body.imageUrl || existingEvent.imageUrl,
            },
            { new: true }
        );

        if (updatedEvent) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Event updated successfully.",
                data: updatedEvent,
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
};


const deleteHoliday = async (req, res) => {
    try {
        const holiday_id = req.params.holiday_id
        if (!holiday_id) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Validation Error ! id is required.",
            });
        }
        // check already added or not
        const isAlreadyExists = await holidaysModel.findOne({ holiday_id: holiday_id});
        if (!isAlreadyExists) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "You have provided wrong id",
            });
        }

        const deleteDoc = await holidaysModel.findOneAndDelete(
            { holiday_id: holiday_id}
        )
        if (deleteDoc) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data deleted successfully.",
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


const getHolidayList = async (req, res) => {
    try {
        // check already added or not
        const getData = await holidaysModel.find({});
        if (getData.length < 1) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "data not found",
            });
        }

        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Holidays list get successfully.",
            data: getData
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


const addNewEvent = async (req, res) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            location: Joi.string().allow("").optional(),
            dateTime: Joi.string().required(),
            imageUrl: Joi.string().allow("").optional(),
        });

        let result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                statusValue: "FAIL",
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }
        // Create a new event document
        const newEvent = new eventModel({
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            dateTime: req.body.dateTime,
            imageUrl: req.body.imageUrl,
        });
        
        // Save the event in MongoDB
        const savedEvent = await newEvent.save();
        
        if (savedEvent) {
            return res.status(201).json({
                statusCode: 201,
                statusValue: "SUCCESS",
                message: "Event created successfully.",
                data: savedEvent,
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
};


const getEventList = async (req, res) => {
    try {
        // check already added or not
        const getData = await eventModel.find({}).sort({createdAt:-1});
        if (getData.length < 1) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "data not found",
            });
        }

        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Holidays list get successfully.",
            data: getData
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




const deleteEvent = async (req, res) => {
    try {
        const {id} = req.params
        if (!id) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Validation Error ! id is required.",
            });
        }
        // check already added or not
        const isExists = await eventModel.findOne({ _id: id});
        if (!isExists) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "You have provided wrong id",
            });
        }

        const deleteDoc = await eventModel.findOneAndDelete(
            { _id: id}
        )
        if (deleteDoc) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Data deleted successfully.",
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


const getEmpDataCount = async (req, res) => {
    try {
        // check already added or not
        const totalEmpCount = await employeeModel.find({accountStatus:"Active"})

        const newEmpCount = await employeeModel.find({accountStatus:"Active", isProbation: true})
        const noticePeriodEmpCount = await employeeModel.find({accountStatus:"Active", isNotice:true})
        const inHouseEmpCount = await employeeModel.find({accountStatus:"Active", isInhouse:true})
        const fieldEmpCount = await employeeModel.find({accountStatus:"Active", isInhouse:false})
        
        if (totalEmpCount.length < 1) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "data not found",
            });
        }
        
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Holidays list get successfully.",
            data: {
                totalEmployeeCount: totalEmpCount.length,
                newEmployeeCount: newEmpCount.length,
                employeeOnNoticePeriod: noticePeriodEmpCount.length,
                inHouseEmpCount: inHouseEmpCount.length,
                fieldEmpCount: fieldEmpCount.length,
            }
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


const getEmpAttendanceCount = async (req, res) => {
    try {
        const startDate = new Date("2025-01-01T00:00:00.000Z");
        const endDate = moment().endOf("month").toDate();

        const result = await AttendanceLogModel.aggregate([
            // Step 1: Match from Jan-2025 till now
            {
                $match: {
                    AttendanceDate: { $gte: startDate, $lte: endDate },
                    $expr: {
                        $in: [
                            { $trim: { input: "$Status" } },
                            ["Present", "Absent"]
                        ]
                    }
                }
            },
            // Step 2: Add duration (month) and dateOnly
            {
                $addFields: {
                    duration: {
                        $dateToString: { format: "%b-%Y", date: "$AttendanceDate" }
                    },
                    dateOnly: {
                        $dateToString: { format: "%Y-%m-%d", date: "$AttendanceDate" }
                    },
                    status: { $trim: { input: "$Status" } }
                }
            },
            // Step 3: Group by date and count present/absent for that day 
            {
                $group: {
                    _id: {
                        duration: "$duration", 
                        dateOnly: "$dateOnly"
                    },
                    presentCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Present"] }, 1, 0]
                        }
                    },
                    absentCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Absent"] }, 1, 0]
                        }
                    }
                }
            },
            // Step 4: Group by month to get max present and absent counts
            {
                $group: {
                    _id: "$_id.duration",
                    presentCount: { $max: "$presentCount" },
                    absentCount: { $max: "$absentCount" }
                }
            },
            // Step 5: Format result
            {
                $project: {
                    _id: 0,
                    duration: "$_id",
                    presentCount: 1,
                    absentCount: 1
                }
            },
            // Step 6: Sort by month
            {
                $addFields: {
                    sortKey: {
                        $dateFromString: {
                            dateString: { $concat: ["01-", "$duration"] },
                            format: "%d-%b-%Y"
                        }
                    }
                }
            },
            { $sort: { sortKey: 1 } },
            { $project: { sortKey: 0 } }
        ]);

        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Attendance counts get successfully.",
            data: result
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


const getEmpLeaveCount = async (req, res) => {
    try {
        // Format as string 'YYYY-MM-DD' because your DB stores leaveStartDate as a string
        const startOfLastMonthStr = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD'); // e.g. '2025-05-01'
        const endOfLastMonthStr = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');     // e.g. '2025-05-31'
        
        const leaveHistoryData = await leaveTakenHistoryModel.find({
            leaveStartDate: { $gte: startOfLastMonthStr, $lte: endOfLastMonthStr }
        }, {
            employeeId: 1,
            leaveStartDate: 1,
            leaveEndDate: 1,
            leaveType: 1,
            status:1
        }).sort({ createdAt: -1 });
         
        let pendingReqs = await leaveTakenHistoryModel.aggregate([
            { $match: { status: "Pending" } },
            { $group: { _id: "$employeeId" } },
            { $count: "pendingReq" }
        ])
        
        console.log("Last month leave history:", pendingReqs);

        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Attendance counts get successfully.",
            data: pendingReqs
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



module.exports = {
    addNewHoliday,
    getHolidayList,
    updateHoliday,
    deleteHoliday,
    addNewEvent,
    getEventList,
    deleteEvent,
    updateEventById,
    getEmpDataCount,
    getEmpAttendanceCount,
    getEmpLeaveCount
}