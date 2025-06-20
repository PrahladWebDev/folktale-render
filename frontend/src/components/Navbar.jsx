import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes, FaUser } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState({ username: null, profileImageUrl: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.isAdmin);
          setUser({
            username: response.data.username,
            profileImageUrl: response.data.profileImageUrl || "",
          });
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    };
    checkUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser({ username: null, profileImageUrl: "" });
    navigate("/login");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const renderProfileIcon = () => (
    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center hover:bg-amber-300 transition-colors duration-200 overflow-hidden">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <FaUser size={16} />
      )}
    </div>
  );

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition-colors duration-200"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false);
          }}
        >
          Legend संसार
        </h1>

        {/* Hamburger Menu for Mobile */}
        <button
          className="md:hidden text-amber-900 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-between gap-4">
          {/* Left Section: Search Bar and Links */}
          <div className="flex items-center gap-4">
            <SearchBar />
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

          {/* Right Section: Profile Icon */}
          {user.username && (
            <button
              className="flex items-center gap-2 hover:text-amber-700 transition-colors duration-200"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              {renderProfileIcon()}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 pt-4 px-4">
          <SearchBar />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false);
            }}
          >
            <span>🌍</span> Map
          </button>
          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/bookmarks");
              setIsMenuOpen(false);
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
                    setIsMenuOpen(false);
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
                  setIsMenuOpen(false);
                }}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/register");
                  setIsMenuOpen(false);
                }}
              >
                Register
              </button>
            </>
          )}
          {user.username && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
              onClick={() => {
                navigate("/profile");
                setIsMenuOpen(false);
              }}
            >
              {renderProfileIcon()}
              Profile
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
