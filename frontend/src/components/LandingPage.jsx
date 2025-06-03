import { useNavigate } from 'react-router-dom';
import { FaBookOpen, FaMapMarkedAlt, FaComments, FaArrowRight } from 'react-icons/fa';

// Reusable Button Component
const PrimaryButton = ({ children, onClick, ariaLabel, variant = 'primary' }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-md text-lg font-semibold flex items-center justify-center gap-2 mx-auto transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
      variant === 'primary'
        ? 'bg-amber-900 text-white hover:bg-amber-800'
        : 'bg-transparent border-2 border-amber-900 text-amber-900 hover:bg-amber-900 hover:text-white'
    }`}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="font-caveat text-gray-800 bg-amber-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-100 to-orange-100 py-12 sm:py-20 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-amber-900 mb-6 animate-pulse">
            Welcome to Folktale Haven
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover a world of enchanting stories, explore tales from every corner of the globe, and share your own adventures in our vibrant community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton
              onClick={() => navigate('/home')}
              ariaLabel="Explore folktales"
            >
              Explore Folktales
            </PrimaryButton>
            <PrimaryButton
              onClick={() => navigate('/register')}
              variant="secondary"
              ariaLabel="Join the Folktale Haven community"
            >
              Join Now
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-amber-900 text-center mb-10 animate-pulse">
            Why Folktale Haven?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 animate-fade-in">
              <FaBookOpen className="text-4xl text-amber-900 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2 text-center">Rich Story Collection</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Dive into a vast library of folktales from diverse cultures, curated for all ages.
              </p>
            </div>
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 animate-fade-in">
              <FaMapMarkedAlt className="text-4xl text-amber-900 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2 text-center">Interactive Map</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Explore stories by clicking on countries with our interactive global map.
              </p>
            </div>
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 animate-fade-in">
              <FaComments className="text-4xl text-amber-900 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2 text-center">Community Engagement</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Rate, comment, and bookmark your favorite tales to connect with others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Teaser Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-amber-100 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-amber-900 mb-6 animate-pulse">
            Explore Folktales by Region
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Click on any country to uncover its unique stories and legends.
          </p>
          <div className="relative max-w-4xl mx-auto">
            <PrimaryButton
              onClick={() => navigate('/map')}
              ariaLabel="Explore the interactive folktale map"
            >
              Explore Map
              <FaArrowRight className="text-xl" />
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-amber-900 mb-6 animate-pulse">
            Start Your Journey Today
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community to save your favorite stories, share your thoughts, and discover new tales.
          </p>
          <PrimaryButton
            onClick={() => navigate('/register')}
            ariaLabel="Get started with Folktale Haven"
          >
            Get Started
          </PrimaryButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg mb-4">Folktale Haven © 2025. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <a
              href="/home"
              className="text-amber-100 hover:text-white hover:underline transition-all duration-200"
              onClick={(e) => { e.preventDefault(); navigate('/home'); }}
              aria-label="Go to Home page"
            >
              Home
            </a>
            <a
              href="/map"
              className="text-amber-100 hover:text-white hover:underline transition-all duration-200"
              onClick={(e) => { e.preventDefault(); navigate('/map'); }}
              aria-label="Go to Interactive Map page"
            >
              Map
            </a>
            <a
              href="/login"
              className="text-amber-100 hover:text-white hover:underline transition-all duration-200"
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}
              aria-label="Go to Login page"
            >
              Login
            </a>
            <a
              href="/register"
              className="text-amber-100 hover:text-white hover:underline transition-all duration-200"
              onClick={(e) => { e.preventDefault(); navigate('/register'); }}
              aria-label="Go to Register page"
            >
              Register
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
