import React from 'react'
import { useNavigate } from 'react-router-dom'
import './About.css'

const About = () => {
  const navigate = useNavigate();

  const handleJoinCommunity = () => {
    navigate('/community'); // Navigate to community page
  };

  const handleStartLearning = () => {
    navigate('/learn'); // Navigate to learn page
  };

  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="hero-content">
          <h1>About BioHarvest</h1>
          <p>Nourishing communities through healthy food and education</p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              At BioHarvest, we believe that healthy eating should be accessible, enjoyable, and educational. 
              Our mission is to connect people with nutritious, delicious food while providing the knowledge 
              and skills needed to make informed dietary choices.
            </p>
            <div className="mission-stats">
              <div className="stat">
                <h3>10K+</h3>
                <p>Happy Customers</p>
              </div>
              <div className="stat">
                <h3>500+</h3>
                <p>Healthy Recipes</p>
              </div>
              <div className="stat">
                <h3>50+</h3>
                <p>Expert Courses</p>
              </div>
              <div className="stat">
                <h3>24/7</h3>
                <p>Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="story-section">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2>Our Story</h2>
              <p>
                BioHarvest was founded in 2020 by a team of nutritionists, chefs, and technology enthusiasts 
                who shared a common vision: making healthy eating accessible to everyone. What started as a 
                small local food delivery service has grown into a comprehensive platform that combines 
                fresh, organic food delivery with educational resources.
              </p>
              <p>
                We understand that healthy eating isn't just about the food on your plate—it's about 
                understanding nutrition, developing cooking skills, and building sustainable habits. 
                That's why we've created a platform that offers both quality food and comprehensive 
                learning resources.
              </p>
            </div>
            <div className="story-image">
              <div className="image-placeholder">
                <span>🍃 Fresh & Organic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="values-section">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>Sustainability</h3>
              <p>We partner with local farmers and use eco-friendly packaging to minimize our environmental impact.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">💚</div>
              <h3>Health First</h3>
              <p>Every meal and course is designed with nutrition and wellness as the top priority.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🎓</div>
              <h3>Education</h3>
              <p>We believe knowledge is power. Our courses empower you to make informed food choices.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Community</h3>
              <p>Building a supportive community of health-conscious individuals who inspire and motivate each other.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">✨</div>
              <h3>Quality</h3>
              <p>We never compromise on quality, from our ingredients to our educational content.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🚀</div>
              <h3>Innovation</h3>
              <p>Continuously improving our platform and services to better serve our community.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="team-section">
        <div className="container">
          <h2>Meet Our Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">
                <span>👨‍🍳</span>
              </div>
              <h3>Chef Michael Chen</h3>
              <p className="member-role">Head Chef & Nutritionist</p>
              <p className="member-bio">
                With 15+ years of culinary experience, Michael creates our delicious, nutritious recipes.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">
                <span>👩‍⚕️</span>
              </div>
              <h3>Dr. Sarah Johnson</h3>
              <p className="member-role">Chief Nutrition Officer</p>
              <p className="member-bio">
                A registered dietitian who ensures all our content meets the highest nutritional standards.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">
                <span>👨‍💻</span>
              </div>
              <h3>David Kim</h3>
              <p className="member-role">Technology Director</p>
              <p className="member-bio">
                Leads our tech team to create seamless digital experiences for our community.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">
                <span>👩‍🏫</span>
              </div>
              <h3>Emma Rodriguez</h3>
              <p className="member-role">Education Manager</p>
              <p className="member-bio">
                Develops our educational content and ensures engaging learning experiences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join Our Community</h2>
            <p>Start your journey towards healthier eating and living today.</p>
            <div className="cta-buttons">
              <button className="cta-button primary" onClick={handleJoinCommunity}>
                Join Community
              </button>
              <button className="cta-button secondary" onClick={handleStartLearning}>
                Start Learning
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About 