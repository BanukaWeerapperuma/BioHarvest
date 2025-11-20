import React from 'react'
import './WhatsAppBubble.css'

const WhatsAppBubble = () => {
  const phoneNumber = '+94763336479' // Replace with your WhatsApp number
  const message = 'Hello! I need help with BioHarvest.'
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="whatsapp-bubble"
      title="Chat with us on WhatsApp"
    >
      <img src="/assets/wp.png" alt="WhatsApp" className="whatsapp-icon" />
    </a>
  )
}

export default WhatsAppBubble

