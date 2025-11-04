import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Laptops() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    brand: "",
    serialNumber: "",
    assetTag: "",
    purchaseDate: "",
    warrantyExpiry: "",
    processor: "",
    ram: "",
    storage: "",
    graphicsCard: "",
    displaySize: "",
    operatingSystem: "",
    batteryCapacity: "",
    location: "",
    status: "Available",
    assignedTo: "",
    remarks: "",
    lastServicedDate: ""
  });

  const API_URL = "http://localhost:5083/api/laptops";

  // Fetch laptops
  const fetchLaptops = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setLaptops(res.data);
    } catch (error) {
      console.error("Error fetching laptops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaptops();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Add / Update Laptop
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        alert("Laptop updated successfully!");
      } else {
        await axios.post(API_URL, form);
        alert("Laptop added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchLaptops();
    } catch (error) {
      console.error("Error saving laptop:", error);
      alert("Failed to save laptop");
    }
  };

  // Edit Laptop
  const handleEdit = (laptop) => {
    setEditingId(laptop.id);
    setForm({
      ...laptop,
      purchaseDate: laptop.purchaseDate?.split("T")[0] || "",
      warrantyExpiry: laptop.warrantyExpiry?.split("T")[0] || "",
      lastServicedDate: laptop.lastServicedDate?.split("T")[0] || ""
    });
    setShowForm(true);
  };

  // Delete Laptop
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this laptop?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Laptop deleted successfully!");
      fetchLaptops();
    } catch (error) {
      console.error("Error deleting laptop:", error);
      alert("Failed to delete laptop");
    }
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setForm({
      brand: "",
      serialNumber: "",
      assetTag: "",
      purchaseDate: "",
      warrantyExpiry: "",
      processor: "",
      ram: "",
      storage: "",
      graphicsCard: "",
      displaySize: "",
      operatingSystem: "",
      batteryCapacity: "",
      location: "",
      status: "Available",
      assignedTo: "",
      remarks: "",
      lastServicedDate: ""
    });
  };

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Laptop Inventory</h3>

      {!showForm && (
        <div className="text-center mb-3">
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            Add New Laptop
          </button>
        </div>
      )}

      {showForm && (
        <form className="card p-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h4>{editingId ? "Edit Laptop" : "Add Laptop"}</h4>
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
                    className="form-control"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <button type="submit" className="btn btn-primary me-2">
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

      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : laptops.length > 0 ? (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Brand</th>
              <th>Serial Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {laptops.map((laptop, idx) => (
              <tr key={laptop.id}>
                <td>{idx + 1}</td>
                <td>{laptop.brand}</td>
                <td>{laptop.serialNumber}</td>
                <td>{laptop.status}</td>
                <td>
                  <button
                    className="btn btn-info btn-sm me-2"
                    onClick={() => {
                      setSelectedLaptop(laptop);
                      setShowModal(true);
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEdit(laptop)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(laptop.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No laptops found.</p>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Laptop Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLaptop && (
            <div>
              {Object.keys(selectedLaptop).map((key) => (
                <p key={key}>
                  <strong className="text-capitalize">{key}: </strong>
                  {selectedLaptop[key]?.toString()}
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

export default Laptops;
