import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Resumable from 'resumablejs';

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
  const [audioFile, setAudioFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [audioPreview, setAudioPreview] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, paused, success, error
  const token = localStorage.getItem('token');
  const resumableRef = useRef(null);
  const fileIdsRef = useRef({ image: null, audio: null });

  useEffect(() => {
    const fetchFolktales = async () => {
      try {
        const response = await axios.get('/api/admin/folktales', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setFolktales(response.data);
      } catch (error) {
        console.error('Error fetching legends:', error);
        navigate('/login');
      }
    };
    fetchFolktales();
  }, [token, navigate]);

  useEffect(() => {
    // Initialize Resumable.js
    resumableRef.current = new Resumable({
      target: '/api/folktales/upload-chunk',
      chunkSize: 5 * 1024 * 1024, // 5 MB chunks
      simultaneousUploads: 4,
      headers: { Authorization: `Bearer ${token}` },
      testChunks: true,
      generateUniqueIdentifier: () => uuidv4(),
    });

    resumableRef.current.on('progress', () => {
      const progress = resumableRef.current.progress() * 100;
      setUploadProgress(progress);
      if (startTime) {
        const elapsedTime = (Date.now() - startTime) / 1000; // seconds
        if (elapsedTime > 0) {
          const uploadedBytes = resumableRef.current.progress() * (imageFile?.size + (audioFile?.size || 0));
          setUploadSpeed(uploadedBytes / elapsedTime / 1024 / 1024); // MB/s
        }
      }
    });

    resumableRef.current.on('complete', async () => {
      try {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('content', form.content);
        formData.append('region', form.region);
        formData.append('genre', form.genre);
        formData.append('ageGroup', form.ageGroup);
        formData.append('fileIds', JSON.stringify(fileIdsRef.current));

        const config = {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000,
        };

        if (editId) {
          await axios.put(`/api/folktales/${editId}`, formData, config);
          setSuccess('Legend updated successfully!');
          setEditId(null);
        } else {
          await axios.post('/api/folktales', formData, config);
          setSuccess('Legend created successfully!');
        }

        setForm({ title: '', content: '', region: '', genre: '', ageGroup: '' });
        setImageFile(null);
        setAudioFile(null);
        setImagePreview('');
        setAudioPreview('');
        setUploadProgress(0);
        setUploadStatus('success');
        setLoading(false);
        setIsUploading(false);

        const response = await axios.get('/api/admin/folktales', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setFolktales(response.data);

        setTimeout(() => {
          setSuccess('');
          setUploadStatus('idle');
        }, 4000);
      } catch (error) {
        setError('Failed to finalize upload: ' + error.message);
        setUploadStatus('error');
        setLoading(false);
        setIsUploading(false);
      }
    });

    resumableRef.current.on('error', (message) => {
      setError('Upload failed: ' + message);
      setUploadStatus('error');
      setLoading(false);
      setIsUploading(false);
    });

    resumableRef.current.on('pause', () => {
      setUploadStatus('paused');
    });

    return () => {
      resumableRef.current.cancel();
    };
  }, [editId, token]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleContentChange = (value) => {
    setForm({ ...form, content: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const filetypes = /jpeg|jpg|png/;
      const maxSizeMB = 1024; // 1 GB
      if (!filetypes.test(file.type)) {
        setError('Please upload a JPEG or PNG image.');
        setImageFile(null);
        setImagePreview('');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Image size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`);
        setImageFile(null);
        setImagePreview('');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('Large file detected. Upload may take several minutes depending on your connection.');
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    } else {
      setImageFile(null);
      setImagePreview('');
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const filetypes = /mp3|mpeg/;
      const extname = /\.mp3$/i.test(file.name);
      const maxSizeMB = 1024; // 1 GB
      if (!filetypes.test(file.type) || !extname) {
        setError('Please upload an MP3 audio file.');
        setAudioFile(null);
        setAudioPreview('');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Audio size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`);
        setAudioFile(null);
        setAudioPreview('');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('Large file detected. Upload may take several minutes depending on your connection.');
      }
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      setError('');
    } else {
      setAudioFile(null);
      setAudioPreview('');
    }
  };

  const handleGenerateStory = async () => {
    if (!form.genre || !form.region || !form.ageGroup) {
      setError('Please select genre, region, and age group before generating a story.');
      return;
    }

    setGeneratingStory(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        '/api/folktales/generate-story',
        {
          genre: form.genre,
          region: form.region,
          ageGroup: form.ageGroup,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const generatedText = response.data.generatedText;
      const titleMatch = generatedText.match(/Title:\s*(.*?)\n/);
      let title = titleMatch ? titleMatch[1].trim() : '';
      const content = generatedText.replace(/Title:\s*.*?\n/, '').trim();

      if (!title) {
        if (content) {
          const firstSentenceMatch = content.match(/^.*?[.!?]/);
          if (firstSentenceMatch) {
            title = firstSentenceMatch[0].replace(/[.!?]$/, '').trim().substring(0, 50);
          } else {
            const words = content.split(' ').filter(word => word);
            title = words.length >= 5 ? words.slice(0, 5).join(' ').trim() : words.join(' ').trim();
            if (!title) {
              title = `A ${form.genre} Tale from ${form.region}`;
            }
          }
        } else {
          title = `A ${form.genre} Tale from ${form.region}`;
        }
      }

      setForm({
        ...form,
        title: title,
        content: content,
      });
      setSuccess('Story generated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      console.error('Error generating story:', error);
      let errorMessage = 'Failed to generate story. Please try again.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setGeneratingStory(false);
    }
  };

  const pauseUpload = () => {
    if (resumableRef.current) {
      resumableRef.current.pause();
      setUploadStatus('paused');
    }
  };

  const resumeUpload = async () => {
    if (resumableRef.current) {
      setUploadStatus('uploading');
      resumableRef.current.upload();
    }
  };

  const cancelUpload = () => {
    if (resumableRef.current) {
      resumableRef.current.cancel();
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('error');
      setError('Upload cancelled by user');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setStartTime(Date.now());

    if (!imageFile && !editId) {
      setError('An image is required for new Legends.');
      setLoading(false);
      setIsUploading(false);
      setUploadStatus('error');
      return;
    }

    fileIdsRef.current = { image: imageFile ? uuidv4() : null, audio: audioFile ? uuidv4() : null };

    if (imageFile) resumableRef.current.addFile(imageFile, undefined, { fileId: fileIdsRef.current.image });
    if (audioFile) resumableRef.current.addFile(audioFile, undefined, { fileId: fileIdsRef.current.audio });

    resumableRef.current.upload();
  };

  const handleEdit = (folktale) => {
    setForm({
      title: folktale.title,
      content: folktale.content,
      region: folktale.region,
      genre: folktale.genre,
      ageGroup: folktale.ageGroup,
    });
    setImageFile(null);
    setAudioFile(null);
    setImagePreview(folktale.imageUrl);
    setAudioPreview(folktale.audioUrl || '');
    setEditId(folktale._id);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Legend?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/folktales/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setFolktales(folktales.filter((f) => f._id !== id));
        setLoading(false);
      } catch (error) {
        console.error('Error deleting Legend:', error);
        setError('Failed to delete Legend.');
        setLoading(false);
      }
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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 font-caveat text-gray-800 animate-fadeIn">
      {(loading || generatingStory) && (
        <div className="fixed inset-0 bg-amber-900/85 flex flex-col items-center justify-center z-[9999]">
          <div className="border-8 border-gray-200 border-t-amber-100 rounded-full w-16 h-16 animate-spin"></div>
          <div className="mt-4 text-white text-xl">
            {generatingStory ? 'Generating story...' : 'Saving legend...'}
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-2 animate-pulseSketchy">
          Admin Panel
        </h2>
        <h3 className="text-xl sm:text-2xl text-amber-800 font-semibold">
          {editId ? 'Edit Legend' : 'Create New Legend'}
        </h3>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md border-2 border-red-300 mb-5 text-center font-semibold animate-shake">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-800 p-3 rounded-md border-2 border-green-300 mb-5 text-center font-semibold animate-shake">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6 shadow-lg border-2 border-amber-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="flex flex-col">
            <label className="mb-1 font-bold text-amber-900">Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter Legend title"
              value={form.title}
              onChange={handleInputChange}
              required
              disabled={loading || generatingStory}
              className="p-2 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-bold text-amber-900">Region</label>
            <select
              name="region"
              value={form.region}
              onChange={handleInputChange}
              required
              disabled={loading || generatingStory}
              className="p-2 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
            >
              <option value="">Select Region</option>
              <option value="Afghanistan">Afghanistan</option>
              <option value="Albania">Albania</option>
              <option value="Algeria">Algeria</option>
              <option value="Andorra">Andorra</option>
              <option value="Angola">Angola</option>
              <option value="Antigua and Barbuda">Antigua and Barbuda</option>
              <option value="Argentina">Argentina</option>
              <option value="Armenia">Armenia</option>
              <option value="Australia">Australia</option>
              <option value="Austria">Austria</option>
              <option value="Azerbaijan">Azerbaijan</option>
              <option value="Bahamas">Bahamas</option>
              <option value="Bahrain">Bahrain</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Barbados">Barbados</option>
              <option value="Belarus">Belarus</option>
              <option value="Belgium">Belgium</option>
              <option value="Belize">Belize</option>
              <option value="Benin">Benin</option>
              <option value="Bhutan">Bhutan</option>
              <option value="Bolivia">Bolivia</option>
              <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
              <option value="Botswana">Botswana</option>
              <option value="Brazil">Brazil</option>
              <option value="Brunei">Brunei</option>
              <option value="Bulgaria">Bulgaria</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Burundi">Burundi</option>
              <option value="Cabo Verde">Cabo Verde</option>
              <option value="Cambodia">Cambodia</option>
              <option value="Cameroon">Cameroon</option>
              <option value="Canada">Canada</option>
              <option value="Central African Republic">Central African Republic</option>
              <option value="Chad">Chad</option>
              <option value="Chile">Chile</option>
              <option value="China">China</option>
              <option value="Colombia">Colombia</option>
              <option value="Comoros">Comoros</option>
              <option value="Congo (Congo-Brazzaville)">Congo (Congo-Brazzaville)</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Croatia">Croatia</option>
              <option value="Cuba">Cuba</option>
              <option value="Cyprus">Cyprus</option>
              <option value="Czech Republic">Czech Republic</option>
              <option value="Democratic Republic of the Congo">Democratic Republic of the Congo</option>
              <option value="Denmark">Denmark</option>
              <option value="Djibouti">Djibouti</option>
              <option value="Dominica">Dominica</option>
              <option value="Dominican Republic">Dominican Republic</option>
              <option value="Ecuador">Ecuador</option>
              <option value="Egypt">Egypt</option>
              <option value="El Salvador">El Salvador</option>
              <option value="Equatorial Guinea">Equatorial Guinea</option>
              <option value="Eritrea">Eritrea</option>
              <option value="Estonia">Estonia</option>
              <option value="Eswatini">Eswatini</option>
              <option value="Ethiopia">Ethiopia</option>
              <option value="Fiji">Fiji</option>
              <option value="Finland">Finland</option>
              <option value="France">France</option>
              <option value="Gabon">Gabon</option>
              <option value="Gambia">Gambia</option>
              <option value="Georgia">Georgia</option>
              <option value="Germany">Germany</option>
              <option value="Ghana">Ghana</option>
              <option value="Greece">Greece</option>
              <option value="Grenada">Grenada</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Guinea">Guinea</option>
              <option value="Guinea-Bissau">Guinea-Bissau</option>
              <option value="Guyana">Guyana</option>
              <option value="Haiti">Haiti</option>
              <option value="Honduras">Honduras</option>
              <option value="Hungary">Hungary</option>
              <option value="Iceland">Iceland</option>
              <option value="India">India</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Iran">Iran</option>
              <option value="Iraq">Iraq</option>
              <option value="Ireland">Ireland</option>
              <option value="Israel">Israel</option>
              <option value="Italy">Italy</option>
              <option value="Jamaica">Jamaica</option>
              <option value="Japan">Japan</option>
              <option value="Jordan">Jordan</option>
              <option value="Kazakhstan">Kazakhstan</option>
              <option value="Kenya">Kenya</option>
              <option value="Kiribati">Kiribati</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Kyrgyzstan">Kyrgyzstan</option>
              <option value="Laos">Laos</option>
              <option value="Latvia">Latvia</option>
              <option value="Lebanon">Lebanon</option>
              <option value="Lesotho">Lesotho</option>
              <option value="Liberia">Liberia</option>
              <option value="Libya">Libya</option>
              <option value="Liechtenstein">Liechtenstein</option>
              <option value="Lithuania">Lithuania</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Madagascar">Madagascar</option>
              <option value="Malawi">Malawi</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Maldives">Maldives</option>
              <option value="Mali">Mali</option>
              <option value="Malta">Malta</option>
              <option value="Marshall Islands">Marshall Islands</option>
              <option value="Mauritania">Mauritania</option>
              <option value="Mauritius">Mauritius</option>
              <option value="Mexico">Mexico</option>
              <option value="Micronesia">Micronesia</option>
              <option value="Moldova">Moldova</option>
              <option value="Monaco">Monaco</option>
              <option value="Mongolia">Mongolia</option>
              <option value="Montenegro">Montenegro</option>
              <option value="Morocco">Morocco</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Myanmar">Myanmar</option>
              <option value="Namibia">Namibia</option>
              <option value="Nauru">Nauru</option>
              <option value="Nepal">Nepal</option>
              <option value="Netherlands">Netherlands</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Nicaragua">Nicaragua</option>
              <option value="Niger">Niger</option>
              <option value="Nigeria">Nigeria</option>
              <option value="North Korea">North Korea</option>
              <option value="North Macedonia">North Macedonia</option>
              <option value="Norway">Norway</option>
              <option value="Oman">Oman</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Palau">Palau</option>
              <option value="Palestine">Palestine</option>
              <option value="Panama">Panama</option>
              <option value="Papua New Guinea">Papua New Guinea</option>
              <option value="Paraguay">Paraguay</option>
              <option value="Peru">Peru</option>
              <option value="Philippines">Philippines</option>
              <option value="Poland">Poland</option>
              <option value="Portugal">Portugal</option>
              <option value="Qatar">Qatar</option>
              <option value="Romania">Romania</option>
              <option value="Russia">Russia</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
              <option value="Saint Lucia">Saint Lucia</option>
              <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
              <option value="Samoa">Samoa</option>
              <option value="San Marino">San Marino</option>
              <option value="Sao Tome and Principe">Sao Tome and Principe</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Senegal">Senegal</option>
              <option value="Serbia">Serbia</option>
              <option value="Seychelles">Seychelles</option>
              <option value="Sierra Leone">Sierra Leone</option>
              <option value="Singapore">Singapore</option>
              <option value="Slovakia">Slovakia</option>
              <option value="Slovenia">Slovenia</option>
              <option value="Solomon Islands">Solomon Islands</option>
              <option value="Somalia">Somalia</option>
              <option value="South Africa">South Africa</option>
              <option value="South Korea">South Korea</option>
              <option value="South Sudan">South Sudan</option>
              <option value="Spain">Spain</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="Sudan">Sudan</option>
              <option value="Suriname">Suriname</option>
              <option value="Sweden">Sweden</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Syria">Syria</option>
              <option value="Taiwan">Taiwan</option>
              <option value="Tajikistan">Tajikistan</option>
              <option value="Tanzania">Tanzania</option>
              <option value="Thailand">Thailand</option>
              <option value="Timor-Leste">Timor-Leste</option>
              <option value="Togo">Togo</option>
              <option value="Tonga">Tonga</option>
              <option value="Trinidad and Tobago">Trinidad and Tobago</option>
              <option value="Tunisia">Tunisia</option>
              <option value="Turkey">Turkey</option>
              <option value="Turkmenistan">Turkmenistan</option>
              <option value="Tuvalu">Tuvalu</option>
              <option value="Uganda">Uganda</option>
              <option value="Ukraine">Ukraine</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States of America">United States of America</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Uzbekistan">Uzbekistan</option>
              <option value="Vanuatu">Vanuatu</option>
              <option value="Vatican City">Vatican City</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Yemen">Yemen</option>
              <option value="Zambia">Zambia</option>
              <option value="Zimbabwe">Zimbabwe</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-bold text-amber-900">Genre</label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleInputChange}
              required
              disabled={loading || generatingStory}
              className="p-2 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
            >
              <option value="">Select Genre</option>
              <option value="Conspiracy Theory">Conspiracy Theory</option>
              <option value="Fable">Fable</option>
              <option value="Myth">Myth</option>
              <option value="Legend">Legend</option>
              <option value="Fairy Tale">Fairy Tale</option>
              <option value="Horror">Horror</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Adventure">Adventure</option>
              <option value="Mystery">Mystery</option>
              <option value="Historical">Historical</option>
              <option value="Ghost Story">Ghost Story</option>
              <option value="Supernatural">Supernatural</option>
              <option value="Tragedy">Tragedy</option>
              <option value="Moral Tale">Moral Tale</option>
              <option value="Urban Legend">Urban Legend</option>
              <option value="Comedy">Comedy</option>
              <option value="Parable">Parable</option>
              <option value="Epic">Epic</option>
              <option value="Romance">Romance</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-bold text-amber-900">Age Group</label>
            <select
              name="ageGroup"
              value={form.ageGroup}
              onChange={handleInputChange}
              required
              disabled={loading || generatingStory}
              className="p-2 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
            >
              <option value="">Select Age Group</option>
              <option value="Kids">Kids</option>
              <option value="Teens">Teens</option>
              <option value="Adults">Adults</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-bold text-amber-900">Image (Max 1GB)</label>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              required={!editId}
              disabled={loading || generatingStory}
              className="p-2 rounded-md border-2 border-amber-200 bg-white text-lg file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-900 file:font-semibold"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-48 rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-bold text-amber-900">Audio (Max 1GB, Optional)</label>
            <input
              type="file"
              name="audio"
              accept="audio/mp3,audio/mpeg"
              onChange={handleAudioChange}
              disabled={loading || generatingStory}
              className="p-2 rounded-md border-2 border-amber-200 bg-white text-lg file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-900 file:font-semibold"
            />
            {audioPreview && (
              <div className="mt-2">
                <audio
                  src={audioPreview}
                  controls
                  className="w-full rounded-md"
                />
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="mb-1 font-bold text-amber-900">Content</label>
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={handleContentChange}
              modules={quillModules}
              className="bg-white rounded-md border-2 border-amber-200"
              readOnly={loading || generatingStory}
            />
          </div>
        </div>

        {isUploading && (
          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-amber-900">Uploading Files</span>
              <div className="space-x-2">
                {uploadStatus === 'uploading' && (
                  <button
                    type="button"
                    onClick={pauseUpload}
                    className="text-yellow-600 text-sm font-semibold hover:underline"
                    aria-label="Pause upload"
                  >
                    Pause
                  </button>
                )}
                {uploadStatus === 'paused' && (
                  <button
                    type="button"
                    onClick={resumeUpload}
                    className="text-blue-600 text-sm font-semibold hover:underline"
                    aria-label="Resume upload"
                  >
                    Resume
                  </button>
                )}
                {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="text-red-600 text-sm font-semibold hover:underline"
                    aria-label="Cancel upload"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <div
              className={`relative h-3 rounded-full overflow-hidden transition-all duration-300 ${
                uploadStatus === 'error' ? 'bg-red-100' : uploadStatus === 'paused' ? 'bg-yellow-100' : 'bg-amber-100'
              }`}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  uploadStatus === 'success'
                    ? 'bg-green-500'
                    : uploadStatus === 'error'
                    ? 'bg-red-500'
                    : uploadStatus === 'paused'
                    ? 'bg-yellow-500'
                    : 'bg-amber-900 animate-pulse'
                }`}
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                {uploadStatus === 'success' ? (
                  <span className="text-green-800">Upload Complete!</span>
                ) : uploadStatus === 'error' ? (
                  <span className="text-red-800">Upload Failed</span>
                ) : uploadStatus === 'paused' ? (
                  <span className="text-yellow-800">Upload Paused</span>
                ) : (
                  <span>{Math.round(uploadProgress)}%</span>
                )}
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {uploadStatus === 'uploading' && uploadSpeed > 0
                ? `Uploading at ${uploadSpeed.toFixed(2)} MB/s, estimated time: ${Math.round(
                    ((100 - uploadProgress) * ((imageFile?.size || 0) + (audioFile?.size || 0)) / 1024 / 1024) / uploadSpeed
                  )}s remaining`
                : uploadStatus === 'uploading'
                ? 'Uploading files, please wait...'
                : uploadStatus === 'paused'
                ? 'Upload paused. Click Resume to continue.'
                : uploadStatus === 'success'
                ? 'Files uploaded successfully!'
                : 'Upload failed. Please try again.'}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-start">
          <button
            type="submit"
            disabled={loading || generatingStory || isUploading}
            className="bg-amber-900 text-white px-5 py-3 rounded-lg text-lg font-bold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editId ? 'Update Legend' : 'Create Legend'}
          </button>
          <button
            type="button"
            onClick={handleGenerateStory}
            disabled={loading || generatingStory || isUploading}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg text-lg font-bold hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate Story
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ title: '', content: '', region: '', genre: '', ageGroup: '' });
                setImageFile(null);
                setAudioFile(null);
                setImagePreview('');
                setAudioPreview('');
                setError('');
                setSuccess('');
                setUploadProgress(0);
                setUploadStatus('idle');
                setLoading(false);
              }}
              disabled={loading || generatingStory || isUploading}
              className="bg-orange-600 text-white px-5 py-3 rounded-lg text-lg font-bold hover:bg-orange-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <hr className="my-8 border-amber-300" />

      <h3 className="text-2xl font-bold text-amber-900 mb-4 animate-pulseSketchy">
        Existing Legends
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {folktales.length === 0 && (
          <p className="text-gray-600 italic text-center col-span-full animate-shake">
            No Legends found.
          </p>
        )}
        {folktales.map((f) => (
          <div
            key={f._id}
            className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg p-4 shadow-md border-2 border-amber-200 animate-fadeIn"
          >
            <h4 className="text-lg font-bold text-amber-900">{f.title}</h4>
            <p className="text-sm">
              <span className="font-bold text-amber-900">Region:</span> {f.region}
            </p>
            <p className="text-sm">
              <span className="font-bold text-amber-900">Genre:</span> {f.genre}
            </p>
            <p className="text-sm">
              <span className="font-bold text-amber-900">Age Group:</span> {f.ageGroup}
            </p>
            {f.imageUrl && (
              <img
                src={f.imageUrl}
                alt={f.title}
                className="w-36 h-24 object-cover rounded-md mt-2"
              />
            )}
            {f.audioUrl && (
              <div className="mt-2">
                <audio
                  src={f.audioUrl}
                  controls
                  className="w-full rounded-md"
                />
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEdit(f)}
                disabled={loading || generatingStory || isUploading}
                className="flex-1 bg-green-600 text-white py-2 rounded-md font-bold hover:bg-green-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(f._id)}
                disabled={loading || generatingStory || isUploading}
                className="flex-1 bg-red-600 text-white py-2 rounded-md font-bold hover:bg-red-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
