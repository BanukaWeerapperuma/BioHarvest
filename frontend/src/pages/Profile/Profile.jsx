import React, { useState, useEffect, useContext, useRef } from 'react'
import './Profile.css'
import { StoreContext } from '../../context/StoreContext'

const Profile = () => {
  const { 
    token, 
    userProfile, 
    fetchUserProfile, 
    updateUserProfile, 
    uploadProfilePicture, 
    setUserProfile,
    url
  } = useContext(StoreContext)
  
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferences: {
      dietary: '',
      allergies: '',
      notifications: true
    }
  })

  // Fetch user profile
  const fetchProfile = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const profileData = await fetchUserProfile(token)
      console.log('Fetched profile data:', profileData)
      
      // If we have profile data, try to fetch real stats
      if (profileData) {
        try {
          // Fetch user orders to get accurate order count
          const ordersResponse = await fetch(`${url}/api/order/user-orders`, {
            headers: { token }
          })
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json()
            const orderCount = ordersData.data ? ordersData.data.length : 0
            
            // Fetch user enrollments to get accurate course count
            const enrollmentsResponse = await fetch(`${url}/api/enrollments/user`, {
              headers: { token }
            })
            let courseCount = 0
            if (enrollmentsResponse.ok) {
              const enrollmentsData = await enrollmentsResponse.json()
              courseCount = enrollmentsData.data ? enrollmentsData.data.length : 0
            }
            
            // Update the profile with real stats
            const updatedProfile = {
              ...profileData,
              stats: {
                orders: orderCount,
                courses: courseCount,
                points: profileData.stats?.points || 0
              }
            }
            setUserProfile(updatedProfile)
            console.log('Updated profile with real stats:', updatedProfile)
          }
        } catch (statsError) {
          console.log('Error fetching real stats, using default stats:', statsError)
        }
      }
    } catch (error) {
      console.log('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update form data when userProfile changes
  useEffect(() => {
    console.log('Profile component - userProfile changed:', userProfile);
    console.log('Profile image URL:', userProfile?.profileImage);
    console.log('User stats:', userProfile?.stats);
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        preferences: {
          dietary: userProfile.preferences?.dietary || '',
          allergies: userProfile.preferences?.allergies || '',
          notifications: userProfile.preferences?.notifications !== false
        }
      })
    }
  }, [userProfile])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const result = await updateUserProfile(formData)
      if (result.success) {
        setEditing(false)
      } else {
        console.log('Failed to update profile:', result.error)
      }
    } catch (error) {
      console.log('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, etc.)')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedImage) return
    
    console.log('Starting image upload for file:', selectedImage.name);
    console.log('File size:', selectedImage.size, 'bytes');
    console.log('File type:', selectedImage.type);
    setUploadingImage(true)
    
    try {
      const result = await uploadProfilePicture(selectedImage)
      console.log('Upload result:', result);
      if (result.success) {
        // Refresh the profile to get the new image URL
        await fetchUserProfile(token)
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Show success message
        alert('Profile picture uploaded successfully!')
      } else {
        console.log('Failed to upload image:', result.error)
        alert(`Failed to upload profile picture: ${result.error}`)
      }
    } catch (error) {
      console.log('Error uploading image:', error)
      alert(`Error uploading profile picture: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    fetchProfile()
  }, [token])

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="profile-container">
        <div className="login-required">
          <h2>Login Required</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-content">
        <div className="container">
          <div className="profile-grid">
            {/* Profile Overview */}
            <div className="profile-overview">
              <div className="profile-card">
                <div className="profile-avatar">
                  <img 
                    src={imagePreview || userProfile?.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iNjAiIGN5PSI0NSIgcj0iMjAiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDEwNUMyMCA4NS4wNTc2IDM1LjA1NzYgNzAgNTUgNzBINjVDODQuOTQyNCA3MCAxMDAgODUuMDU3NiAxMDAgMTA1VjExMEgyMFYxMDVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='} 
                    alt="Profile" 
                    onError={(e) => {
                      // If profile image fails to load, use default avatar
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iNjAiIGN5PSI0NSIgcj0iMjAiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDEwNUMyMCA4NS4wNTc2IDM1LjA1NzYgNzAgNTUgNzBINjVDODQuOTQyNCA3MCAxMDAgODUuMDU3NiAxMDAgMTA1VjExMEgyMFYxMDVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                    }}
                  />
                  <button 
                    className="avatar-edit" 
                    onClick={triggerFileInput}
                    title="Change profile picture"
                  >
                    📷
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  {userProfile?.profileImage && (
                    <div className="profile-photo-status">
                      <span className="status-indicator">✓</span>
                      <span className="status-text">Profile Photo Set</span>
                    </div>
                  )}
                </div>
                
                {selectedImage && (
                  <div className="image-upload-section">
                    <p className="selected-file">Selected: {selectedImage.name}</p>
                    <button 
                      onClick={handleImageUpload}
                      className="upload-button"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Picture'}
                    </button>
                  </div>
                )}
                
                <div className="profile-info">
                  <h2>{userProfile?.name}</h2>
                  <p className="email">{userProfile?.email}</p>
                  <p className="join-date">
                    Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    }) : 'Recently'}
                  </p>
                  {!userProfile?.profileImage && (
                    <p className="upload-hint">
                      Click the camera icon to upload your profile photo
                    </p>
                  )}
                </div>

                <div className="profile-stats">
                  <div className="stat">
                    <h3>{loading ? '...' : (userProfile?.stats?.orders || 0)}</h3>
                    <p>Orders</p>
                    <span className="stat-description">Total orders placed</span>
                  </div>
                  <div className="stat">
                    <h3>{loading ? '...' : (userProfile?.stats?.courses || 0)}</h3>
                    <p>Courses</p>
                    <span className="stat-description">Courses enrolled</span>
                  </div>
                  <div className="stat">
                    <h3>{loading ? '...' : (userProfile?.stats?.points || 0)}</h3>
                    <p>Points</p>
                    <span className="stat-description">Loyalty points earned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="profile-form-section">
              <div className="form-header">
                <h2>Profile Information</h2>
                {!editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    className="edit-button"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dietary">Dietary Preferences</label>
                    <select
                      id="dietary"
                      name="preferences.dietary"
                      value={formData.preferences.dietary}
                      onChange={handleChange}
                    >
                      <option value="">No preference</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                      <option value="Keto">Keto</option>
                      <option value="Paleo">Paleo</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="allergies">Food Allergies</label>
                    <input
                      type="text"
                      id="allergies"
                      name="preferences.allergies"
                      value={formData.preferences.allergies}
                      onChange={handleChange}
                      placeholder="e.g., Nuts, Dairy, Shellfish"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferences.notifications"
                        checked={formData.preferences.notifications}
                        onChange={handleChange}
                      />
                      Receive email notifications
                    </label>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => setEditing(false)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="save-button"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-details">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <p>{userProfile?.name}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email Address</label>
                    <p>{userProfile?.email}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <p>{userProfile?.phone || 'Not provided'}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Address</label>
                    <p>{userProfile?.address || 'Not provided'}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Dietary Preferences</label>
                    <p>{userProfile?.preferences?.dietary || 'No preference'}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Food Allergies</label>
                    <p>{userProfile?.preferences?.allergies || 'None'}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email Notifications</label>
                    <p>{userProfile?.preferences?.notifications ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 