const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  time: {
    type: String, 
    required: true
  },
  locality: {
    type: String,
    default: ''
  },
  subLocality: {
    type: String,
    default: ''
  },
  duration: {
    type: String, 
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  }
}, { _id: false }); 

const employeeLocationSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
  },
  attendanceDate: {
    type: String, 
    required: true
  },
  location: {
    type: [locationSchema],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('empLocation', employeeLocationSchema);
