import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("isLoggedIn");
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("isLoggedIn", "true");
      navigate("/dashboard");
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-left">
          <h1>WELCOME!</h1>
          <p>Smart Attendance & Face Recognition System</p>
          <span>AI Powered Admin Portal</span>
        </div>

        <div className="login-right">
          <h2>Admin Login</h2>

          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>LOGIN</button>
        </div>
      </div>
    </div>
  );
}

export default Login;