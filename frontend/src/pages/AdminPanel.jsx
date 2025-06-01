import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchFolktales = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/folktales', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 seconds timeout for fetching
        });
        setFolktales(response.data);
      } catch (error) {
        console.error('Error fetching folktales:', error);
        navigate('/login');
      }
    };
    fetchFolktales();
  }, [token, navigate]);

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
      const maxSizeMB = 5; // Max file size: 5MB
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
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    } else {
      setImageFile(null);
      setImagePreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        timeout: 30000, // 30 seconds timeout for upload
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      };

      if (editId) {
        // Update folktale
        await axios.put(`http://localhost:5000/api/folktales/${editId}`, formData, config);
        setEditId(null);
      } else {
        // Create new folktale
        if (!imageFile) {
          setError('An image is required for new folktales.');
          setIsUploading(false);
          return;
        }
        await axios.post('http://localhost:5000/api/folktales', formData, config);
      }

      // Reset form
      setForm({ title: '', content: '', region: '', genre: '', ageGroup: '' });
      setImageFile(null);
      setImagePreview('');
      setUploadProgress(0);
      setIsUploading(false);

      // Refresh folktales list
      const response = await axios.get('http://localhost:5000/api/admin/folktales', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setFolktales(response.data);
    } catch (error) {
      console.error('Error saving folktale:', error);
      let errorMessage = 'Failed to save folktale.';
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Try uploading a smaller image or check server status.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
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
    setImagePreview(folktale.imageUrl);
    setEditId(folktale._id);
    setError('');
    setUploadProgress(0);
    setIsUploading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this folktale?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/folktales/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setFolktales(folktales.filter((f) => f._id !== id));
      } catch (error) {
        console.error('Error deleting folktale:', error);
        setError('Failed to delete folktale.');
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Admin Panel</h2>
        <h3 style={styles.subtitle}>{editId ? 'Edit Folktale' : 'Create New Folktale'}</h3>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter folktale title"
              value={form.title}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Region</label>
            <select
              name="region"
              value={form.region}
              onChange={handleInputChange}
              required
              style={styles.select}
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
              <option value="Brunei Darussalam">Brunei Darussalam</option>
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
              <option value="Congo (Democratic Republic of the)">Congo (Democratic Republic of the)</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Croatia">Croatia</option>
              <option value="Cuba">Cuba</option>
              <option value="Cyprus">Cyprus</option>
              <option value="Czech Republic (Czechia)">Czech Republic (Czechia)</option>
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
              <option value="Eswatini (fmr. 'Swaziland')">Eswatini (fmr. 'Swaziland')</option>
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
              <option value="Korea (North)">Korea (North)</option>
              <option value="Korea (South)">Korea (South)</option>
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
              <option value="Myanmar (formerly Burma)">Myanmar (formerly Burma)</option>
              <option value="Namibia">Namibia</option>
              <option value="Nauru">Nauru</option>
              <option value="Nepal">Nepal</option>
              <option value="Netherlands">Netherlands</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Nicaragua">Nicaragua</option>
              <option value="Niger">Niger</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Genre</label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleInputChange}
              required
              style={styles.select}
            >
              <option value="">Select Genre</option>
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Age Group</label>
            <select
              name="ageGroup"
              value={form.ageGroup}
              onChange={handleInputChange}
              required
              style={styles.select}
            >
              <option value="">Select Age Group</option>
              <option value="Kids">Kids</option>
              <option value="Teens">Teens</option>
              <option value="Adults">Adults</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Image (Max 5MB)</label>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              required={!editId}
              style={styles.fileInput}
            />
            {imagePreview && (
              <div style={styles.imagePreview}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={styles.previewImage}
                />
              </div>
            )}
            {isUploading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${uploadProgress}%`,
                    }}
                  ></div>
                </div>
                <span style={styles.progressText}>{uploadProgress}%</span>
              </div>
            )}
          </div>

          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Content</label>
            <ReactQuill
              value={form.content}
              onChange={handleContentChange}
              modules={quillModules}
              placeholder="Enter folktale content"
              style={styles.quillEditor}
            />
          </div>
        </div>

        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton} disabled={isUploading}>
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
                setError('');
                setUploadProgress(0);
                setIsUploading(false);
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={styles.folktalesSection}>
        <h3 style={styles.sectionTitle}>All Folktales ({folktales.length})</h3>
        <div style={styles.folktaleGrid}>
          {folktales.map((folktale) => (
            <div key={folktale._id} style={styles.folktaleCard}>
              <div style={styles.cardHeader}>
                <h4 style={styles.folktaleTitle}>{folktale.title}</h4>
                <div style={styles.cardMeta}>
                  <span style={styles.metaItem}>{folktale.region}</span>
                  <span style={styles.metaItem}>{folktale.genre}</span>
                  <span style={styles.metaItem}>{folktale.ageGroup}</span>
                </div>
              </div>

              <div style={styles.imagePreview}>
                {folktale.imageUrl && (
                  <img
                    src={folktale.imageUrl}
                    alt={folktale.title}
                    style={styles.image}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                )}
              </div>

              <div style={styles.ratingSection}>
                <span style={styles.rating}>
                  Rating: {folktale.averageRating || 'N/A'} ⭐
                </span>
                <span style={styles.commentCount}>
                  {folktale.comments?.length || 0} comment{folktale.comments?.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => handleEdit(folktale)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(folktale._id)}
                  style={styles.deleteButton}
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

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Merriweather', serif",
    color: '#3a3a3a',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.2rem',
    color: '#5c3c10',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.5rem',
    color: '#6e4a1f',
    fontWeight: '500',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '0.95rem',
  },
  form: {
    backgroundColor: '#f9f5e9',
    padding: '25px',
    borderRadius: '8px',
    marginBottom: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '25px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#5c3c10',
    fontSize: '0.95rem',
  },
  input: {
    width: '93%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #e0c9a6',
    fontSize: '1rem',
    fontFamily: "'Merriweather', serif",
    transition: 'all 0.3s ease',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #e0c9a6',
    fontSize: '1rem',
    fontFamily: "'Merriweather', serif",
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  fileInput: {
    width: '93%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #e0c9a6',
    fontSize: '1rem',
    fontFamily: "'Merriweather', serif",
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  imagePreview: {
    width: '100%',
    maxHeight: '180px',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '10px',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  progressContainer: {
    marginTop: '10px',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5c3c10',
    transition: 'width 0.3s ease',
  },
  progressText: {
    display: 'block',
    marginTop: '5px',
    fontSize: '0.9rem',
    color: '#5c3c10',
    textAlign: 'center',
  },
  quillEditor: {
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e0c9a6',
    fontFamily: "'Merriweather', serif",
    minHeight: '200px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginTop: '20px',
  },
  submitButton: {
    backgroundColor: '#5c3c10',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    opacity: (props) => (props.disabled ? '0.6' : '1'),
  },
  cancelButton: {
    backgroundColor: 'transparent',
    color: '#5c3c10',
    border: '1px solid #5c3c10',
    borderRadius: '4px',
    padding: '12px 25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  folktalesSection: {
    marginTop: '40px',
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.8rem',
    color: '#5c3c10',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e0c9a6',
  },
  folktaleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '25px',
  },
  folktaleCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0c9a6',
    transition: 'transform 0.3s ease',
  },
  cardHeader: {
    marginBottom: '15px',
  },
  folktaleTitle: {
    fontSize: '1.3rem',
    color: '#5c3c10',
    marginBottom: '10px',
    fontFamily: "'Playfair Display', serif",
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '15px',
  },
  metaItem: {
    backgroundColor: '#f9f5e9',
    color: '#5c3c10',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.85rem',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  ratingSection: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    fontSize: '0.9rem',
  },
  rating: {
    color: '#d4a017',
    fontWeight: '600',
  },
  commentCount: {
    color: '#666',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
  },
  editButton: {
    flex: '1',
    backgroundColor: '#d4a017',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  deleteButton: {
    flex: '1',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default AdminPanel;