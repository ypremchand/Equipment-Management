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
  const [assetError, setAssetError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  const API_URL = "http://localhost:5083/api/laptops";

  // ✅ Individual field states
  const [brand, setBrand] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [processor, setProcessor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [graphicsCard, setGraphicsCard] = useState("");
  const [displaySize, setDisplaySize] = useState("");
  const [operatingSystem, setOperatingSystem] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Available");
  const [assignedTo, setAssignedTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lastServicedDate, setLastServicedDate] = useState("");

  // ✅ Fetch laptops
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

  // ✅ Auto-update warranty expiry (+1 year)
  const handlePurchaseDateChange = (value) => {
    setPurchaseDate(value);
    if (value) {
      const purchase = new Date(value);
      const expiry = new Date(purchase);
      expiry.setFullYear(expiry.getFullYear() + 1);
      setWarrantyExpiry(expiry.toISOString().split("T")[0]);
    } else {
      setWarrantyExpiry("");
    }
  };

  // ✅ Real-time duplicate check for AssetTag
  const handleAssetTagChange = async (value) => {
    setAssetTag(value);
    if (value.trim() === "") {
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

  // ✅ Handle Save/Update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assetError) {
      alert("Please fix errors before saving.");
      return;
    }

    const laptopData = {
      brand,
      serialNumber,
      assetTag,
      purchaseDate,
      warrantyExpiry,
      processor,
      ram,
      storage,
      graphicsCard,
      displaySize,
      operatingSystem,
      batteryCapacity,
      location,
      status,
      assignedTo,
      remarks,
      lastServicedDate,
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, laptopData);
        alert("Laptop updated successfully!");
      } else {
        await axios.post(API_URL, laptopData);
        alert("Laptop added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchLaptops();
    } catch (error) {
      console.error("Error saving laptop:", error);
      alert(error.response?.data?.message || "Failed to save laptop");
    }
  };

  // ✅ Edit existing laptop
  const handleEdit = (laptop) => {
    setEditingId(laptop.id);
    setBrand(laptop.brand);
    setSerialNumber(laptop.serialNumber);
    setAssetTag(laptop.assetTag);
    setPurchaseDate(laptop.purchaseDate?.split("T")[0] || "");
    setWarrantyExpiry(laptop.warrantyExpiry?.split("T")[0] || "");
    setProcessor(laptop.processor);
    setRam(laptop.ram);
    setStorage(laptop.storage);
    setGraphicsCard(laptop.graphicsCard);
    setDisplaySize(laptop.displaySize);
    setOperatingSystem(laptop.operatingSystem);
    setBatteryCapacity(laptop.batteryCapacity);
    setLocation(laptop.location);
    setStatus(laptop.status);
    setAssignedTo(laptop.assignedTo);
    setRemarks(laptop.remarks);
    setLastServicedDate(laptop.lastServicedDate?.split("T")[0] || "");
    setAssetError("");
    setShowForm(true);
  };

  // ✅ Delete laptop
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

  // ✅ Reset Form
  const resetForm = () => {
    setEditingId(null);
    setBrand("");
    setSerialNumber("");
    setAssetTag("");
    setPurchaseDate("");
    setWarrantyExpiry("");
    setProcessor("");
    setRam("");
    setStorage("");
    setGraphicsCard("");
    setDisplaySize("");
    setOperatingSystem("");
    setBatteryCapacity("");
    setLocation("");
    setStatus("Available");
    setAssignedTo("");
    setRemarks("");
    setLastServicedDate("");
    setAssetError("");
  };

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
            {/* Each input field uses its own state */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Brand</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Serial Number</label>
              <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Asset Tag</label>
              <input
                type="text"
                value={assetTag}
                onChange={(e) => handleAssetTagChange(e.target.value)}
                className={`form-control ${assetError ? "is-invalid" : ""}`}
              />
              {assetError && <div className="invalid-feedback">{assetError}</div>}
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={(e) => handlePurchaseDateChange(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Warranty Expiry</label>
              <input type="date" value={warrantyExpiry} readOnly className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Processor</label>
              <input type="text" value={processor} onChange={(e) => setProcessor(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">RAM</label>
              <input type="text" value={ram} onChange={(e) => setRam(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Storage</label>
              <input type="text" value={storage} onChange={(e) => setStorage(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Graphics Card</label>
              <input type="text" value={graphicsCard} onChange={(e) => setGraphicsCard(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Display Size</label>
              <input type="text" value={displaySize} onChange={(e) => setDisplaySize(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Operating System</label>
              <input type="text" value={operatingSystem} onChange={(e) => setOperatingSystem(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Battery Capacity</label>
              <input type="text" value={batteryCapacity} onChange={(e) => setBatteryCapacity(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                <option>Available</option>
                <option>Assigned</option>
                <option>Under Repair</option>
                <option>Disposed</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Assigned To</label>
              <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Remarks</label>
              <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="form-control" />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Last Serviced Date</label>
              <input type="date" value={lastServicedDate} onChange={(e) => setLastServicedDate(e.target.value)} className="form-control" />
            </div>
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

      {/* Table of laptops */}
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
              <th>Asset Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {laptops.map((laptop, idx) => (
              <tr key={laptop.id}>
                <td>{idx + 1}</td>
                <td>{laptop.brand}</td>
                <td>{laptop.assetTag}</td>
                <td>{laptop.status}</td>
                <td>
                  <button
                    className="btn btn-info btn-sm me-2"
                    onClick={() => {
                      setSelectedLaptop(laptop);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(laptop)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(laptop.id)}>
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

      {/* Details Modal */}
   <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Laptop Details</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedLaptop && (
      <div>
        {Object.entries(selectedLaptop).map(([key, value]) => (
          <p key={key}>
            <strong className="text-capitalize">{key}: </strong>
            {typeof value === "object" && value !== null
              ? value.name || JSON.stringify(value) // ✅ Show asset name or stringify object
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

export default Laptops;
