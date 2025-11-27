import React, { useState, useEffect, useContext, useRef } from 'react';
import './Analytics.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Analytics = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const newUsersSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalBlogViews: 0,
    totalCustomers: 0,
    totalNewUsers: 0,
    dailyStats: [],
    dayStats: {},
    orderSummary: {
      totalOrders: 0,
      totalRevenue: 0,
      deliveredOrders: 0,
      processingOrders: 0,
      outForDeliveryOrders: 0
    }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD format
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'day'

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedDate, selectedDay, viewMode]);

  // Scroll to new users section if URL parameter is present
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'newUsers' && newUsersSectionRef.current) {
      setTimeout(() => {
        newUsersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clear the URL parameter after scrolling
        setSearchParams({});
      }, 500);
    }
  }, [searchParams, loading]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = viewMode === 'day' 
        ? `period=30days&day=${selectedDay}`
        : `period=30days&month=${selectedDate}`;
      
      const response = await axios.get(`${url}/api/analytics/dashboard?${params}`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data || {
          totalBlogViews: 0,
          totalCustomers: 0,
          totalNewUsers: 0,
          dailyStats: [],
          dayStats: {},
          orderSummary: {
            totalOrders: 0,
            totalRevenue: 0,
            deliveredOrders: 0,
            processingOrders: 0,
            outForDeliveryOrders: 0
          }
        });
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateString) => {
    return new Date(dateString + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatDay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'day') {
      // Set selected day to first day of selected month if switching to day view
      const monthDate = new Date(selectedDate + '-01');
      setSelectedDay(monthDate.toISOString().slice(0, 10));
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Track your website performance and user engagement</p>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <button 
          className={`view-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('month')}
        >
          Monthly Analysis
        </button>
        <button 
          className={`view-mode-btn ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('day')}
        >
          Daily Analysis
        </button>
      </div>

      {/* Date Selector */}
      <div className="date-selector">
        {viewMode === 'month' ? (
          <>
            <label htmlFor="month-selector">Select Month:</label>
            <input
              type="month"
              id="month-selector"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="month-input"
            />
            <span className="selected-month">{formatMonthYear(selectedDate)}</span>
          </>
        ) : (
          <>
            <label htmlFor="day-selector">Select Day:</label>
            <input
              type="date"
              id="day-selector"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="day-input"
            />
            <span className="selected-day">{formatDay(selectedDay)}</span>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon blog-views">
            <span>📊</span>
          </div>
          <div className="card-content">
            <h3>Total Blog Views</h3>
            <p className="card-number">{formatNumber(analyticsData.totalBlogViews)}</p>
            <p className="card-label">All time blog views</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon customers">
            <span>👥</span>
          </div>
          <div className="card-content">
            <h3>Total Customers</h3>
            <p className="card-number">{formatNumber(analyticsData.totalCustomers)}</p>
            <p className="card-label">Registered users</p>
          </div>
        </div>

        <div className="summary-card" ref={newUsersSectionRef}>
          <div className="card-icon new-users">
            <span>🆕</span>
          </div>
          <div className="card-content">
            <h3>New Users ({viewMode === 'month' ? formatMonthYear(selectedDate) : formatDay(selectedDay)})</h3>
            <p className="card-number">{formatNumber(analyticsData.totalNewUsers)}</p>
            <p className="card-label">Recently registered</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon orders">
            <span>📦</span>
          </div>
          <div className="card-content">
            <h3>Total Orders ({viewMode === 'month' ? formatMonthYear(selectedDate) : formatDay(selectedDay)})</h3>
            <p className="card-number">{formatNumber(analyticsData.orderSummary?.totalOrders || 0)}</p>
            <p className="card-label">Delivered: {formatNumber(analyticsData.orderSummary?.deliveredOrders || 0)} • In Progress: {formatNumber((analyticsData.orderSummary?.processingOrders || 0) + (analyticsData.orderSummary?.outForDeliveryOrders || 0))}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon revenue">
            <span>💰</span>
          </div>
          <div className="card-content">
            <h3>Total Revenue ({viewMode === 'month' ? formatMonthYear(selectedDate) : formatDay(selectedDay)})</h3>
            <p className="card-number">{formatCurrency(analyticsData.orderSummary?.totalRevenue || 0)}</p>
            <p className="card-label">Gross revenue in period</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => navigate('/blog')}
          >
            View Blog Posts
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/list')}
          >
            View All Items
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/orders')}
          >
            View Orders
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="analytics-table">
          <div className="table-header">
            <h2>Daily Performance ({formatMonthYear(selectedDate)})</h2>
            <span>{analyticsData.dailyStats?.length || 0} days</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Delivered</th>
                  <th>In Progress</th>
                  <th>Revenue</th>
                  <th>New Users</th>
                  <th>Active Users</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData.dailyStats || []).map((day) => (
                  <tr key={day.date}>
                    <td>{formatDate(day.date)}</td>
                    <td>{formatNumber(day.orders || 0)}</td>
                    <td>{formatNumber(day.deliveredOrders || 0)}</td>
                    <td>{formatNumber((day.processingOrders || 0) + (day.outForDeliveryOrders || 0))}</td>
                    <td>{formatCurrency(day.revenue || 0)}</td>
                    <td>{formatNumber(day.newUsers || 0)}</td>
                    <td>{formatNumber(day.activeUsers || 0)}</td>
                  </tr>
                ))}
                {(!analyticsData.dailyStats || analyticsData.dailyStats.length === 0) && (
                  <tr>
                    <td colSpan="7" className="no-data">No data available for this month</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="analytics-table">
          <div className="table-header">
            <h2>Hourly Performance ({formatDay(selectedDay)})</h2>
            <span>24 hours</span>
          </div>
          <div className="table-wrapper">
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
                {Array.from({ length: 24 }).map((_, hour) => {
                  const key = hour.toString().padStart(2, '0');
                  const stats = analyticsData.dayStats?.[key] || {};
                  return (
                    <tr key={key}>
                      <td>{`${key}:00`}</td>
                      <td>{formatNumber(stats.orders || 0)}</td>
                      <td>{formatNumber(stats.deliveredOrders || 0)}</td>
                      <td>{formatCurrency(stats.revenue || 0)}</td>
                      <td>{formatNumber(stats.newUsers || 0)}</td>
                      <td>{formatNumber(stats.activeUsers || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics; 