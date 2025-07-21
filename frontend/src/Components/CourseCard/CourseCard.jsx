import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { url } from '../../assets/frontend_assets/assets';


const CourseCard = ({ course, showEnrollButton = true }) => {
  const navigate = useNavigate();
  const { token } = useContext(StoreContext);

  // Helper: Discounted price
  const getDiscountedPrice = (course) => {
    if (!course) return 0;
    if (course.isFree) return 0;
    if (course.discountedPrice !== undefined) return course.discountedPrice;
    if (course.discount && course.price) {
      return course.price - (course.price * course.discount / 100);
    }
    return course.price || 0;
  };

  // Helper: Duration
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Placeholder images as data URLs
  const coursePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvdXJzZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
  const avatarPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+STwvdGV4dD48L3N2Zz4=';

  // Enroll handler
  const handleEnroll = async (course) => {
    if (!course || !course._id) {
      alert('Invalid course data');
      return;
    }
    if (course.isFree) {
      try {
        if (!token) {
          alert('Please login to enroll in courses');
          return;
        }
        const response = await axios.post(`${url}/api/enrollments/courses/${course._id}/enroll`, {}, {
          headers: { token }
        });
        if (response.data.success) {
          alert('Successfully enrolled in the course!');
          navigate(`/course/${response.data.data._id}`);
        } else {
          alert('Failed to enroll in course');
        }
      } catch (error) {
        console.error('Error enrolling in course:', error);
        if (error.response?.status === 400) {
          alert(error.response.data.message);
        } else {
          alert('Error enrolling in course');
        }
      }
    } else {
      const amount = getDiscountedPrice(course);
      navigate('/order', {
        state: {
          courseId: course._id,
          courseName: course.title || 'Course',
          amount,
          type: 'course'
        }
      });
    }
  };

  if (!course) {
    return null;
  }

  const discountedPrice = getDiscountedPrice(course);

  return (
    <div className="enrollment-card">
      <div className="enrollment-image-container">
        <img
          src={course.image ? `${url}/uploads/${course.image}` : coursePlaceholder}
          alt={course.title || 'Course'}
          className="enrollment-image"
          onError={e => { e.target.src = coursePlaceholder; }}
        />
        {course.discount > 0 && !course.isFree && (
          <div className="status-badge" style={{ backgroundColor: '#e53e3e', left: 'auto', right: 15 }}>{course.discount}% OFF</div>
        )}
      </div>

      <div className="enrollment-content">
        <div className="enrollment-category">
          <span className="category-tag">{course.category || 'General'}</span>
          <span className="course-level">{course.level || 'Beginner'}</span>
        </div>

        <h3 className="enrollment-title">{course.title || 'Untitled Course'}</h3>
        <p className="enrollment-description">{course.description || 'No description available'}</p>

        <div className="enrollment-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{formatDuration(course.duration)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">👥</span>
            <span>{course.enrolledStudents || 0} students</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">⭐</span>
            <span>{course.rating || 0} ({course.reviewCount || 0} reviews)</span>
          </div>
        </div>

        <div className="enrollment-instructor">
          <img
            src={course.instructor?.avatar ? `${url}/uploads/${course.instructor.avatar}` : avatarPlaceholder}
            alt={course.instructor?.name || 'Instructor'}
            className="instructor-avatar"
            onError={e => { e.target.src = avatarPlaceholder; }}
          />
          <div className="instructor-info">
            <span className="instructor-name">{course.instructor?.name || 'Unknown Instructor'}</span>
            <span className="instructor-title">{course.instructor?.title || 'Course Instructor'}</span>
          </div>
        </div>

        <div className="enrollment-meta" style={{ marginBottom: 16 }}>
          {course.isFree ? (
            <span className="category-tag" style={{ background: '#38a169', color: 'white' }}>Free</span>
          ) : (
            <span>
              {course.discount > 0 && course.price && (
                <span className="category-tag" style={{ background: '#e53e3e', color: 'white', marginRight: 8, textDecoration: 'line-through' }}>
                  ${course.price}
                </span>
              )}
              <span className="category-tag" style={{ background: '#764ba2', color: 'white' }}>
                ${discountedPrice}
              </span>
            </span>
          )}
        </div>

        {showEnrollButton && (
          <button
            className="continue-learning-btn"
            onClick={() => handleEnroll(course)}
          >
            {course.isFree ? 'Enroll Free' : 'Enroll Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard; 