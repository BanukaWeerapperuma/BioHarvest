import React from 'react'
import './Footer.css'
import { assets } from '../../assets/frontend_assets/assets'

const Footer = () => {
  return (
    <div  className="footer" id="footer">
            <div className="footer-content">
                <div className="footer-content-left">
                    <img src={assets.logo} alt="" />
                    <p>BioHarvest is built around a clean, earthy, and modern theme that reflects our commitment to health, sustainability, and simplicity. With calming greens, natural tones, and intuitive design, our platform connects users to organic living in a way that feels fresh, honest, and inspiring.</p>

                    <div className="footer-social-icons">
                        <img src={assets.facebook_icon} alt="" />
                        <img src={assets.twitter_icon} alt="" />
                        <img src={assets.linkedin_icon} alt="" />
                    </div>
                </div>
                <div className="footer-content-center">
                    <h2>COMPANY</h2>
                    <ul>
                       <li>Home</li>
                       <li>About Us</li>
                       <li>Delivery</li>
                       <li>Privacy policy</li>
                    </ul>
                </div>

                <div className="footer-content-right">
                        <h2>GET IN TOUCH</h2>
                        <ul>
                            
                            <li>+94 76 333 6479</li>
                            <li>contact@bioharvest.com</li>
                        </ul>
                </div>
            </div>
           
        
        <hr />
        <p className="footer-copy-right">
            Copyright 2025 © BioHarvest.com All rights reserved.
        </p>
    </div>
  )
}

export default Footer