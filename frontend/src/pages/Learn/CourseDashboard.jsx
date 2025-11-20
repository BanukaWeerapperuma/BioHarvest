import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDashboard.css';
import { url } from '../../assets/frontend_assets/assets';
import { StoreContext } from '../../context/StoreContext';
import PdfViewer from '../../Components/PdfViewer/PdfViewer';

const CourseDashboard = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { token, setToken } = useContext(StoreContext);
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [authToken, setAuthToken] = useState(token || localStorage.getItem('token') || '');
  const [authChecked, setAuthChecked] = useState(!!(token || localStorage.getItem('token')));

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      setAuthChecked(true);
      return;
    }
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setAuthToken(storedToken);
      setToken && setToken(storedToken);
      setAuthChecked(true);
    } else {
      setAuthToken('');
      setAuthChecked(true);
    }
  }, [token, setToken]);

  const resolveMediaUrl = (value) => {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return `${url}/uploads/${value}`;
  };

  const getPdfUrl = (pdfFile) => {
    if (!pdfFile) return null;
    if (pdfFile.url) return pdfFile.url;
    if (pdfFile.secure_url) return pdfFile.secure_url;
    if (pdfFile.filename) return `${url}/uploads/${pdfFile.filename}`;
    if (typeof pdfFile === 'string') return pdfFile;
    return null;
  };

  // Attach auth token for backend PDF URLs (so direct PDF links can pass auth)
  const withAuthTokenIfNeeded = (resourceUrl) => {
    if (!resourceUrl) return null;
    if (!authToken) return resourceUrl;
    // Only modify URLs that point to our backend
    if (!resourceUrl.startsWith(url)) return resourceUrl;

    const separator = resourceUrl.includes('?') ? '&' : '?';
    return `${resourceUrl}${separator}token=${authToken}`;
  };

  const getPdfSizeMb = (pdfFile) => {
    if (!pdfFile) return null;
    const bytes = pdfFile.bytes || pdfFile.size;
    if (!bytes) return null;
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const extractYouTubeVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : '';
  };

  const coursePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvdXJzZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
  const avatarPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+STwvdGV4dD48L3N2Zz4=';

  useEffect(() => {
    if (!authChecked) {
      return;
    }
    if (!authToken) {
      alert('Please login to access course dashboard');
      navigate('/learn');
      return;
    }
    fetchEnrollmentDetails(authToken);
  }, [enrollmentId, authToken, authChecked]);

  const fetchEnrollmentDetails = async (tokenToUse) => {
    try {
      setLoading(true);
      
      const enrollmentResponse = await axios.get(`${url}/api/enrollments/enrollments/${enrollmentId}`, {
        headers: { token: tokenToUse }
      });
      
      if (enrollmentResponse.data.success) {
        const enrollmentData = enrollmentResponse.data.data;
        setEnrollment(enrollmentData);
        setCourse(enrollmentData.course);
      } else {
        alert('Failed to fetch enrollment details');
        navigate('/learn');
      }
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
      if (error.response) {
        if (error.response.status === 404) {
          alert('Enrollment not found. Please check the URL or enroll in a valid course.');
        } else {
          alert('Error fetching enrollment details: ' + (error.response.data?.message || 'Unknown error'));
        }
      } else {
        alert('Error fetching enrollment details: Network error');
      }
      navigate('/learn');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfView = (pdfFile) => {
    const baseUrl = getPdfUrl(pdfFile);
    if (!baseUrl) {
      alert('PDF link is not available for this topic yet.');
      return;
    }

    // Store a copy with an authenticated URL if needed
    const authedUrl = withAuthTokenIfNeeded(baseUrl);
    setSelectedPdf({ ...pdfFile, url: authedUrl || baseUrl });
    setShowPdfViewer(true);
  };

  const handlePdfClose = () => {
    setShowPdfViewer(false);
    setSelectedPdf(null);
  };

  const handleSectionComplete = async (sectionId) => {
    try {
      await axios.put(`${url}/api/enrollments/enrollments/${enrollment._id}/progress`, {
        sectionId,
        score: 100
      }, {
        headers: { "token": authToken }
      });
      
      fetchEnrollmentDetails(authToken);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const response = await axios.post(`${url}/api/enrollments/enrollments/${enrollment._id}/certificate`, {}, {
        headers: { "token": authToken }
      });
      
      if (response.data.success) {
        alert('Certificate generated successfully! You can now download it.');
        fetchEnrollmentDetails(authToken);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error generating certificate. Please try again.');
      }
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      // Use fetch with proper headers
      const response = await fetch(`${url}/api/enrollments/enrollments/${enrollment._id}/certificate/download`, {
        method: 'GET',
        headers: {
          'token': authToken
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        // If not PDF, try to get error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid response format');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `certificate-${enrollment.certificate.certificateId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert(`Error downloading certificate: ${error.message || 'Please try again.'}`);
    }
  };

  const isSectionCompleted = (sectionId) => {
    return enrollment?.progress?.completedSections?.some(
      section => section.sectionId === sectionId
    );
  };

  const getProgressPercentage = () => {
    if (!course?.content?.sections) return 0;
    const totalSections = course.content.sections.length;
    if (totalSections === 0) return 0;
    
    const completedSections = enrollment?.progress?.completedSections?.length || 0;
    return Math.round((completedSections / totalSections) * 100);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading course dashboard...</p>
      </div>
    );
  }

  if (!enrollment || !course) {
    return (
      <div className="error-container">
        <h2>Course Not Found</h2>
        <p>The course you're looking for doesn't exist or you're not enrolled.</p>
        <button onClick={() => navigate('/learn')} className="back-btn">
          Back to Courses
        </button>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const selectedPdfUrl = selectedPdf ? getPdfUrl(selectedPdf) : null;

  return (
    <div className="course-dashboard-container">
      <button onClick={() => navigate('/learn')} className="back-btn">
        ← Back to Courses
      </button>

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="course-info">
          <img 
            src={resolveMediaUrl(course.image) || coursePlaceholder}
            alt={course.title}
            className="course-image"
          />
          <div className="course-details">
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>
            <div className="course-meta">
              <div className="instructor">
                <img 
                  src={resolveMediaUrl(course.instructor?.avatar) || avatarPlaceholder} 
                  alt="Instructor" 
                />
                <span>{course.instructor?.name || 'Course Instructor'}</span>
              </div>
              <span className="duration">⏱️ {course.duration || 'Self-paced'} hours</span>
              <span className="level">📚 {course.level || 'Beginner'}</span>
              <span className="category">🏷️ {course.category || 'General'}</span>
            </div>
          </div>
        </div>
        
        <div className="progress-overview">
          <div className="progress-circle" style={{ '--progress': progressPercentage }}>
            <span className="progress-percentage">{progressPercentage}%</span>
          </div>
          <p className="progress-label">Course Progress</p>
          <div className="enrollment-status">
            <span className={`status ${enrollment.status || 'enrolled'}`}>
              {enrollment.status || 'Enrolled'}
            </span>
          </div>
        </div>
      </div>

      {/* Course Overview Cards */}
      <div className="course-overview-section">
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-icon">📚</div>
            <div className="card-content">
              <h3>Course Content</h3>
              <p>{course.content?.sections?.length || 0} sections</p>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="card-icon">📄</div>
            <div className="card-content">
              <h3>PDF Documents</h3>
              <p>{course.content?.sections?.reduce((total, section) => {
                return total + (section.topics?.reduce((topicTotal, topic) => {
                  return topicTotal + (topic.content?.pdfFile ? 1 : 0);
                }, 0) || 0);
              }, 0) || 0} documents</p>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="card-icon">🎥</div>
            <div className="card-content">
              <h3>Video Content</h3>
              <p>{course.content?.sections?.reduce((total, section) => {
                return total + (section.topics?.reduce((topicTotal, topic) => {
                  return topicTotal + (topic.content?.youtubeVideo?.url ? 1 : 0);
                }, 0) || 0);
              }, 0) || 0} videos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      {course.content?.timeline && course.content.timeline.length > 0 && (
        <div className="learning-path-section">
          <h2>🗺️ Course Timeline</h2>
          <div className="learning-path">
            {course.content.timeline.map((week, index) => (
              <div key={index} className="path-item">
                <div className="path-marker">
                  <span className="week-number">{week.week}</span>
                  <div className="path-line"></div>
                </div>
                <div className="path-content">
                  <h3>{week.title}</h3>
                  <p>{week.description}</p>
                  <div className="path-topics">
                    {week.topics?.map((topic, topicIndex) => (
                      <span key={topicIndex} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📚 Course Content
        </button>
        <button 
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          📊 Progress
        </button>
        <button 
          className={`tab ${activeTab === 'certificate' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificate')}
        >
          🏆 Certificate
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <h2>Course Overview</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <h3>📖 What You'll Learn</h3>
                <div className="learning-objectives">
                  {course.learningOutcomes?.map((outcome, index) => (
                    <div key={index} className="objective-item">
                      <span className="checkmark">✓</span>
                      <span>{outcome}</span>
                    </div>
                  )) || (
                    <>
                      <div className="objective-item">
                        <span className="checkmark">✓</span>
                        <span>Master fundamental concepts and principles</span>
                      </div>
                      <div className="objective-item">
                        <span className="checkmark">✓</span>
                        <span>Build real-world projects from scratch</span>
                      </div>
                      <div className="objective-item">
                        <span className="checkmark">✓</span>
                        <span>Learn industry best practices and standards</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="overview-card">
                <h3>🎯 Course Requirements</h3>
                <div className="requirements-list">
                  {course.requirements?.map((requirement, index) => (
                    <div key={index} className="requirement-item">
                      <span className="requirement-icon">💻</span>
                      <span>{requirement}</span>
                    </div>
                  )) || (
                    <>
                      <div className="requirement-item">
                        <span className="requirement-icon">💻</span>
                        <span>Basic computer skills</span>
                      </div>
                      <div className="requirement-item">
                        <span className="requirement-icon">🌐</span>
                        <span>Stable internet connection</span>
                      </div>
                      <div className="requirement-item">
                        <span className="requirement-icon">📱</span>
                        <span>Computer or mobile device</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="overview-card">
                <h3>📅 Course Timeline</h3>
                <div className="timeline">
                  {course.content?.sections?.map((section, index) => (
                    <div key={section._id} className="timeline-item">
                      <div className="timeline-marker">
                        {isSectionCompleted(section._id) ? '✅' : `${index + 1}`}
                      </div>
                      <div className="timeline-content">
                        <h3>{section.title}</h3>
                        <p>{section.description}</p>
                        <div className="section-meta">
                          <span>📚 {section.topics?.length || 0} topics</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-tab">
            <h2>Course Content</h2>
            <div className="sections-grid">
              {course.content?.sections?.map((section, sectionIndex) => (
                <div key={section._id || sectionIndex} className={`section-card ${isSectionCompleted(section._id) ? 'completed' : ''}`}>
                  <div className="section-header">
                    <h3>Section {sectionIndex + 1}: {section.title}</h3>
                    <span className="duration">⏱️ {section.duration || 'Self-paced'} min</span>
                  </div>
                  
                  <p>{section.description}</p>
                  
                  {/* Display Topics */}
                  {section.topics && section.topics.length > 0 && (
                    <div className="topics-container">
                      <h4>Topics:</h4>
                      {section.topics.map((topic, topicIndex) => {
                        // Support both new structure (topic.content.pdfFile)
                        // and possible legacy structure (topic.pdfFile / topic.pdfUrl)
                        const pdfSource =
                          topic.content?.pdfFile ||
                          topic.pdfFile ||
                          topic.pdfUrl ||
                          null;
                        const pdfFile = pdfSource && typeof pdfSource === 'object' ? pdfSource : { url: pdfSource };
                        const pdfUrl = getPdfUrl(pdfFile);
                        const pdfSize = getPdfSizeMb(pdfFile);

                        return (
                          <div key={topicIndex} className="topic-item">
                            <div className="topic-header">
                              <h5>{topic.title}</h5>
                              <span className="topic-order">#{topic.order + 1}</span>
                            </div>
                            
                            {topic.description && (
                              <p className="topic-description">{topic.description}</p>
                            )}
                            
                            <div className="topic-content">
                              {/* Text Content */}
                              {topic.content?.text && (
                                <div className="content-text">
                                  <h6>📝 Text Content</h6>
                                  <div className="text-content" dangerouslySetInnerHTML={{ __html: topic.content.text }} />
                                </div>
                              )}
                              
                              {/* PDF File */}
                              {pdfFile && (
                                <div className="content-pdf">
                                  <h6>📄 PDF Document</h6>
                                  <div className="pdf-info">
                                    <div className="pdf-details">
                                      <span className="pdf-name">{pdfFile.originalName || pdfFile.name || 'Course PDF'}</span>
                                      <div className="pdf-meta">
                                        {pdfSize && (
                                          <span className="pdf-size">
                                            📏 {pdfSize} MB
                                          </span>
                                        )}
                                        {pdfFile.uploadDate && (
                                          <span className="pdf-date">
                                            📅 {new Date(pdfFile.uploadDate).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="pdf-actions">
                                      {pdfUrl ? (
                                        <>
                                          <button 
                                            onClick={() => handlePdfView(pdfFile)}
                                            className="pdf-view-btn"
                                          >
                                            👁️ View PDF
                                          </button>
                                          <a 
                                            href={pdfUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="pdf-download-btn"
                                          >
                                            📥 Download PDF
                                          </a>
                                        </>
                                      ) : (
                                        <span className="pdf-missing">PDF link unavailable</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* YouTube Video */}
                              {topic.content?.youtubeVideo?.url && (() => {
                                const videoId = topic.content.youtubeVideo.videoId || extractYouTubeVideoId(topic.content.youtubeVideo.url);
                                return videoId ? (
                                  <div className="content-video">
                                    <h6>🎥 Video Content</h6>
                                    <div className="video-info">
                                      <span>{topic.content.youtubeVideo.title || 'Video'}</span>
                                      <div className="video-embed">
                                        <iframe
                                          width="100%"
                                          height="315"
                                          src={`https://www.youtube.com/embed/${videoId}`}
                                          title={topic.content.youtubeVideo.title || 'Video'}
                                          frameBorder="0"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        ></iframe>
                                      </div>
                                      <a 
                                        href={topic.content.youtubeVideo.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="video-link-btn"
                                      >
                                        🔗 Watch on YouTube
                                      </a>
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Legacy content display */}
                  <div className="section-stats">
                    <span>📚 {section.topics?.length || 0} topics</span>
                  </div>
                  
                  {!isSectionCompleted(section._id) && (
                    <button 
                      className="complete-section-btn"
                      onClick={() => handleSectionComplete(section._id)}
                    >
                      Mark as Complete
                    </button>
                  )}
                  
                  {isSectionCompleted(section._id) && (
                    <div className="completed-badge">✅ Completed</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="progress-tab">
            <h2>Your Progress</h2>
            <div className="progress-details">
              <div className="progress-chart">
                <div className="progress-ring">
                  <svg width="200" height="200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - progressPercentage / 100)}`}
                      transform="rotate(-90 100 100)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="progress-center">
                    <div className="progress-number">{progressPercentage}%</div>
                    <div className="progress-text">Complete</div>
                  </div>
                </div>
              </div>
              
              <div className="progress-breakdown">
                <h3>Progress Breakdown</h3>
                <div className="breakdown-item">
                  <span>Completed Sections</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <span>{enrollment?.progress?.completedSections?.length || 0} / {course.content?.sections?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certificate' && (
          <div className="certificate-tab">
            <h2>Course Certificate</h2>
            {enrollment.certificate?.issued ? (
              <div className="certificate-issued">
                <div className="certificate-badge">🏆</div>
                <h3>Certificate Issued!</h3>
                <p>Congratulations! You have successfully completed this course and earned your certificate.</p>
                <div className="certificate-details">
                  <p><strong>Certificate ID:</strong> {enrollment.certificate.certificateId}</p>
                  <p><strong>Issued Date:</strong> {new Date(enrollment.certificate.issuedAt).toLocaleDateString()}</p>
                  <p><strong>Course:</strong> {course.title}</p>
                  <p><strong>Student:</strong> {enrollment.student?.name || 'Student'}</p>
                </div>
                <button onClick={handleDownloadCertificate} className="download-certificate-btn">
                  Download Certificate
                </button>
              </div>
            ) : (
              <div className="certificate-requirements">
                <h3>Certificate Requirements</h3>
                <div className="requirements-list">
                  <div className="requirement-item">
                    <span className="requirement-icon">✅</span>
                    <span>Complete all course sections</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">✅</span>
                    <span>Achieve minimum 80% progress</span>
                  </div>
                </div>
                
                {progressPercentage >= 80 ? (
                  <div className="certificate-ready">
                    <p>You've met all requirements! You can now generate your certificate.</p>
                    <button onClick={handleGenerateCertificate} className="generate-certificate-btn">
                      Generate Certificate
                    </button>
                  </div>
                ) : (
                  <div className="certificate-pending">
                    <p>You need to complete more of the course to earn your certificate.</p>
                    <div className="completion-progress">
                      <span>Current Progress: {progressPercentage}%</span>
                      <span>Required: 80%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      {showPdfViewer && selectedPdf && selectedPdfUrl && (
        <PdfViewer
          pdfUrl={selectedPdfUrl}
          fileName={selectedPdf.originalName || selectedPdf.name}
          onClose={handlePdfClose}
        />
      )}
    </div>
  );
};

export default CourseDashboard; 
