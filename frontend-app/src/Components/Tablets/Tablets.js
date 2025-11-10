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

  // ✅ Individual field states
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [processor, setProcessor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [displaySize, setDisplaySize] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [simSupport, setSimSupport] = useState("");
  const [imeiNumber, setImeiNumber] = useState("");
  const [networkType, setNetworkType] = useState("");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lastServicedDate, setLastServicedDate] = useState("");

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

  // ✅ Real-time duplicate check for AssetTag
  const handleAssetTagChange = async (value) => {
    setAssetTag(value);
    if (!value.trim()) {
      setAssetError("");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/check-duplicate?assetTag=${value}`);
      setAssetError(res.data.exists ? "Asset number already exists" : "");
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

    // ✅ IMEI validation only if Cellular
    if (simSupport === "Wi-Fi + Cellular" && !imeiNumber.trim()) {
      alert("IMEI number is required for tablets with cellular support.");
      return;
    }

    const tabletData = {
      brand,
      model,
      assetTag,
      purchaseDate,
      processor,
      ram,
      storage,
      displaySize,
      batteryCapacity,
      simSupport,
      imeiNumber,
      networkType,
      location,
      remarks,
      lastServicedDate,
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, tabletData);
        alert("Tablet updated successfully!");
      } else {
        await axios.post(API_URL, tabletData);
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
    setBrand(tablet.brand);
    setModel(tablet.model);
    setAssetTag(tablet.assetTag);
    setPurchaseDate(tablet.purchaseDate?.split("T")[0] || "");
    setProcessor(tablet.processor);
    setRam(tablet.ram);
    setStorage(tablet.storage);
    setDisplaySize(tablet.displaySize);
    setBatteryCapacity(tablet.batteryCapacity);
    setSimSupport(tablet.simSupport);
    setImeiNumber(tablet.imeiNumber || "");
    setNetworkType(tablet.networkType);
    setLocation(tablet.location);
    setRemarks(tablet.remarks || "");
    setLastServicedDate(tablet.lastServicedDate?.split("T")[0] || "");
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
    setBrand("");
    setModel("");
    setAssetTag("");
    setPurchaseDate("");
    setProcessor("");
    setRam("");
    setStorage("");
    setDisplaySize("");
    setBatteryCapacity("");
    setSimSupport("");
    setImeiNumber("");
    setNetworkType("");
    setLocation("");
    setRemarks("");
    setLastServicedDate("");
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
            {/* Basic fields */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="form-control"
              />
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
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Processor</label>
              <input
                type="text"
                value={processor}
                onChange={(e) => setProcessor(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">RAM</label>
              <input
                type="text"
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Storage</label>
              <input
                type="text"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Display Size</label>
              <input
                type="text"
                value={displaySize}
                onChange={(e) => setDisplaySize(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Battery Capacity</label>
              <input
                type="text"
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(e.target.value)}
                className="form-control"
              />
            </div>

            {/* ✅ SIM Support Dropdown */}
            <div className="col-md-4 mb-3">
              <label className="form-label">SIM Support</label>
              <select
                className="form-select"
                value={simSupport}
                onChange={(e) => {
                  const value = e.target.value;
                  setSimSupport(value);
                  if (value === "Wi-Fi Only") setImeiNumber("");
                }}
              >
                <option value="">-- Select --</option>
                <option value="Wi-Fi Only">Wi-Fi Only</option>
                <option value="Wi-Fi + Cellular">Wi-Fi + Cellular</option>
              </select>
            </div>

            {/* ✅ Conditionally show IMEI */}
            {simSupport === "Wi-Fi + Cellular" && (
              <div className="col-md-4 mb-3">
                <label className="form-label">IMEI Number</label>
                <input
                  type="text"
                  value={imeiNumber}
                  onChange={(e) => setImeiNumber(e.target.value)}
                  className="form-control"
                  placeholder="Enter IMEI Number"
                />
              </div>
            )}

            <div className="col-md-4 mb-3">
              <label className="form-label">Network Type</label>
              <input
                type="text"
                value={networkType}
                onChange={(e) => setNetworkType(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Last Serviced Date</label>
              <input
                type="date"
                value={lastServicedDate}
                onChange={(e) => setLastServicedDate(e.target.value)}
                className="form-control"
              />
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
              <th>SIM Support</th>
              <th>Asset Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tablets.map((tablet, idx) => (
              <tr key={tablet.id}>
                <td>{idx + 1}</td>
                <td>{tablet.brand}</td>
                <td>{tablet.model}</td>
                <td>{tablet.simSupport}</td>
                <td>{tablet.assetTag}</td>
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
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(tablet)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tablet.id)}>
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
                    ? value.name || JSON.stringify(value)
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

export default Tablets;
