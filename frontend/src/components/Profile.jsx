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

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "", email: "", isAdmin: false, profileImageUrl: "" });
  const [formData, setFormData] = useState({ username: "", password: "", profileImage: null });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const token = localStorage.getItem("token");
  const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/dvws2chvw/image/upload/v1750929194/user_profiles/jwkack4vcko50qfaawfn.png";
  const isGuestUser = user.email === "guest@gmail.com"; // Check if user is guest

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate("/login");
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
    if (isGuestUser) {
      setErrors([{ field: 'general', message: 'Guest users cannot update their profile' }]);
      return;
    }
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
      if (error.response?.data?.errors) {
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

          {isEditing && !isGuestUser ? (
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
            <motion.div variants={itemVariants} className="pt-2">
              {!isGuestUser ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="w-full px-4 py-3 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 shadow-md transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FaUserEdit /> Edit Profile
                </motion.button>
              ) : (
                <p className="text-center text-gray-600 text-sm">
                  Guest users cannot edit their profile.
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Profile;
