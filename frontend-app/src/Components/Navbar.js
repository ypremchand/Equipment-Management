import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleNavbar = () => setIsOpen(!isOpen);

  const isAdmin = user?.email?.includes("@admin"); // check if admin

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container-fluid">
        {/* Brand/Logo */}
        <Link className="navbar-brand fw-bold ms-3" to="/">
          EDM
        </Link>

        {/* Hamburger button for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
          aria-controls="navbarNav"
          aria-expanded={isOpen ? "true" : "false"}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible menu */}
        <div
          className={`collapse navbar-collapse justify-content-between ${isOpen ? "show" : ""}`}
          id="navbarNav"
        >
          {/* Left-side links */}
          <ul className="navbar-nav ms-3">
            {isAdmin ? (
              <>
                {/* Admin sees only Admin Panel and ContactedUs */}
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
              </>
            ) : (
              <>
                {/* Regular user sees normal links */}
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
                    Contact
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/inventory" onClick={() => setIsOpen(false)}>
                    Inventory
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
  );
}

export default Navbar;
