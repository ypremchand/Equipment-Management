import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Inventory from "../Inventory/Inventory";
import "./style.css";

function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.email?.includes("@admin");

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top">
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
                    AdminPanel
                  </Link>
                </li>

                {/* ✅ Inventory dropdown (dynamic) */}
                <Inventory closeMenu={() => setIsOpen(false)} />

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/requests"
                    onClick={() => setIsOpen(false)}
                  >
                    Requests
                  </Link>
                </li>

                {/* 🗑️ Delete History Dropdown */}
                <li className="nav-item hover-dropdown">
                  <span className="nav-link dropdown-toggle-link no-caret">
                    DeleteHistory
                  </span>
                  <div className="dropdown-menu bg-black">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/admindeletehistory");
                        setIsOpen(false);
                      }}
                    >
                      AdminDeleteHistory
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/userdeletehistory");
                        setIsOpen(false);
                      }}
                    >
                      UserDeleteHistory
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <>
                {/* Regular user links */}
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
                    ContactUs  
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/returnassets"
                    onClick={() => setIsOpen(false)}
                  >
                    RequestedAssets
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
 