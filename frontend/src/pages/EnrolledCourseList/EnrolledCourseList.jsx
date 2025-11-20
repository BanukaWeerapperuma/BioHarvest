import React, { useState, useEffect, useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import EnrolledCourseCard from '../../Components/EnrolledCourseCard/EnrolledCourseCard';
import axios from 'axios';
import { url } from '../../assets/frontend_assets/assets';
import './EnrolledCourseList.css';

const EnrolledCourseList = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { token } = useContext(StoreContext);

  // Fetch user enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!token) {
        setError('Please login to view your enrolled courses');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${url}/api/enrollments/user`, {
          headers: { token }
        });
        
        if (response.data.success) {
          setEnrollments(response.data.data);
          setFilteredEnrollments(response.data.data);
        } else {
          setError('Failed to fetch enrollments');
        }
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        if (error.response?.status === 401) {
          setError('Please login to view your enrolled courses');
        } else {
          setError('Error loading enrolled courses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [token]);

  // Filter enrollments based on search and status
  useEffect(() => {
    let filtered = enrollments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(enrollment =>
        enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === selectedStatus);
    }

    setFilteredEnrollments(filtered);
  }, [enrollments, searchTerm, selectedStatus]);

  // Get unique statuses
  const statuses = ['all', ...new Set(enrollments.map(enrollment => enrollment.status).filter(Boolean))];

  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter(e => e.status === 'completed').length;
  const inProgressCourses = enrollments.filter(e => e.status === 'in-progress').length;
  const averageProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((acc, enrollment) => {
        const progress = enrollment.progress?.completedSections?.length || 0;
        const total = enrollment.course?.content?.sections?.length || 1;
        return acc + (progress / total * 100);
      }, 0) / enrollments.length)
    : 0;

  if (loading) {
    return (
      <div className="enrolled-course-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your enrolled courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enrolled-course-list-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="enrolled-course-list-container">
      <div className="enrolled-course-list-header">
        <h1>My Enrolled Courses</h1>
        <p>Continue your learning journey</p>
      </div>

      {/* Statistics */}
      <div className="statistics-section">
        <div className="stat-card">
          <h3>{totalEnrollments}</h3>
          <p>Total Courses</p>
        </div>
        <div className="stat-card">
          <h3>{completedCourses}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <h3>{inProgressCourses}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h3>{averageProgress}%</h3>
          <p>Avg Progress</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search your courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.replace('-', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="results-info">
        <p>Showing {filteredEnrollments.length} of {enrollments.length} enrolled courses</p>
      </div>

      {/* Enrolled Course Grid */}
      {filteredEnrollments.length > 0 ? (
        <div className={`enrolled-course-grid ${filteredEnrollments.length === 1 ? 'single-course' : ''}`}>
          {filteredEnrollments.map(enrollment => (
            <EnrolledCourseCard key={enrollment._id} enrollment={enrollment} />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="no-enrollments">
          <h3>No enrolled courses yet</h3>
          <p>Start your learning journey by enrolling in courses</p>
          <button onClick={() => window.location.href = '/courses'}>
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="no-results">
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default EnrolledCourseList; 