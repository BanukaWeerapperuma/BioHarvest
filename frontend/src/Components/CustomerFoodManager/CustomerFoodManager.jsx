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
        category: "Fresh Vegetables"
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
        if (!slsCertificate && !editingItem) {
            toast.error("Please upload the SLS Certificate");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("price", Number(data.price));
            formData.append("category", data.category);
            if (image) {
                formData.append("image", image);
            }
            if (slsCertificate) {
                formData.append("slsCertificate", slsCertificate);
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
            category: "Fresh Vegetables"
        });
        setImage(false);
        setSlsCertificate(false);
        setEditingItem(null);
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
            category: item.category
        });
        setSlsCertificate(item.slsCertificate ? {
            name: item.slsCertificate.name,
            size: item.slsCertificate.size,
            type: item.slsCertificate.type,
            lastModified: item.slsCertificate.lastModified,
            webkitRelativePath: item.slsCertificate.webkitRelativePath
        } : false);
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

    const uploadSLSCertificate = async (foodId) => {
        if (!slsCertificate) {
            toast.error("Please select an SLS certificate image");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('certificate', slsCertificate);

            const response = await axios.post(`${url}/api/food/${foodId}/sls-certificate`, formData, {
                headers: { 
                    token,
                    "Content-Type": "multipart/form-data"
                }
            });
            
            if (response.data.success) {
                toast.success(response.data.message);
                setSlsCertificate(false);
                const certInput = document.getElementById('customer-certificate');
                if (certInput) certInput.value = '';
                fetchCustomerFoods();
            } else {
                toast.error(response.data.message || "Failed to upload certificate");
            }
        } catch (error) {
            console.error('Error uploading certificate:', error);
            toast.error("Error uploading certificate");
        } finally {
            setLoading(false);
        }
    }

    const viewCertificate = async (foodId) => {
        try {
            const response = await axios.get(`${url}/api/food/${foodId}/sls-certificate`, {
                headers: { token }
            });
            
            if (response.data.success) {
                setSelectedCertificate({
                    foodId,
                    imageUrl: response.data.data.imageUrl,
                    certificate: response.data.data.certificate
                });
                setShowCertificateModal(true);
            } else {
                toast.error(response.data.message || "No certificate found");
            }
        } catch (error) {
            console.error('Error fetching certificate:', error);
            toast.error("Error loading certificate");
        }
    }

    const removeCertificate = async (foodId) => {
        if (window.confirm('Are you sure you want to remove this SLS certificate?')) {
            try {
                const response = await axios.delete(`${url}/api/food/${foodId}/sls-certificate`, {
                    headers: { token }
                });
                
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchCustomerFoods();
                } else {
                    toast.error(response.data.message || "Failed to remove certificate");
                }
            } catch (error) {
                console.error('Error removing certificate:', error);
                toast.error("Error removing certificate");
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
                                src={!image ? assets.upload_area : URL.createObjectURL(image)} 
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
                    
                    <div className='add-sls-certificate'>
                        <p>SLS Certificate (Required)</p>
                        <label htmlFor="customer-certificate">
                            <img 
                                src={!slsCertificate ? assets.upload_area : URL.createObjectURL(slsCertificate)} 
                                alt="" 
                            />
                        </label>
                        <input 
                            onChange={(e) => { setSlsCertificate(e.target.files[0]) }} 
                            type="file" 
                            id="customer-certificate" 
                            hidden 
                            accept="image/*"
                            required={!editingItem}
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
                                    <img src={`${url}/uploads/${item.image}`} alt={item.name} />
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
                                                        setSlsCertificate(e.target.files[0]);
                                                        uploadSLSCertificate(item._id);
                                                    }}
                                                    style={{ display: 'none' }}
                                                />
                                                <label 
                                                    htmlFor={`cert-upload-${item._id}`}
                                                    className='upload-cert-btn'
                                                >
                                                    Upload Cert
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
                                <img 
                                    src={url + selectedCertificate.imageUrl} 
                                    alt="SLS Certificate" 
                                    className="certificate-image"
                                />
                                {selectedCertificate.certificate.isVerified && (
                                    <div className="verification-info">
                                        <p>✓ Verified by Admin</p>
                                        <p>Verified on: {new Date(selectedCertificate.certificate.verifiedAt).toLocaleDateString()}</p>
                                    </div>
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