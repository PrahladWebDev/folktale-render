import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes, FaGlobeAsia } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState({ username: null, profileImageUrl: "" });

  const token = localStorage.getItem("token");
  const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/dvws2chvw/image/upload/v1750855878/user_profiles/b2kfd6sawgnkrimdnm3m.png";

  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.user.isAdmin);
          setUser({
            username: response.data.user.username,
            profileImageUrl: response.data.user.profileImageUrl || DEFAULT_PROFILE_IMAGE,
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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const renderProfileIcon = () => (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-200 hover:bg-amber-300 transition-colors duration-200">
      <img
        src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE}
        alt="Profile"
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE; }}
      />
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

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-amber-900 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Desktop navbar items */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-4">
          <SearchBar />

          {user.username && (
            <button
              onClick={() => navigate("/profile")}
              title="Profile"
              className="hover:scale-105 transition-transform duration-200"
            >
              {renderProfileIcon()}
            </button>
          )}

        <button
  onClick={() => navigate("/map")}
  className="p-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
  title="Map"
>
  <FaGlobeAsia size={20} />
</button>

          <button
            onClick={() => navigate("/bookmarks")}
            className="p-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile navbar dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 pt-4 px-4">
          <SearchBar />

          {user.username && (
            <button
              onClick={() => {
                navigate("/profile");
                setIsMenuOpen(false);
              }}
              className="self-start"
              title="Profile"
            >
              {renderProfileIcon()}
            </button>
          )}

          <button
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 transition-all duration-200"
          >
            🌍 Map
          </button>

          <button
            onClick={() => {
              navigate("/bookmarks");
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 transition-all duration-200"
          >
            <FaBookmark /> Bookmarks
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate("/admin");
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300 transition-all duration-200"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300 transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300 transition-all duration-200"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate("/register");
                  setIsMenuOpen(false);
                }}
                className="px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 transition-all duration-200"
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
