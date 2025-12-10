import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Home/Home";
import Contact from "./Components/ContactUs/Contact";
import ReturnAssets from "./Components/ReturnAssets/ReturnAssets";
import AssignedItems from "./Components/AssignedItems/AssignedItems";
import Requests from "./Components/Requests/Requests";
import AdminPanel from "./Components/AdminPanel/AdminPanel";
import Inventory from "./Components/Inventory/Inventory";
import Laptops from "./Components/Laptops/Laptops";
import Mobiles from "./Components/Mobiles/Mobiles";
import Tablets from "./Components/Tablets/Tablets";
import Desktops from "./Components/Desktops/Desktops";
import Printers from "./Components/Printers/Printers";
import Scanner1 from "./Components/Scanner1/Scanner1";
import Scanner2 from "./Components/Scanner2/Scanner2";
import Scanner3 from "./Components/Scanner3/Scanner3";
import DamagedAssets from "./Components/DamagedAssets/DamagedAssets";
import ContactedUs from "./Components/ContactedUs/ContactedUs";
import AdminDeleteHistory from "./Components/AdminDeleteHistory/AdminDeleteHistory";
import UserDeleteHistory from "./Components/UserDeleteHistory/UserDeleteHistory";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // still save user info
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
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
              element={user?.email?.includes("@admin") ? <Navigate to="/admin-panel" /> : <Home />}
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/contact/:id" element={<Contact />} />
            <Route path="/requested-assets" element={<ReturnAssets />} />
            <Route>
              <Route path="/assigned-items/:requestId" element={<AssignedItems />} />
            </Route>


            {/* Admin-only routes */}
            <Route
              path="/admin-panel"
              element={user?.email?.includes("@admin") ? <AdminPanel /> : <Navigate to="/" />}
            />
            <Route
              path="/inventory"
              element={user?.email?.includes("@admin") ? <Inventory /> : <Navigate to="/" />}
            />
            <Route
              path="/contacted-us"
              element={user?.email?.includes("@admin") ? <ContactedUs /> : <Navigate to="/" />}
            />
            <Route
              path="/laptops"
              element={user?.email?.includes("@admin") ? <Laptops /> : <Navigate to="/" />}
            />
            <Route
              path="/mobiles"
              element={user?.email?.includes("@admin") ? <Mobiles /> : <Navigate to="/" />}
            />
            <Route
              path="/tablets"
              element={user?.email?.includes("@admin") ? <Tablets /> : <Navigate to="/" />}
            />
            <Route
              path="/desktops"
              element={user?.email?.includes("@admin") ? <Desktops /> : <Navigate to="/" />}
            />
            <Route
              path="/printers"
              element={user?.email?.includes("@admin") ? <Printers /> : <Navigate to="/" />}
            />
            <Route
              path="/scanner1"
              element={user?.email?.includes("@admin") ? <Scanner1 /> : <Navigate to="/" />}
            />
            <Route
              path="/scanner2"
              element={user?.email?.includes("@admin") ? <Scanner2 /> : <Navigate to="/" />}
            />
            <Route
              path="/scanner3"
              element={user?.email?.includes("@admin") ? <Scanner3 /> : <Navigate to="/" />}
            />  
            <Route
              path="/requests"
              element={user?.email?.includes("@admin") ? <Requests /> : <Navigate to="/" />}
            />
              <Route
              path="/damaged-assets"
              element={user?.email?.includes("@admin") ? <DamagedAssets /> : <Navigate to="/" />}
            />
            <Route
              path="/admin-delete-history"
              element={user?.email?.includes("@admin") ? <AdminDeleteHistory /> : <Navigate to="/" />}
            />

            <Route
              path="/user-delete-history"
              element={user?.email?.includes("@admin") ? <UserDeleteHistory /> : <Navigate to="/" />}
            />


            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
