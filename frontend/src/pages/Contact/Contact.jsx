import React, { useState, useEffect } from 'react'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true)
        initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        setMapLoaded(true)
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initMap()
        }, 100)
      }
      script.onerror = () => {
        console.error('Failed to load Google Maps API')
        setMapLoaded(false)
        setMapError(true)
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Re-initialize map when mapLoaded changes
  useEffect(() => {
    if (mapLoaded) {
      // Additional delay to ensure DOM is fully rendered
      setTimeout(() => {
        initMap()
      }, 200)
    }
  }, [mapLoaded])

  const initMap = () => {
    console.log('initMap called')
    
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded')
      setMapError(true)
      return
    }

    const mapElement = document.getElementById('google-map')
    if (!mapElement) {
      console.error('Map element not found')
      setMapError(true)
      return
    }

    console.log('Map element found, initializing map...')

    const location = { lat: 7.2906, lng: 80.6337 } // Kandy, Sri Lanka coordinates
    
    try {
      const map = new window.google.maps.Map(mapElement, {
        center: location,
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9c9c9' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }]
          }
        ]
      })

      console.log('Map created successfully')

      // Add marker
      const marker = new window.google.maps.Marker({
        position: location,
        map: map,
        title: 'BioHarvest',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#6366f1" stroke="white" stroke-width="2"/>
              <circle cx="20" cy="20" r="8" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      })

      console.log('Marker added successfully')

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; color: #6366f1;">BioHarvest</h3>
            <p style="margin: 0; font-size: 14px;">275 Galaha Street<br>Kandy District, Sri Lanka</p>
          </div>
        `
      })

      map.addListener('click', () => {
        infoWindow.open(map, map.getCenter())
      })

      console.log('Map initialization completed')
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError(true)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    }, 2000)
  }

  const handleGetDirections = () => {
    const address = '275 Galaha Street, Kandy District, Sri Lanka'
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank')
  }

  const handleRetryMap = () => {
    setMapError(false)
    setMapLoaded(false)
    // Reload the map
    setTimeout(() => {
      initMap()
    }, 100)
  }

  return (
    <div className="contact-container">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Get in Touch</h1>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </div>

      <div className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info">
              <h2>Contact Information</h2>
              <p>Have questions? We're here to help! Reach out to us through any of these channels.</p>
              
              <div className="info-items">
                <div className="info-item">
                  <div className="info-icon">📍</div>
                  <div className="info-content">
                    <h3>Address</h3>
                    <p>275 Galaha Street<br />Kandy District, Sri Lanka</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">📧</div>
                  <div className="info-content">
                    <h3>Email</h3>
                    <p>hello@bioharvest.com<br />support@bioharvest.com</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">📞</div>
                  <div className="info-content">
                    <h3>Phone</h3>
                    <p>+94 (11) 123-4567<br />Mon-Fri: 9AM-6PM IST</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">💬</div>
                  <div className="info-content">
                    <h3>Live Chat</h3>
                    <p>Available 24/7<br />Click the chat icon below</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon" aria-label="Facebook">📘</a>
                  <a href="#" className="social-icon" aria-label="Instagram">📷</a>
                  <a href="#" className="social-icon" aria-label="Twitter">🐦</a>
                  <a href="#" className="social-icon" aria-label="LinkedIn">💼</a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              
              {submitted && (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    aria-describedby="name-help"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    aria-describedby="email-help"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    aria-describedby="subject-help"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="orders">Order Questions</option>
                    <option value="courses">Course Information</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us how we can help you..."
                    aria-describedby="message-help"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={submitting}
                  aria-describedby="submit-status"
                >
                  {submitting ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How do I place an order?</h3>
              <p>Browse our menu, add items to your cart, and proceed to checkout. You can pay securely online and track your order in real-time.</p>
            </div>
            
            <div className="faq-item">
              <h3>What are your delivery times?</h3>
              <p>We offer same-day delivery for orders placed before 2 PM. Delivery times vary by location, typically 30-60 minutes.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I enroll in courses?</h3>
              <p>Visit our Learn section, browse available courses, and click "Enroll Now" to get started. All courses are self-paced and accessible 24/7.</p>
            </div>
            
            <div className="faq-item">
              <h3>Do you offer refunds?</h3>
              <p>Yes, we offer a 30-day money-back guarantee on all courses. For food orders, we'll replace any items that don't meet your satisfaction.</p>
            </div>
            
            <div className="faq-item">
              <h3>Are your ingredients organic?</h3>
              <p>We prioritize organic, locally-sourced ingredients whenever possible. All our suppliers meet our strict quality standards.</p>
            </div>
            
            <div className="faq-item">
              <h3>How can I track my order?</h3>
              <p>Once your order is confirmed, you'll receive a tracking link via email and SMS. You can also track it in your account dashboard.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="map-section">
        <div className="container">
          <h2>Visit Our Place</h2>
          
          <div className="map-container">
            {mapLoaded && !mapError ? (
              <div id="google-map" className="google-map"></div>
            ) : mapError ? (
              <div className="map-error">
                <div className="error-icon">🗺️</div>
                <h3>Map Unavailable</h3>
                <p>Sorry, we couldn't load the map. Please try again.</p>
                <button onClick={handleRetryMap} className="retry-btn">
                  Retry Map
                </button>
              </div>
            ) : (
              <div className="map-loading">
                <div className="loading-spinner"></div>
                <p>Loading map...</p>
              </div>
            )}
            <div className="map-info">
              <h3>📍 Our Location</h3>
              <p>275 Galaha Street<br />Kandy District,<br />Sri Lanka</p>
              <button 
                className="directions-btn" 
                onClick={handleGetDirections}
                aria-label="Get directions to our location"
              >
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact 