const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

console.log("Attendance Routes Loaded");

// Test Route
router.get("/test", (req, res) => {
  res.send("Attendance route working");
});

// Mark attendance only once per day
router.post("/mark", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const alreadyMarked = await Attendance.findOne({
      studentId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (alreadyMarked) {
      return res.status(400).json({
        message: "Attendance already marked for today",
      });
    }

    const attendance = new Attendance({
      studentId,
      status: "Present",
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.log("Attendance Error:", error.message);

    res.status(500).json({
      message: "Error marking attendance",
      error: error.message,
    });
  }
});

// Get today's unique attendance count
router.get("/count", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.distinct("studentId", {
      status: "Present",
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json({
      count: attendance.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance count",
      error: error.message,
    });
  }
});

// Get today's present student IDs
router.get("/today", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const presentStudentIds = await Attendance.distinct("studentId", {
      status: "Present",
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json({
      presentStudentIds,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching today's attendance",
      error: error.message,
    });
  }
});

// Get attendance history
router.get("/history", async (req, res) => {
  try {
    const history = await Attendance.find()
      .populate("studentId", "name rollNumber email department")
      .sort({ date: -1 });

    res.status(200).json({
      history,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance history",
      error: error.message,
    });
  }
});

module.exports = router;