import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import logo from '../../assets/react.svg';
import { Typography } from "@mui/material";


function SignIn({isAccountant}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }
    if (isAccountant) {
      navigate("/manage");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="signin-container">
      {/* Left Features Section */}
      <div className="features-section">
        <div className="features-content">
          <div className="feature-item">
            <div className="feature-title">
              Built with React.js frontend and Supabase backend for scalability.
            </div>
            <div className="feature-description">
              Features notes and reminders to keep track of client interactions.
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-title">
              Role-Based Access
            </div>
            <div className="feature-description"> 
              Includes role-based dashboards for different types of users.
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-title">
              Offers interactive charts and graphs for visualizing lead data.
            </div>
            <div className="feature-description"> 
             Visualizing and providing proper analysis using nivo charts
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-title">
              CRUD Operations with Extra Features
            </div>
            <div className="feature-description">
              Provides lead management with filtering, sorting, and reminders.
            </div>
          </div>
        </div>
      </div>

      {/* Right Sign-in Form */}
      <div className="form-section">
        <div className="form-container">
          {/* Brand Header */}
          <div className="brand-header">
            {/* Logo Container */}
            <div className="logo-container">
              
              <img src={logo} alt="SafetyCatch Logo" className="brand-logo" />

            </div>
            
            {/* Brand Name */}
            <h1 className="brand-title">
              <span className="brand-safety">CRM</span>
              {/* <span className="brand-catch">Catch</span> */}
            </h1>
            
            {/* Subtitle */}
            <p className="brand-subtitle">Customer Relationship Management</p>
          </div>

          <form className="signin-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-field">
              <input
                className="form-input"
                type="email"
                id="email"
                name="email"
                placeholder=" "
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
            </div>

            <div className="form-field">
              <input
                className="form-input"
                type="password"
                id="password"
                name="password"
                placeholder=" "
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="form-label" htmlFor="password">
                Password
              </label>
            </div>

            <div className="remember-container">
              <input
                className="remember-checkbox"
                type="checkbox"
                id="remember"
                name="remember"
              />
              <label className="remember-label" htmlFor="remember">
                Remember me
              </label>
            </div>

            <button
              className="signin-button"
              type="button"
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <Typography variant="body2" sx={{ mt: 2 }}>
  <a href="/forgot-password">Forgot Password?</a>
</Typography>

            
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;