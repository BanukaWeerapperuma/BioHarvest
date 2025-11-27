import React, { useContext, useEffect } from "react";
import "./Login.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import adminUser from "../../adminUser.json";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken } = useContext(StoreContext);
  const [data, setData] = useState({
    username: "",
    password: "",
  });
  const hasCredentials = localStorage.getItem("adminUsername") && 
                         localStorage.getItem("adminPassword") && 
                         localStorage.getItem("adminPosition");
  const [showSetup, setShowSetup] = useState(!hasCredentials);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const adminPositions = [
    "Administrator",
    "Operations Manager",
    "Content Manager",
    "Product Manager",
    "Marketing Manager",
    "Customer Support Manager",
    "IT Administrator",
    "Finance Manager"
  ];

  const [setupData, setSetupData] = useState({
    username: localStorage.getItem("adminUsername") || adminUser.defaultUsername,
    password: "",
    confirmPassword: "",
    position: localStorage.getItem("adminPosition") || "",
    email: localStorage.getItem("adminEmail") || ""
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSetupChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setSetupData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    const adminUsername = localStorage.getItem("adminUsername") || adminUser.defaultUsername;
    const adminPassword = localStorage.getItem("adminPassword");
    
    if (data.username === adminUsername && data.password === adminPassword) {
      // Use local authentication for admin panel
      setToken("admin-token");
      setAdmin(true);
      localStorage.setItem("token", "admin-token");
      localStorage.setItem("admin", "true");
      toast.success("Admin Login Successfully");
      navigate("/add");
    } else {
      toast.error("Invalid username or password");
    }
  };

  const onSetup = (event) => {
    event.preventDefault();
    if (setupData.password.length < 3) {
      toast.error("Password must be at least 3 characters");
      return;
    }
    if (setupData.password !== setupData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (setupData.username.length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }
    if (!setupData.position || setupData.position.trim().length < 2) {
      toast.error("Please enter your position (min 2 characters)");
      return;
    }
    if (!setupData.email) {
      toast.error("Please enter your email address");
      return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(setupData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    localStorage.setItem("adminUsername", setupData.username);
    localStorage.setItem("adminPassword", setupData.password);
    localStorage.setItem("adminPosition", setupData.position.trim());
    localStorage.setItem("adminEmail", setupData.email.trim());
    toast.success("Admin credentials set successfully");
    setShowSetup(false);
  };


  useEffect(() => {
    if (admin && token) {
      navigate("/add");
    }
  }, []);

  // ForgotPasswordForm component
  const ForgotPasswordForm = ({ onBack }) => {
    const { url } = useContext(StoreContext);
    const [forgotData, setForgotData] = useState({
      username: "",
      email: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onForgotChange = (event) => {
      const name = event.target.name;
      const value = event.target.value;
      setForgotData((data) => ({ ...data, [name]: value }));
    };

    const onForgotPassword = async (event) => {
      event.preventDefault();
      
      if (!forgotData.username) {
        toast.error("Please enter your username");
        return;
      }

      if (!forgotData.email) {
        toast.error("Please enter your email address");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Verify username exists
      const storedUsername = localStorage.getItem("adminUsername");
      if (!storedUsername || storedUsername !== forgotData.username.trim()) {
        toast.error("Username not found. Please check your username and try again.");
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await axios.post(`${url}/api/admin/forgot-password`, {
          username: forgotData.username,
          email: forgotData.email
        });

        if (response.data.success) {
          // Clear the password so user needs to set up new credentials
          localStorage.removeItem("adminPassword");
          toast.success("Password reset instructions have been sent to your email. Please check your Gmail.");
          toast.info("Your password has been cleared. You will need to set up new credentials when you log in.");
          onBack();
        } else {
          toast.error(response.data.message || "Failed to send password reset email");
        }
      } catch (error) {
        console.error("Forgot password error:", error);
        const errorMessage = error.response?.data?.message || error.message || "Error sending password reset email. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={onForgotPassword} className="login-popup-inputs">
        <input
          name="username"
          onChange={onForgotChange}
          value={forgotData.username}
          type="text"
          placeholder="Your username"
          required
        />
        <input
          name="email"
          onChange={onForgotChange}
          value={forgotData.email}
          type="email"
          placeholder="Your email address"
          required
        />
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Instructions"}
          </button>
          <button type="button" onClick={onBack} className="forgot-password-btn">
            Back to Login
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="login-popup">
      {showSetup ? (
        <form onSubmit={onSetup} className="login-popup-container">
          <div className="login-popup-title">
            <h2>Sign Up - Admin Registration</h2>
          </div>
          <div className="login-popup-inputs">
            <input
              name="username"
              onChange={onSetupChange}
              value={setupData.username}
              type="text"
              placeholder="Admin username"
              required
            />
            <input
              name="password"
              onChange={onSetupChange}
              value={setupData.password}
              type="password"
              placeholder="Admin password"
              required
            />
            <input
              name="confirmPassword"
              onChange={onSetupChange}
              value={setupData.confirmPassword}
              type="password"
              placeholder="Confirm password"
              required
            />
            <input
              name="email"
              onChange={onSetupChange}
              value={setupData.email}
              type="email"
              placeholder="Gmail address"
              required
            />
            <select
              name="position"
              onChange={onSetupChange}
              value={setupData.position}
              className="position-select"
              required
            >
              <option value="">Select Admin Position</option>
              {adminPositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Sign Up</button>
          {hasCredentials && (
            <button 
              type="button" 
              className="signup-btn"
              onClick={() => setShowSetup(false)}
            >
              Back to Login
            </button>
          )}
        </form>
      ) : showForgotPassword ? (
        <div className="login-popup-container">
          <div className="login-popup-title">
            <h2>Forgot Password</h2>
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Enter your username and email address. We'll send you instructions to reset your password.
          </p>
          <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
        </div>
      ) : (
        <form onSubmit={onLogin} className="login-popup-container">
          <div className="login-popup-title">
            <h2>Admin Login</h2>
          </div>
          <div className="login-popup-inputs">
            <input
              name="username"
              onChange={onChangeHandler}
              value={data.username}
              type="text"
              placeholder="Your username"
              required
            />
            <input
              name="password"
              onChange={onChangeHandler}
              value={data.password}
              type="password"
              placeholder="Your password"
              required
            />
          </div>
          <button type="submit">Login</button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="button" 
              className="forgot-password-btn"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
            <button 
              type="button" 
              className="signup-btn"
              onClick={() => setShowSetup(true)}
            >
              Sign Up as Admin
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Login; 