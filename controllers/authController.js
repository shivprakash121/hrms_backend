const express = require("express");
const mongoose = require("mongoose");
const employeeModel = require("../models/employeeModel");
const redisClient = require("../config/redisClient");
// console.log(redisClient)
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const blacklist = require("../utils/blacklist");
const departmentModel = require("../models/departmentModel");
// console.log(process.env.JWT_SECRET)
const bcrypt = require('bcrypt');
const leaveTakenHistoryModel = require("../models/leaveTakenHistoryModel");

const registerEmployee = async (req, res) => {
    try {
        const {
            employeeId,
            employeeName,
            employeeCode,
            gender,
            departmentId,
            designation,
            doj,
            employeeCodeInDevice,
            employmentType,
            employeeStatus,
            accountStatus,
            fatherName,
            motherName,
            residentialAddress,
            permanentAddress,
            contactNo,
            email,
            dob,
            placeOfBirth,
            bloodGroup,
            workPlace,
            aadhaarNumber,
            employeePhoto,
            masterDeviceId,
            maritalStatus,
            nationality,
            overallExperience,
            qualifications,
            emergencyContact,
            managerId,
            teamLeadId,
            leaveBalance,
            role,
            shiftTime,
            loginPassword,
            pancardNo,
            workingDays
        } = req.body;
        console.log(req.body)
        if ((!email || email == "" || email == null) && (!employeeId || employeeId == "" || employeeId == null)) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Validation error! || EmployeeId and email are required.",
            });
        } else {
            const isUserExists = await employeeModel.findOne({ $or: [{ email: email }, { employeeId: employeeId }] })
            if (isUserExists) {
                return res.status(403).json({  
                    statusCode: 403,
                    statusValue: "FAIL",
                    message: "User email or employeeId already exists."
                });
            }
            const newEmployee = new employeeModel({
                employeeId:employeeId ? employeeId : "NA",
                employeeName:employeeName ? employeeName : "NA",
                employeeCode: employeeCode ? employeeCode : "NA",
                gender: gender ? gender : "NA",
                departmentId : departmentId ? departmentId : 0,
                designation : designation ? designation : "NA",  
                doj: doj ? doj : "NA",
                employeeCodeInDevice : employeeCodeInDevice ? employeeCodeInDevice : "NA",
                employmentType : employmentType ? employmentType : "NA",
                employeeStatus : employeeStatus ? employeeStatus : "Working",
                accountStatus : accountStatus ? accountStatus : "Active",
                fatherName : fatherName ? fatherName : "NA",
                motherName : motherName ? motherName : "NA",
                residentialAddress : residentialAddress ? residentialAddress : "NA",
                permanentAddress : permanentAddress ? permanentAddress : "NA",
                contactNo : contactNo ? contactNo : "NA",
                email,
                dob,
                placeOfBirth : placeOfBirth ? placeOfBirth : "NA",
                bloodGroup : bloodGroup ? bloodGroup : "NA",
                workPlace : workPlace ? workPlace : "NA",
                aadhaarNumber : aadhaarNumber ? aadhaarNumber : "NA",
                employeePhoto : employeePhoto ? employeePhoto : "NA",
                masterDeviceId: masterDeviceId ? masterDeviceId : 0,
                maritalStatus : maritalStatus ? maritalStatus : "NA",
                nationality : nationality ? nationality : "NA",
                overallExperience : overallExperience ? overallExperience : "NA",
                qualifications : qualifications ? qualifications : "NA",
                emergencyContact : emergencyContact ? emergencyContact : "NA",
                managerId : managerId ? managerId : "NA",
                teamLeadId : teamLeadId ? teamLeadId : "NA",
                leaveBalance,
                role : role ? role : "Employee",
                shiftTime,
                loginPassword : loginPassword ? loginPassword : "12345",
                workingDays: workingDays ? workingDays : "5",
                pancardNo: pancardNo ? pancardNo : "NA"
            });
            //   console.log('body-data',req.body)
            const savedEmployee = await newEmployee.save();  
            return res.status(201).json({
                statusCode: 201,
                statusValue: "SUCCESS",
                message: "Employee added successfully",  
                data: savedEmployee,
            });
        }

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Validation error",
                error: error.message,
            });
        }
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error adding employee",
            error: error.message,
        });
    }
};

