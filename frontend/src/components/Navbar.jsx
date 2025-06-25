import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes, FaUser, FaSun, FaMoon } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState({ username: null, profileImageUrl: "" });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Apply theme to <html> element
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const renderProfileIcon = () => (
    <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center hover:bg-amber-300 dark:hover:bg-amber-600 transition-colors duration-200 overflow-hidden">
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
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800 dark:text-gray-100 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-400 cursor-pointer hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false);
          }}
        >
          Legend संसार
        </h1>

        <div className="flex items-center gap-3">
          <button
            className="text-amber-900 dark:text-amber-400 focus:outline-none hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
          </button>
          <button
            className="md:hidden text-amber-900 dark:text-amber-400 focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        <div className="hidden md:flex flex-1 items-center gap-4 mx-4">
          <SearchBar />
          {user.username && (
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-semibold">
              <button
                className="flex items-center gap-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                {renderProfileIcon()}
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/map")}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/bookmarks")}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 dark:bg-gray-700 text-amber-900 dark:text-amber-400 font-semibold hover:bg-amber-300 dark:hover:bg-gray-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-md bg-amber-200 dark:bg-gray-700 text-amber-900 dark:text-amber-400 font-semibold hover:bg-amber-300 dark:hover:bg-gray-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 dark:bg-gray-700 text-amber-900 dark:text-amber-400 font-semibold hover:bg-amber-300 dark:hover:bg-gray-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 pt-4">
          <div className="px-4 flex flex-col gap-3">
            <SearchBar />
            {user.username && (
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-semibold">
                <button
                  className="flex items-center gap-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200"
                  onClick={() => {
                    navigate("/profile");
                    setIsMenuOpen(false);
                  }}
                >
                  {renderProfileIcon()}
                </button>
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false);
            }}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/bookmarks");
              setIsMenuOpen(false);
            }}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 transition-all duration-200"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
            <span className="ml-2">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 dark:bg-gray-700 text-amber-900 dark:text-amber-400 font-semibold hover:bg-amber-300 dark:hover:bg-gray-600 hover:shadow-lg transition-all duration-200"
                  onClick={() => {
                    navigate("/admin");
                    setIsMenuOpen(false);
                  }}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-md bg-amber-200 dark:bg-gray-700 text-amber-900 dark:text-amber-400 font-semibold hover:bg-amber-300 dark:hover:bg-gray-600 hover:shadow-lg transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 dark:bg-gray-700 text-amber-900 dark:text-amber-400 font-semibold hover:bg-amber-300 dark:hover:bg-gray-600 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 dark:bg-amber-700 text-white font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/register");
                  setIsMenuOpen(false);
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
