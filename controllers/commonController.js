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


module.exports = {
    addNewHoliday,
    getHolidayList,
    updateHoliday,
    deleteHoliday
}