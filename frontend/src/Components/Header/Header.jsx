import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    navigate('/enrolled-courses');
  };

  return (
    <div className='header'>
        <div className="header-contents">
            <h2>Learn to Grow Naturally. Live Purely.</h2>
            <p>Start your journey toward healthier living — learn how to grow organic, eat clean, and live sustainably with BioHarvest.</p>
            <button onClick={handleLearnMore}>Learn More</button>
        </div>
    </div>
  )
}

export default Header