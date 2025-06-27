import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaCrown,
  FaUserShield,
  FaUserEdit,
  FaKey,
  FaImage,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "", email: "", isAdmin: false, profileImageUrl: "", isSubscribed: false, subscriptionPlan: null, subscriptionExpires: null });
  const [formData, setFormData] = useState({ username: "", password: "", profileImage: null });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const token = localStorage.getItem("token");
  const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/dvws2chvw/image/upload/v1750929194/user_profiles/jwkack4vcko50qfaawfn.png";

  useEffect(() => {
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        toast.warning('Please log in to view your profile.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      try {
        const response = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({
          username: response.data.user.username,
          email: response.data.user.email,
          isAdmin: response.data.user.isAdmin,
          profileImageUrl: response.data.user.profileImageUrl || DEFAULT_PROFILE_IMAGE,
          isSubscribed: response.data.user.isSubscribed,
          subscriptionPlan: response.data.user.subscriptionPlan,
          subscriptionExpires: response.data.user.subscriptionExpires,
        });
        setFormData({ username: response.data.user.username, password: "", profileImage: null });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setErrors([{ field: 'general', message: error.response?.data?.message || 'Failed to load profile' }]);
      }
    };
    fetchProfile();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setErrors(errors.filter(err => err.field !== name)); // Clear errors for the field being edited

    if (name === "profileImage") {
      const file = files[0];
      if (file) {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
          setErrors([...errors, { field: 'profileImage', message: 'Please upload a valid image (JPEG, JPG, or PNG)' }]);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setErrors([...errors, { field: 'profileImage', message: 'Image size must not exceed 5MB' }]);
          return;
        }
      }
      setFormData({ ...formData, profileImage: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors([]);
    setIsUploading(true);
    setUploadProgress(0);

    // Client-side validation
    const newErrors = [];
    if (!formData.username.trim()) {
      newErrors.push({ field: 'username', message: 'Username is required' });
    } else if (formData.username.trim().length < 3) {
      newErrors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    } else if (formData.password && !/[A-Z]/.test(formData.password)) {
      newErrors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
    } else if (formData.password && !/[0-9]/.test(formData.password)) {
      newErrors.push({ field: 'password', message: 'Password must contain at least one number' });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsUploading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("username", formData.username.trim());
      if (formData.password) {
        data.append("password", formData.password);
      }
      if (formData.profileImage) {
        data.append("profileImage", formData.profileImage);
      }

      const response = await axios.put("/api/auth/update-profile", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setUser({
        ...user,
        username: response.data.user.username,
        profileImageUrl: response.data.user.profileImageUrl || DEFAULT_PROFILE_IMAGE,
      });
      setMessage(response.data.message);
      setFormData({ username: response.data.user.username, password: "", profileImage: null });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.status === 401) {
        toast.warning('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([{ 
          field: 'general', 
          message: error.response?.data?.message || 'Failed to update profile' 
        }]);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!token) {
      toast.warning('Please log in to subscribe.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const response = await axios.post(
        '/api/auth/create-subscription-order',
        { plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, plan: selectedPlan } = response.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'Legend Sansar',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              '/api/auth/verify-subscription',
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser({
              ...user,
              isSubscribed: verifyResponse.data.user.isSubscribed,
              subscriptionPlan: verifyResponse.data.user.subscriptionPlan,
              subscriptionExpires: verifyResponse.data.user.subscriptionExpires,
            });
            toast.success('Subscription activated successfully!');
          } catch (err) {
            console.error('Error verifying subscription:', err);
            toast.error(err.response?.data?.message || 'Failed to verify subscription.');
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: '#D97706',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error('Payment failed. Please try again.');
        console.error('Payment failed:', response.error);
      });
      rzp.open();
    } catch (err) {
      console.error('Error creating subscription order:', err);
      if (err.response?.status === 401) {
        toast.warning('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to initiate subscription.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    setTimeout(() => navigate('/login'), 2000);
  };

  const renderError = (field) => {
    const error = errors.find(err => err.field === field || err.field === 'general');
    return error ? (
      <motion.div
        variants={itemVariants}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-3 border-l-4 border-red-500"
      >
        <FaExclamationCircle className="text-red-500 flex-shrink-0" />
        <span>{error.message}</span>
      </motion.div>
    ) : null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-8 max-w-md w-full"
      >
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
        
        <div className="flex justify-center mb-6">
          <motion.div whileHover={{ scale: 1.1 }} className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-200 overflow-hidden">
              <img
                src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE; }}
              />
            </div>
            {user.isAdmin && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full p-1"
                title="Admin"
              >
                <FaCrown className="text-xs" />
              </motion.div>
            )}
          </motion.div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold text-amber-900 text-center flex items-center justify-center gap-3"
          >
            <FaUserEdit className="text-amber-700" />
            {user.username || "My Profile"}
          </motion.h2>

          {message && (
            <motion.div
              variants={itemVariants}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-3 border-b-2 border-green-200"
            >
              <FaCheckCircle className="text-green-600 flex-shrink-0" />
              <span>{message}</span>
            </motion.div>
          )}

          {renderError('general')}
          {renderError('username')}
          {renderError('password')}
          {renderError('profileImage')}

          <motion.div variants={itemVariants} className="bg-amber-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <FaEnvelope className="text-amber-700 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              {user.isAdmin ? (
                <FaUserShield className="text-amber-700 flex-shrink-0" />
              ) : (
                <FaUser className="text-amber-700 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs text-amber-600">Role</p>
                <p className="font-medium">{user.isAdmin ? "Administrator" : "Standard User"}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-amber-50 rounded-xl p-4 space-y-3">
            <h3 className="text-lg font-semibold text-amber-900">Subscription Status</h3>
            {user.isSubscribed ? (
              <div className="text-gray-700">
                <p><strong>Plan:</strong> {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}</p>
                <p><strong>Expires:</strong> {new Date(user.subscriptionExpires).toLocaleDateString()}</p>
                <p className="text-green-600 font-semibold">You have access to exclusive podcasts!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">No active subscription. Subscribe to access exclusive podcasts.</p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubscribe('monthly')}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all duration-300"
                  >
                    Monthly (₹100)
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubscribe('yearly')}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all duration-300"
                  >
                    Yearly (₹1000)
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>

          {isEditing ? (
            <motion.form
              variants={containerVariants}
              onSubmit={handleSubmit}
              className="space-y-4"
              encType="multipart/form-data"
            >
              <motion.div variants={itemVariants}>
                <label htmlFor="username" className="block text-sm font-semibold text-amber-900 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-md border-2 ${
                      errors.find(err => err.field === 'username') 
                        ? 'border-red-200' 
                        : 'border-amber-200'
                    } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400 pl-10`}
                    placeholder="Enter new username"
                    disabled={isUploading}
                  />
                  <FaUser className="absolute left-3 top-3.5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 3 characters</p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm font-semibold text-amber-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-md border-2 ${
                      errors.find(err => err.field === 'password') 
                        ? 'border-red-200' 
                        : 'border-amber-200'
                    } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400 pl-10`}
                    placeholder="Enter new password"
                    disabled={isUploading}
                  />
                  <FaKey className="absolute left-3 top-3.5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters, including one uppercase letter and one number; leave blank to keep current password
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="profileImage" className="block text-sm font-semibold text-amber-900 mb-2">
                  Profile Image (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-md border-2 ${
                      errors.find(err => err.field === 'profileImage') 
                        ? 'border-red-200' 
                        : 'border-amber-200'
                    } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300`}
                    disabled={isUploading}
                  />
                  <FaImage className="absolute left-3 top-3.5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">JPEG, JPG, or PNG (max 5MB)</p>
              </motion.div>

              {isUploading && (
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4"
                >
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div
                      className="bg-amber-600 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "easeInOut", duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    Uploading: {uploadProgress}%
                  </p>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: isUploading ? 1 : 1.05 }}
                  whileTap={{ scale: isUploading ? 1 : 0.95 }}
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 shadow-md transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Save Changes"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: isUploading ? 1 : 1.05 }}
                  whileTap={{ scale: isUploading ? 1 : 0.95 }}
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrors([]);
                  }}
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 shadow-md transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.div variants={itemVariants} className="space-y-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-3 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 shadow-md transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaUserEdit /> Edit Profile
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 shadow-md transition-all duration-300 flex items-center justify-center gap-2"
              >
                Logout
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Profile;
