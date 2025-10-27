import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.email?.includes("@admin");

  return (
    <>
      {/* Inline CSS for dropdown */}
      <style>{`
        .hover-dropdown {
          position: relative;
        }

        .hover-dropdown .dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background-color: #212529;
          border: none;
          border-radius: 0;
          padding: 0;
          min-width: 160px;
          z-index: 1000;
        }

        .hover-dropdown:hover .dropdown-menu {
          display: block;
        }

        .dropdown-item {
          color: white;
          padding: 10px 15px;
          text-decoration: none;
          display: block;
          background-color: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: #343a40;
        }

        .dropdown-toggle-link {
          color: white;
          text-decoration: none;
          cursor: pointer;
        }

        .dropdown-toggle-link:hover {
          color: #adb5bd;
        }

        .no-caret::after {
          display: none !important;
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
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
                    <Link
                      className="nav-link"
                      to="/adminpanel"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/contactedus"
                      onClick={() => setIsOpen(false)}
                    >
                      Contacted Us
                    </Link>
                  </li>

                  {/* Hover Dropdown for Inventory */}
                  <li className="nav-item hover-dropdown">
                    <span className="nav-link dropdown-toggle-link no-caret">
                      Inventory
                    </span>
                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          navigate("/laptops");
                          setIsOpen(false);
                        }}
                      >
                        Laptops
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          navigate("/mobiles");
                          setIsOpen(false);
                        }}
                      >
                        Mobiles
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          navigate("/tablets");
                          setIsOpen(false);
                        }}
                      >
                        Tablets
                      </button>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/"
                      onClick={() => setIsOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/about"
                      onClick={() => setIsOpen(false)}
                    >
                      About
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/contact"
                      onClick={() => setIsOpen(false)}
                    >
                      Contact
                    </Link>
                  </li>
                </>
              )}
            </ul>

            {/* Right-side user info */}
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
    </>
  );
}

export default Navbar;
