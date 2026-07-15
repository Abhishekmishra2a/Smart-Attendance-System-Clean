import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function AttendanceHistory() {
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance/history");
      setHistory(res.data.history);
    } catch (error) {
      alert("Error fetching history");
    }
  };

  const filteredHistory = history
    .filter((item) => item.studentId)
    .filter((item) => {
      if (!selectedDate) return true;
      const recordDate = new Date(item.date).toISOString().split("T")[0];
      return recordDate === selectedDate;
    })
    .filter((item) => {
      const search = searchTerm.toLowerCase();
      return (
        item.studentId?.name?.toLowerCase().includes(search) ||
        item.studentId?.rollNumber?.toLowerCase().includes(search) ||
        item.studentId?.department?.toLowerCase().includes(search)
      );
    });

  const exportExcel = () => {
    if (filteredHistory.length === 0) {
      alert("No attendance records to export");
      return;
    }

    const excelData = filteredHistory.map((item) => ({
      Name: item.studentId?.name,
      "Roll Number": item.studentId?.rollNumber,
      Department: item.studentId?.department,
      Date: new Date(item.date).toLocaleDateString(),
      Time: new Date(item.date).toLocaleTimeString(),
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    const fileName = selectedDate
      ? `Attendance_${selectedDate}.xlsx`
      : "Attendance_All_Records.xlsx";

    saveAs(file, fileName);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-navbar">
        <h2>Attendance History</h2>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>
      </div>

      <div className="table-box">
        <h2>Attendance Records</h2>

        <h3 style={{ color: "#00d4ff" }}>
          Total Records: {filteredHistory.length}
        </h3>

        <input
          type="text"
          placeholder="🔍 Search by name, roll no or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "95%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "1px solid #00d4ff",
            background: "transparent",
            color: "white",
            outline: "none",
          }}
        />

        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <label style={{ marginRight: "10px", color: "#00d4ff" }}>
            📅 Select Date:
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #00d4ff",
              background: "transparent",
              color: "white",
            }}
          />

          <button
            onClick={() => {
              setSelectedDate("");
              setSearchTerm("");
            }}
            style={{
              marginLeft: "10px",
              background: "#ef4444",
              color: "white",
            }}
          >
            Clear Filter
          </button>

          <button
            onClick={exportExcel}
            style={{
              marginLeft: "10px",
              background: "#22c55e",
              color: "white",
            }}
          >
            📥 Export Excel
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll No</th>
              <th>Department</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <tr key={item._id}>
                  <td>{item.studentId?.name}</td>
                  <td>{item.studentId?.rollNumber}</td>
                  <td>{item.studentId?.department}</td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{new Date(item.date).toLocaleTimeString()}</td>
                  <td style={{ color: "#22c55e", fontWeight: "bold" }}>
                    ✅ {item.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ color: "#94a3b8" }}>
                  No attendance record found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendanceHistory;