import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";

function RegisterStudent() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState("");

  const [student, setStudent] = useState({
    name: "",
    rollNumber: "",
    email: "",
    department: "",
  });

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]:
        e.target.name === "rollNumber"
          ? e.target.value.toUpperCase()
          : e.target.value,
    });
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      alert("Camera not ready. Please allow camera permission.");
      return;
    }

    setImage(imageSrc);
  };

  const handleSubmit = async () => {
    if (
      !student.name ||
      !student.rollNumber ||
      !student.email ||
      !student.department
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!/^221CS\d{2,3}$/.test(student.rollNumber)) {
      alert("Roll Number should be like 221CS01");
      return;
    }

    if (!image) {
      alert("Please capture face photo first.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("https://smart-attendance-backend-te37.onrender.com/api/students/add", {
        ...student,
        image,
      });

      alert(res.data.message);

      setStudent({
        name: "",
        rollNumber: "",
        email: "",
        department: "",
      });

      setImage("");
    } catch (error) {
      alert(error.response?.data?.message || "Error registering student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-navbar">
        <h2>Register Student</h2>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>
      </div>

      <div className="register-container">
        <div className="register-card">
          <h2>👨‍🎓 Student Details</h2>

          <input
            type="text"
            name="name"
            placeholder="Student Name"
            value={student.name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="rollNumber"
            placeholder="Example: 221CS01"
            value={student.rollNumber}
            onChange={handleChange}
            maxLength={8}
          />

          <input
            type="email"
            name="email"
            placeholder="Student Email"
            value={student.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={student.department}
            onChange={handleChange}
          />

          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            Roll Number format: <b style={{ color: "#00d4ff" }}>221CS01</b>
          </p>

          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Registering..." : "✅ Register Student"}
          </button>
        </div>

        <div className="camera-card">
          <h2>📷 Face Capture</h2>

          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={350}
            videoConstraints={{
              facingMode: "user",
            }}
          />

          <button onClick={capture}>📷 Capture Face</button>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "10px",
              fontSize: "14px",
            }}
          >
            Keep your face straight and ensure good lighting.
          </p>

          {image && (
            <>
              <h3 style={{ marginTop: "20px", color: "#00d4ff" }}>
                Captured Preview
              </h3>

              <img
                src={image}
                alt="Captured Face"
                className="preview-image"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterStudent;