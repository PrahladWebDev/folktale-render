import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function RandomFolktale() {
  const [folktale, setFolktale] = useState(null);
  const intervalTime = 2000; // time in milliseconds (2000 = 2 seconds)

  const fetchRandomFolktale = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/folktales/random');
      setFolktale(response.data);
    } catch (error) {
      console.error("Failed to fetch folktale:", error);
    }
  };

  useEffect(() => {
    fetchRandomFolktale(); // fetch once immediately
    const interval = setInterval(fetchRandomFolktale, intervalTime);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {!folktale ? (
        <p>Loading folktale...</p>
      ) : (
        <>
          <h3 style={styles.folktaleTitle}>{folktale.title}</h3>
          <div style={styles.card}>
            <Link to={`/folktale/${folktale._id}`} style={styles.link}>
              <div style={styles.imageContainer}>
                <img
                  src={folktale.imageUrl}
                  alt={folktale.title}
                  style={styles.image}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/600x400?text=Folktale+Image';
                  }}
                />
              </div>
            </Link>
            {/* Optional refresh button */}
            {/* <button
              style={styles.refreshButton}
              onClick={fetchRandomFolktale}
            >
              <span style={styles.buttonIcon}>⟳</span> Discover Another Tale
            </button> */}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff8ee',
    borderRadius: '12px',
    padding: '2rem',
    margin: '2rem 0',
    boxShadow: '0 4px 12px rgba(92, 60, 16, 0.1)',
    textAlign: 'center',
    border: '1px solid #e0c9a6',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  folktaleTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.4rem',
    color: '#3a3a3a',
    margin: '0.5rem 0 1rem',
    transition: 'color 0.3s ease'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
    width: '100%'
  },
  imageContainer: {
    width: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '1rem',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  image: {
    width: '100%',
    height: 'auto',
    maxHeight: '400px',
    objectFit: 'contain',
    transition: 'transform 0.3s ease'
  },
  refreshButton: {
    backgroundColor: '#5c3c10',
    color: '#f9f5e9',
    border: 'none',
    borderRadius: '4px',
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  buttonIcon: {
    fontSize: '1.2rem'
  }
};

export default RandomFolktale;
