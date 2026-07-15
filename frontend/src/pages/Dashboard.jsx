import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();

  const [totalStudents, setTotalStudents] = useState(0);
  const [students, setStudents] = useState([]);
  const [presentToday, setPresentToday] = useState(0);
  const [presentStudentIds, setPresentStudentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    rollNumber: "",
    email: "",
    department: "",
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      navigate("/");
      return;
    }

    fetchStudents();
    fetchAttendanceCount();
    fetchTodayAttendance();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students");
      setTotalStudents(res.data.count);
      setStudents(res.data.students);
    } catch (error) {
      alert("Error fetching students");
    }
  };

  const fetchAttendanceCount = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance/count");
      setPresentToday(res.data.count);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance/today");
      const ids = res.data.presentStudentIds.map((id) => id.toString());
      setPresentStudentIds(ids);
    } catch (error) {
      console.log(error);
    }
  };

  const markPresent = async (studentId) => {
    try {
      const res = await axios.post("http://localhost:5000/api/attendance/mark", {
        studentId,
      });

      alert(res.data.message);
      fetchAttendanceCount();
      fetchTodayAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Error marking attendance");
      fetchTodayAttendance();
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this student?"
      );

      if (!confirmDelete) return;

      const res = await axios.delete(
        `http://localhost:5000/api/students/${studentId}`
      );

      alert(res.data.message);

      fetchStudents();
      fetchAttendanceCount();
      fetchTodayAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Error deleting student");
    }
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      department: student.department,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]:
        e.target.name === "rollNumber"
          ? e.target.value.toUpperCase()
          : e.target.value,
    });
  };

  const updateStudent = async () => {
    try {
      if (
        !editForm.name ||
        !editForm.rollNumber ||
        !editForm.email ||
        !editForm.department
      ) {
        alert("Please fill all fields");
        return;
      }

      if (!/^221CS\d{2,3}$/.test(editForm.rollNumber)) {
        alert("Roll number format must be like 221CS01");
        return;
      }

      const res = await axios.put(
        `http://localhost:5000/api/students/${editingStudent._id}`,
        editForm
      );

      alert(res.data.message);

      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Error updating student");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  const attendancePercentage =
    totalStudents === 0 ? 0 : Math.round((presentToday / totalStudents) * 100);

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();

    return (
      student.name.toLowerCase().includes(search) ||
      student.rollNumber.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search) ||
      student.department.toLowerCase().includes(search)
    );
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-navbar">
        <h2>Smart Attendance System</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>AI Powered Face Recognition Attendance Portal</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>📚 Total Students</h3>
          <p>{totalStudents}</p>
        </div>

        <div className="stat-card">
          <h3>✅ Present Today</h3>
          <p>{presentToday}</p>
        </div>

        <div className="stat-card">
          <h3>❌ Absent Today</h3>
          <p>{totalStudents - presentToday}</p>
        </div>

        <div className="stat-card">
          <h3>📈 Attendance</h3>
          <p>{attendancePercentage}%</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={() => navigate("/register")}>Register Student</button>

        <button
          onClick={() => navigate("/attendance-history")}
          style={{ marginLeft: "15px", background: "#22c55e", color: "white" }}
        >
          Attendance History
        </button>

        <button
          onClick={() => navigate("/face-scan")}
          style={{ marginLeft: "15px", background: "#9333ea", color: "white" }}
        >
          📷 Face Scan
        </button>
      </div>

      {editingStudent && (
        <div className="table-box" style={{ marginBottom: "25px" }}>
          <h2>✏️ Edit Student</h2>

          <input
            type="text"
            name="name"
            placeholder="Student Name"
            value={editForm.name}
            onChange={handleEditChange}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #00d4ff",
              background: "transparent",
              color: "white",
            }}
          />

          <input
            type="text"
            name="rollNumber"
            placeholder="Example: 221CS01"
            value={editForm.rollNumber}
            onChange={handleEditChange}
            maxLength={8}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #00d4ff",
              background: "transparent",
              color: "white",
            }}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={editForm.email}
            onChange={handleEditChange}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #00d4ff",
              background: "transparent",
              color: "white",
            }}
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={editForm.department}
            onChange={handleEditChange}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #00d4ff",
              background: "transparent",
              color: "white",
            }}
          />

          <button onClick={updateStudent}>💾 Update Student</button>

          <button
            onClick={() => setEditingStudent(null)}
            style={{ marginLeft: "10px", background: "#ef4444", color: "white" }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="table-box">
        <h2>Registered Students</h2>

        <input
          type="text"
          placeholder="🔍 Search by name, roll number, email or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "1px solid #00d4ff",
            background: "transparent",
            color: "white",
            outline: "none",
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Roll Number</th>
              <th>Email</th>
              <th>Department</th>
              <th>Attendance</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const isPresent = presentStudentIds.includes(student._id);

                return (
                  <tr key={student._id}>
                    <td>
                      <img
                        src={student.image}
                        alt={student.name}
                        style={{
                          width: "55px",
                          height: "55px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #00d4ff",
                        }}
                      />
                    </td>

                    <td>{student.name}</td>
                    <td>{student.rollNumber}</td>
                    <td>{student.email}</td>
                    <td>{student.department}</td>

                    <td>
                      {isPresent ? (
                        <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                          ✅ Present
                        </span>
                      ) : (
                        <button onClick={() => markPresent(student._id)}>
                          Mark Present
                        </button>
                      )}
                    </td>

                    <td>
                      <button
                        onClick={() => openEditForm(student)}
                        style={{
                          background: "#f59e0b",
                          color: "white",
                          marginRight: "8px",
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => deleteStudent(student._id)}
                        style={{ background: "#ef4444", color: "white" }}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ color: "#94a3b8" }}>
                  No student found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;