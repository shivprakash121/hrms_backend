const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type AttendanceLog {
    id: ID!
    EmployeeName: String!
    EmployeeCode: String
    EmployeeId: Int!
    AttendanceDate: String!
    InTime: String
    OutTime: String
    Duration: Int
    Status: String
    PunchRecords: String
    # Add more fields as needed
  }

  type Query {
    attendanceLogs(
      employeeCode: String
      employeeId: Int
      dateFrom: String
      dateTo: String
      page: Int
      limit: Int
    ): [AttendanceLog]
  }
`;

module.exports = typeDefs;