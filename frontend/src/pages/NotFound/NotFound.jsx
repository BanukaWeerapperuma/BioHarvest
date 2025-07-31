import React from 'react'
import { Link } from 'react-router-dom'
import './NotFound.css'

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-illustration">
          <div className="error-number">404</div>
          <div className="error-icon">🍽️</div>
        </div>
        
        <div className="error-message">
          <h1>Oops! Page Not Found</h1>
          <p>
            The page you're looking for seems to have wandered off to the kitchen. 
            Don't worry, we'll help you find your way back!
          </p>
        </div>

        <div className="suggestions">
          <h2>Here are some tasty alternatives:</h2>
          <div className="suggestion-grid">
            <Link to="/" className="suggestion-card">
              <div className="suggestion-icon">🏠</div>
              <h3>Home</h3>
              <p>Back to our delicious menu</p>
            </Link>
            
            <Link to="/learn" className="suggestion-card">
              <div className="suggestion-icon">📚</div>
              <h3>Learn</h3>
              <p>Explore our cooking courses</p>
            </Link>
            
            <Link to="/blog" className="suggestion-card">
              <div className="suggestion-icon">📝</div>
              <h3>Blog</h3>
              <p>Read our latest articles</p>
            </Link>
            
            <Link to="/community" className="suggestion-card">
              <div className="suggestion-icon">👥</div>
              <h3>Community</h3>
              <p>Connect with food lovers</p>
            </Link>
          </div>
        </div>

        <div className="search-section">
          <h3>Looking for something specific?</h3>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search for recipes, courses, or articles..."
              className="search-input"
            />
            <button className="search-button">🔍</button>
          </div>
        </div>

        <div className="help-section">
          <h3>Need Help?</h3>
          <div className="help-options">
            <Link to="/contact" className="help-link">
              <span>📧</span>
              Contact Support
            </Link>
            <Link to="/about" className="help-link">
              <span>ℹ️</span>
              About Us
            </Link>
            <button className="help-link" onClick={() => window.history.back()}>
              <span>⬅️</span>
              Go Back
            </button>
          </div>
        </div>

        <div className="fun-fact">
          <div className="fact-icon">💡</div>
          <p>
            <strong>Did you know?</strong> The average person makes over 200 food-related decisions every day. 
            That's a lot of opportunities to make healthy choices!
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound 