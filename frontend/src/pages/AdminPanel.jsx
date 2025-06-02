import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminPanel() {
  const navigate = useNavigate();
  const [folktales, setFolktales] = useState([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    region: '',
    genre: '',
    ageGroup: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editId, setEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      toast.error('Authentication required. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const fetchFolktales = async () => {
      try {
        const response = await axios.get('/api/admin/folktales', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setFolktales(response.data.data || []);
      } catch (error) {
        console.error('Error fetching folktales:', error);
        handleError(error, 'Failed to fetch folktales.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    fetchFolktales();
  }, [token, navigate]);

  const handleError = (error, defaultMessage) => {
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    let message = errorData?.message || defaultMessage;

    switch (errorCode) {
      case 'auth_required':
      case 'invalid_token':
      case 'token_expired':
        message = 'Session expired. Redirecting to login...';
        localStorage.removeItem('token');
        break;
      case 'validation_error':
        message = errorData.details?.map(err => err.msg).join(', ') || 'Invalid input data.';
        break;
      case 'not_found':
        message = 'Folktale not found.';
        break;
      case 'server_error':
        message = 'Server error. Please try again later.';
        break;
      case 'ECONNABORTED':
        message = 'Request timed out. Please check your connection.';
        break;
    }
    toast.error(message);
    return message;
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleContentChange = (value) => {
    setForm({ ...form, content: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    const filetypes = /jpeg|jpg|png/;
    const maxSizeMB = 5;
    if (!filetypes.test(file.type)) {
      toast.error('Please upload a JPEG or PNG image.');
      setImageFile(null);
      setImagePreview('');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image size exceeds ${maxSizeMB}MB limit.`);
      setImageFile(null);
      setImagePreview('');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;

    if (!editId && !imageFile) {
      toast.error('An image is required for new folktales.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('region', form.region);
      formData.append('genre', form.genre);
      formData.append('ageGroup', form.ageGroup);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      };

      if (editId) {
        await axios.put(`/api/folktales/${editId}`, formData, config);
        toast.success('Folktale updated successfully!');
      } else {
        await axios.post('/api/folktales', formData, config);
        toast.success('Folktale created successfully!');
      }

      // Reset form
      setForm({ title: '', content: '', region: '', genre: '', ageGroup: '' });
      setImageFile(null);
      setImagePreview('');
      setEditId(null);

      // Refresh folktales
      const response = await axios.get('/api/admin/folktales', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setFolktales(response.data.data || []);
    } catch (error) {
      console.error('Error saving folktale:', error);
      handleError(error, 'Failed to save folktale.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (folktale) => {
    if (!folktale?._id) {
      toast.error('Invalid folktale selected.');
      return;
    }
    setForm({
      title: folktale.title || '',
      content: folktale.content || '',
      region: folktale.region || '',
      genre: folktale.genre || '',
      ageGroup: folktale.ageGroup || '',
    });
    setImageFile(null);
    setImagePreview(folktale.imageUrl || '');
    setEditId(folktale._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!id) {
      toast.error('Invalid folktale ID.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this folktale?')) return;

    try {
      await axios.delete(`/api/admin/folktales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setFolktales(folktales.filter((f) => f._id !== id));
      toast.success('Folktale deleted successfully!');
    } catch (error) {
      console.error('Error deleting folktale:', error);
      handleError(error, 'Failed to delete folktale.');
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className="max-w-6xl mx-auto p-5">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-serif text-amber-900 mb-2">Admin Panel</h2>
        <h3 className="text-xl text-amber-800 font-medium">
          {editId ? 'Edit Folktale' : 'Create New Folktale'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="bg-amber-50 p-6 rounded-lg mb-10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block mb-2 font-semibold text-amber-900 text-sm">Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter folktale title"
              value={form.title}
              onChange={handleInputChange}
              required
              className="w-full p-2.5 border border-amber-200 rounded-md text-base font-serif text-gray-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-amber-900 text-sm">Region</label>
            <select
              name="region"
              value={form.region}
              onChange={handleInputChange}
              required
              className="w-full p-2.5 border border-amber-200 rounded-md text-base font-serif bg-white cursor-pointer focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Select Region</option>
              {/* Truncated for brevity; same options as original */}
              <option value="Afghanistan">Afghanistan</option>
              <option value="Albania">Albania</option>
              <option value="Algeria">Algeria</option>
              {/* ... Add remaining countries as needed */}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-amber-900 text-sm">Genre</label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleInputChange}
              required
              className="w-full p-2.5 border border-amber-200 rounded-md text-base font-serif bg-white cursor-pointer focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Select Genre</option>
              <option value="Fable">Fable</option>
              <option value="Myth">Myth</option>
              <option value="Legend">Legend</option>
              <option value="Fairy Tale">Fairy Tale</option>
              {/* ... Add remaining genres as needed */}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-amber-900 text-sm">Age Group</label>
            <select
              name="ageGroup"
              value={form.ageGroup}
              onChange={handleInputChange}
              required
              className="w-full p-2.5 border border-amber-200 rounded-md text-base font-serif bg-white cursor-pointer focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Select Age Group</option>
              <option value="Kids">Kids</option>
              <option value="Teens">Teens</option>
              <option value="Adults">Adults</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-amber-900 text-sm">Image (Max 5MB)</label>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              required={!editId}
              className="w-full p-2.5 border border-amber-200 rounded-md text-base font-serif bg-white cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-2 w-full max-h-44 rounded overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            {isUploading && (
              <div className="mt-2">
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-900 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="block mt-1 text-sm text-amber-900 text-center">{uploadProgress}%</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2 font-semibold text-amber-900 text-sm">Content</label>
            <ReactQuill
              value={form.content}
              onChange={handleContentChange}
              modules={quillModules}
              placeholder="Enter folktale content"
              className="bg-white border border-amber-200 rounded-md font-serif min-h-[200px]"
            />
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            type="submit"
            disabled={isUploading}
            className={`px-6 py-3 bg-amber-900 text-white rounded-md font-semibold hover:bg-amber-800 transition-all duration-300 ${
              isUploading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {editId ? 'Update Folktale' : 'Create Folktale'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ title: '', content: '', region: '', genre: '', ageGroup: '' });
                setImageFile(null);
                setImagePreview('');
                setIsUploading(false);
                setUploadProgress(0);
              }}
              className="px-6 py-3 bg-transparent text-amber-900 border border-amber-900 rounded-md font-semibold hover:bg-amber-100 transition-all duration-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-10">
        <h3 className="text-2xl font-serif text-amber-900 mb-5 pb-2 border-b-2 border-amber-200">
          All Folktales ({folktales.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folktales.map((folktale) => (
            <div
              key={folktale._id || Math.random()}
              className="bg-white rounded-lg p-5 shadow-sm border border-amber-100 hover:shadow-md transition-transform duration-300"
            >
              <div className="mb-4">
                <h4 className="text-lg font-serif text-amber-900 mb-2">{folktale.title || 'Untitled'}</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-amber-50 text-amber-900 px-2 py-1 rounded-full text-xs">
                    {folktale.region || 'Unknown'}
                  </span>
                  <span className="bg-amber-50 text-amber-900 px-2 py-1 rounded-full text-xs">
                    {folktale.genre || 'Unknown'}
                  </span>
                  <span className="bg-amber-50 text-amber-900 px-2 py-1 rounded-full text-xs">
                    {folktale.ageGroup || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="w-full max-h-48 rounded overflow-hidden mb-4">
                <img
                  src={folktale.imageUrl || '/placeholder.jpg'}
                  alt={folktale.title || 'Folktale'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder.jpg';
                    toast.warn('Failed to load folktale image.');
                  }}
                />
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-amber-600 font-semibold">
                  Rating: {folktale.averageRating || 'N/A'} ⭐
                </span>
                <span className="text-gray-600">
                  {folktale.comments?.length || 0} comment{folktale.comments?.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(folktale)}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-all duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(folktale._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
