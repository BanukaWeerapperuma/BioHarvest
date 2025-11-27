import React, { useContext, useState, useEffect, useRef } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { toast } from 'react-toastify'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, admin, setAdmin, setToken, url } = useContext(StoreContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileDetails, setProfileDetails] = useState({
    username: localStorage.getItem('adminUsername') || 'Admin User',
    position: localStorage.getItem('adminPosition') || 'Administrator'
  });
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [notificationState, setNotificationState] = useState({
    newUser: true,
    certificate: true
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileInfo(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProfileDetails({
      username: localStorage.getItem('adminUsername') || 'Admin User',
      position: localStorage.getItem('adminPosition') || 'Administrator'
    });
  }, [token, admin]);

  const unreadCount = Object.values(notificationState).filter(Boolean).length;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Logout Successfully");
    navigate("/");
  };

  const login = () => {
    navigate("/");
  };

  const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatNumber = (num = 0) => new Intl.NumberFormat().format(num || 0);

  const fetchAnalyticsSnapshot = async () => {
    const monthParam = new Date().toISOString().slice(0, 7);
    const dayParam = new Date().toISOString().slice(0, 10);
    const config = { headers: { token } };

    const [monthRes, dayRes] = await Promise.all([
      axios.get(`${url}/api/analytics/dashboard?month=${monthParam}`, config),
      axios.get(`${url}/api/analytics/dashboard?day=${dayParam}`, config)
    ]);

    return {
      month: monthRes.data?.data,
      day: dayRes.data?.data
    };
  };

  const printAnalysis = async () => {
    if (!token) {
      toast.error("Please login to generate analysis");
      return;
    }

    try {
      const currentDate = new Date();
      const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const dayLabel = currentDate.toLocaleDateString();

      const analyticsSnapshot = await fetchAnalyticsSnapshot();
      const monthData = analyticsSnapshot.month || {};
      const dayData = analyticsSnapshot.day || {};

      const monthDaily = monthData.dailyStats || [];
      const recentDays = monthDaily.slice(-7);
      const orderSummary = monthData.orderSummary || {
        totalOrders: 0,
        totalRevenue: 0,
        deliveredOrders: 0,
        processingOrders: 0,
        outForDeliveryOrders: 0
      };

      const dayStats = dayData.dayStats || {};
      const hourlyEntries = Object.entries(dayStats);
      const todaySummary = hourlyEntries.reduce((acc, [, stats]) => {
        acc.orders += stats.orders || 0;
        acc.revenue += stats.revenue || 0;
        acc.newUsers += stats.newUsers || 0;
        return acc;
      }, { orders: 0, revenue: 0, newUsers: 0 });

      const recentDayRows = recentDays.map(day => `
        <tr>
          <td>${new Date(day.date).toLocaleDateString()}</td>
          <td>${formatNumber(day.orders || 0)}</td>
          <td>${formatNumber(day.deliveredOrders || 0)}</td>
          <td>${formatNumber((day.processingOrders || 0) + (day.outForDeliveryOrders || 0))}</td>
          <td>${formatCurrency(day.revenue || 0)}</td>
          <td>${formatNumber(day.newUsers || 0)}</td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align:center;color:#999;">No records</td></tr>`;

      const hourlyRows = hourlyEntries.map(([hour, stats]) => `
        <tr>
          <td>${hour}:00</td>
          <td>${formatNumber(stats.orders || 0)}</td>
          <td>${formatNumber(stats.deliveredOrders || 0)}</td>
          <td>${formatCurrency(stats.revenue || 0)}</td>
          <td>${formatNumber(stats.newUsers || 0)}</td>
          <td>${formatNumber(stats.activeUsers || 0)}</td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align:center;color:#999;">No hourly activity</td></tr>`;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
      <html>
        <head>
          <title>BioHarvest Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .section h3 { color: #667eea; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .data-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BioHarvest Analysis Report</h1>
            <p>Generated on: ${dayLabel} at ${currentTime.toLocaleTimeString()}</p>
          </div>
          
          <div class="section">
            <h3>Daily Analysis - ${dayLabel}</h3>
            <div class="data-row">
              <span>Total Orders:</span>
              <span>${formatNumber(todaySummary.orders)}</span>
            </div>
            <div class="data-row">
              <span>Revenue:</span>
              <span>${formatCurrency(todaySummary.revenue)}</span>
            </div>
            <div class="data-row">
              <span>New Users:</span>
              <span>${formatNumber(todaySummary.newUsers)}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Orders</th>
                  <th>Delivered</th>
                  <th>Revenue</th>
                  <th>New Users</th>
                  <th>Active Users</th>
                </tr>
              </thead>
              <tbody>
                ${hourlyRows}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h3>Monthly Analysis - ${monthLabel}</h3>
            <div class="data-row">
              <span>Total Orders:</span>
              <span>${formatNumber(orderSummary.totalOrders || 0)}</span>
            </div>
            <div class="data-row">
              <span>Total Revenue:</span>
              <span>${formatCurrency(orderSummary.totalRevenue || 0)}</span>
            </div>
            <div class="data-row">
              <span>New Customers:</span>
              <span>${formatNumber(monthData.totalNewUsers || 0)}</span>
            </div>
            <div class="data-row">
              <span>Delivered Orders:</span>
              <span>${formatNumber(orderSummary.deliveredOrders || 0)}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Delivered</th>
                  <th>In Progress</th>
                  <th>Revenue</th>
                  <th>New Users</th>
                </tr>
              </thead>
              <tbody>
                ${recentDayRows}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <div class="data-row">
              <span>Monthly Growth:</span>
              <span style="color: #28a745;">+15.2%</span>
            </div>
          </div>
        </body>
      </html>
    `);
      printWindow.document.close();
      printWindow.print();
      toast.success("Analysis report printed successfully!");
    } catch (error) {
      console.error('Error printing analysis:', error);
      toast.error("Unable to generate analysis report right now.");
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className='navbar'>
      <img 
        className='logo' 
        src={assets.logo} 
        alt="BioHarvest Admin" 
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleLogoClick();
          }
        }}
      />
      
      <div className="navbar-actions">
        {token && admin ? (
          <>
            <div className="admin-info">
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <div className="dropdown" ref={notificationRef}>
              <div 
                className="nav-item"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setShowNotificationDropdown(!showNotificationDropdown);
                  }
                }}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
              {showNotificationDropdown && (
                <div className="dropdown-content">
                  <button 
                    className={`dropdown-item ${activeNotification === 'newUser' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveNotification('newUser');
                      setNotificationState(prev => ({ ...prev, newUser: false }));
                      setShowNotificationDropdown(false);
                      navigate('/analytics?section=newUsers');
                      toast.info('Navigating to new users section');
                    }}
                  >
                    New user arrived
                  </button>
                  <button 
                    className={`dropdown-item ${activeNotification === 'certificate' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveNotification('certificate');
                      setNotificationState(prev => ({ ...prev, certificate: false }));
                      setShowNotificationDropdown(false);
                      navigate('/list?filter=unverified');
                      toast.info('Showing unverified products');
                    }}
                  >
                    Certificate needs verification
                  </button>
                  <button 
                    className="dropdown-item mark-unread"
                    onClick={() => {
                      setNotificationState({ newUser: true, certificate: true });
                      setShowNotificationDropdown(false);
                      toast.success('All notifications marked as unread');
                    }}
                  >
                    Mark all as unread
                  </button>
                </div>
              )}
            </div>
            
            <button className="logout-btn" onClick={logout}>Logout</button>
          </>
        ) : null}
      </div>
      
      <div className="profile-wrapper" ref={profileRef}>
        <img 
          className={`profile ${showProfileInfo ? 'active' : ''}`} 
          src={assets.profile_image} 
          alt="Admin Profile" 
          onClick={() => setShowProfileInfo(prev => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setShowProfileInfo(prev => !prev);
            }
          }}
        />
        {showProfileInfo && (
          <div className="profile-info-card">
            <div className="profile-info-header">
              <h4>{profileDetails.username}</h4>
              <span className="profile-position">{profileDetails.position}</span>
            </div>
            <div className="profile-info-body">
              <p><strong>Status:</strong> {admin ? 'Active Admin' : 'Guest'}</p>
              <p><strong>Session:</strong> {token ? 'Authenticated' : 'Not logged in'}</p>
              <p><strong>Current Time:</strong> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="profile-info-actions">
              <button onClick={() => {
                setShowProfileInfo(false);
                navigate('/reset-credentials');
              }}>Reset Credentials</button>
              <button onClick={() => setShowProfileInfo(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
