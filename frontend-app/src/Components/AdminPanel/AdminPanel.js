import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminPanel() {
  const [asset, setAsset] = useState("");
  // const [assetQuantity, setAssetQuantity] = useState(""); // still exists, used internally
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [editingAssetId, setEditingAssetId] = useState(null);

  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [editingLocationId, setEditingLocationId] = useState(null);

  const ASSETS_API = "http://localhost:5083/api/assets";
  const LOCATIONS_API = "http://localhost:5083/api/locations";

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

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!asset.trim()) return alert("Please enter an asset name");

    try {
      if (editingAssetId) {
        await axios.put(`${ASSETS_API}/${editingAssetId}`, {
          id: editingAssetId,
          name: asset,
        });
        alert("Asset updated successfully!");
      } else {
        // ✅ Prevent duplicate assets (case-insensitive)
        const exists = assets.some(a => a.name.toLowerCase() === asset.toLowerCase());
        if (exists) {
          alert("Asset already exists!");
          return;
        }

        await axios.post(ASSETS_API, { name: asset });
        alert("Asset added successfully!");

        // ✅ Notify Navbar to refresh Inventory
        window.dispatchEvent(new Event("inventoryUpdated"));


      }
      setAsset("");
      setEditingAssetId(null);
      fetchAssets();
    } catch (error) {
      console.error("Error saving asset:", error);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    await axios.delete(`${ASSETS_API}/${id}`);
    fetchAssets();
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
        alert("Location updated successfully!");
      } else {
        await axios.post(LOCATIONS_API, { name: location });
        alert("Location added successfully!");
      }
      setLocation("");
      setEditingLocationId(null);
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    await axios.delete(`${LOCATIONS_API}/${id}`);
    fetchLocations();
  };

  return (
    <div className="container mt-4">
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
                  id="asset"
                  placeholder="Enter asset name..."
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary me-2">
                {editingAssetId ? "Update" : "Add Asset"}
              </button>
              {editingAssetId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAsset("");
                    setEditingAssetId(null);
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
  <Link
    to={`/${item.name.toLowerCase().replace(/\s+/g, "")}`} // ✅ Dynamic path
    className="text-decoration-none"
  >
    {item.name}
  </Link>
</td>

                    <td>{item.quantity}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => {
                          setAsset(item.name);
                          setEditingAssetId(item.id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteAsset(item.id)}
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
