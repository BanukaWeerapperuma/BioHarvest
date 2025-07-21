import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Navbar.css";
import { assets } from '../../assets/frontend_assets/assets';
import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalCartQuantity, token, setToken, userProfile } = useContext(StoreContext);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMenuClick = (menuName) => {
    setMenu(menuName);
    closeMobileMenu();
  };

  return (
    <div className='navbar'>
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="logo" />
      </Link>
      
      {/* Mobile hamburger menu */}
      <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
      </div>

      {/* Desktop menu */}
      <ul className="navbar-menu desktop-menu">
        <Link to="/" onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>
          Home
        </Link>
        <Link to="/about" onClick={() => setMenu("about")} className={menu === "about" ? "active" : ""}>
          About
        </Link>
        <Link to="/learn" onClick={() => setMenu("learn")} className={menu === "learn" ? "active" : ""}>
          Learn
        </Link>
        <Link to="/community" onClick={() => setMenu("community")} className={menu === "community" ? "active" : ""}>
          Community
        </Link>
        <Link to="/blog" onClick={() => setMenu("blog")} className={menu === "blog" ? "active" : ""}>
          Blog
        </Link>
        <Link to="/contact-us" onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>
          Contact
        </Link>
      </ul>
      
      {/* Mobile menu overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}></div>
      
      {/* Mobile menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" onClick={closeMobileMenu}>
            <img src={assets.logo} alt="Logo" className="mobile-logo" />
          </Link>
          <button className="mobile-menu-close" onClick={closeMobileMenu}>
            ×
          </button>
        </div>
        
        <ul className="mobile-navbar-menu">
          <Link to="/" onClick={() => handleMenuClick("home")} className={menu === "home" ? "active" : ""}>
            Home
          </Link>
          <Link to="/about" onClick={() => handleMenuClick("about")} className={menu === "about" ? "active" : ""}>
            About
          </Link>
          <Link to="/learn" onClick={() => handleMenuClick("learn")} className={menu === "learn" ? "active" : ""}>
            Learn
          </Link>
          <Link to="/community" onClick={() => handleMenuClick("community")} className={menu === "community" ? "active" : ""}>
            Community
          </Link>
          <Link to="/blog" onClick={() => handleMenuClick("blog")} className={menu === "blog" ? "active" : ""}>
            Blog
          </Link>
          <Link to="/contact-us" onClick={() => handleMenuClick("contact-us")} className={menu === "contact-us" ? "active" : ""}>
            Contact
          </Link>
        </ul>
        
        <div className="mobile-menu-footer">
          {!token ? (
            <button onClick={() => { setShowLogin(true); closeMobileMenu(); }} className="mobile-signin-btn">
              Sign In
            </button>
          ) : (
            <div className="mobile-profile-section">
              <div className="mobile-profile-info">
                <img 
                  src={userProfile?.profileImage || assets.profile_icon} 
                  alt="Profile" 
                  className="mobile-profile-image"
                  onError={(e) => {
                    e.target.src = assets.profile_icon;
                  }}
                />
                <span>Welcome back!</span>
              </div>
              <div className="mobile-profile-actions">
                <button onClick={() => { navigate("/profile"); closeMobileMenu(); }}>
                  Profile
                </button>
                <button onClick={() => { navigate("/myorders"); closeMobileMenu(); }}>
                  Orders
                </button>
                <button onClick={() => { navigate("/enrolled-courses"); closeMobileMenu(); }}>
                  My Courses
                </button>
                <button onClick={() => { logout(); closeMobileMenu(); }} className="mobile-logout-btn">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right section */}
      <div className="navbar-right">
        <img src={assets.search_icon} alt="Search" />
        
        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="Cart" />
          </Link>
          {getTotalCartQuantity() > 0 && (
            <span className="cart-indicator">{getTotalCartQuantity()}</span>
          )}
        </div>
        
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        ) : (
          <div className='nav-profile'>
            <img 
              src={userProfile?.profileImage || assets.profile_icon} 
              alt="Profile" 
              className="nav-profile-image"
              onError={(e) => {
                e.target.src = assets.profile_icon;
              }}
            />
            <ul className="nav-profile-dropdown">
              <li onClick={() => navigate("/profile")}>
                <img src={assets.profile_icon} alt="" />
                <span>Profile</span>
              </li>
              <li onClick={() => navigate("/myorders")}>
                <img src={assets.bag_icon} alt="" />
                <span>Orders</span>
              </li>
              <li onClick={() => navigate("/enrolled-courses")}>
                <img src={assets.bag_icon} alt="" />
                <span>My Courses</span>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <span>Logout</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;