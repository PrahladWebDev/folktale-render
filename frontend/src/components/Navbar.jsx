import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState({ username: null, profileImageUrl: "" });

  const token = localStorage.getItem("token");
  const DEFAULT_PROFILE_IMAGE =
    "https://res.cloudinary.com/dvws2chvw/image/upload/v1750929194/user_profiles/jwkack4vcko50qfaawfn.png";

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
            profileImageUrl:
              response.data.user.profileImageUrl || DEFAULT_PROFILE_IMAGE,
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
        onError={(e) => {
          e.target.src = DEFAULT_PROFILE_IMAGE;
        }}
      />
    </div>
  );

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false);
          }}
        >
          Legend संसार
        </h1>

        {/* Toggle button for mobile */}
        <button
          className="md:hidden text-amber-900"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <SearchBar />

          {/* Explore dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 bg-amber-200 rounded-md hover:bg-amber-300 transition">
              Explore ▼
            </button>
            <div className="absolute hidden group-hover:flex flex-col bg-white shadow-lg rounded-md mt-1 min-w-[150px] right-0 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
              <button
                onClick={() => navigate("/map")}
                className="px-4 py-2 hover:bg-amber-100 text-left"
              >
                🌍 Map
              </button>
              <button
                onClick={() => navigate("/bookmarks")}
                className="px-4 py-2 hover:bg-amber-100 text-left flex items-center gap-2"
              >
                <FaBookmark /> Bookmarks
              </button>
            </div>
          </div>

          {/* Profile */}
          {user.username && (
            <button
              onClick={() => navigate("/profile")}
              className="hover:scale-105 transition-transform"
              title="Profile"
            >
              {renderProfileIcon()}
            </button>
          )}

          {/* Account dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition">
              Account ▼
            </button>
            <div className="absolute hidden group-hover:flex flex-col bg-white shadow-lg rounded-md mt-1 right-0 min-w-[160px] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
              {token ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="px-4 py-2 hover:bg-amber-100 text-left"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 hover:bg-amber-100 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 hover:bg-amber-100 text-left"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="px-4 py-2 hover:bg-amber-100 text-left"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="flex flex-col gap-4 pt-4 px-4">
          <SearchBar />

          <div className="pt-2 border-t border-amber-300">
            <p className="text-sm font-semibold text-amber-700">Explore</p>
            <button
              onClick={() => {
                navigate("/map");
                setIsMenuOpen(false);
              }}
              className="mt-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800"
            >
              🌍 Map
            </button>
            <button
              onClick={() => {
                navigate("/bookmarks");
                setIsMenuOpen(false);
              }}
              className="mt-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 flex items-center gap-2"
            >
              <FaBookmark /> Bookmarks
            </button>
          </div>

          {user.username && (
            <div className="pt-2 border-t border-amber-300">
              <p className="text-sm font-semibold text-amber-700">User</p>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2"
              >
                {renderProfileIcon()}
                <span>Profile</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-amber-300">
            <p className="text-sm font-semibold text-amber-700">Account</p>
            {token ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setIsMenuOpen(false);
                    }}
                    className="mt-1 px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-1 px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300"
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
                  className="mt-1 px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate("/register");
                    setIsMenuOpen(false);
                  }}
                  className="mt-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
