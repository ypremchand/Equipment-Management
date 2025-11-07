import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Tablets() {
  const [tablets, setTablets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTablet, setSelectedTablet] = useState(null);

  const [form, setForm] = useState({
    brand: "",
    model: "",
    serialNumber: "",
    assetTag: "",
    purchaseDate: "",
    processor: "",
    ram: "",
    storage: "",
    displaySize: "",
    batteryCapacity: "",
    operatingSystem: "",
    simSupport: "",
    networkType: "",
    location: "",
    status: "Available",
    assignedTo: "",
    remarks: "",
    lastServicedDate: "",
  });

  const API_URL = "http://localhost:5083/api/tablets";

  // ✅ Fetch tablets
  const fetchTablets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setTablets(res.data);
    } catch (error) {
      console.error("Error fetching tablets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablets();
  }, []);

  // ✅ Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "assetTag") {
      handleAssetTagChange(value);
    }
  };

  // ✅ Real-time duplicate check for AssetTag
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

  // ✅ Handle submit (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assetError) {
      alert("Please fix the asset tag issue before saving.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        alert("Tablet updated successfully!");
      } else {
        await axios.post(API_URL, form);
        alert("Tablet added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchTablets();
    } catch (error) {
      console.error("Error saving tablet:", error);
      alert(error.response?.data?.message || "Failed to save tablet");
    }
  };

  // ✅ Edit
  const handleEdit = (tablet) => {
    setEditingId(tablet.id);
    setForm({
      ...tablet,
      purchaseDate: tablet.purchaseDate?.split("T")[0] || "",
      lastServicedDate: tablet.lastServicedDate?.split("T")[0] || "",
    });
    setAssetError("");
    setShowForm(true);
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tablet?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Tablet deleted successfully!");
      fetchTablets();
    } catch (error) {
      console.error("Error deleting tablet:", error);
      alert("Failed to delete tablet");
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setEditingId(null);
    setForm({
      brand: "",
      model: "",
      serialNumber: "",
      assetTag: "",
      purchaseDate: "",
      processor: "",
      ram: "",
      storage: "",
      displaySize: "",
      batteryCapacity: "",
      operatingSystem: "",
      simSupport: "",
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
      <h3 className="text-center mb-4">Tablet Inventory</h3>

      {!showForm && (
        <div className="text-center mb-3">
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            Add New Tablet
          </button>
        </div>
      )}

      {showForm && (
        <form className="card p-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h4>{editingId ? "Edit Tablet" : "Add Tablet"}</h4>
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
                    <option>Under Repair</option>
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

      {/* ✅ Tablets Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : tablets.length > 0 ? (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Asset Tag</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tablets.map((tablet, idx) => (
              <tr key={tablet.id}>
                <td>{idx + 1}</td>
                <td>{tablet.brand}</td>
                <td>{tablet.model}</td>
                <td>{tablet.assetTag}</td>
                <td>{tablet.status}</td>
                <td>
                  <button
                    className="btn btn-info btn-sm me-2"
                    onClick={() => {
                      setSelectedTablet(tablet);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEdit(tablet)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(tablet.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No tablets found.</p>
      )}

      {/* ✅ Tablet Details Modal */}
     <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Tablet Details</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedTablet && (
      <div>
        {Object.entries(selectedTablet).map(([key, value]) => (
          <p key={key}>
            <strong className="text-capitalize">{key}: </strong>
            {typeof value === "object" && value !== null
              ? // ✅ If it's the linked Asset object, show its Name
                value.name || JSON.stringify(value)
              : // ✅ Otherwise just display normally
                value?.toString() || "-"}
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

export default Tablets;
