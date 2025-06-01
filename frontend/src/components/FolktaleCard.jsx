import { Link } from 'react-router-dom';

function FolktaleCard({ folktale }) {
  const averageRating = folktale.ratings.length
    ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
    : 'No ratings';

  return (
    <Link to={`/folktale/${folktale._id}`} className="folktale-card" style={styles.card}>
      <div style={styles.imageContainer}>
        <img
          src={folktale.imageUrl}
          alt={folktale.title}
          style={styles.image}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '';
          }}
        />
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{folktale.title}</h3>
        <div style={styles.meta}>
          <p style={styles.metaItem}>
            <span style={styles.metaLabel}>Region:</span> {folktale.region}
          </p>
          <p style={styles.metaItem}>
            <span style={styles.metaLabel}>Genre:</span> {folktale.genre}
          </p>
          <p style={styles.metaItem}>
            <span style={styles.metaLabel}>Age Group:</span> {folktale.ageGroup}
          </p>
        </div>
        <div style={styles.rating}>
          <span style={styles.ratingText}>Rating:</span>
          <span style={styles.ratingValue}>
            {averageRating}
            <span style={styles.star}>⭐</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'block',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    textDecoration: 'none',
    color: '#333',
    height: '100%',
  },
  imageContainer: {
    position: 'relative',
    paddingTop: '60%', // Maintains a 5:3 aspect ratio
    overflow: 'hidden',
    backgroundColor: '#f9f5e9', // Background color for letterboxing
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // Center the image
    width: '100%',
    height: '100%',
    objectFit: 'contain', // Ensure entire image is visible
    transition: 'transform 0.3s ease',
  },
  content: {
    padding: '16px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#5c3c10',
    fontFamily: "'Playfair Display', serif",
    minHeight: '3em',
    lineHeight: '1.3',
  },
  meta: {
    marginBottom: '12px',
  },
  metaItem: {
    margin: '4px 0',
    fontSize: '0.9rem',
    color: '#666',
  },
  metaLabel: {
    fontWeight: '600',
    color: '#5c3c10',
  },
  rating: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #eee',
  },
  ratingText: {
    fontSize: '0.9rem',
    color: '#666',
  },
  ratingValue: {
    fontWeight: '600',
    color: '#d4a017',
  },
  star: {
    marginLeft: '4px',
  },
};

export default FolktaleCard;