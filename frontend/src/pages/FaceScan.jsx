import Webcam from "react-webcam";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function FaceScan() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const [capturedImage, setCapturedImage] = useState("");
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Success Popup
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    color: "#22c55e",
  });

  const capture = async () => {
    try {
      setLoading(true);
      setMatchedStudent(null);

      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        setPopup({
          show: true,
          message: "❌ Camera not ready!",
          color: "#ef4444",
        });

        setTimeout(() => {
          setPopup({ show: false, message: "", color: "#22c55e" });
        }, 3000);

        setLoading(false);
        return;
      }

      setCapturedImage(imageSrc);

      const res = await axios.post("http://localhost:8000/recognize", {
        image: imageSrc,
      });

      if (res.data.success) {
        setMatchedStudent(res.data.student);

        // Success Popup
        setPopup({
          show: true,
          message: `✅ Attendance Marked Successfully\n${res.data.student.name}`,
          color: "#22c55e",
        });

        // Auto Redirect after 3 sec
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        setPopup({
          show: true,
          message: res.data.message || "❌ Face not matched",
          color: "#ef4444",
        });

        setTimeout(() => {
          setPopup({ show: false, message: "", color: "#22c55e" });
        }, 3000);
      }
    } catch (error) {
      setPopup({
        show: true,
        message:
          error.response?.data?.message ||
          "❌ Face recognition error. Please try again.",
        color: "#ef4444",
      });

      setTimeout(() => {
        setPopup({ show: false, message: "", color: "#22c55e" });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-navbar">
        <h2>Face Recognition</h2>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>
      </div>

      <div className="table-box" style={{ textAlign: "center" }}>
        <h2>Scan Face</h2>

        <p style={{ color: "#22c55e" }}>
          ✅ Python DeepFace API Connected
        </p>

        {/* Popup */}
        {popup.show && (
          <div
            style={{
              background: popup.color,
              color: "white",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "bold",
              fontSize: "18px",
              whiteSpace: "pre-line",
            }}
          >
            {popup.message}
          </div>
        )}

        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={450}
          videoConstraints={{
            facingMode: "user",
          }}
        />

        <br />
        <br />

        <button onClick={capture} disabled={loading}>
          {loading ? "Recognizing Face..." : "📷 Capture & Auto Attendance"}
        </button>

        <br />
        <br />

        {capturedImage && (
          <>
            <h3>Captured Face</h3>

            <img
              src={capturedImage}
              alt="Captured"
              width={250}
              style={{
                borderRadius: "10px",
                border: "2px solid #00d4ff",
              }}
            />
          </>
        )}

        {matchedStudent && (
          <div
            style={{
              marginTop: "20px",
              color: "#22c55e",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            ✅ Matched Student: {matchedStudent.name} <br />
            Roll No: {matchedStudent.rollNumber}
          </div>
        )}
      </div>
    </div>
  );
}

export default FaceScan;