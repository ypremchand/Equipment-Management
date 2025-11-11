import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Tablets() {
  const [tablets, setTablets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTablet, setSelectedTablet] = useState(null);

  // Pagination + search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const pageSize = 5;

  const API_URL = "http://localhost:5083/api/tablets";

  // ✅ Form fields
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    assetTag: "",
    purchaseDate: "",
    processor: "",
    ram: "",
    storage: "",
    displaySize: "",
    batteryCapacity: "",
    simSupport: "",
    imeiNumber: "",
    networkType: "",
    location: "",
    remarks: "",
    lastServicedDate: "",
  });

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Fetch tablets (with pagination + search)
  const fetchTablets = async (currentPage = 1, searchText = "") => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(
          searchText.trim()
        )}`
      );

      if (res.data?.data) {
        setTablets(res.data.data);
        setTotalPages(res.data.totalPages);
        setPage(res.data.currentPage);
      } else setTablets([]);
    } catch (error) {
      console.error("Error fetching tablets:", error);
      setTablets([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search with debounce
  useEffect(() => {
    const delay = setTimeout(() => fetchTablets(1, searchInput), 400);
    return () => clearTimeout(delay);
  }, [searchInput]);

  useEffect(() => {
    fetchTablets(page, searchInput);
  }, [page,searchInput]);

  // ✅ Duplicate Asset Tag check
  const handleAssetTagChange = async (value) => {
    setFormData((prev) => ({ ...prev, assetTag: value }));
    if (!value.trim()) return setAssetError("");
    try {
      const res = await axios.get(`${API_URL}/check-duplicate?assetTag=${value}`);
      setAssetError(res.data.exists ? "Asset number already exists" : "");
    } catch (error) {
      console.error("Error checking asset tag:", error);
    }
  };

  // ✅ Submit (Add/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (assetError) return alert("Please fix errors before saving.");

    const required = [
      "brand",
      "model",
      "assetTag",
      "purchaseDate",
      "processor",
      "ram",
      "storage",
      "location",
    ];

    if (required.some((f) => !formData[f]?.trim())) {
      alert("Please fill all required fields.");
      return;
    }

    // IMEI validation for SIM models
    if (formData.simSupport === "Wi-Fi + Cellular" && !formData.imeiNumber.trim()) {
      alert("IMEI number required for tablets with SIM support.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...formData });
        alert("✅ Tablet updated successfully!");
      } else {
        await axios.post(API_URL, formData);
        alert("✅ Tablet added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchTablets(page, searchInput);
    } catch (error) {
      console.error("Error saving tablet:", error);
      alert(error.response?.data?.message || "❌ Failed to save tablet");
    }
  };

  // ✅ Edit
  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({
      brand: t.brand || "",
      model: t.model || "",
      assetTag: t.assetTag || "",
      purchaseDate: t.purchaseDate?.split("T")[0] || "",
      processor: t.processor || "",
      ram: t.ram || "",
      storage: t.storage || "",
      displaySize: t.displaySize || "",
      batteryCapacity: t.batteryCapacity || "",
      simSupport: t.simSupport || "",
      imeiNumber: t.imeiNumber || "",
      networkType: t.networkType || "",
      location: t.location || "",
      remarks: t.remarks || "",
      lastServicedDate: t.lastServicedDate?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tablet?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("🗑️ Tablet deleted successfully!");
      fetchTablets(page, searchInput);
    } catch (error) {
      console.error("Error deleting tablet:", error);
      alert("❌ Failed to delete tablet");
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      brand: "",
      model: "",
      assetTag: "",
      purchaseDate: "",
      processor: "",
      ram: "",
      storage: "",
      displaySize: "",
      batteryCapacity: "",
      simSupport: "",
      imeiNumber: "",
      networkType: "",
      location: "",
      remarks: "",
      lastServicedDate: "",
    });
    setAssetError("");
  };

  // Pagination buttons
  const nextPage = () => page < totalPages && setPage((p) => p + 1);
  const prevPage = () => page > 1 && setPage((p) => p - 1);

  return (
    <div
      className="tablets-page container-fluid mt-4 mb-5 px-2"
      style={{
        maxWidth: "100vw",
        overflowX: "hidden",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <h3 className="text-center mb-4">📲 Tablets</h3>

      {/* ✅ Search */}
      <div className="row justify-content-center mb-3 mx-0">
        <div className="col-12 col-sm-10 col-md-6 px-2">
          <input
            type="text"
            placeholder="🔍 Search tablets..."
            className="form-control w-100"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {!showForm && (
        <div className="text-center mb-3">
          <button
            className="btn btn-success px-3 px-sm-4 py-2 w-sm-auto"
            onClick={() => setShowForm(true)}
          >
            ➕ Add New Tablet
          </button>
        </div>
      )}

      {/* ✅ Tablet Form */}
      {showForm && (
        <form className="card p-3 p-sm-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h5 className="mb-3 text-center fw-bold">
            {editingId ? "✏️ Edit Tablet" : "🆕 Add Tablet"}
          </h5>

          <div className="row g-3 mx-0">
            {[
              ["brand", "Brand *"],
              ["model", "Model *"],
              ["assetTag", "Asset Tag *"],
              ["purchaseDate", "Purchase Date *", "date"],
              ["processor", "Processor *"],
              ["ram", "RAM *"],
              ["storage", "Storage *"],
              ["displaySize", "Display Size"],
              ["batteryCapacity", "Battery Capacity"],
              ["simSupport", "SIM Support"],
              ["imeiNumber", "IMEI Number"],
              ["networkType", "Network Type"],
              ["location", "Location *"],
              ["remarks", "Remarks"],
              ["lastServicedDate", "Last Serviced Date", "date"],
            ].map(([name, label, type = "text"]) => (
              <div key={name} className="col-12 col-sm-6 col-md-4 px-2">
                <label className="form-label small fw-semibold">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={
                    name === "assetTag"
                      ? (e) => handleAssetTagChange(e.target.value)
                      : handleChange
                  }
                  className={`form-control ${
                    name === "assetTag" && assetError ? "is-invalid" : ""
                  }`}
                  required={label.includes("*")}
                />
                {name === "assetTag" && assetError && (
                  <div className="invalid-feedback">{assetError}</div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <button
              type="submit"
              className="btn btn-primary me-2 px-3 px-sm-4 py-2 mb-2 mb-sm-0 w-sm-auto"
              disabled={!!assetError}
            >
              {editingId ? "Update Tablet" : "Save Tablet"}
            </button>
            <button
              type="button"
              className="btn btn-secondary px-3 px-sm-4 py-2 w-sm-auto"
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

      {/* ✅ Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : tablets.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Asset Tag</th>
                  <th>Processor</th>
                  <th>RAM</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tablets.map((t, i) => (
                  <tr key={t.id}>
                    <td>{(page - 1) * pageSize + i + 1}</td>
                    <td>{t.brand}</td>
                    <td>{t.model}</td>
                    <td>{t.assetTag}</td>
                    <td>{t.processor}</td>
                    <td>{t.ram}</td>
                    <td className="d-flex flex-wrap justify-content-center gap-2">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => {
                          setSelectedTablet(t);
                          setShowModal(true);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEdit(t)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(t.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination */}
                <div className="d-flex justify-content-center mt-3">
            <button
              className="btn btn-outline-primary me-2"
              disabled={page === 1}
              onClick={prevPage}
            >
              ◀ Prev
            </button>
            <span className="align-self-center">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-outline-primary ms-2"
              disabled={page === totalPages}
              onClick={nextPage}
            >
              Next ▶
            </button>
          </div>
        </>
      ) : (
        <p className="text-center">No tablets found.</p>
      )}

      {/* ✅ Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} scrollable centered>
        <Modal.Header closeButton>
          <Modal.Title>Tablet Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedTablet &&
            Object.entries(selectedTablet).map(([k, v]) => (
              <p key={k} className="mb-1">
                <strong className="text-capitalize">{k}:</strong>{" "}
                {typeof v === "object" ? JSON.stringify(v) : v?.toString() || "-"}
              </p>
            ))}
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

export default Tablets;
