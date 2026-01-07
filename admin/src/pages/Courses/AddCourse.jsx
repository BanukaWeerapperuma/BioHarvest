import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddCourse.css';

const AddCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState({
    title: '',
    description: '',
    duration: 0
  });
  const [currentSectionTopics, setCurrentSectionTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState({
    title: '',
    description: '',
    content: {
      text: '',
      pdfFile: null,
      youtubeVideo: {
        title: '',
        url: '',
        videoId: ''
      }
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'organic',
    level: 'beginner',
    price: 0,
    discount: 0,
    isFree: false,
    duration: 0,
    instructor: {
      name: '',
      title: '',
      bio: ''
    },
    tags: [],
    requirements: [],
    learningOutcomes: []
  });

  const url = 'https://bioharvest-lemon.vercel.app';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isFree') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        price: checked ? 0 : prev.price
      }));
    } else if (name === 'instructor.name' || name === 'instructor.title' || name === 'instructor.bio') {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        instructor: {
          ...prev.instructor,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value) || 0) : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleSectionChange = (e) => {
    const { name, value, type } = e.target;
    setCurrentSection(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value) || 0) : value
    }));
  };

  const handleTopicChange = (e) => {
    const { name, value } = e.target;
    if (name === 'youtubeUrl') {
      // Extract video ID from YouTube URL
      const videoId = extractYouTubeVideoId(value);
      setCurrentTopic(prev => ({
        ...prev,
        content: {
          ...prev.content,
          youtubeVideo: {
            ...prev.content.youtubeVideo,
            url: value,
            videoId: videoId
          }
        }
      }));
    } else if (name === 'youtubeTitle') {
      setCurrentTopic(prev => ({
        ...prev,
        content: {
          ...prev.content,
          youtubeVideo: {
            ...prev.content.youtubeVideo,
            title: value
          }
        }
      }));
    } else if (name === 'textContent') {
      setCurrentTopic(prev => ({
        ...prev,
        content: {
          ...prev.content,
          text: value
        }
      }));
    } else {
      setCurrentTopic(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const extractYouTubeVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file');
        return;
      }
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('PDF file size must be less than 50MB');
        return;
      }
      
      setCurrentTopic(prev => ({
        ...prev,
        content: {
          ...prev.content,
          pdfFile: file
        }
      }));
    }
  };

  const addTopic = () => {
    if (currentTopic.title.trim()) {
      const newTopic = {
        ...currentTopic,
        order: currentSectionTopics.length
      };
      setCurrentSectionTopics(prev => [...prev, newTopic]);
      
      // Reset topic form
      setCurrentTopic({
        title: '',
        description: '',
        content: {
          text: '',
          pdfFile: null,
          youtubeVideo: {
            title: '',
            url: '',
            videoId: ''
          }
        }
      });
    } else {
      alert('Please enter a topic title');
    }
  };

  const removeTopic = (index) => {
    setCurrentSectionTopics(prev => prev.filter((_, i) => i !== index));
  };

  const addSection = () => {
    if (currentSection.title.trim()) {
      if (currentSectionTopics.length === 0) {
        alert('Please add at least one topic to the section');
        return;
      }
      
      const newSection = {
        ...currentSection,
        topics: [...currentSectionTopics]
      };
      setSections(prev => [...prev, newSection]);
      
      // Reset section and topics
      setCurrentSection({
        title: '',
        description: '',
        duration: 0
      });
      setCurrentSectionTopics([]);
    } else {
      alert('Please enter a section title');
    }
  };

  const removeSection = (index) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!imageFile) {
      alert('Please select a course image');
      return;
    }

    if (formData.isFree && formData.price > 0) {
      alert('Free courses should have price set to 0');
      return;
    }

    if (sections.length === 0) {
      alert('Please add at least one section with topics');
      return;
    }

    if (!formData.instructor.name.trim()) {
      alert('Please enter instructor name');
      return;
    }

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);
      
      // Append avatar file if selected
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'instructor' || key === 'content') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (typeof formData[key] === 'boolean') {
          formDataToSend.append(key, formData[key].toString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append sections with topics - clean up PDF file objects before sending
      const cleanedSections = sections.map(section => ({
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          content: {
            ...topic.content,
            pdfFile: topic.content.pdfFile instanceof File ? null : topic.content.pdfFile
          }
        }))
      }));
      
      formDataToSend.append('sections', JSON.stringify(cleanedSections));

      // Append PDF files for topics
      sections.forEach((section, sectionIndex) => {
        section.topics.forEach((topic, topicIndex) => {
          if (topic.content.pdfFile instanceof File) {
            formDataToSend.append(`pdf_${sectionIndex}_${topicIndex}`, topic.content.pdfFile);
          }
        });
      });

      // Debug: Log what's being sent
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, ':', value);
      }

      const response = await axios.post(`${url}/api/courses/admin/add`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Course added successfully!');
        navigate('/courses');
      } else {
        alert('Failed to add course: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error adding course:', error);
      if (error.response && error.response.data) {
        alert('Error adding course: ' + error.response.data.message);
      } else {
        alert('Error adding course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-course-container">
      <div className="add-course-header">
        <h1>Add New Course</h1>
        <p>Create a new course with comprehensive content</p>
      </div>

      <form onSubmit={handleSubmit} className="add-course-form">
        {/* Basic Course Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="organic">Organic</option>
                <option value="food">Food</option>
                <option value="plantation">Plantation</option>
                <option value="sustainability">Sustainability</option>
                <option value="cooking">Cooking</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Level *</label>
              <select name="level" value={formData.level} onChange={handleInputChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter course description"
              rows="4"
              required
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h2>Pricing</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleInputChange}
                />
                Free Course
              </label>
            </div>
          </div>

          {!formData.isFree && (
            <div className="form-row">
              <div className="form-group">
                <label>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Instructor Information */}
        <div className="form-section">
          <h2>Instructor Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Instructor Name *</label>
              <input
                type="text"
                name="instructor.name"
                value={formData.instructor.name}
                onChange={handleInputChange}
                placeholder="Enter instructor name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Instructor Title</label>
              <input
                type="text"
                name="instructor.title"
                value={formData.instructor.title}
                onChange={handleInputChange}
                placeholder="e.g., Course Instructor"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Instructor Bio</label>
            <textarea
              name="instructor.bio"
              value={formData.instructor.bio}
              onChange={handleInputChange}
              placeholder="Enter instructor bio"
              rows="3"
            />
          </div>
        </div>

        {/* Course Images */}
        <div className="form-section">
          <h2>Course Images</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Course Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
              {imageFile && (
                <p className="file-info">Selected: {imageFile.name}</p>
              )}
            </div>
            
            <div className="form-group">
              <label>Instructor Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {avatarFile && (
                <p className="file-info">Selected: {avatarFile.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="form-section">
          <h2>Course Content</h2>
          
          {/* Existing Sections */}
          {sections.length > 0 && (
            <div className="sections-list">
              <h3>Added Sections ({sections.length})</h3>
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="section-item">
                  <div className="section-header">
                    <h4>{section.title}</h4>
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                  <p>{section.description}</p>
                  <p>Duration: {section.duration} minutes</p>
                  <p>Topics: {section.topics.length}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add New Section */}
          <div className="add-section-form">
            <h3>Add New Section</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Section Title *</label>
                <input
                  type="text"
                  name="title"
                  value={currentSection.title}
                  onChange={handleSectionChange}
                  placeholder="Enter section title"
                />
              </div>
              
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={currentSection.duration}
                  onChange={handleSectionChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Section Description</label>
              <textarea
                name="description"
                value={currentSection.description}
                onChange={handleSectionChange}
                placeholder="Enter section description"
                rows="2"
              />
            </div>

            {/* Topics for Current Section */}
            <div className="topics-section">
              <h4>Topics ({currentSectionTopics.length})</h4>
              
              {currentSectionTopics.length > 0 && (
                <div className="topics-list">
                  {currentSectionTopics.map((topic, index) => (
                    <div key={index} className="topic-item">
                      <div className="topic-header">
                        <h5>{topic.title}</h5>
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                      <p>{topic.description}</p>
                      {topic.content.pdfFile && (
                        <p className="file-info">📄 PDF: {topic.content.pdfFile.name || topic.content.pdfFile.originalName}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Topic */}
              <div className="add-topic-form">
                <h5>Add New Topic</h5>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Topic Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={currentTopic.title}
                      onChange={handleTopicChange}
                      placeholder="Enter topic title"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Topic Description</label>
                  <textarea
                    name="description"
                    value={currentTopic.description}
                    onChange={handleTopicChange}
                    placeholder="Enter topic description"
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Text Content</label>
                  <textarea
                    name="textContent"
                    value={currentTopic.content.text}
                    onChange={handleTopicChange}
                    placeholder="Enter text content for this topic"
                    rows="4"
                  />
                </div>

                {/* PDF File */}
                <div className="form-group">
                  <label>PDF File (optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfFileChange}
                    className="topic-pdf-input"
                  />
                  {currentTopic.content.pdfFile && (
                    <p className="file-info">Selected: {currentTopic.content.pdfFile.name || currentTopic.content.pdfFile.originalName}</p>
                  )}
                </div>

                {/* YouTube Video */}
                <div className="form-group">
                  <label>YouTube Video Title (optional)</label>
                  <input
                    type="text"
                    name="youtubeTitle"
                    value={currentTopic.content.youtubeVideo.title}
                    onChange={handleTopicChange}
                    placeholder="e.g., Introduction to Organic Farming"
                    className="topic-video-title-input"
                  />
                </div>

                <div className="form-group">
                  <label>YouTube Video URL (optional)</label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={currentTopic.content.youtubeVideo.url}
                    onChange={handleTopicChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="topic-video-url-input"
                  />
                  {currentTopic.content.youtubeVideo.videoId && (
                    <p className="video-info">Video ID: {currentTopic.content.youtubeVideo.videoId}</p>
                  )}
                </div>
              </div>

              <button type="button" onClick={addTopic} className="add-topic-btn">
                + Add Topic
              </button>
            </div>

            <button type="button" onClick={addSection} className="add-section-btn">
              + Add Section
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding Course...' : 'Add Course'}
          </button>
          <button type="button" onClick={() => navigate('/courses')} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse; 