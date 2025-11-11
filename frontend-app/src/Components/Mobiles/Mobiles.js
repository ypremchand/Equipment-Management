import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

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
    remarks: "",
    lastServicedDate: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const [searchInput, setSearchInput] = useState("");

  const API_URL = "http://localhost:5083/api/mobiles";

  // ✅ Fetch mobiles (pagination + search)
  const fetchMobiles = async (currentPage = 1, searchText = "") => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(
          searchText.trim()
        )}`
      );

      if (res.data && Array.isArray(res.data.data)) {
        setMobiles(res.data.data);
        setTotalPages(res.data.totalPages);
        setPage(res.data.currentPage);
      } else setMobiles([]);
    } catch (error) {
      console.error("Error fetching Mobiles:", error);
      setMobiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchMobiles(1, searchInput), 400);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  useEffect(() => {
    fetchMobiles(page, searchInput);
  }, [page, searchInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "assetTag") handleAssetTagChange(value);
  };

  const handleAssetTagChange = async (value) => {
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
      fetchMobiles(page, searchInput);
    } catch (error) {
      console.error("Error saving mobile:", error);
      alert(error.response?.data?.message || "Failed to save mobile");
    }
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mobile?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Mobile deleted successfully!");
      fetchMobiles(page, searchInput);
    } catch (error) {
      console.error("Error deleting mobile:", error);
      alert("Failed to delete mobile");
    }
  };

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
      remarks: "",
      lastServicedDate: "",
    });
    setAssetError("");
    setShowForm(false);
  };

  return (
    <div
      className="mobiles-page container-fluid mt-4 mb-5 px-2"
      style={{
        maxWidth: "100vw",
        overflowX: "hidden",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <h3 className="text-center mb-4">📱 Mobiles</h3>

      {/* ✅ Search */}
      <div className="row justify-content-center mb-3 mx-0">
        <div className="col-12 col-sm-10 col-md-6 px-2">
          <input
            type="text"
            placeholder="🔍 Search Mobiles..."
            className="form-control w-100"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {!showForm && (
        <div className="text-center mb-3">
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            ➕ Add New Mobile
          </button>
        </div>
      )}

      {showForm && (
        <form className="card p-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h5 className="mb-3 text-center fw-bold">
            {editingId ? "✏️ Edit Mobile" : "🆕 Add Mobile"}
          </h5>
          <div className="row">
            {Object.keys(form).map((key) => (
              <div className="col-md-4 mb-3" key={key}>
                <label className="form-label text-capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
                <input
                  type={key.toLowerCase().includes("date") ? "date" : "text"}
                  name={key}
                  value={form[key] || ""}
                  onChange={handleChange}
                  className={`form-control ${key === "assetTag" && assetError ? "is-invalid" : ""}`}
                />
                {key === "assetTag" && assetError && (
                  <div className="invalid-feedback">{assetError}</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <button type="submit" className="btn btn-primary me-2" disabled={!!assetError}>
              {editingId ? "Update Mobile" : "Save Mobile"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ✅ Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : mobiles.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>IMEI</th>
                  <th>Processor</th>
                  <th>RAM</th>
                  <th>Storage</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mobiles.map((mobile, idx) => (
                  <tr key={mobile.id}>
                    <td>{(page - 1) * pageSize + idx + 1}</td>
                    <td>{mobile.brand}</td>
                    <td>{mobile.model}</td>
                    <td>{mobile.imeiNumber}</td>
                    <td>{mobile.processor}</td>
                    <td>{mobile.ram}</td>
                    <td>{mobile.storage}</td>
                    <td>{mobile.location}</td>
                    <td>
                      <button
                        className="btn btn-info btn-sm me-2"
                        onClick={() => {
                          setSelectedMobile(mobile);
                          setShowModal(true);
                        }}
                      >
                        View
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
          </div>

          {/* ✅ Unified Pagination */}
          <div className="d-flex justify-content-center align-items-center mt-4 gap-3 flex-wrap">
            <Button variant="dark" className="px-3 py-1" disabled={page === 1} onClick={() => setPage(page - 1)}>
              ◀ Previous
            </Button>
            <span className="fw-semibold text-dark">
              Page {page} of {totalPages}
            </span>
            <Button variant="dark" className="px-3 py-1" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next ▶
            </Button>
          </div>
        </>
      ) : (
        <p className="text-center">No mobiles found.</p>
      )}

      {/* ✅ Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mobile Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMobile && (
            <div>
              {Object.entries(selectedMobile).map(([key, value]) => (
                <p key={key}>
                  <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
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

      <div className="text-center mt-4">
        <Link to="/adminpanel" className="btn btn-outline-dark px-3 px-sm-4 py-2 w-sm-auto">
          ⬅ Back to Admin Panel
        </Link>
      </div>
    </div>
  );
}

export default Mobiles;
