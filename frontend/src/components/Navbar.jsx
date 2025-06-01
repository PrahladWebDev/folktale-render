import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAdmin = async () => {
      if (token) {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/auth/me",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
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
  };

  return (
    <nav className="navbar">
      <style>
        {`
          .navbar {
            background: linear-gradient(90deg, #f6f9fc, #ffffff);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 12px 16px;
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
          }
          .logo {
            font-size: 1.8rem;
            font-weight: 700;
            color: #2d3748;
            cursor: pointer;
            transition: color 0.2s ease;
          }
          .logo:hover {
            color: #3182ce;
          }
          .search-container {
            flex: 1;
            max-width: 500px;
            margin: 0 16px;
          }
          .nav-buttons {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .nav-button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            background-color: #edf2f7;
            color: #2d3748;
          }
          .nav-button:hover {
            background-color: #e2e8f0;
            transform: translateY(-1px);
          }
          .primary-button {
            background-color: #3182ce;
            color: white;
          }
          .primary-button:hover {
            background-color: #2c5282;
          }
          .map-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            background-color: #4a5568;
            color: white;
          }
          .map-button:hover {
            background-color: #2d3748;
            transform: translateY(-1px);
          }
          @media (max-width: 768px) {
            .nav-container {
              flex-direction: column;
              align-items: flex-start;
            }
            .search-container {
              width: 100%;
              margin: 8px 0;
            }
            .nav-buttons {
              width: 100%;
              justify-content: flex-start;
              flex-wrap: wrap;
            }
            .nav-button, .map-button {
              flex: 1;
              text-align: center;
            }
          }
          @media (max-width: 480px) {
            .logo {
              font-size: 1.4rem;
            }
            .nav-button, .map-button {
              padding: 6px 12px;
              font-size: 0.9rem;
            }
          }
        `}
      </style>
      <div className="nav-container">
        <h1 className="logo" onClick={() => navigate("/")}>
          Folktale Haven
        </h1>

        <div className="search-container">
          <SearchBar />
        </div>

        <div className="nav-buttons">
          <button className="map-button" onClick={() => navigate("/map")}>
            <span>🌍</span> Map
          </button>

          {/* 👉 Bookmark Icon Button */}
          <button
            className="map-button"
            onClick={() => navigate("/bookmarks")}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="nav-button"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}
              <button className="nav-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="nav-button" onClick={() => navigate("/login")}>
                Login
              </button>
              <button
                className="nav-button primary-button"
                onClick={() => navigate("/register")}
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
