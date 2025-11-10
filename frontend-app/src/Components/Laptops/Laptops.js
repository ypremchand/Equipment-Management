import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Laptops() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  // Search
  const [searchInput, setSearchInput] = useState("");

  const API_URL = "http://localhost:5083/api/laptops";

  // Form fields
  const [formData, setFormData] = useState({
    brand: "",
    modelNumber: "",
    assetTag: "",
    purchaseDate: "",
    processor: "",
    ram: "",
    storage: "",
    graphicsCard: "",
    displaySize: "",
    operatingSystem: "",
    batteryCapacity: "",
    location: "",
    remarks: "",
    lastServicedDate: "",
  });

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Fetch laptops (with search)
  const fetchLaptops = async (currentPage = 1, searchText = "") => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(
          searchText.trim()
        )}`
      );
      if (res.data?.data) {
        setLaptops(res.data.data);
        setTotalPages(res.data.totalPages);
        setPage(res.data.currentPage);
      } else setLaptops([]);
    } catch (error) {
      console.error("Error fetching laptops:", error);
      setLaptops([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Debounced dynamic search
  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchLaptops(1, searchInput), 400);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // ✅ Fetch laptops when page changes
  useEffect(() => {
    fetchLaptops(page, searchInput);
  }, [page, searchInput]);

  // ✅ Check duplicate Asset Tag
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
      "modelNumber",
      "assetTag",
      "purchaseDate",
      "processor",
      "ram",
      "storage",
      "operatingSystem",
      "location",
    ];
    if (required.some((f) => !formData[f]?.trim())) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...formData });
        alert("✅ Laptop updated successfully!");
      } else {
        await axios.post(API_URL, formData);
        alert("✅ Laptop added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchLaptops(page, searchInput);
    } catch (error) {
      console.error("Error saving laptop:", error);
      alert(error.response?.data?.message || "❌ Failed to save laptop");
    }
  };

  // ✅ Edit
  const handleEdit = (l) => {
    setEditingId(l.id);
    setFormData({
      brand: l.brand || "",
      modelNumber: l.modelNumber || "",
      assetTag: l.assetTag || "",
      purchaseDate: l.purchaseDate?.split("T")[0] || "",
      processor: l.processor || "",
      ram: l.ram || "",
      storage: l.storage || "",
      graphicsCard: l.graphicsCard || "",
      displaySize: l.displaySize || "",
      operatingSystem: l.operatingSystem || "",
      batteryCapacity: l.batteryCapacity || "",
      location: l.location || "",
      remarks: l.remarks || "",
      lastServicedDate: l.lastServicedDate?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this laptop?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("🗑️ Laptop deleted successfully!");
      fetchLaptops(page, searchInput);
    } catch (error) {
      console.error("Error deleting laptop:", error);
      alert("❌ Failed to delete laptop");
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      brand: "",
      modelNumber: "",
      assetTag: "",
      purchaseDate: "",
      processor: "",
      ram: "",
      storage: "",
      graphicsCard: "",
      displaySize: "",
      operatingSystem: "",
      batteryCapacity: "",
      location: "",
      remarks: "",
      lastServicedDate: "",
    });
    setAssetError("");
  };

  // ✅ Pagination controls
  const nextPage = () => page < totalPages && setPage((p) => p + 1);
  const prevPage = () => page > 1 && setPage((p) => p - 1);

 return (
  <div
  className="container-fluid mt-4 mb-5 px-2"
  style={{
    maxWidth: "100vw",
    overflowX: "hidden",
    paddingLeft: "10px",
    paddingRight: "10px",
  }}
>

    <h3 className="text-center mb-4">💻 Laptop Inventory</h3>

    {/* ✅ Live Search */}
    <div className="row justify-content-center mb-3 mx-0">
      <div className="col-12 col-sm-10 col-md-6 px-2">
        <input
          type="text"
          placeholder="🔍 Search laptops..."
          className="form-control w-100"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
    </div>

    {!showForm && (
      <div className="text-center mb-3">
        <button className="btn btn-success px-3 px-sm-4 py-2 w-100 w-sm-auto" onClick={() => setShowForm(true)}>
          ➕ Add New Laptop
        </button>
      </div>
    )}

    {/* ✅ Laptop Form */}
    {showForm && (
      <form className="card p-3 p-sm-4 shadow-sm mb-4" onSubmit={handleSubmit}>
        <h5 className="mb-3 text-center fw-bold">
          {editingId ? "✏️ Edit Laptop" : "🆕 Add Laptop"}
        </h5>

        <div className="row g-3 mx-0">
          {[
            ["brand", "Brand *"],
            ["modelNumber", "Model Number *"],
            ["assetTag", "Asset Tag *"],
            ["purchaseDate", "Purchase Date *", "date"],
            ["processor", "Processor *"],
            ["ram", "RAM *"],
            ["storage", "Storage *"],
            ["graphicsCard", "Graphics Card"],
            ["displaySize", "Display Size"],
            ["operatingSystem", "Operating System *"],
            ["batteryCapacity", "Battery Capacity"],
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
            className="btn btn-primary me-2 px-3 px-sm-4 py-2 mb-2 mb-sm-0 w-100 w-sm-auto"
            disabled={!!assetError}
          >
            {editingId ? "Update Laptop" : "Save Laptop"}
          </button>
          <button
            type="button"
            className="btn btn-secondary px-3 px-sm-4 py-2 w-100 w-sm-auto"
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

    {/* ✅ Responsive Table */}
    {loading ? (
      <div className="text-center my-3">
        <div className="spinner-border" role="status"></div>
      </div>
    ) : laptops.length > 0 ? (
      <>
        <div
          className="table-responsive"
          style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
        >
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
              {laptops.map((l, i) => (
                <tr key={l.id}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td className="text-break">{l.brand}</td>
                  <td className="text-break">{l.modelNumber}</td>
                  <td className="text-break">{l.assetTag}</td>
                  <td className="text-break">{l.processor}</td>
                  <td className="text-break">{l.ram}</td>
                  <td className="d-flex flex-wrap justify-content-center gap-2">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => {
                        setSelectedLaptop(l);
                        setShowModal(true);
                      }}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleEdit(l)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(l.id)}
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-2">
          <Button variant="secondary" disabled={page === 1} onClick={prevPage}>
            ◀ Previous
          </Button>
          <span className="fw-semibold">Page {page} of {totalPages}</span>
          <Button variant="dark" disabled={page === totalPages} onClick={nextPage}>
            Next ▶
          </Button>
        </div>
      </>
    ) : (
      <p className="text-center">No laptops found.</p>
    )}

    {/* ✅ Scrollable Modal */}
    <Modal show={showModal} onHide={() => setShowModal(false)} scrollable centered>
      <Modal.Header closeButton>
        <Modal.Title>Laptop Details</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {selectedLaptop &&
          Object.entries(selectedLaptop).map(([k, v]) => (
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
      <Link to="/adminpanel" className="btn btn-outline-secondary px-3 px-sm-4 py-2 w-100 w-sm-auto">
        ⬅ Back to Admin Panel
      </Link>
    </div>
  </div>
 )
}
export default Laptops;
