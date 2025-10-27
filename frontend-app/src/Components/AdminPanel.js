import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminPanel() {
  const [asset, setAsset] = useState("");
  const [quantity, setQuantity] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const API_URL = "http://localhost:5083/api/assets";

  // Fetch all assets
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setAssets(res.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Add or Update Asset
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!asset.trim()) {
      alert("Please enter an asset name");
      return;
    }

    const qty = Number(quantity);
    if (quantity === "" || isNaN(qty) || qty < 0) {
      alert("Quantity must be a non-negative number");
      return;
    }

    try {
      if (editingId) {
        // Update existing asset
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, name: asset, quantity: qty });
        alert("Asset updated successfully!");
      } else {
        // Add new asset
        await axios.post(API_URL, { name: asset, quantity: qty });
        alert("Asset added successfully!");
      }
      setAsset("");
      setQuantity("");
      setEditingId(null);
      fetchAssets();
    } catch (error) {
      console.error("Error saving asset:", error);
      alert("Failed to save asset");
    }
  };

  // Edit Asset
  const handleEdit = (assetItem) => {
    setAsset(assetItem.name);
    setQuantity(assetItem.quantity.toString());
    setEditingId(assetItem.id);
  };

  // Delete Asset
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Asset deleted successfully!");
      fetchAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete asset");
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Admin Panel</h3>

      {/* Add/Edit Form */}
      <div className="card p-4 shadow-sm mb-4">
        <h4>{editingId ? "Edit Asset" : "Add Asset"}</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="asset" className="form-label">Asset Name</label>
            <input
              type="text"
              className="form-control"
              id="asset"
              placeholder="Enter asset name..."
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="quantity" className="form-label">Quantity</label>
            <input
              type="number"
              className="form-control"
              id="quantity"
              placeholder="Enter quantity..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
            />
          </div>

          <button type="submit" className="btn btn-primary me-2">
            {editingId ? "Update Asset" : "Add Asset"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setAsset("");
                setQuantity("");
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Assets Table */}
      <h4>Existing Assets</h4>
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : assets.length > 0 ? (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Asset Name</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <Link
                    to={
                      item.name.toLowerCase() === "laptop" ? "/laptops" :
                      item.name.toLowerCase() === "mobiles" ? "/mobiles" :
                      item.name.toLowerCase() === "tablets" ? "/tablets" :
                      "/" // fallback route
                    }
                    className="text-decoration-none"
                  >
                    {item.name}
                  </Link>
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    className="form-control form-control-sm"
                    readOnly
                  />
                </td>
                <td>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No assets found.</p>
      )}
    </div>
  );
}

export default AdminPanel;
