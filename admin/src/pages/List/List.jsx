import React, { useEffect, useState } from 'react'
import './List.css'
import { url } from '../../assets/assets'
import axios from 'axios';
import { toast } from 'react-toastify';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/price';

const List = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, admin } = useContext(StoreContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(null);
  const filterUnverified = searchParams.get('filter') === 'unverified';
  
  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/food/admin/list-all`);
      if (response.data.success) {
        setList(response.data.data);
        console.log('All food items fetched:', response.data.data);
      } else {
        toast.error("Failed to fetch food items");
        setList([]);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
      toast.error("Error connecting to server. Please check if backend is running.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/admin/remove`, {
        id: foodId
      });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to remove food item");
      }
    } catch (error) {
      console.error('Error removing food item:', error);
      toast.error("Error removing food item");
    }
  }

  const viewCertificate = async (foodId) => {
    try {
      console.log('Viewing certificate for foodId:', foodId)
      console.log('Admin token:', token)
      console.log('Admin status:', admin)
      
      const response = await axios.get(`${url}/api/food/${foodId}/sls-certificate`, {
        headers: { "token": token }
      });
      
      console.log('Certificate response:', response.data)
      
      if (response.data.success && response.data.data && response.data.data.imageUrl) {
        const imageUrl = response.data.data.imageUrl
        console.log('Certificate image URL:', imageUrl)
        setSelectedCertificate({
          foodId,
          imageUrl: imageUrl,
          certificate: response.data.data.certificate || {}
        });
        setShowCertificateModal(true);
      } else {
        console.error('No certificate found in response:', response.data)
        toast.error(response.data.message || "No certificate found");
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      console.error('Error response:', error.response?.data);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Error loading certificate");
      } else {
        toast.error("Error loading certificate. Please try again.");
      }
    }
  }

  const verifyCertificate = async (foodId, isVerified) => {
    try {
      console.log('Verifying certificate for foodId:', foodId, 'isVerified:', isVerified)
      const response = await axios.put(`${url}/api/food/${foodId}/sls-certificate/verify`, {
        isVerified
      }, {
        headers: { "token": token }
      });
      
      console.log('Verify response:', response.data)
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to verify certificate");
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Error verifying certificate");
      } else {
        toast.error("Error verifying certificate");
      }
    }
  }

  const handleCertificateUpload = async (foodId, file) => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append('certificate', file);

    try {
      setUploadingCertificate(foodId);
      console.log('Uploading certificate for foodId:', foodId)
      const response = await axios.post(`${url}/api/food/${foodId}/sls-certificate`, formData, {
        headers: { 
          "token": token,
          "Content-Type": "multipart/form-data"
        }
      });
      
      console.log('Upload response:', response.data)
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to upload certificate");
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Error uploading certificate");
      } else {
        toast.error("Error uploading certificate");
      }
    } finally {
      setUploadingCertificate(null);
    }
  }

  const removeCertificate = async (foodId) => {
    if (!window.confirm('Are you sure you want to remove this SLS certificate?')) {
      return;
    }
    try {
      console.log('Removing certificate for foodId:', foodId)
      const response = await axios.delete(`${url}/api/food/${foodId}/sls-certificate`, {
        headers: { "token": token }
      });
      
      console.log('Remove response:', response.data)
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to remove certificate");
      }
    } catch (error) {
      console.error('Error removing certificate:', error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Error removing certificate");
      } else {
        toast.error("Error removing certificate");
      }
    }
  }

  // Helper function to get image URL (handles both Cloudinary URLs and local paths)
  const getImageUrl = (imgPath) => {
    if (!imgPath) return '';
    // If it's already a full URL (starts with http), return as is
    if (imgPath.startsWith('http')) {
      return imgPath;
    }
    // Otherwise, it's a local path
    return `${url}/uploads/${imgPath}`;
  }

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    } else {
      fetchList();
    }
  }, [admin, token]);

  // Filter list based on URL parameter
  const filteredList = filterUnverified 
    ? list.filter(item => {
        // Show items that have a certificate but are not verified
        return item.slsCertificate && !item.slsCertificate.isVerified;
      })
    : list;

  if (loading) {
    return (
      <div className='list add flex-col'>
        <p>All Foods List (Admin & Customer Items)</p>
        <div className="loading-message">
          <p>Loading food items...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='list add flex-col'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p>{filterUnverified ? 'Not Verified Products' : 'All Foods List (Admin & Customer Items)'}</p>
          {filterUnverified && (
            <button 
              onClick={() => {
                setSearchParams({});
                toast.info('Showing all products');
              }}
              style={{
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Show All Products
            </button>
          )}
        </div>
        {filteredList.length === 0 ? (
          <div className="no-items-message">
            <p>{filterUnverified ? 'No unverified products found.' : 'No food items found.'}</p>
            <p>{filterUnverified ? 'All products with certificates are verified.' : 'Add some food items using the "Add Items" page.'}</p>
            <button onClick={fetchList} className="refresh-btn">Refresh List</button>
          </div>
        ) : (
          <div className='list-table'>
            <div className="list-table-format title">
              <b>Image</b>
              <b>Name</b>
              <b>Category</b>
              <b>Price</b>
              <b>Type</b>
              <b>SLS Certificate</b>
              <b>Action</b>
            </div>
            {filteredList.map((item, index) => {
              const isVerified = item.slsCertificate && item.slsCertificate.isVerified;
              return (
                <div key={index} className={`list-table-format ${item.isCustomerAdded ? 'customer-item' : 'admin-item'}`}>
                  <img src={getImageUrl(item.image)} alt={item.name} />
                  <p>{item.name}</p>
                  <p>{item.category}</p>
                  <p>{formatCurrency(item.price)}</p>
                  <p className={`item-type ${item.isCustomerAdded ? 'customer' : 'admin'}`}>
                    {item.isCustomerAdded ? 'Customer' : 'Admin'}
                  </p>
                  <div className="certificate-actions">
                    {item.slsCertificate ? (
                      <>
                        <div className="cert-status">
                          <span className={`status-badge ${isVerified ? 'verified' : 'not-verified'}`}>
                            {isVerified ? '✓ Verified' : '⚠ Not Verified'}
                          </span>
                        </div>
                        <button 
                          className="view-cert-btn"
                          onClick={() => viewCertificate(item._id)}
                          title="View SLS Certificate"
                        >
                          👁️ View SLS Certificate
                        </button>
                        <button 
                          className={`verify-btn ${isVerified ? 'verified' : 'unverified'}`}
                          onClick={() => verifyCertificate(item._id, !isVerified)}
                          title={isVerified ? "Unverify Certificate" : "Verify Certificate"}
                        >
                          {isVerified ? '✓ Verified' : 'Verify'}
                        </button>
                      </>
                    ) : (
                      <div className="upload-cert">
                        <span className="no-cert-badge">No Certificate</span>
                      </div>
                    )}
                  </div>
                  <p className='cursor remove-btn' onClick={() => removeFood(item._id)} title="Remove item">×</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="certificate-modal-overlay" onClick={() => setShowCertificateModal(false)}>
          <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="certificate-modal-header">
              <h3>SLS Certificate</h3>
              <button className="close-btn" onClick={() => setShowCertificateModal(false)}>✕</button>
            </div>
            <div className="certificate-modal-content">
              {selectedCertificate.imageUrl ? (
                <>
                  <img 
                    src={
                      selectedCertificate.imageUrl && (selectedCertificate.imageUrl.startsWith('http') || selectedCertificate.imageUrl.startsWith('https'))
                        ? selectedCertificate.imageUrl
                        : selectedCertificate.imageUrl
                        ? `${url}${selectedCertificate.imageUrl.startsWith('/') ? '' : '/'}${selectedCertificate.imageUrl}`
                        : ''
                    } 
                    alt="SLS Certificate" 
                    className="certificate-image"
                    style={{maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto'}}
                    onLoad={() => {
                      console.log('Certificate image loaded successfully:', selectedCertificate.imageUrl)
                    }}
                    onError={(e) => {
                      console.error('Error loading certificate image:', selectedCertificate.imageUrl);
                      e.target.style.display = 'none';
                      const errorDiv = e.target.parentElement.querySelector('.certificate-error');
                      if (errorDiv) {
                        errorDiv.style.display = 'block';
                      }
                    }}
                  />
                  <div className="certificate-error" style={{display: 'none', color: 'red', padding: '20px', textAlign: 'center'}}>
                    <p>Error loading certificate image.</p>
                    <p>URL: {selectedCertificate.imageUrl}</p>
                    <p>Please try again or contact support.</p>
                  </div>
                </>
              ) : (
                <div style={{color: 'red', padding: '20px', textAlign: 'center'}}>
                  <p>Certificate image not available</p>
                  <p>Please refresh the page and try again.</p>
                </div>
              )}
              {selectedCertificate.certificate && (
                <>
                  {selectedCertificate.certificate.isVerified ? (
                    <div className="verification-info">
                      <p>✓ Verified by Admin</p>
                      {selectedCertificate.certificate.verifiedAt && (
                        <p>Verified on: {new Date(selectedCertificate.certificate.verifiedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="verification-info not-verified-info">
                      <p>⚠ Not SLS Verified - Cannot Purchase</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default List
