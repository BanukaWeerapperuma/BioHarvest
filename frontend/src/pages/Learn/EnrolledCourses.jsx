import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './EnrolledCourses.css';
import axios from 'axios';
import { url } from '../../assets/frontend_assets/assets';
import { toast } from 'react-toastify';
import { StoreContext } from '../../context/StoreContext';
import EnrolledCourseCard from '../../Components/EnrolledCourseCard/EnrolledCourseCard';

const EnrolledCourses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, setToken } = useContext(StoreContext);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState(token || localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      return;
    }
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setAuthToken(storedToken);
      setToken && setToken(storedToken);
    } else {
      setAuthToken('');
    }
  }, [token, setToken]);

  useEffect(() => {
    // Check if redirected from successful payment
    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');
    
    if (!authToken) {
      setLoading(false);
      setError('Please login to view your enrolled courses');
      return;
    }

    setError('');

    if (success === 'true' && orderId) {
      // Verify payment and create enrollment
      verifyPayment(orderId);
    } else {
      fetchEnrollments(authToken);
    }
  }, [searchParams, authToken]);

  const verifyPayment = async (orderId) => {
    try {
      console.log('Verifying payment for order:', orderId);
      const response = await axios.get(`${url}/api/order/verify-payment?success=true&orderId=${orderId}`);
      
      if (response.data.success) {
        toast.success('Payment successful! You are now enrolled in the course.');
        // Fetch updated enrollments after successful payment
        fetchEnrollments(authToken);
      } else {
        toast.error('Payment verification failed: ' + response.data.message);
        fetchEnrollments(authToken);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error verifying payment');
      fetchEnrollments(authToken);
    }
  };

  const fetchEnrollments = async (tokenToUse = authToken) => {
    try {
      setLoading(true);
      
      if (!tokenToUse) {
        setError('Please login to view your enrolled courses');
        setLoading(false);
        return;
      }

      console.log('Fetching enrollments with token:', tokenToUse);
      const response = await axios.get(`${url}/api/enrollments/user`, {
        headers: { token: tokenToUse }
      });

      console.log('Enrollments response:', response.data);

      if (response.data.success) {
        setEnrollments(response.data.data);
        console.log('Enrollments set:', response.data.data);
      } else {
        setError('Failed to fetch enrolled courses');
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Error fetching enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressPercentage = (enrollment) => {
    if (!enrollment?.course?.content || !enrollment.course.content.sections) {
      return 0;
    }
    const totalSections = enrollment.course.content.sections.length;
    const completedSections = enrollment.progress?.completedSections?.length || 0;
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled': return '#4CAF50';
      case 'in-progress': return '#2196F3';
      case 'completed': return '#FF9800';
      default: return '#757575';
    }
  };

  const handleContinueLearning = (enrollment) => {
    navigate(`/course/${enrollment._id}`);
  };

  if (loading) {
    return (
      <div className="enrolled-courses-container">
        <div className="loading-message">
          <p>Loading your enrolled courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enrolled-courses-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/learn')}>Back to Courses</button>
        </div>
      </div>
    );
  }

  return (
    <div className="enrolled-courses-container">
      <div className="enrolled-courses-header">
        <div className="header-content">
          <div className="header-text">
            <h1>My Enrolled Courses</h1>
            <p>Continue your learning journey and track your progress</p>
          </div>
          <div className="header-actions">
            <button 
              className="back-to-courses-btn"
              onClick={() => navigate('/learn')}
            >
              ← Back to All Courses
            </button>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="no-enrollments-message">
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>No Enrolled Courses</h2>
            <p>You haven't enrolled in any courses yet.</p>
            <p>Start your learning journey by exploring our courses!</p>
            <button 
              className="explore-courses-btn"
              onClick={() => navigate('/learn')}
            >
              Explore Courses
            </button>
          </div>
        </div>
      ) : (
        <div className={`enrollments-grid ${enrollments.length === 1 ? 'single-course' : ''}`}>
          {enrollments.map((enrollment) => (
            <EnrolledCourseCard key={enrollment._id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses; 