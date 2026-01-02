import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css"

function AdminPanel() {
  const [asset, setAsset] = useState("");
  // const [assetQuantity, setAssetQuantity] = useState(""); // still exists, used internally
  const [assets, setAssets] = useState([]);
  const [assetPreCode, setAssetPreCode] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [preCodeError, setPreCodeError] = useState("");
  const [isPreCodeManual, setIsPreCodeManual] = useState(false);

  const ASSETS_API = "http://localhost:5083/api/assets";
  const LOCATIONS_API = "http://localhost:5083/api/locations";

  // GET LOGGED-IN ADMIN
  const admin = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const res = await axios.get(ASSETS_API);
      setAssets(res.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await axios.get(LOCATIONS_API);
      setLocations(res.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchLocations();
  }, []);


  const getAssetRoute = (name) => {
    if (!name) return "/";

    const slug = name.toLowerCase();

    if (slug.includes("laptop")) return "/laptops";
    if (slug.includes("mobile")) return "/mobiles";
    if (slug.includes("tablet")) return "/tablets";
    if (slug.includes("desktop")) return "/desktops";
    if (slug.includes("printer")) return "/printers";
    if (slug.includes("scanner1")) return "/scanner1";
    if (slug.includes("scanner2")) return "/scanner2";
    if (slug.includes("scanner3")) return "/scanner3";
    if (slug.includes("barcode")) return "/barcodes";
    return "/";
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();

    if (!asset.trim()) {
      setPreCodeError("Asset name is required.");
      return;
    }
    try {
      if (editingAssetId) {
        await axios.put(`${ASSETS_API}/${editingAssetId}`, {
          id: editingAssetId,
          name: asset,
          preCode: assetPreCode,
        });
        alert("✅ Asset updated successfully!");
      } else {
        await axios.post(ASSETS_API, {
          name: asset,
          preCode: assetPreCode,
        });
        alert("✅ Asset added successfully!");
        window.dispatchEvent(new Event("inventoryUpdated"));
      }

      // reset
      setAsset("");
      setAssetPreCode("");
      setPreCodeError("");
      setEditingAssetId(null);
      setIsPreCodeManual(false);
      fetchAssets();

    } catch (error) {
      if (error.response?.status === 409) {
        // 🔥 SHOW BELOW INPUT (NOT ALERT)
        setPreCodeError(error.response.data.message);
      } else {
        alert("Failed to save asset.");
        console.error(error);
      }
    }
  };

  const generatePreCode = (name) => {
    if (!name) return "";

    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    // 1 Word
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    // 2 Words
    if (words.length === 2) {
      return (
        words[0].substring(0, 2) +
        words[1].substring(0, 1)
      ).toUpperCase();
    }

    // 3 or more words
    return words
      .slice(0, 3)
      .map(w => w[0])
      .join("")
      .toUpperCase();
  };


  const handleDeleteAsset = async (id) => {
    const reason = prompt("Please enter the reason for deleting this asset:");

    if (!reason || reason.trim() === "") {
      alert("Deletion cancelled. Reason is required.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axios.delete(`${ASSETS_API}/${id}`, {
        data: {
          reason,
          adminName: admin?.name || "Unknown Admin"
        }
      });

      fetchAssets();
    } catch (err) {
      console.error(err);
      alert("Failed to delete asset");
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) return alert("Please enter a location name");

    try {
      if (editingLocationId) {
        await axios.put(`${LOCATIONS_API}/${editingLocationId}`, {
          id: editingLocationId,
          name: location,
        });
        alert("✅ Location updated successfully!");
      } else {
        await axios.post(LOCATIONS_API, { name: location });
        alert("✅ Location added successfully!");
      }
      setLocation("");
      setEditingLocationId(null);
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleDeleteLocation = async (id) => {
    const reason = prompt("Please enter the reason for deleting this location:");

    if (!reason || reason.trim() === "") {
      alert("Deletion cancelled. Reason is required.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this location?")) return;

    try {
      await axios.delete(`${LOCATIONS_API}/${id}`, {
        data: {
          reason,
          adminName: admin?.name || "Unknown Admin"
        }
      });
      fetchLocations();
    } catch (err) {
      console.error(err);
      alert("Failed to delete location");
    }
  };
  return (
    <div className="admin-page container mt-4">
      <h3 className="text-center mb-4">Admin Panel</h3>

      <div className="row">
        {/* ====== ASSET SECTION ====== */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm mb-4">
            <h4>{editingAssetId ? "Edit Asset" : "Add Asset"}</h4>
            <form onSubmit={handleAssetSubmit}>
              <div className="mb-3">
                <label htmlFor="asset" className="form-label">
                  Asset Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter asset name..."
                  value={asset}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAsset(value);
                    if (!isPreCodeManual) {
                      setAssetPreCode(generatePreCode(value));
                    }
                    setPreCodeError("");
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Asset PreCode</label>
                <input
                  type="text"
                  className={`form-control ${preCodeError ? "is-invalid" : ""}`}
                  placeholder="Auto-generated PreCode"
                  value={assetPreCode}
                  onChange={(e) => {
                    setAssetPreCode(e.target.value.toUpperCase());
                    setIsPreCodeManual(true);
                    setPreCodeError("");
                  }}
                />
              </div>
              {preCodeError && (
                <div className="text-danger mt-1 fw-semibold">
                  {preCodeError}
                </div>
              )}

              <button type="submit" className="btn btn-primary me-2">
                {editingAssetId ? "Update" : "Add Asset"}
              </button>
              {editingAssetId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAsset("");
                    setAssetPreCode("");
                    setPreCodeError("");
                    setEditingAssetId(null);
                    setIsPreCodeManual(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          <h5>Existing Assets</h5>
          {loadingAssets ? (
            <div className="text-center my-3">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <table className="table table-bordered text-center">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asset Name</th>
                  <th>Available Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>
                      <Link to={getAssetRoute(item.name)}>
                        {item.name}
                      </Link>
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => {
                          setAsset(item.name);
                          setAssetPreCode(item.preCode || generatePreCode(item.name));
                          setIsPreCodeManual(true);
                          setPreCodeError("");
                          setEditingAssetId(item.id);
                        }}>
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteAsset(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ====== LOCATION SECTION ====== */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm mb-4">
            <h4>{editingLocationId ? "Edit Location" : "Add Location"}</h4>
            <form onSubmit={handleLocationSubmit}>
              <div className="mb-3">
                <label htmlFor="location" className="form-label">
                  Location Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  placeholder="Enter location name..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary me-2">
                {editingLocationId ? "Update" : "Add Location"}
              </button>
              {editingLocationId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setLocation("");
                    setEditingLocationId(null);
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          <h5>Existing Locations</h5>
          {loadingLocations ? (
            <div className="text-center my-3">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <table className="table table-bordered text-center">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Location Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc, i) => (
                  <tr key={loc.id}>
                    <td>{i + 1}</td>
                    <td>{loc.name}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => {
                          setLocation(loc.name);
                          setEditingLocationId(loc.id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteLocation(loc.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;