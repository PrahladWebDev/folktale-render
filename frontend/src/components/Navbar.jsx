import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for toggling menu
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAdmin = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.isAdmin);
        } catch (error) {
          console.error("Error checking admin:", error);
        }
      }
    };
    checkAdmin();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    setIsMenuOpen(false); // Close menu on logout
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition-colors duration-200"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false); // Close menu on navigation
          }}
        >
          Folktale Haven
        </h1>

        {/* Hamburger Icon for Mobile */}
        <button
          className="md:hidden text-amber-900 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Search Bar for Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/map")}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/bookmarks")}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 pt-4">
          {/* Search Bar for Mobile */}
          <div className="px-4">
            <SearchBar />
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false); // Close menu on navigation
            }}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/bookmarks");
              setIsMenuOpen(false); // Close menu on navigation
            }}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                  onClick={() => {
                    navigate("/admin");
                    setIsMenuOpen(false); // Close menu on navigation
                  }}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false); // Close menu on navigation
                }}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/register");
                  setIsMenuOpen(false); // Close menu on navigation
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
