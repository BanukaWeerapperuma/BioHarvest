import React, { useContext, useEffect, useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/frontend_assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { RatingContext } from '../../context/RatingContext'
import axios from 'axios'
import { formatCurrency } from '../../utils/price'

const FoodItem = ({id ,name , price ,description, image, isCustomerAdded, slsCertificate, phone, address, availableQuantity, rating, reviewCount}) => {

    const {cartItems , addToCart , removeFromCart , url, token } =useContext(StoreContext)
    const [showCertificate, setShowCertificate] = useState(false)
    const [certificateImage, setCertificateImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showMoreInfo, setShowMoreInfo] = useState(false)
    const [aggregatedRating, setAggregatedRating] = useState(rating ? Math.round(Number(rating)) : 0)
    const [aggregatedCount, setAggregatedCount] = useState(typeof reviewCount !== 'undefined' && reviewCount !== null ? reviewCount : 0)
    const { ratings } = useContext(RatingContext)
    

    // Determine which image to show
    // Check if image is already a full URL (Cloudinary) or needs local path
    const getImageUrl = (imgPath) => {
        if (!imgPath) return '';
        // If it's already a full URL (starts with http), return as is
        if (imgPath.startsWith('http')) {
            return imgPath;
        }
        // Otherwise, it's a local path
        return url + "/uploads/" + imgPath;
    };

    // Determine main image - always use food image, certificate is viewed separately
    const mainImage = getImageUrl(image);

    // Determine if the item is verified
    const isVerified = slsCertificate && slsCertificate.isVerified;

    const handleViewCertificate = async () => {
        // Prevent multiple clicks while loading
        if (loading) return;
        
        // If certificate data is already available and has URL, show it immediately
        if (slsCertificate && slsCertificate.url) {
            console.log('Using certificate URL from props:', slsCertificate.url)
            setCertificateImage(slsCertificate.url)
            setShowCertificate(true)
            return
        }
        
        // Otherwise fetch from API
        setLoading(true)
        try {
            console.log('Fetching certificate from API for foodId:', id)
            const response = await axios.get(`${url}/api/food/${id}/sls-certificate`, {
                headers: { "token": token || "" }
            })
            
            console.log('Certificate API response:', response.data)
            
            if (response.data.success && response.data.data && response.data.data.imageUrl) {
                const imageUrl = response.data.data.imageUrl
                console.log('Certificate image URL:', imageUrl)
                setCertificateImage(imageUrl)
                setShowCertificate(true)
            } else {
                console.log('No certificate found in response:', response.data)
                alert(response.data.message || 'No SLS certificate found for this item')
            }
        } catch (error) {
            console.error('Error fetching certificate:', error)
            if (error.response && error.response.data) {
                alert(error.response.data.message || 'Error loading SLS certificate')
            } else {
                alert('Error loading SLS certificate. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const closeCertificate = () => {
        setShowCertificate(false)
        setCertificateImage(null)
    }

    useEffect(() => {
        let mounted = true;
        const fetchAggregated = async () => {
            try {
                const res = await axios.get(`${url}/api/food/${id}`);
                if (res.data && res.data.success && res.data.data) {
                    const f = res.data.data;
                    if (!mounted) return;
                    setAggregatedRating(f.rating ? Math.round(Number(f.rating)) : 0);
                    setAggregatedCount(typeof f.reviewCount !== 'undefined' && f.reviewCount !== null ? f.reviewCount : 0);
                }
            } catch (err) {
                console.error('Error fetching aggregated rating for food:', err);
            }
        }
        fetchAggregated();
        return () => { mounted = false; }
    }, [id, url]);

    

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
                {(!cartItems || !cartItems[id]) && (
                    <img 
                        className='add' 
                        onClick={()=>isVerified && addToCart(id)} 
                        src={assets.add_icon_white} 
                        alt="add_icon_white" 
                        style={{ opacity: isVerified ? 1 : 0.5, cursor: isVerified ? 'pointer' : 'not-allowed' }}
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
                    <div className="food-rating-wrapper" >
                        <>
                            <div className="food-rating-stars" aria-hidden>
                                {Array.from({ length: 5 }).map((_, idx) => {
                                    const starIndex = idx + 1;
                                    // Prefer live context value, then aggregated state
                                    const ctx = ratings && ratings[id] ? ratings[id] : null;
                                    const displayRating = (ctx && ctx.rating !== undefined && ctx.rating !== null)
                                        ? Math.round(Number(ctx.rating))
                                        : (aggregatedRating || 0);
                                    return (
                                        <span
                                            key={starIndex}
                                            className={`food-rating-star ${starIndex <= displayRating ? '' : 'inactive'}`}
                                        >
                                            ★
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="food-review-count">{`(${(ratings && ratings[id] && typeof ratings[id].reviewCount !== 'undefined') ? ratings[id].reviewCount : aggregatedCount})`}</div>
                        </>
                    </div>
                </div>
                <p className="food-item-desc">
                    {description}
                </p>
                <div className="food-item-price-container">
                    <p className="food-item-price">
                        {formatCurrency(price)}
                    </p>
                    <button 
                        className="more-info-btn-small"
                        onClick={() => setShowMoreInfo(true)}
                        title="Click to view more information"
                    >
                        More Info
                    </button>
                </div>
                {slsCertificate && (
                    <button 
                        className="view-certificate-btn"
                        onClick={handleViewCertificate}
                        disabled={loading}
                        title="Click to view SLS certificate"
                    >
                        {loading ? 'Loading...' : 'View SLS Certificate'}
                    </button>
                )}
                {slsCertificate && (
                    isVerified ? (
                        <div style={{color: 'green', fontSize: '12px', marginTop: '4px', fontWeight: '500'}}>SLS Verified - Can Purchase</div>
                    ) : (
                        <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>Not SLS Verified - Cannot Purchase</div>
                    )
                )}
                {availableQuantity !== null && availableQuantity !== undefined && (
                    <div style={{color: '#666', fontSize: '12px', marginTop: '4px'}}>
                        Available: {availableQuantity} item(s)
                    </div>
                )}

                {/* Reviews removed: only aggregated rating shown above */}
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
                        {certificateImage ? (
                            <>
                                <img 
                                    src={
                                        certificateImage && (certificateImage.startsWith('http') || certificateImage.startsWith('https'))
                                            ? certificateImage
                                            : certificateImage
                                            ? `${url}${certificateImage.startsWith('/') ? '' : '/'}${certificateImage}`
                                            : ''
                                    } 
                                    alt="SLS Certificate" 
                                    className="certificate-image"
                                    style={{maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto'}}
                                    onLoad={() => {
                                        console.log('Certificate image loaded successfully:', certificateImage)
                                    }}
                                    onError={(e) => {
                                        console.error('Error loading certificate image:', certificateImage);
                                        e.target.style.display = 'none';
                                        const errorDiv = e.target.parentElement.querySelector('.certificate-error');
                                        if (errorDiv) {
                                            errorDiv.style.display = 'block';
                                        }
                                    }}
                                />
                                <div className="certificate-error" style={{display: 'none', color: 'red', padding: '20px', textAlign: 'center'}}>
                                    <p>Error loading certificate image.</p>
                                    <p>URL: {certificateImage}</p>
                                    <p>Please try again or contact support.</p>
                                </div>
                            </>
                        ) : (
                            <div style={{color: 'red', padding: '20px', textAlign: 'center'}}>
                                <p>Certificate image not available</p>
                                <p>Please refresh the page and try again.</p>
                            </div>
                        )}
                        {slsCertificate && (
                            isVerified ? (
                                <div className="verification-info">
                                    <p>✓ Verified by Admin</p>
                                    {slsCertificate.verifiedAt && (
                                        <p>Verified on: {new Date(slsCertificate.verifiedAt).toLocaleDateString()}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="verification-info not-verified-info">
                                    <p>⚠ Not SLS Verified - Cannot Purchase</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* More Info Modal */}
        {showMoreInfo && (
            <div className="certificate-modal-overlay" onClick={() => setShowMoreInfo(false)}>
                <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="certificate-modal-header">
                        <h3>More Information - {name}</h3>
                        <button className="close-btn" onClick={() => setShowMoreInfo(false)}>✕</button>
                    </div>
                    <div className="certificate-modal-content">
                        <div style={{padding: '20px'}}>
                            {phone && (
                                <div style={{marginBottom: '15px'}}>
                                    <strong style={{color: '#333', display: 'block', marginBottom: '5px'}}>Phone Number:</strong>
                                    <p style={{color: '#666', margin: 0}}>{phone}</p>
                                </div>
                            )}
                            {address && (
                                <div style={{marginBottom: '15px'}}>
                                    <strong style={{color: '#333', display: 'block', marginBottom: '5px'}}>Address:</strong>
                                    <p style={{color: '#666', margin: 0}}>{address}</p>
                                </div>
                            )}
                            {availableQuantity !== null && availableQuantity !== undefined && (
                                <div style={{marginBottom: '15px'}}>
                                    <strong style={{color: '#333', display: 'block', marginBottom: '5px'}}>Available Quantity:</strong>
                                    <p style={{color: '#666', margin: 0, fontWeight: '600'}}>{availableQuantity} item(s)</p>
                                </div>
                            )}
                            {!phone && !address && (availableQuantity === null || availableQuantity === undefined) && (
                                <p style={{color: '#999', textAlign: 'center'}}>No additional information available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  )
}

export default FoodItem