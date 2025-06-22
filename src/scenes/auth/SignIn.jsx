import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import logo from '../../assets/react.svg';


function SignIn() {
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
              🎯 Proven expertise
            </div>
            <div className="feature-description">
              Trusted by 250+ corporate clients across India, Saudi Arabia, Qatar, and Bangladesh for comprehensive safety solutions.
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-title">
              🏆 International standards
            </div>
            <div className="feature-description"> 
              NEBOSH, OSHA, IOSH certified training programs that meet global workplace safety requirements.
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-title">
              🎓 15+ years of excellence
            </div>
            <div className="feature-description"> 
              Established reputation since 2010 in delivering world-class safety education and professional development.
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-title">
              🛡️ Complete safety ecosystem 
            </div>
            <div className="feature-description">
              From training and consultancy to audit services and recruitment - your one-stop safety partner. 
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
              <span className="brand-safety">Safety</span>
              <span className="brand-catch">Catch</span>
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

            
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;