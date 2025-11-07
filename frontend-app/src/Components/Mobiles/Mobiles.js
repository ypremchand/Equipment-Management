import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Mobiles() {
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedMobile, setSelectedMobile] = useState(null);

  const [form, setForm] = useState({
    brand: "",
    model: "",
    imeiNumber: "",
    assetTag: "",
    purchaseDate: "",
    processor: "",
    ram: "",
    storage: "",
    batteryCapacity: "",
    displaySize: "",
    simType: "",
    networkType: "",
    location: "",
    status: "Available",
    assignedTo: "",
    remarks: "",
    lastServicedDate: "",
  });

  const API_URL = "http://localhost:5083/api/mobiles";

  // ✅ Fetch mobiles
  const fetchMobiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setMobiles(res.data);
    } catch (error) {
      console.error("Error fetching mobiles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobiles();
  }, []);

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "assetTag") {
      handleAssetTagChange(value);
    }
  };

  // ✅ Real-time AssetTag duplicate validation
  const handleAssetTagChange = async (value) => {
    if (!value.trim()) {
      setAssetError("");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/check-duplicate?assetTag=${value}`);
      if (res.data.exists) {
        setAssetError("Asset number already exists");
      } else {
        setAssetError("");
      }
    } catch (error) {
      console.error("Error checking asset tag:", error);
    }
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assetError) {
      alert("Please fix the asset tag issue before saving.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        alert("Mobile updated successfully!");
      } else {
        await axios.post(API_URL, form);
        alert("Mobile added successfully!");
      }

      resetForm();
      setShowForm(false);
      fetchMobiles();
    } catch (error) {
      console.error("Error saving mobile:", error);
      alert(error.response?.data?.message || "Failed to save mobile");
    }
  };

  // ✅ Edit
  const handleEdit = (mobile) => {
    setEditingId(mobile.id);
    setForm({
      ...mobile,
      purchaseDate: mobile.purchaseDate?.split("T")[0] || "",
      lastServicedDate: mobile.lastServicedDate?.split("T")[0] || "",
    });
    setAssetError("");
    setShowForm(true);
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mobile?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Mobile deleted successfully!");
      fetchMobiles();
    } catch (error) {
      console.error("Error deleting mobile:", error);
      alert("Failed to delete mobile");
    }
  };

  // ✅ Reset
  const resetForm = () => {
    setEditingId(null);
    setForm({
      brand: "",
      model: "",
      imeiNumber: "",
      assetTag: "",
      purchaseDate: "",
      processor: "",
      ram: "",
      storage: "",
      batteryCapacity: "",
      displaySize: "",
      simType: "",
      networkType: "",
      location: "",
      status: "Available",
      assignedTo: "",
      remarks: "",
      lastServicedDate: "",
    });
    setAssetError("");
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Mobile Inventory</h3>

      {!showForm && (
        <div className="text-center mb-3">
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            Add New Mobile
          </button>
        </div>
      )}

      {showForm && (
        <form className="card p-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h4>{editingId ? "Edit Mobile" : "Add Mobile"}</h4>
          <div className="row">
            {Object.keys(form).map((key) => (
              <div className="col-md-4 mb-3" key={key}>
                <label className="form-label text-capitalize">{key}</label>
                {key === "status" ? (
                  <select
                    name={key}
                    className="form-select"
                    value={form[key]}
                    onChange={handleChange}
                  >
                    <option>Available</option>
                    <option>Assigned</option>
                    <option>Repair</option>
                    <option>Disposed</option>
                  </select>
                ) : (
                  <input
                    type={key.toLowerCase().includes("date") ? "date" : "text"}
                    name={key}
                    value={form[key] || ""}
                    onChange={handleChange}
                    className={`form-control ${
                      key === "assetTag" && assetError ? "is-invalid" : ""
                    }`}
                  />
                )}
                {key === "assetTag" && assetError && (
                  <div className="invalid-feedback">{assetError}</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <button type="submit" className="btn btn-primary me-2" disabled={!!assetError}>
              {editingId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : mobiles.length > 0 ? (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Brand</th>
              <th>Model</th>
              <th>IMEI</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mobiles.map((mobile, idx) => (
              <tr key={mobile.id}>
                <td>{idx + 1}</td>
                <td>{mobile.brand}</td>
                <td>{mobile.model}</td>
                <td>{mobile.imeiNumber}</td>
                <td>{mobile.status}</td>
                <td>
                  <button
                    className="btn btn-info btn-sm me-2"
                    onClick={() => {
                      setSelectedMobile(mobile);
                      setShowModal(true);
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEdit(mobile)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(mobile.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No mobiles found.</p>
      )}

      {/* Modal */}
 <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Mobile Details</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedMobile && (
      <div>
        {Object.entries(selectedMobile).map(([key, value]) => (
          <p key={key}>
            <strong className="text-capitalize">{key}: </strong>
            {typeof value === "object" && value !== null
              ? value.name || JSON.stringify(value) // ✅ Show asset name if object
              : value?.toString() || "-"}
          </p>
        ))}
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Close
    </Button>
  </Modal.Footer>
</Modal>


      <Link to="/adminpanel" className="btn btn-secondary mt-3">
        Back to Admin Panel
      </Link>
    </div>
  );
}

export default Mobiles;
