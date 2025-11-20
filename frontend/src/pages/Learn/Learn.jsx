import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Learn.css';
import axios from 'axios';
import { url } from '../../assets/frontend_assets/assets';
import CourseCard from '../../Components/CourseCard/CourseCard';

const Learn = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Courses', icon: '📚' },
    { id: 'organic', name: 'Organic Farming', icon: '🌱' },
    { id: 'food', name: 'Food & Nutrition', icon: '🥗' },
    { id: 'plantation', name: 'Plantation', icon: '🌿' },
    { id: 'sustainability', name: 'Sustainability', icon: '♻️' },
    { id: 'cooking', name: 'Cooking', icon: '👨‍🍳' }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/courses/list`);
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

  const handleEnroll = async (course) => {
    // Validate course data
    if (!course || !course._id) {
      alert('Invalid course data');
      return;
    }

    if (course.isFree) {
      // Handle free course enrollment
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login to enroll in courses');
          return;
        }

        const response = await axios.post(`${url}/api/enrollments/courses/${course._id}/enroll`, {}, {
          headers: { token }
        });

        if (response.data.success) {
          alert('Successfully enrolled in the course!');
          // Redirect to course dashboard using enrollmentId
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
      // Calculate discounted price
      const discountedPrice = course.discountedPrice !== undefined ? course.discountedPrice : 
                             (course.discount && course.price ? course.price - (course.price * course.discount / 100) : course.price);
      
      // Navigate to payment for paid courses
      navigate('/order', { 
        state: { 
          courseId: course._id,
          courseName: course.title || 'Course',
          amount: discountedPrice || course.price || 0,
          type: 'course'
        } 
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="learn-container">
        <div className="loading-message">
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-container">
      <div className="learn-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Learn & Grow</h1>
            <p>Master the art of organic farming, sustainable living, and healthy cooking</p>
          </div>
          <div className="header-actions">
            <button 
              className="enrolled-courses-btn"
              onClick={() => navigate('/enrolled-courses')}
            >
              📚 My Enrolled Courses
            </button>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="categories-section">
        <h2>Course Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="courses-section">
        <div className="courses-header">
          <h2>
            {selectedCategory === 'all' ? 'All Courses' : 
             categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span className="course-count">{filteredCourses.length} courses available</span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="no-courses-message">
            <p>No courses found for your search criteria.</p>
            <p>Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Learn;