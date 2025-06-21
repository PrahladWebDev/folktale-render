import { useState, useEffect } from 'react'; // Add useEffect for cleanup
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/SearchBar';

function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // New state for preview
  const [error, setError] = useState('');
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
    setError('');
    setUploadProgress(0);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedUsername || !normalizedPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (normalizedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    if (normalizedPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (profileImage) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(profileImage.type)) {
        setError('Please upload a valid image (JPEG, JPG, or PNG)');
        setIsLoading(false);
        return;
      }
      if (profileImage.size > 5 * 1024 * 1024) {
        setError('Image size must not exceed 5MB');
        setIsLoading(false);
        return;
      }
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
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-amber-50 p-4 font-caveat text-gray-800 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 animate-pulse">
            Join Legend Sansar
          </h2>
          <p className="text-gray-600 text-base">
            Create your account to explore stories
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-md border-2 border-red-200 mb-5 text-center text-sm font-semibold animate-shake">
            {error}
          </div>
        )}

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
              minLength="3"
              className="w-full p-3 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400"
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
              className="w-full p-3 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400"
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
              minLength="6"
              className="w-full p-3 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              At least 6 characters
            </p>
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-amber-900">
              Profile Image (Optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange} // Updated handler
              className="w-full p-3 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              JPEG, JPG, or PNG (max 5MB)
            </p>
            {/* Image Preview */}
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
          {/*           <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 text-amber-600 border-amber-200 rounded focus:ring-amber-400"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm font-semibold text-amber-900">
                Register as Admin
              </span>
            </label>
          </div> */}
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
