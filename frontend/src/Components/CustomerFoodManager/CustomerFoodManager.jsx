import React, { useState, useEffect, useContext } from 'react'
import './CustomerFoodManager.css'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/frontend_assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const CustomerFoodManager = ({ onClose, onFoodAdded }) => {
    const { token, url } = useContext(StoreContext)
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Fresh Vegetables",
        phone: "",
        address: "",
        availableQuantity: ""
    });
    const [image, setImage] = useState(false);
    const [slsCertificate, setSlsCertificate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customerFoods, setCustomerFoods] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        
        if (!image && !editingItem) {
            toast.error("Please select an image");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("price", Number(data.price));
            formData.append("category", data.category);
            if (data.phone) {
                formData.append("phone", data.phone);
            }
            if (data.address) {
                formData.append("address", data.address);
            }
            if (data.availableQuantity) {
                formData.append("availableQuantity", Number(data.availableQuantity));
            }
            if (image) {
                formData.append("image", image);
            }
            // Include certificate when creating new food item (not when editing)
            if (!editingItem && slsCertificate) {
                formData.append("certificate", slsCertificate);
            }
            
            let response;
            if (editingItem) {
                formData.append("id", editingItem._id);
                response = await axios.put(`${url}/api/food/customer/update`, formData, {
                    headers: { token }
                });
            } else {
                response = await axios.post(`${url}/api/food/customer/add`, formData, {
                    headers: { token }
                });
            }

            if (response.data.success) {
                toast.success(response.data.message);
                resetForm();
                fetchCustomerFoods();
                if (onFoodAdded) onFoodAdded();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error managing food item:', error);
            toast.error("Error managing food item. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }));
    }

    const resetForm = () => {
        setData({
            name: "",
            description: "",
            price: "",
            category: "Fresh Vegetables",
            phone: "",
            address: "",
            availableQuantity: ""
        });
        setImage(false);
        setSlsCertificate(false);
        setEditingItem(null);
        setShowCertificateModal(false);
        setSelectedCertificate(null);
        const fileInput = document.getElementById('customer-image');
        const certInput = document.getElementById('customer-certificate');
        if (fileInput) fileInput.value = '';
        if (certInput) certInput.value = '';
    }

    const fetchCustomerFoods = async () => {
        try {
            const response = await axios.get(`${url}/api/food/customer/list`, {
                headers: { token }
            });
            if (response.data.success) {
                setCustomerFoods(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching customer foods:', error);
        }
    }

    const handleEdit = (item) => {
        setEditingItem(item);
        setData({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            category: item.category,
            phone: item.phone || "",
            address: item.address || "",
            availableQuantity: item.availableQuantity ? item.availableQuantity.toString() : ""
        });
    }

    const handleDelete = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const response = await axios.post(`${url}/api/food/customer/remove`, 
                    { id: itemId }, 
                    { headers: { token } }
                );
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchCustomerFoods();
                    if (onFoodAdded) onFoodAdded();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                console.error('Error deleting food item:', error);
                toast.error("Error deleting food item");
            }
        }
    }

    const uploadSLSCertificate = async (foodId, fileToUpload = null) => {
        const file = fileToUpload || slsCertificate;
        if (!file) {
            toast.error("Please select an SLS certificate image");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('certificate', file);

            console.log('Uploading certificate for foodId:', foodId);
            const response = await axios.post(`${url}/api/food/${foodId}/sls-certificate`, formData, {
                headers: { 
                    token,
                    "Content-Type": "multipart/form-data"
                }
            });
            
            console.log('Certificate upload response:', response.data);
            
            if (response.data.success) {
                toast.success(response.data.message);
                setSlsCertificate(false);
                // Clear file inputs
                const certInput = document.getElementById('customer-certificate');
                if (certInput) certInput.value = '';
                // Clear item-specific inputs
                const itemCertInput = document.getElementById(`cert-upload-${foodId}`);
                if (itemCertInput) itemCertInput.value = '';
                // Refresh both customer foods and main food list
                await fetchCustomerFoods();
                if (onFoodAdded) onFoodAdded(); // This will refresh the main food list
            } else {
                toast.error(response.data.message || "Failed to upload certificate");
            }
        } catch (error) {
            console.error('Error uploading certificate:', error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message || "Error uploading certificate");
            } else {
                toast.error("Error uploading certificate. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    const viewCertificate = async (foodId) => {
        try {
            console.log('Viewing certificate for foodId:', foodId);
            const response = await axios.get(`${url}/api/food/${foodId}/sls-certificate`, {
                headers: { token }
            });
            
            console.log('Certificate response:', response.data);
            
            if (response.data.success && response.data.data && response.data.data.imageUrl) {
                setSelectedCertificate({
                    foodId,
                    imageUrl: response.data.data.imageUrl,
                    certificate: response.data.data.certificate || {}
                });
                setShowCertificateModal(true);
            } else {
                toast.error(response.data.message || "No certificate found");
            }
        } catch (error) {
            console.error('Error fetching certificate:', error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message || "Error loading certificate");
            } else {
                toast.error("Error loading certificate. Please try again.");
            }
        }
    }

    const removeCertificate = async (foodId) => {
        if (window.confirm('Are you sure you want to remove this SLS certificate?')) {
            try {
                console.log('Removing certificate for foodId:', foodId);
                const response = await axios.delete(`${url}/api/food/${foodId}/sls-certificate`, {
                    headers: { token }
                });
                
                console.log('Remove certificate response:', response.data);
                
                if (response.data.success) {
                    toast.success(response.data.message);
                    await fetchCustomerFoods();
                    if (onFoodAdded) onFoodAdded(); // Refresh main food list
                } else {
                    toast.error(response.data.message || "Failed to remove certificate");
                }
            } catch (error) {
                console.error('Error removing certificate:', error);
                if (error.response && error.response.data) {
                    toast.error(error.response.data.message || "Error removing certificate");
                } else {
                    toast.error("Error removing certificate. Please try again.");
                }
            }
        }
    }

    useEffect(() => {
        if (token) {
            fetchCustomerFoods();
        }
    }, [token]);

    return (
        <div className='customer-food-manager-overlay'>
            <div className='customer-food-manager'>
                <div className='customer-food-manager-header'>
                    <h2>{editingItem ? 'Edit Your Food Item' : 'Add Your Food Item'}</h2>
                    <button className='close-btn' onClick={onClose}>×</button>
                </div>
                
                <form className='customer-food-form' onSubmit={onSubmitHandler}>
                    <div className='add-img-upload'>
                        <p>Upload image</p>
                        <label htmlFor="customer-image">
                            <img 
                                src={
                                    image 
                                        ? URL.createObjectURL(image) 
                                        : editingItem && editingItem.image && editingItem.image.startsWith('http')
                                        ? editingItem.image
                                        : editingItem && editingItem.image
                                        ? `${url}/uploads/${editingItem.image}`
                                        : assets.upload_area
                                } 
                                alt="" 
                            />
                        </label>
                        <input 
                            onChange={(e) => { setImage(e.target.files[0]) }} 
                            type="file" 
                            id="customer-image" 
                            hidden 
                            accept="image/*"
                        />
                    </div>
                    
                    <div className='add-product-name'>
                        <p>Product name</p>
                        <input 
                            name='name' 
                            onChange={onChangeHandler} 
                            value={data.name} 
                            type="text" 
                            placeholder='Type here' 
                            required 
                        />
                    </div>
                    
                    <div className='add-product-description'>
                        <p>Product description</p>
                        <textarea 
                            name='description' 
                            onChange={onChangeHandler} 
                            value={data.description} 
                            rows={6} 
                            placeholder='Write content here' 
                            required 
                        />
                    </div>
                    
                    <div className='add-category-price'>
                        <div className='add-category'>
                            <p>Product category</p>
                            <select name='category' onChange={onChangeHandler} value={data.category}>
                                <option value="Fresh Vegetables">Fresh Vegetables</option>
                                <option value="Organic Fruits">Organic Fruits</option>
                                <option value="Dairy & Eggs">Dairy & Eggs</option>
                                <option value="Grains & Pulses">Grains & Pulses</option>
                                <option value="Organic Snacks">Organic Snacks</option>
                                <option value="Herbs & Spices">Herbs & Spices</option>
                                <option value="Oils & Condiments">Oils & Condiments</option>
                                <option value="Personal Care & Wellness">Personal Care & Wellness</option>
                            </select>
                        </div>
                        <div className='add-price'>
                            <p>Product Price</p>
                            <input 
                                type="Number" 
                                name='price' 
                                onChange={onChangeHandler} 
                                value={data.price} 
                                placeholder='$25' 
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                    
                    <div className='add-contact-info'>
                        <div className='add-phone'>
                            <p>Phone Number</p>
                            <input 
                                type="text" 
                                name='phone' 
                                onChange={onChangeHandler} 
                                value={data.phone} 
                                placeholder='+94 76 123 4567' 
                            />
                        </div>
                        <div className='add-quantity'>
                            <p>Available Quantity</p>
                            <input 
                                type="Number" 
                                name='availableQuantity' 
                                onChange={onChangeHandler} 
                                value={data.availableQuantity} 
                                placeholder='10' 
                                min="0"
                            />
                        </div>
                    </div>
                    
                    <div className='add-address'>
                        <p>Address</p>
                        <textarea 
                            name='address' 
                            onChange={onChangeHandler} 
                            value={data.address} 
                            rows={3} 
                            placeholder='Enter your address here' 
                        />
                    </div>
                    
                    <div className='add-sls-certificate'>
                        <p>SLS Certificate (Optional)</p>
                        {!editingItem && (
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontStyle: 'italic' }}>
                                You can upload the SLS certificate now, or add it later from your food items list.
                            </p>
                        )}
                        {editingItem && editingItem.slsCertificate && editingItem.slsCertificate.url && (
                            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                                <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                    Current Certificate: 
                                    {editingItem.slsCertificate.isVerified && (
                                        <span style={{ color: 'green', marginLeft: '5px' }}>✓ Verified</span>
                                    )}
                                    {!editingItem.slsCertificate.isVerified && (
                                        <span style={{ color: 'orange', marginLeft: '5px' }}>⏳ Pending Verification</span>
                                    )}
                                </p>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <img 
                                        src={
                                            editingItem.slsCertificate.url && (editingItem.slsCertificate.url.startsWith('http') || editingItem.slsCertificate.url.startsWith('https'))
                                                ? editingItem.slsCertificate.url
                                                : editingItem.slsCertificate.filename
                                                ? `${url}/uploads/${editingItem.slsCertificate.filename}`
                                                : assets.upload_area
                                        }
                                        alt="Current SLS Certificate" 
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                        onError={(e) => {
                                            console.error('Error loading certificate thumbnail:', editingItem.slsCertificate.url);
                                            e.target.src = assets.upload_area;
                                        }}
                                        onClick={() => {
                                            if (editingItem.slsCertificate.url) {
                                                setSelectedCertificate({
                                                    foodId: editingItem._id,
                                                    imageUrl: editingItem.slsCertificate.url,
                                                    certificate: editingItem.slsCertificate
                                                });
                                                setShowCertificateModal(true);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => viewCertificate(editingItem._id)}
                                        style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}
                                    >
                                        View Full
                                    </button>
                                </div>
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                                    Upload a new file below to replace the current certificate
                                </p>
                            </div>
                        )}
                        <label htmlFor="customer-certificate">
                            <img 
                                src={
                                    slsCertificate 
                                        ? URL.createObjectURL(slsCertificate) 
                                        : editingItem && editingItem.slsCertificate && editingItem.slsCertificate.url && (editingItem.slsCertificate.url.startsWith('http') || editingItem.slsCertificate.url.startsWith('https'))
                                        ? editingItem.slsCertificate.url
                                        : editingItem && editingItem.slsCertificate && editingItem.slsCertificate.filename
                                        ? `${url}/uploads/${editingItem.slsCertificate.filename}`
                                        : assets.upload_area
                                } 
                                alt=""
                                onError={(e) => {
                                    console.error('Error loading certificate preview');
                                    e.target.src = assets.upload_area;
                                }}
                            />
                        </label>
                        <input 
                            onChange={(e) => { setSlsCertificate(e.target.files[0]) }} 
                            type="file" 
                            id="customer-certificate" 
                            hidden 
                            accept="image/*"
                        />
                    </div>
                    
                    <div className='form-buttons'>
                        {editingItem && (
                            <button 
                                type='button' 
                                className='cancel-btn' 
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            type='submit' 
                            className='add-btn' 
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (editingItem ? 'UPDATE' : 'ADD')}
                        </button>
                    </div>
                </form>

                {customerFoods.length > 0 && (
                    <div className='customer-food-list'>
                        <h3>Your Food Items</h3>
                        <div className='food-items-grid'>
                            {customerFoods.map((item) => (
                                <div key={item._id} className='food-item-card'>
                                    <img 
                                        src={item.image && item.image.startsWith('http') 
                                            ? item.image 
                                            : `${url}/uploads/${item.image}`} 
                                        alt={item.name} 
                                    />
                                    <div className='food-item-info'>
                                        <h4>{item.name}</h4>
                                        <p>${item.price}</p>
                                        <p>{item.category}</p>
                                        {item.slsCertificate && (
                                            <div className='certificate-status'>
                                                <span className={`cert-badge ${item.slsCertificate.isVerified ? 'verified' : 'pending'}`}>
                                                    {item.slsCertificate.isVerified ? '✓ Verified' : '⏳ Pending'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className='food-item-actions'>
                                        <button 
                                            className='edit-btn' 
                                            onClick={() => handleEdit(item)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className='delete-btn' 
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            Delete
                                        </button>
                                        {item.slsCertificate ? (
                                            <>
                                                <button 
                                                    className='view-cert-btn' 
                                                    onClick={() => viewCertificate(item._id)}
                                                >
                                                    View Cert
                                                </button>
                                                <button 
                                                    className='remove-cert-btn' 
                                                    onClick={() => removeCertificate(item._id)}
                                                >
                                                    Remove Cert
                                                </button>
                                            </>
                                        ) : (
                                            <div className='upload-cert-section'>
                                                <input
                                                    type="file"
                                                    id={`cert-upload-${item._id}`}
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setSlsCertificate(file);
                                                            // Upload immediately after file selection
                                                            uploadSLSCertificate(item._id, file);
                                                        }
                                                    }}
                                                    style={{ display: 'none' }}
                                                />
                                                <label 
                                                    htmlFor={`cert-upload-${item._id}`}
                                                    className='upload-cert-btn'
                                                    title="Upload SLS Certificate"
                                                >
                                                    {loading ? 'Uploading...' : 'Upload Cert'}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                                console.log('Certificate image loaded successfully:', selectedCertificate.imageUrl);
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
                                        Certificate image not available
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
            </div>
        </div>
    )
}

export default CustomerFoodManager 