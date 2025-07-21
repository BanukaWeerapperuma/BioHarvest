import React, { useContext, useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/frontend_assets/assets'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'

const FoodItem = ({id ,name , price ,description, image, isCustomerAdded, slsCertificate, slsCertificateVerified, slsCertificateVerifiedAt}) => {

    const {cartItems , addToCart , removeFromCart , url, token } =useContext(StoreContext)
    const [showCertificate, setShowCertificate] = useState(false)
    const [certificateImage, setCertificateImage] = useState(null)
    const [loading, setLoading] = useState(false)

    // Determine which image to show
    const mainImage = (slsCertificate && slsCertificateVerified)
        ? url+"/uploads/"+slsCertificate
        : url+"/uploads/"+image;

    // Determine if the item is verified
    const isVerified = !!slsCertificateVerified;

    const handleViewCertificate = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${url}/api/food/${id}/sls-certificate`, {
                headers: { "token": token }
            })
            
            if (response.data.success) {
                setCertificateImage(response.data.data.imageUrl)
                setShowCertificate(true)
            } else {
                console.log('Certificate response:', response.data)
                alert(response.data.message || 'No SLS certificate found for this item')
            }
        } catch (error) {
            console.error('Error fetching certificate:', error)
            if (error.response && error.response.data) {
                alert(error.response.data.message || 'Error loading SLS certificate')
            } else {
                alert('Error loading SLS certificate')
            }
        } finally {
            setLoading(false)
        }
    }

    const closeCertificate = () => {
        setShowCertificate(false)
        setCertificateImage(null)
    }

  return (
    <>
        <div className='food-item' >
            <div className="food-item-img-container">
                <img className='food-item-image' src={mainImage} alt="food-items" />
                {isCustomerAdded && (
                    <div className="customer-added-badge">
                        <span>Community Item</span>
                    </div>
                )}
                {slsCertificate && (
                    <div className="sls-certificate-badge">
                        <span>SLS Certified</span>
                        {isVerified && (
                            <span className="verified-badge">✓ Verified</span>
                        )}
                    </div>
                )}
                {(!cartItems || !cartItems[id]) && isVerified && (
                    <img 
                        className='add' 
                        onClick={()=>addToCart(id)} 
                        src={assets.add_icon_white} 
                        alt="add_icon_white" 
                        style={{ opacity: 1, cursor: 'pointer' }}
                    />
                )}
                {(!cartItems || !cartItems[id]) && !isVerified && (
                    <img 
                        className='add' 
                        src={assets.add_icon_white} 
                        alt="add_icon_white" 
                        style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}
                    />
                )}
                {cartItems && cartItems[id] && (
                    <div className='food-item-counter'>
                        <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt="" />
                        <p>{cartItems[id]}</p>
                        <img onClick={()=>isVerified && addToCart(id)} src={assets.add_icon_green} alt="" style={{ opacity: isVerified ? 1 : 0.5, cursor: isVerified ? 'pointer' : 'not-allowed' }} />
                    </div>
                )}
            </div>
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                    <img src={assets.rating_starts} alt="" />
                </div>
                <p className="food-item-desc">
                    {description}
                </p>
                <p className="food-item-price">
                    ${price}
                </p>
                <button 
                    className="view-certificate-btn"
                    onClick={handleViewCertificate}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'View SLS Certificate'}
                </button>
                {!isVerified && (
                    <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>Not SLS Verified - Cannot Purchase</div>
                )}
            </div>
        </div>

        {/* SLS Certificate Modal */}
        {showCertificate && certificateImage && (
            <div className="certificate-modal-overlay" onClick={closeCertificate}>
                <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="certificate-modal-header">
                        <h3>SLS Certificate - {name}</h3>
                        <button className="close-btn" onClick={closeCertificate}>✕</button>
                    </div>
                    <div className="certificate-modal-content">
                        <img 
                            src={url + certificateImage} 
                            alt="SLS Certificate" 
                            className="certificate-image"
                        />
                        {isVerified && (
                            <div className="verification-info">
                                <p>✓ Verified by Admin</p>
                                {slsCertificateVerifiedAt && <p>Verified on: {new Date(slsCertificateVerifiedAt).toLocaleDateString()}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </>
  )
}

export default FoodItem