const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGO_URI; // Your MongoDB connection string

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    throw err;
  }
};

module.exports = connectToMongoDB;
