import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import About from "./Components/About";
import Contact from "./Components/Contact";
import AdminPanel from "./Components/AdminPanel";
import Laptops from "./Components/Laptops";
import Mobiles from "./Components/Mobiles";
import Tablets from "./Components/Tablets";
import ContactedUs from "./Components/ContactedUs";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function App() {
  const [user, setUser] = useState(null);

  // Load user data from localStorage when the app starts
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // ✅ Save to localStorage
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user"); // ✅ Remove on logout
  };

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={user?.email?.includes("@admin") ? <Navigate to="/adminpanel" /> : <Home />}
            />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin-only routes */}
            <Route
              path="/adminpanel"
              element={user?.email?.includes("@admin") ? <AdminPanel /> : <Navigate to="/" />}
            />
            <Route
              path="/contactedus"
              element={user?.email?.includes("@admin") ? <ContactedUs /> : <Navigate to="/" />}
            />
            <Route
              path="/Laptops"
              element={user?.email?.includes("@admin") ? <Laptops /> : <Navigate to="/" />}
            />
             <Route
              path="/Mobiles"
              element={user?.email?.includes("@admin") ? <Mobiles /> : <Navigate to="/" />}
            />
             <Route
              path="/Tablets"
              element={user?.email?.includes("@admin") ? <Tablets /> : <Navigate to="/" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
