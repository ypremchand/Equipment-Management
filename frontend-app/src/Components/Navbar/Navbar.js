import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";

function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState([]); // ✅ store dynamic assets
  const navigate = useNavigate();
  const isAdmin = user?.email?.includes("@admin");

  const fetchAssets = async () => {
    try {
      const res = await axios.get("http://localhost:5083/api/assets");
      setAssets(res.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  // ✅ Fetch once and refresh on event
  useEffect(() => {
    fetchAssets();
    window.addEventListener("inventoryUpdated", fetchAssets);
    return () => window.removeEventListener("inventoryUpdated", fetchAssets);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold ms-3" to="/">
          EDM
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className={`collapse navbar-collapse justify-content-between ${
            isOpen ? "show" : ""
          }`}
        >
          <ul className="navbar-nav ms-3">
            {isAdmin ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/adminpanel" onClick={() => setIsOpen(false)}>
                    Admin Panel
                  </Link>
                </li>

                <li className="nav-item hover-dropdown">
                  <span className="nav-link dropdown-toggle-link no-caret">
                    Inventory
                  </span>
                  <div className="dropdown-menu bg-black">
                    {/* ✅ Dynamically populate all assets */}
                    {assets.length > 0 ? (
                      assets.map((a) => (
                        <button
                          key={a.id}
                          className="dropdown-item"
                          onClick={() => {
                            // Navigate based on asset name
                            const name = a.name.toLowerCase();
                            if (name.includes("laptop")) navigate("/laptops");
                            else if (name.includes("mobile")) navigate("/mobiles");
                            else if (name.includes("tablet")) navigate("/tablets");
                            else navigate("/");
                            setIsOpen(false);
                          }}
                        >
                          {a.name}
                        </button>
                      ))
                    ) : (
                      <span className="dropdown-item text-muted">No assets found</span>
                    )}
                  </div>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/requests" onClick={() => setIsOpen(false)}>
                    Requests
                  </Link>
                </li>

                {/* 🗑️ Delete History Dropdown */}
                <li className="nav-item hover-dropdown">
                  <span className="nav-link dropdown-toggle-link no-caret">
                    Delete History
                  </span>
                  <div className="dropdown-menu bg-black">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/admindeletehistory");
                        setIsOpen(false);
                      }}
                    >
                      Admin Delete History
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/userdeletehistory");
                        setIsOpen(false);
                      }}
                    >
                      User Delete History
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <>
                {/* Regular user links */}
                <li className="nav-item">
                  <Link className="nav-link" to="/" onClick={() => setIsOpen(false)}>
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={() => setIsOpen(false)}>
                    About
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/contact" onClick={() => setIsOpen(false)}>
                    Contact Us
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/returnassets" onClick={() => setIsOpen(false)}>
                    Requested Assets
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center me-3">
            <span className="navbar-text me-3 text-white">
              Hi, {user?.name || user?.username || "User"}
            </span>
            <button className="btn btn-danger btn-sm" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