const employeeLogin = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().required(),
            password: Joi.string().required(),
        });
        let result = schema.validate(req.body);
        if (result.error) {
            return res.status(200).json({
                status: 0,
                statusCode: 400,
                message: result.error.details[0].message,
            });
        }

        // Find user by email
        const employee = await employeeModel.findOne({ $or:[{email: req.body.email},{employeeId:req.body.email}] });
        if (!employee) {
            return res.status(404).json(
                { 
                    statusCode:400,
                    statusValue: "FAIL",
                    message: "User not found" 
                }
            );
        }

        // Compare password
        const isMatch = await employee.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(401).json({ 
                statusCode:400,
                statusValue: "FAIL",
                message: "Invalid credentials." 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { employeeId: employee.employeeId, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: "15d" }
        );
        
        // dept data
         // Fetch department data based on employee's departmentId
        const deptData = await departmentModel.findOne({ departmentId: employee.departmentId });
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Login successful",
            token,
            data: {
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                role: employee.role,
                email: employee.email,
                contactNo: employee.contactNo,
                designation:employee.designation,
                gender:employee.gender,
                // departmentName: deptData.departmentName || "Department not assigned",
                token,

            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error in login.",
            error: error.message,
        });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Add token to blacklist
        blacklist.add(token);

        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Logout successful",
        });
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error in logout.",
            error: error.message,
        });
    }
};



const updateEmployeeById = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const updateData = req.body;
        console.log(req.body)
        // Validate employeeId
        if (!employeeId) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Employee ID is required",
            });
        }
        // Update the employee details
        if (req.body.email || req.body.employeeId || req.body.loginPassword) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "EmployeeId, Email and Login Password can't be change.",
            });
        }
        const updatedEmployee = await employeeModel.findOneAndUpdate(
            { employeeId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: `Employee with ID ${employeeId} not found`,
            });
        }

        // Success response
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Employee updated successfully",
            data: updatedEmployee,
        });
    } catch (error) {
        console.error(error);

        // Error response
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error updating employee",
            error: error.message,
        });
    }
};

const getEmployeeListByManagerId = async (req, res) => {
    try {
        // Extract pagination parameters from the request query
        const { page = 1, limit = 10 } = req.query;

        // Ensure `page` and `limit` are integers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

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
        // Calculate the total number of employees
        const totalCount = await employeeModel.countDocuments({managerId: decoded.employeeId});

        if (totalCount === 0) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "No employees found.",
            });
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limitNumber);

        // Retrieve paginated employee records
        const employees = await employeeModel
            .find({managerId:decoded.employeeId})
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        // Success response
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Employee list retrieved successfully.",
            data: employees,
            totalRecords: totalCount,
            totalPages,
            currentPage: pageNumber,
            limit: limitNumber,
        });
    } catch (error) {
        console.error(error);

        // Error response
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error retrieving employee list.",
            error: error.message,
        });
    }
};


const getAllEmployeeList = async (req, res) => {
    try {
        // Extract pagination parameters from the request query
        const { page = 1, limit = 10 } = req.query;

        // Ensure `page` and `limit` are integers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        // Calculate the total number of employees
        const totalCount = await employeeModel.countDocuments();

        if (totalCount === 0) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "No employees found.",
            });
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limitNumber);

        // Retrieve paginated employee records
        const employees = await employeeModel
            .find({})
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        // Success response
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Employee list retrieved successfully.",
            data: employees,
            totalRecords: totalCount,
            totalPages,
            currentPage: pageNumber,
            limit: limitNumber,
        });
    } catch (error) {
        console.error(error);

        // Error response
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error retrieving employee list.",
            error: error.message,
        });
    }
};



const getEmpDetailsById = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "No employees found.",
            });
        }

        const employee = await employeeModel.findOne({ employeeId: Number(employeeId) }, { __v: 0 })
        if (employee) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Employee list retrieved successfully.",
                data: employee
            });
        }
        // Success response
        return res.status(400).json({
            statusCode: 400,
            statusValue: "FAIL",
            message: "Employee data not found.",
        });
    } catch (error) {
        console.error(error);
        // Error response
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error retrieving employee list.",
            error: error.message,
        });
    }
};


const getTodayOnleaveList = async (req, res) => {
    try {
        const leaveData = await leaveTakenHistoryModel.find({status:"Approved"},{employeeId:1, leaveType:1, leaveStartDate:1, leaveEndDate:1});
        const currentDate = new Date().toISOString().split('T')[0];

        const employeesOnLeave = leaveData
        .filter(leave => 
            new Date(currentDate) >= new Date(leave.leaveStartDate) &&
            new Date(currentDate) <= new Date(leave.leaveEndDate)
        )
        .map(leave => leave.employeeId);

        const employeeIds = [...new Set(employeesOnLeave)]
        if (employeeIds.length < 1) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Employee data not found.",
            });
        }
        const empList = await employeeModel.find({employeeId:{$in: employeeIds}},{employeeId:1,employeeName:1,gender:1,designation:1,employeePhoto:1})
        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Today on leave Employee list retrieved successfully.",
            data: empList
        });
    } catch (error) {
        console.error(error);
        // Error response
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error retrieving employee list.",
            error: error.message,
        });
    }
};

