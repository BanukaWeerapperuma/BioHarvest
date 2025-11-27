import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Courses.css';
import { url } from '../../assets/assets';
import { formatCurrency } from '../../utils/price';

const resolveMediaUrl = (value, fallback) => {
  if (!value || typeof value !== 'string') return fallback;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `${url}/uploads/${value.replace(/^\/+/, '')}`;
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const coursePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvdXJzZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
  const avatarPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+STwvdGV4dD48L3N2Zz4=';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/courses/admin/list`);
      if (response.data.success) {
        setCourses(response.data.data);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;

    try {
      const response = await axios.delete(`${url}/api/courses/admin/delete/${courseToDelete._id}`);
      if (response.data.success) {
        setCourses(courses.filter(course => course._id !== courseToDelete._id));
        setShowDeleteModal(false);
        setCourseToDelete(null);
        alert('Course deleted successfully!');
      } else {
        alert('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    }
  };

  const handleToggleStatus = async (courseId, currentStatus) => {
    try {
      const response = await axios.put(`${url}/api/courses/admin/toggle/${courseId}`);
      if (response.data.success) {
        setCourses(courses.map(course => 
          course._id === courseId 
            ? { ...course, isActive: !course.isActive }
            : course
        ));
        alert(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert('Failed to update course status');
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      alert('Error updating course status');
    }
  };

  const confirmDelete = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="courses-container">
        <div className="loading-message">
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1>Course Management</h1>
        <Link to="/add-course" className="add-course-btn">
          <span>+</span> Add New Course
        </Link>
      </div>

      <div className="courses-stats">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p>{courses.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Courses</h3>
          <p>{courses.filter(c => c.isActive).length}</p>
        </div>
        <div className="stat-card">
          <h3>Free Courses</h3>
          <p>{courses.filter(c => c.isFree).length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Enrollments</h3>
          <p>{courses.reduce((sum, c) => sum + c.enrolledStudents, 0)}</p>
        </div>
      </div>

      <div className="courses-list">
        <div className="list-header">
          <h2>All Courses</h2>
          <span className="course-count">{courses.length} courses</span>
        </div>

        {courses.length === 0 ? (
          <div className="no-courses-message">
            <p>No courses found. Add your first course to get started!</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} className={`course-card ${!course.isActive ? 'inactive' : ''}`}>
                <div className="course-image-container">
                  <img 
                    src={resolveMediaUrl(course.image, coursePlaceholder)} 
                    alt={course.title || 'Course'} 
                    className="course-image"
                    onError={(e) => { e.target.src = coursePlaceholder; }}
                  />
                  {!course.isActive && (
                    <div className="inactive-badge">Inactive</div>
                  )}
                  {course.isFree && (
                    <div className="free-badge">FREE</div>
                  )}
                  {course.discount > 0 && (
                    <div className="discount-badge">{course.discount}% OFF</div>
                  )}
                </div>

                <div className="course-content">
                  <div className="course-category">
                    <span className="category-tag">{course.category}</span>
                    <span className="course-level">{course.level}</span>
                  </div>

                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>

                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-icon">⏱️</span>
                      <span>{formatDuration(course.duration)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{course.enrolledStudents} students</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">⭐</span>
                      <span>{course.rating} ({course.reviewCount} reviews)</span>
                    </div>
                  </div>

                  <div className="course-instructor">
                    <img 
                      src={resolveMediaUrl(course.instructor?.avatar, avatarPlaceholder)} 
                      alt={course.instructor?.name || 'Instructor'}
                      className="instructor-avatar"
                      onError={(e) => { e.target.src = avatarPlaceholder; }}
                    />
                    <div className="instructor-info">
                      <span className="instructor-name">{course.instructor.name}</span>
                      <span className="instructor-title">{course.instructor.title}</span>
                    </div>
                  </div>

                  <div className="course-pricing">
                    {course.isFree ? (
                      <div className="price-free">Free</div>
                    ) : (
                      <div className="price-container">
                        {course.discount > 0 && (
                          <span className="original-price">{formatCurrency(course.price)}</span>
                        )}
                        <span className="current-price">{formatCurrency(course.discountedPrice || course.price)}</span>
                      </div>
                    )}
                  </div>

                  <div className="course-actions">
                    <Link 
                      to={`/edit-course/${course._id}`} 
                      className="edit-btn"
                    >
                      Edit
                    </Link>
                    <button 
                      className={`toggle-btn ${course.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(course._id, course.isActive)}
                    >
                      {course.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => confirmDelete(course)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete "{courseToDelete?.title}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCourseToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDelete}
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses; 