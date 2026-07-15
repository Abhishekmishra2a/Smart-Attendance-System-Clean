const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

console.log("Student Routes Loaded");

// ======================
// Register Student
// ======================
router.post("/add", async (req, res) => {
  try {
    const { name, rollNumber, email, department, image } = req.body;

    if (!name || !rollNumber || !email || !department || !image) {
      return res.status(400).json({
        message: "All fields and face photo are required",
      });
    }

    const rollRegex = /^221CS\d{2,3}$/;

    if (!rollRegex.test(rollNumber)) {
      return res.status(400).json({
        message: "Roll number format must be like 221CS01",
      });
    }

    const existingRoll = await Student.findOne({ rollNumber });

    if (existingRoll) {
      return res.status(400).json({
        message: "Roll number already exists",
      });
    }

    const existingEmail = await Student.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const student = new Student({
      name,
      rollNumber,
      email,
      department,
      image,
    });

    await student.save();

    res.status(201).json({
      message: "Student registered successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering student",
      error: error.message,
    });
  }
});

// ======================
// Get All Students
// ======================
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();

    res.status(200).json({
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching students",
      error: error.message,
    });
  }
});

// ======================
// Update Student
// ======================
router.put("/:id", async (req, res) => {
  try {
    const { name, rollNumber, email, department } = req.body;

    if (!name || !rollNumber || !email || !department) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const rollRegex = /^221CS\d{2,3}$/;

    if (!rollRegex.test(rollNumber)) {
      return res.status(400).json({
        message: "Roll number format must be like 221CS01",
      });
    }

    const existingRoll = await Student.findOne({
      rollNumber,
      _id: { $ne: req.params.id },
    });

    if (existingRoll) {
      return res.status(400).json({
        message: "Roll number already exists",
      });
    }

    const existingEmail = await Student.findOne({
      email,
      _id: { $ne: req.params.id },
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        rollNumber,
        email,
        department,
      },
      {
        new: true,
      }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating student",
      error: error.message,
    });
  }
});

// ======================
// Delete Student
// ======================
router.delete("/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    const deletedStudent = await Student.findByIdAndDelete(studentId);

    if (!deletedStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    await Attendance.deleteMany({
      studentId,
    });

    res.status(200).json({
      message: "Student and attendance records deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting student",
      error: error.message,
    });
  }
});

module.exports = router;