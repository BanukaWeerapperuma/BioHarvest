import React from 'react';
import { useNavigate } from 'react-router-dom';
import { url } from '../../assets/frontend_assets/assets';
import './EnrolledCourseCard.css';

const resolveMediaUrl = (value, fallback) => {
  if (!value || typeof value !== 'string') return fallback;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `${url}/uploads/${value.replace(/^\/+/, '')}`;
};

const coursePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvdXJzZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
const avatarPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+STwvdGV4dD48L3N2Zz4=';

const EnrolledCourseCard = ({ enrollment }) => {
  const navigate = useNavigate();

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

  // Skip rendering if enrollment or course is null/undefined
  if (!enrollment || !enrollment.course) {
    return null;
  }

  return (
    <div className="enrollment-card">
      <div className="enrollment-image-container">
        <img 
          src={resolveMediaUrl(enrollment.course.image, coursePlaceholder)} 
          alt={enrollment.course.title || 'Course'} 
          className="enrollment-image"
          onError={(e) => { e.target.src = coursePlaceholder; }}
        />
        <div 
          className="status-badge"
          style={{ backgroundColor: getStatusColor(enrollment.status) }}
        >
          {enrollment.status.replace('-', ' ').toUpperCase()}
        </div>
        <div className="progress-overlay">
          <div className="progress-circle">
            <span className="progress-text">{getProgressPercentage(enrollment)}%</span>
          </div>
        </div>
      </div>

      <div className="enrollment-content">
        <div className="enrollment-category">
          <span className="category-tag">{enrollment.course.category}</span>
          <span className="course-level">{enrollment.course.level}</span>
        </div>

        <h3 className="enrollment-title">{enrollment.course.title}</h3>
        <p className="enrollment-description">{enrollment.course.description}</p>

        <div className="enrollment-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{formatDuration(enrollment.course.duration)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <span>Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🔄</span>
            <span>Last accessed: {enrollment.lastAccessed ? new Date(enrollment.lastAccessed).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${getProgressPercentage(enrollment)}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {enrollment.progress?.completedSections?.length || 0} of {enrollment.course.content?.sections?.length || 0} sections completed
          </span>
        </div>

        <div className="enrollment-instructor">
          <img 
            src={resolveMediaUrl(enrollment.course.instructor?.avatar, avatarPlaceholder)} 
            alt={enrollment.course.instructor?.name || 'Instructor'}
            className="instructor-avatar"
            onError={(e) => { e.target.src = avatarPlaceholder; }}
          />
          <div className="instructor-info">
            <span className="instructor-name">{enrollment.course.instructor?.name || 'Unknown Instructor'}</span>
            <span className="instructor-title">{enrollment.course.instructor?.title || 'Instructor'}</span>
          </div>
        </div>

        <button 
          className="continue-learning-btn"
          onClick={() => handleContinueLearning(enrollment)}
        >
          {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
        </button>
      </div>
    </div>
  );
};

export default EnrolledCourseCard; 