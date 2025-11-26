// Components/Inventory/Inventory.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css"; // optional, below I give a tiny stylesheet

function Inventory({ closeMenu }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5083/api/assets");
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // listen for the event dispatched by AdminPanel after adding/removing assets
    window.addEventListener("inventoryUpdated", fetchAssets);
    return () => window.removeEventListener("inventoryUpdated", fetchAssets);
  }, []);

  const goToAsset = (name) => {
    if (!name) return;
    // produce route like: "/laptops" or "/tablets" or fallback to "/assetnamewithoutspaces"
    const slug = name.toLowerCase().trim();
    let route = `/${slug.replace(/\s+/g, "")}`; // e.g. "Laptop Devices" -> /laptopdevices

    // common mapping convenience:
    if (slug.includes("laptop")) route = "/laptops";
    else if (slug.includes("mobile")) route = "/mobiles";
    else if (slug.includes("tablet")) route = "/tablets";
    else if (slug.includes("desktop")) route = "/desktops";
    else if (slug.includes("scanner")) route = "/scanners";
    else if (slug.includes("printer")) route = "/printers";

    navigate(route);
    if (typeof closeMenu === "function") closeMenu();
  };

  return (
    <li className="nav-item hover-dropdown">
      <span className="nav-link dropdown-toggle-link no-caret">Inventory</span>

      <div className="dropdown-menu bg-black inventory-dropdown">
        {loading ? (
          <div className="dropdown-item text-muted">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="dropdown-item text-muted">No assets found</div>
        ) : (
          assets.map((a) => (
            <button
              key={a.id}
              className="dropdown-item inventory-item"
              onClick={() => goToAsset(a.name)}
              type="button"
            >
              {a.name}
              
            </button>
          ))
        )}
      </div>
    </li>
  );
}

export default Inventory;