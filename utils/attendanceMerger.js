const AttendanceLogModel = require("../models/attendanceLogModel");
const AttendanceLogForOutDuty = require("../models/attendanceLogModelForOutDuty");
const EmployeeModel = require("../models/employeeModel");
const moment = require("moment");

async function mergeAttendanceForAll() {
  try {
    console.log("🚀 Starting mergeAttendanceForAll...");

    // Get last 10 days range
    const tenDaysAgo = moment().subtract(10, "days").startOf("day").toDate();

    // Step 1: collect all distinct employee/date pairs from both collections (only last 10 days)
    const mainPairs = await AttendanceLogModel.aggregate([
      { $match: { AttendanceDate: { $gte: tenDaysAgo } } },
      {
        $project: {
          EmployeeCode: 1,
          AttendanceDate: { $dateToString: { format: "%Y-%m-%d", date: "$AttendanceDate" } }
        }
      },
      { $group: { _id: { EmployeeCode: "$EmployeeCode", AttendanceDate: "$AttendanceDate" } } }
    ]);

    const outDutyPairs = await AttendanceLogForOutDuty.aggregate([
      { $match: { AttendanceDate: { $gte: tenDaysAgo } } },
      {
        $project: {
          EmployeeCode: 1,
          AttendanceDate: { $dateToString: { format: "%Y-%m-%d", date: "$AttendanceDate" } }
        }
      },
      { $group: { _id: { EmployeeCode: "$EmployeeCode", AttendanceDate: "$AttendanceDate" } } }
    ]);

    // merge both sets of keys
    const allPairs = [
      ...new Map([...mainPairs, ...outDutyPairs].map(p => [`${p._id.EmployeeCode}_${p._id.AttendanceDate}`, p._id])).values()
    ];

    console.log(`🔎 Found ${allPairs.length} employee-date pairs in last 10 days`);

    const results = [];

    // Step 2: iterate each pair
    for (const pair of allPairs) {
      const { EmployeeCode, AttendanceDate } = pair;

      const start = moment(AttendanceDate).startOf("day").toDate();
      const end = moment(AttendanceDate).endOf("day").toDate();

      const mainLog = await AttendanceLogModel.findOne({
        EmployeeCode,
        AttendanceDate: { $gte: start, $lte: end }
      });

      const outDutyLogs = await AttendanceLogForOutDuty.find({
        EmployeeCode,
        AttendanceDate: { $gte: start, $lte: end }
      });

      // Case 3 → only main
      if (!outDutyLogs.length && mainLog) {
        console.log(`➡️ Skipping ${EmployeeCode} on ${AttendanceDate} (only in Main)`);
        results.push(mainLog);
        continue;
      }

      if (outDutyLogs.length && !mainLog) {
  console.log(`🆕 Inserting new doc for ${EmployeeCode} on ${AttendanceDate}`);

  // Fetch employee data
  const emp = await EmployeeModel.findOne({ employeeId: EmployeeCode });
  if (!emp) {
    console.warn(`⚠️ Employee not found: ${EmployeeCode}`);
    continue; // skip if employee data not found
  }

  let newDoc = {
    AttendanceLogId: Date.now(), // random unique ID
    EmployeeCode,
    AttendanceDate: start,
    ShiftId: 0,
    EmployeeId: emp.employeeId,
    CategoryId: 0,
    Gender: emp.gender,
    EmployeeName: emp.employeeName,
    Duration: 0,
    InTime: null,
    OutTime: null,
    PunchRecords: ""
  };

  for (const out of outDutyLogs) {
    newDoc.Duration += parseInt(out.Duration || 0, 10);
    if (!newDoc.InTime || moment(out.InTime).isBefore(moment(newDoc.InTime))) {
      newDoc.InTime = out.InTime;
    }
    if (!newDoc.OutTime || moment(out.OutTime).isAfter(moment(newDoc.OutTime))) {
      newDoc.OutTime = out.OutTime;
    }
    newDoc.PunchRecords += (out.PunchRecords || "");
  }

  const inserted = await AttendanceLogModel.create(newDoc);
  results.push(inserted);
}

      // Case 2 → merge + update
      if (outDutyLogs.length && mainLog) {
        console.log(`🔄 Updating doc for ${EmployeeCode} on ${AttendanceDate}`);

        let merged = mainLog.toObject();

        for (const out of outDutyLogs) {
          merged.Duration = (merged.Duration || 0) + parseInt(out.Duration || 0, 10);

          if (!merged.InTime || moment(out.InTime).isBefore(moment(merged.InTime))) {
            merged.InTime = out.InTime;
          }

          if (!merged.OutTime || moment(out.OutTime).isAfter(moment(merged.OutTime))) {
            merged.OutTime = out.OutTime;
          }

          merged.PunchRecords = (merged.PunchRecords || "") + (out.PunchRecords || "");
        }

        const updatedDoc = await AttendanceLogModel.findByIdAndUpdate(
          mainLog._id,
          { $set: merged },
          { new: true }
        );
        results.push(updatedDoc);
      }
    }

    console.log("✅ mergeAttendanceForAll (last 10 days) completed");
    return results;
  } catch (err) {
    console.error("❌ Error in mergeAttendanceForAll:", err);
    throw err;
  }
}

module.exports = { mergeAttendanceForAll };
