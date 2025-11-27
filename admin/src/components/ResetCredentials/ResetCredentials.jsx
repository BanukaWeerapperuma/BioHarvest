import React, { useState } from "react";
import "./ResetCredentials.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";

const ResetCredentials = () => {
  const navigate = useNavigate();
  const { url } = useContext(StoreContext);
  const [data, setData] = useState({
    currentPassword: "",
    email: localStorage.getItem("adminEmail") || "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isResetting, setIsResetting] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onReset = async (event) => {
    event.preventDefault();
    
    if (!data.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!data.email) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!data.newPassword) {
      toast.error("Please enter your new password");
      return;
    }

    if (data.newPassword.length < 3) {
      toast.error("New password must be at least 3 characters");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const adminPassword = localStorage.getItem("adminPassword");
    
    if (data.currentPassword !== adminPassword) {
      toast.error("Incorrect current password. Please try again.");
      return;
    }

    setIsResetting(true);

    try {
      // Call backend API to send password reset email
      const response = await axios.post(`${url}/api/admin/reset-credentials`, {
        email: data.email,
        username: localStorage.getItem("adminUsername")
      });

      if (response.data.success) {
        // Update password with new password
        localStorage.setItem("adminPassword", data.newPassword);
        // Update email if changed
        localStorage.setItem("adminEmail", data.email);
        
        toast.success("Password reset successful! Email notification has been sent to your Gmail.");
        toast.info("Your password has been updated. You can now log in with your new password.");
        navigate("/add");
      } else {
        toast.error(response.data.message || "Failed to reset credentials");
      }
    } catch (error) {
      console.error("Reset credentials error:", error);
      console.error("Error response:", error.response?.data);
      
      // Get error message from response
      const errorMessage = error.response?.data?.message || error.message || "Error resetting credentials. Please try again.";
      
      // Check if it's an email configuration error
      if (error.response?.data?.error === 'Email configuration missing' || 
          errorMessage.includes('Email service is not configured') ||
          errorMessage.includes('SMTP_USER') ||
          errorMessage.includes('SMTP_PASS')) {
        toast.error("Email service is not configured. Please set up SMTP_USER and SMTP_PASS in the backend .env file.");
        toast.warning("Note: Credentials reset requires email configuration. Contact your system administrator.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="reset-credentials">
      <form onSubmit={onReset} className="reset-credentials-container">
        <div className="reset-credentials-title">
          <h2>Reset Admin Credentials</h2>
          <p>Enter your current password, email, and set a new password</p>
        </div>
        <div className="reset-credentials-inputs">
          <input
            name="currentPassword"
            onChange={onChangeHandler}
            value={data.currentPassword}
            type="password"
            placeholder="Current Password"
            required
          />
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your Email Address"
            required
          />
          <input
            name="newPassword"
            onChange={onChangeHandler}
            value={data.newPassword}
            type="password"
            placeholder="New Password"
            required
          />
          <input
            name="confirmPassword"
            onChange={onChangeHandler}
            value={data.confirmPassword}
            type="password"
            placeholder="Confirm New Password"
            required
          />
        </div>
        <div className="reset-credentials-actions">
          <button type="submit" disabled={isResetting}>
            {isResetting ? "Resetting..." : "Reset Credentials"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetCredentials;