const deleteEmpById = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "No employees found.",
            });
        }

        const employee = await employeeModel.findOne({ employeeId: employeeId }, { __v: 0 })
        if (!employee) {
            return res.status(400).json({
                statusCode: 400,
                statusValue: "FAIL",
                message: "Employee data not found.",
            });
        }
        const deleteDoc = await employeeModel.findOneAndDelete({ employeeId: employeeId });
        if (deleteDoc) {
            return res.status(200).json({
                statusCode: 200,
                statusValue: "SUCCESS",
                message: "Employee deleted successfully.",
                data: deleteDoc
            });
        }

    } catch (error) {
        console.error(error);
        // Error response
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Error deleting employee list.",
            error: error.message,
        });
    }
};


const resetForgetPassword = async (req, res) => {
    try {
      const schema = Joi.object({
        email: Joi.string().required(),
      })
      let result = schema.validate(req.body);
      if (result.error) {
        return res.status(400).json({
          statusCode: 400,
          statusValue: "FAIL",
          message: result.error.details[0].message,
        });
      };

      const checkUser = await employeeModel.findOne({email:req.body.email});
      
      if (!checkUser) {
        return res.status(404).json({
            message: 'User not found ! You have entered wrong email id',
            statusCode: 404,
            statusValue: false
        });
      }

      var otp = Math.floor(1000 + Math.random() * 9000);
      const saveOtp = await employeeModel.findOneAndUpdate(
        { email: req.body.email },
        {
            $set: {
                otp: otp.toString(),
                isOtpVerified: false,
            },
        },
        { new: true } // Returns the updated document
      );
      //   await sendOtp(checkUser.email, otp)
    res.status(200).json({
        statusCode: 200,                   
        statusValue: "SUCCESS",
        message: "OTP has been sent successfully to your registered email.",
        otp
      });
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        statusValue: "FAIL",
        message: "Internal server error.",
        data: {
          generatedTime: new Date(),
          errMsg: err.stack,
        }
      });
    }
  }
  
  
  const verifyOtp = async (req, res) => {
    try {
      // console.log(req.body)
      const schema = Joi.object({
        otp: Joi.string().required(),
      })
      let result = schema.validate(req.body);
      if (result.error) {
        return res.status(400).json({
          statusCode: 400,
          statusValue: "FAIL",
          message: result.error.details[0].message,
        })
      }
      // console.log()
      const checkOtp = await employeeModel.find({ otp:req.body.otp });
      if (checkOtp.length<1) {
        console.log('Invalid OTP.');
        // Handle invalid OTP
        return res.status(400).json({
            message: 'You have entered invalid or expired OTP',
            statusCode: 400,
            statusValue: false
        });
    } else {
        const updatedUser = await employeeModel.findOneAndUpdate(
            { otp: req.body.otp }, // Ensure the OTP matches exactly
            { $set: { isOtpVerified: true } }, // Set isOtpVerified to true
            { new: true } // Return the updated document
        );
        if (!updatedUser) {
            console.log('Invalid or expired OTP provided.');
            return res.status(400).json({
                message: 'Invalid or expired OTP.',
                statusCode: 400,
                statusValue: false,
            });
        }
        console.log('User updated successfully:', updatedUser);
        return res.status(200).json({
                message: 'OTP verified successfully.',
                statusCode: 200,
                statusValue: true,
                user: updatedUser,
            });
        }
      
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        statusValue: "FAIL",
        message: "Internal server error.",
        data: {
          generatedTime: new Date(),
          errMsg: err.stack,
        }
      });
    }
  }
  
  
  const generateNewPassword = async (req, res) => {
    try {
        const { email, loginPassword } = req.body;

        // Generate new password hash
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(loginPassword, salt);

        // Update the user's password
        const updatedUser = await employeeModel.findOneAndUpdate(
            { email },
            { loginPassword: hashedPassword },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({
                statusCode: 404,
                statusValue: "FAIL",
                message: "User not found. Unable to update password.",
            });
        }

        return res.status(200).json({
            statusCode: 200,
            statusValue: "SUCCESS",
            message: "Password updated successfully.",
            data: updatedUser,
        });
    } catch (err) {
        console.error("Error generating new password:", err);
        return res.status(500).json({
            statusCode: 500,
            statusValue: "FAIL",
            message: "Internal server error.",
            data: {
                generatedTime: new Date(),
                errorMessage: err.message,
            },
        });
    }
};

  



module.exports = {
    registerEmployee,
    updateEmployeeById,
    getAllEmployeeList,
    employeeLogin,
    logout,
    getEmpDetailsById,
    deleteEmpById,
    getEmployeeListByManagerId,
    resetForgetPassword,
    verifyOtp,
    generateNewPassword,
    getTodayOnleaveList
}