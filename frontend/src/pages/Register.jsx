import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/SearchBar';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (error) {
      console.error('Register error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* <div style={styles.searchContainer}>
        <SearchBar />
      </div> */}
      
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Join Folktale Haven</h2>
          <p style={styles.subtitle}>Create your account to explore stories</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength="3"
              style={styles.input}
            />
            <p style={styles.helperText}>At least 3 characters</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              style={styles.input}
            />
            <p style={styles.helperText}>At least 6 characters</p>
          </div>

          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <a 
              href="/login" 
              style={styles.link}
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9f5e9',
    padding: '20px',
    fontFamily: "'Merriweather', serif"
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2rem',
    color: '#5c3c10',
    marginBottom: '10px',
    fontFamily: "'Playfair Display', serif"
  },
  subtitle: {
    color: '#666',
    fontSize: '0.95rem'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    textAlign: 'center'
  },
  form: {
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '25px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#5c3c10',
    fontSize: '0.95rem'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid #e0c9a6',
    fontSize: '1rem',
    fontFamily: "'Merriweather', serif",
    transition: 'all 0.3s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#d4a017',
      boxShadow: '0 0 0 3px rgba(212, 160, 23, 0.2)'
    }
  },
  helperText: {
    margin: '6px 0 0',
    fontSize: '0.8rem',
    color: '#777'
  },
  button: {
    width: '100%',
    backgroundColor: '#d4a017',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    ':hover': {
      backgroundColor: '#e0b53b'
    },
    ':disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    }
  },
  footer: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #eee'
  },
  footerText: {
    color: '#666',
    fontSize: '0.95rem'
  },
  link: {
    color: '#d4a017',
    fontWeight: '600',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline'
    }
  }
};

export default Register;