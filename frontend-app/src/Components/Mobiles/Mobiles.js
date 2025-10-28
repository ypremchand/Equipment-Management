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

  // Form fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [imeiNumber, setImeiNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [processor, setProcessor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [displaySize, setDisplaySize] = useState("");
  const [simType, setSimType] = useState("");
  const [networkType, setNetworkType] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Available");
  const [assignedTo, setAssignedTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lastServicedDate, setLastServicedDate] = useState("");

  const API_URL = "http://localhost:5083/api/mobiles";

  // Fetch all mobiles
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

  // Add or Update Mobile
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!brand.trim() || !model.trim() || !imeiNumber.trim()) {
      alert("Brand, Model, and IMEI Number are required");
      return;
    }

    const mobileData = {
      brand,
      model,
      imeiNumber,
      assetTag,
      purchaseDate,
      processor,
      ram,
      storage,
      batteryCapacity,
      displaySize,
      simType,
      networkType,
      location,
      status,
      assignedTo,
      remarks,
      lastServicedDate: lastServicedDate || null,
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...mobileData });
        alert("Mobile updated successfully!");
      } else {
        await axios.post(API_URL, mobileData);
        alert("Mobile added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchMobiles();
    } catch (error) {
      console.error("Error saving mobile:", error);
      alert("Failed to save mobile");
    }
  };

  // Edit
  const handleEdit = (mobile) => {
    setEditingId(mobile.id);
    setBrand(mobile.brand);
    setModel(mobile.model);
    setImeiNumber(mobile.imeiNumber);
    setAssetTag(mobile.assetTag);
    setPurchaseDate(mobile.purchaseDate ? mobile.purchaseDate.split("T")[0] : "");
    setProcessor(mobile.processor);
    setRam(mobile.ram);
    setStorage(mobile.storage);
    setBatteryCapacity(mobile.batteryCapacity);
    setDisplaySize(mobile.displaySize);
    setSimType(mobile.simType);
    setNetworkType(mobile.networkType);
    setLocation(mobile.location);
    setStatus(mobile.status);
    setAssignedTo(mobile.assignedTo);
    setRemarks(mobile.remarks);
    setLastServicedDate(mobile.lastServicedDate ? mobile.lastServicedDate.split("T")[0] : "");
    setShowForm(true);
  };

  // Delete
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

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setBrand("");
    setModel("");
    setImeiNumber("");
    setAssetTag("");
    setPurchaseDate("");
    setProcessor("");
    setRam("");
    setStorage("");
    setBatteryCapacity("");
    setDisplaySize("");
    setSimType("");
    setNetworkType("");
    setLocation("");
    setStatus("Available");
    setAssignedTo("");
    setRemarks("");
    setLastServicedDate("");
  };

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedMobile, setSelectedMobile] = useState(null);

  const handleShowModal = (mobile) => {
    setSelectedMobile(mobile);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedMobile(null);
    setShowModal(false);
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Mobile Inventory</h3>

      {!showForm && (
        <div className="mb-3 text-center">
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            Add New Mobile
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-4 shadow-sm mb-4">
          <h4>{editingId ? "Edit Mobile" : "Add Mobile"}</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Brand</label>
                <input type="text" className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Model</label>
                <input type="text" className="form-control" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">IMEI Number</label>
                <input type="text" className="form-control" value={imeiNumber} onChange={(e) => setImeiNumber(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Asset Tag</label>
                <input type="text" className="form-control" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Purchase Date</label>
                <input type="date" className="form-control" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Processor</label>
                <input type="text" className="form-control" value={processor} onChange={(e) => setProcessor(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">RAM</label>
                <input type="text" className="form-control" value={ram} onChange={(e) => setRam(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Storage</label>
                <input type="text" className="form-control" value={storage} onChange={(e) => setStorage(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Battery Capacity</label>
                <input type="text" className="form-control" value={batteryCapacity} onChange={(e) => setBatteryCapacity(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Display Size</label>
                <input type="text" className="form-control" value={displaySize} onChange={(e) => setDisplaySize(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">SIM Type</label>
                <input type="text" className="form-control" value={simType} onChange={(e) => setSimType(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Network Type</label>
                <input type="text" className="form-control" value={networkType} onChange={(e) => setNetworkType(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Location</label>
                <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Available</option>
                  <option>Assigned</option>
                  <option>Repair</option>
                  <option>Disposed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Assigned To</label>
                <input type="text" className="form-control" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Remarks</label>
                <input type="text" className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Serviced Date</label>
                <input type="date" className="form-control" value={lastServicedDate} onChange={(e) => setLastServicedDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary me-2">
                {editingId ? "Update Mobile" : "Add Mobile"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : mobiles.length > 0 ? (
        <>
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
                    <button className="btn btn-info btn-sm me-2" onClick={() => handleShowModal(mobile)}>
                      View Details
                    </button>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(mobile)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(mobile.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal for Details */}
          <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Mobile Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedMobile && (
                <div>
                  <p><strong>Brand:</strong> {selectedMobile.brand}</p>
                  <p><strong>Model:</strong> {selectedMobile.model}</p>
                  <p><strong>IMEI:</strong> {selectedMobile.imeiNumber}</p>
                  <p><strong>Processor:</strong> {selectedMobile.processor}</p>
                  <p><strong>RAM:</strong> {selectedMobile.ram}</p>
                  <p><strong>Storage:</strong> {selectedMobile.storage}</p>
                  <p><strong>Battery:</strong> {selectedMobile.batteryCapacity}</p>
                  <p><strong>Display:</strong> {selectedMobile.displaySize}</p>
                  <p><strong>SIM Type:</strong> {selectedMobile.simType}</p>
                  <p><strong>Network:</strong> {selectedMobile.networkType}</p>
                  <p><strong>Location:</strong> {selectedMobile.location}</p>
                  <p><strong>Status:</strong> {selectedMobile.status}</p>
                  <p><strong>Assigned To:</strong> {selectedMobile.assignedTo}</p>
                  <p><strong>Remarks:</strong> {selectedMobile.remarks}</p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      ) : (
        <p>No mobiles found.</p>
      )}

      <Link to="/adminpanel" className="btn btn-secondary mt-3">
        Back to Admin Panel
      </Link>
    </div>
  );
}

export default Mobiles;
