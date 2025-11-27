import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditBlog.css';
import axios from 'axios';
import { url } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Health',
    tags: '',
    isPublished: true
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    if (admin) {
      fetchBlogPost();
    }
  }, [admin, id]);

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${url}/uploads/${imagePath}`;
  };

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/blog/admin/list`);
      if (response.data.success) {
        const post = response.data.data.find(p => p._id === id);
        if (post) {
          setFormData({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            category: post.category,
            tags: post.tags ? post.tags.join(', ') : '',
            isPublished: post.isPublished
          });
          setImagePreview(resolveImageUrl(post.image));
        } else {
          alert('Blog post not found');
          navigate('/blog');
        }
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      alert('Error fetching blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('excerpt', formData.excerpt);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('isPublished', formData.isPublished);
      
      if (newImage) {
        formDataToSend.append('image', newImage);
      }

      const response = await axios.put(`${url}/api/blog/admin/update/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Blog post updated successfully!');
        navigate('/blog');
      } else {
        alert('Failed to update blog post');
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      alert('Error updating blog post');
    } finally {
      setSubmitting(false);
    }
  };

  if (!admin) {
    return (
      <div className="edit-blog-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need to be logged in as admin to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="edit-blog-container">
        <div className="loading-message">
          <p>Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-blog-container">
      <div className="edit-blog-header">
        <h1>Edit Blog Post</h1>
        <button 
          className="back-btn"
          onClick={() => navigate('/blog')}
        >
          ← Back to Blog Management
        </button>
      </div>

      <div className="edit-blog-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter blog post title"
            />
          </div>

          <div className="form-group">
            <label>Excerpt *</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              required
              placeholder="Enter a short excerpt (max 200 characters)"
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{formData.excerpt.length}/200</span>
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Enter blog post content"
              rows={12}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="Health">Health</option>
                <option value="Nutrition">Nutrition</option>
                <option value="Recipes">Recipes</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Fitness">Fitness</option>
                <option value="Wellness">Wellness</option>
                <option value="News">News</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
              />
              Publish this post
            </label>
          </div>

          <div className="form-group">
            <label>Current Image</label>
            {imagePreview && (
              <div className="current-image">
                <img src={imagePreview} alt="Current" />
                <p>Current image (upload new image to replace)</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className="image-help">Leave empty to keep current image</p>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/blog')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Blog Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlog; 