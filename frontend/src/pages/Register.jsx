import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/SearchBar';

function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  // Handle image selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);

    // Clean up previous preview
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    // Set new preview
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    } else {
      setPreviewImage(null);
    }
  };

  // Clean up preview URL on component unmount
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setUploadProgress(0);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Client-side validation
    const newErrors = [];
    if (!normalizedEmail) newErrors.push({ field: 'email', message: 'Email is required' });
    if (!normalizedUsername) newErrors.push({ field: 'username', message: 'Username is required' });
    if (!normalizedPassword) newErrors.push({ field: 'password', message: 'Password is required' });

    if (normalizedUsername.length < 3) {
      newErrors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    }

    if (normalizedPassword.length < 8) {
      newErrors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    } else if (!/[A-Z]/.test(normalizedPassword)) {
      newErrors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
    } else if (!/[0-9]/.test(normalizedPassword)) {
      newErrors.push({ field: 'password', message: 'Password must contain at least one number' });
    }

    if (profileImage) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(profileImage.type)) {
        newErrors.push({ field: 'profileImage', message: 'Please upload a valid image (JPEG, JPG, or PNG)' });
      }
      if (profileImage.size > 5 * 1024 * 1024) {
        newErrors.push({ field: 'profileImage', message: 'Image size must not exceed 5MB' });
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', normalizedUsername);
      formData.append('email', normalizedEmail);
      formData.append('password', normalizedPassword);
      formData.append('isAdmin', isAdmin);
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      await axios.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      navigate('/verify-otp', { state: { email: normalizedEmail } });
    } catch (error) {
      console.error('Register error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([{ 
          field: 'general', 
          message: error.response?.data?.message || 'An unexpected error occurred during registration' 
        }]);
      }
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const renderError = (field) => {
    const error = errors.find(err => err.field === field || err.field === 'general');
    return error ? (
      <div className="bg-red-100 text-red-600 p-3 rounded-md border-b-2 border-red-200 mb-5 text-center text-sm font-semibold animate-shake">
        {error.message}
      </div>
    ) : null;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-amber-50 p-4 font-caveat text-gray-800 animate-fadeIn">
      <div className="w-full max-w-7xl mb-8">
        {/* <SearchBar /> */}
      </div>
      
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 animate-pulse">
            Join Legend Sansar
          </h2>
          <p className="text-gray-600 text-base">
            Create your account to explore stories
          </p>
        </div>

        {renderError('general')}
        {renderError('username')}
        {renderError('email')}
        {renderError('password')}
        {renderError('profileImage')}

        <form onSubmit={handleRegister} className="mb-6" encType="multipart/form-data">
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-amber-900">
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={`w-full p-3 rounded-md border-2 ${
                errors.find(err => err.field === 'username') 
                  ? 'border-red-200' 
                  : 'border-amber-200'
              } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400`}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              At least 3 characters
            </p>
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-amber-900">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full p-3 rounded-md border-2 ${
                errors.find(err => err.field === 'email') 
                  ? 'border-red-200' 
                  : 'border-amber-200'
              } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400`}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a valid email address
            </p>
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-amber-900">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full p-3 rounded-md border-2 ${
                errors.find(err => err.field === 'password') 
                  ? 'border-red-200' 
                  : 'border-amber-200'
              } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400`}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              At least 8 characters, including one uppercase letter and one number
            </p>
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-amber-900">
              Profile Image (Optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className={`w-full p-3 rounded-md border-2 ${
                errors.find(err => err.field === 'profileImage') 
                  ? 'border-red-200' 
                  : 'border-amber-200'
              } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300`}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              JPEG, JPG, or PNG (max 5MB)
            </p>
            {previewImage && (
              <div className="mt-4 flex justify-center">
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="w-32 h-32 object-cover rounded-full border-2 border-amber-200 shadow-md"
                />
              </div>
            )}
          </div>
          {isLoading && uploadProgress > 0 && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-amber-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-600 text-white p-3 rounded-md text-lg font-bold hover:bg-amber-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-5 border-t border-amber-100">
          <p className="text-gray-600 text-base">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-amber-600 font-semibold hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
