const AttendanceLogModel = require('../models/attendanceLogModel');

const resolvers = {
  Query: {
    attendanceLogs: async (
      _,
      { employeeCode, employeeId, dateFrom, dateTo, page = 1, limit = 20 }
    ) => {
      const filter = {};
      // Only one of employeeCode or employeeId should be used for filtering
      if (employeeCode) {
        filter.EmployeeCode = employeeCode;
      } else if (employeeId !== undefined && employeeId !== null) {
        filter.EmployeeId = Number(employeeId);
      }
      if (dateFrom && dateTo) {
        filter.AttendanceDate = {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo)
        };
      }
      const skip = (page - 1) * limit;
      return AttendanceLogModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ AttendanceDate: -1 });
    }
  },
  AttendanceLog: {
    id: (parent) => parent._id.toString(),
    AttendanceDate: (parent) => parent.AttendanceDate?.toISOString().split('T')[0],
  }
};

module.exports = resolvers;