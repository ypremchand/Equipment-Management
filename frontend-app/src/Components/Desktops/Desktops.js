import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Desktops() {
  const API_URL = "http://localhost:5083/api/desktops";

  // Data
  const [desktops, setDesktops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getEmptyForm());
  const [assetError, setAssetError] = useState("");
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);

  // Search / filters / sort
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    brand: "",
    ram: "",
    storage: "",
    location: ""
  });

  const [sort, setSort] = useState({ by: "id", dir: "asc" });

  // Options
  const [allOptions, setAllOptions] = useState({
    brands: [],
    rams: [],
    storages: [],
    locations: []
  });

  const searchDebounceRef = useRef(null);

  const admin = JSON.parse(localStorage.getItem("user") || "{}");

  function getEmptyForm() {
    return {
      brand: "",
      modelNumber: "",
      assetTag: "",
      purchaseDate: "",
      processor: "",
      ram: "",
      storage: "",
      graphicsCard: "",
      operatingSystem: "",
      location: "",
      remarks: "",
      damageReasonInput: "",
      lastServicedDate: ""
    };
  }

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (!formData.modelNumber.trim()) newErrors.modelNumber = "Model Number is required";
    if (!formData.assetTag.trim()) newErrors.assetTag = "Asset Tag is required";
    if (!formData.purchaseDate.trim()) newErrors.purchaseDate = "Purchase Date is required";
    if (!formData.processor.trim()) newErrors.processor = "Processor is required";
    if (!formData.ram.trim()) newErrors.ram = "RAM is required";
    if (!formData.storage.trim()) newErrors.storage = "Storage is required";
    if (!formData.operatingSystem.trim()) newErrors.operatingSystem = "Operating System is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";

    if (!formData.remarks.trim()) {
      newErrors.remarks = "Remarks is required";
    } else if (formData.remarks === "Yes" && !formData.damageReasonInput.trim()) {
      newErrors.damageReasonInput = "Damage Reason is required when Remarks = Yes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch desktops
  const fetchDesktops = useCallback(
    async (currentPage = 1) => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          pageSize,
          search: searchInput || undefined,
          sortBy: sort.by,
          sortDir: sort.dir,
          brand: filters.brand || undefined,
          ram: filters.ram || undefined,
          storage: filters.storage || undefined,
          location: filters.location || undefined
        };

        const res = await axios.get(API_URL, { params });

        setDesktops(res.data.data || []);
        setTotalPages(res.data.totalPages ?? 1);
        setPage(res.data.currentPage ?? currentPage);
      } catch (err) {
        console.error("fetchDesktops error", err);
      } finally {
        setLoading(false);
      }
    },
    [searchInput, filters, sort]
  );

  // Search debounce effect
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      fetchDesktops(1);
    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput, filters, sort, fetchDesktops]);

  // Page change effect
  useEffect(() => {
    fetchDesktops(page);
  }, [page, fetchDesktops]);

  // Load filter options
  useEffect(() => {
    axios
      .get(API_URL + "/options")
      .then((res) => setAllOptions(res.data))
      .catch((err) => console.error("options load error", err));
  }, []);

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // AssetTag duplicate
  const handleAssetTagChange = async (value) => {
    setFormData((prev) => ({ ...prev, assetTag: value }));
    setErrors((prev) => ({ ...prev, assetTag: "" }));

    if (!value.trim()) return setAssetError("");

    try {
      const res = await axios.get(`${API_URL}/check-duplicate`, {
        params: { assetTag: value }
      });
      setAssetError(res.data?.exists ? "Asset number already exists" : "");
    } catch (err) {
      console.error("AssetTag check error", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (assetError) {
      alert("Asset number already exists. Please fix it before saving.");
      return;
    }

    const payload = { ...formData };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...payload });
        alert("✅ Desktop updated successfully");
      } else {
        await axios.post(API_URL, payload);
        alert("✅ Desktop added successfully");
      }

      resetForm();
      fetchDesktops(page);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save desktop");
    }
  };

  // Edit
  const handleEdit = (d) => {
    setEditingId(d.id);
    setFormData({
      brand: d.brand || "",
      modelNumber: d.modelNumber || "",
      assetTag: d.assetTag || "",
      purchaseDate: d.purchaseDate?.split("T")[0] || "",
      processor: d.processor || "",
      ram: d.ram || "",
      storage: d.storage || "",
      graphicsCard: d.graphicsCard || "",
      operatingSystem: d.operatingSystem || "",
      location: d.location || "",
      remarks: d.remarks || "",
      damageReasonInput: "",
      lastServicedDate: d.lastServicedDate?.split("T")[0] || ""
    });

    setErrors({});
    setAssetError("");
    setShowForm(true);
  };

  // Delete
  const handleDelete = async (id) => {
    const reason = prompt("Please enter the reason for deleting this desktop:");

    if (!reason || reason.trim() === "") {
      alert("Deletion cancelled — reason is required.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this desktop?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        data: { reason, adminName: admin?.name || "Unknown Admin" }
      });

      alert("Desktop deleted successfully");
      fetchDesktops(page);
    } catch (err) {
      alert("Failed to delete desktop");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(getEmptyForm());
    setAssetError("");
    setErrors({});
    setShowForm(false);
  };

  const toggleSort = (field) => {
    setSort((prev) =>
      prev.by === field
        ? { by: field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { by: field, dir: "asc" }
    );
  };

  const nextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  // Export PDF
  const exportToPDF = () => {
    if (!desktops || desktops.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const columns = ["#", "Brand", "Model", "Asset Tag", "Processor", "RAM", "Storage", "Location"];

    const rows = desktops.map((d, i) => [
      (page - 1) * pageSize + i + 1,
      d.brand,
      d.modelNumber,
      d.assetTag,
      d.processor,
      d.ram,
      d.storage,
      d.location
    ]);

    doc.text("Desktops Export", 14, 12);
    autoTable(doc, { head: [columns], body: rows, startY: 18, styles: { fontSize: 8 } });
    doc.save(`desktops_${Date.now()}.pdf`);
  };

  const renderSortIcon = (field) => {
    if (sort.by !== field) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="desktops-page container-fluid mt-4 mb-5 px-2">
      <h3 className="text-center mb-4">🖥️ Desktops</h3>

      {/* Filters + Search */}
      <div className="card p-3 mb-3">
        <div className="row g-2 align-items-center">

          {/* Search */}
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="🔍 Search (brand/model/assetTag...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div className="col-auto">
            <select className="form-select" name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option value="">All Brands</option>
              {allOptions.brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* RAM */}
          <div className="col-auto">
            <select className="form-select" name="ram" value={filters.ram} onChange={handleFilterChange}>
              <option value="">All RAM</option>
              {allOptions.rams.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Storage */}
          <div className="col-auto">
            <select className="form-select" name="storage" value={filters.storage} onChange={handleFilterChange}>
              <option value="">All Storage</option>
              {allOptions.storages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="col-auto">
            <select className="form-select" name="location" value={filters.location} onChange={handleFilterChange}>
              <option value="">All Locations</option>
              {allOptions.locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="col ms-auto d-flex gap-2 justify-content-end">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setFilters({ brand: "", ram: "", storage: "", location: "" });
                setSearchInput("");
              }}
            >
              Reset
            </button>

            <button className="btn btn-outline-danger" onClick={exportToPDF}>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {!showForm && (
        <div className="text-center mb-3">
          <button className="btn btn-success px-4 py-2" onClick={() => setShowForm(true)}>
            ➕ Add Desktop
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form className="card p-3 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h5 className="text-center fw-bold mb-3">
            {editingId ? "✏️ Edit Desktop" : "🆕 Add Desktop"}
          </h5>

          <div className="row g-3">

            {/* Brand */}
            <div className="col-md-4">
              <label className="form-label">Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={`form-control ${errors.brand ? "is-invalid" : ""}`}
              />
              {errors.brand && <div className="text-danger small">{errors.brand}</div>}
            </div>

            {/* Model Number */}
            <div className="col-md-4">
              <label className="form-label">Model Number *</label>
              <input
                type="text"
                name="modelNumber"
                value={formData.modelNumber}
                onChange={handleChange}
                className={`form-control ${errors.modelNumber ? "is-invalid" : ""}`}
              />
              {errors.modelNumber && <div className="text-danger small">{errors.modelNumber}</div>}
            </div>

            {/* Asset Tag */}
            <div className="col-md-4">
              <label className="form-label">Asset Tag *</label>
              <input
                type="text"
                name="assetTag"
                value={formData.assetTag}
                onChange={(e) => handleAssetTagChange(e.target.value)}
                className={`form-control ${errors.assetTag || assetError ? "is-invalid" : ""}`}
              />
              {errors.assetTag && <div className="text-danger small">{errors.assetTag}</div>}
              {assetError && <div className="text-danger small">{assetError}</div>}
            </div>

            {/* Purchase Date */}
            <div className="col-md-4">
              <label className="form-label">Purchase Date *</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className={`form-control ${errors.purchaseDate ? "is-invalid" : ""}`}
              />
              {errors.purchaseDate && <div className="text-danger small">{errors.purchaseDate}</div>}
            </div>

            {/* Processor */}
            <div className="col-md-4">
              <label className="form-label">Processor *</label>
              <input
                type="text"
                name="processor"
                value={formData.processor}
                onChange={handleChange}
                className={`form-control ${errors.processor ? "is-invalid" : ""}`}
              />
              {errors.processor && <div className="text-danger small">{errors.processor}</div>}
            </div>

            {/* RAM */}
            <div className="col-md-4">
              <label className="form-label">RAM *</label>
              <input
                type="text"
                name="ram"
                value={formData.ram}
                onChange={handleChange}
                className={`form-control ${errors.ram ? "is-invalid" : ""}`}
              />
              {errors.ram && <div className="text-danger small">{errors.ram}</div>}
            </div>

            {/* Storage */}
            <div className="col-md-4">
              <label className="form-label">Storage *</label>
              <input
                type="text"
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                className={`form-control ${errors.storage ? "is-invalid" : ""}`}
              />
              {errors.storage && <div className="text-danger small">{errors.storage}</div>}
            </div>

            {/* Graphics Card */}
            <div className="col-md-4">
              <label className="form-label">Graphics Card</label>
              <input
                type="text"
                name="graphicsCard"
                value={formData.graphicsCard}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Operating System */}
            <div className="col-md-4">
              <label className="form-label">Operating System *</label>
              <input
                type="text"
                name="operatingSystem"
                value={formData.operatingSystem}
                onChange={handleChange}
                className={`form-control ${errors.operatingSystem ? "is-invalid" : ""}`}
              />
              {errors.operatingSystem && (
                <div className="text-danger small">{errors.operatingSystem}</div>
              )}
            </div>

            {/* Location */}
            <div className="col-md-4">
              <label className="form-label">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`form-control ${errors.location ? "is-invalid" : ""}`}
              />
              {errors.location && (
                <div className="text-danger small">{errors.location}</div>
              )}
            </div>

            {/* Last Serviced Date */}
            <div className="col-md-4">
              <label className="form-label">Last Serviced Date</label>
              <input
                type="date"
                name="lastServicedDate"
                value={formData.lastServicedDate}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Remarks */}
            <div className="col-md-4">
              <label className="form-label">Remarks *</label>
              <select
                name="remarks"
                value={formData.remarks}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    remarks: value,
                    damageReasonInput: value === "Yes" ? prev.damageReasonInput : ""
                  }));
                  setErrors((prev) => ({ ...prev, remarks: "", damageReasonInput: "" }));
                }}
                className={`form-select ${errors.remarks ? "is-invalid" : ""}`}
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              {errors.remarks && <div className="text-danger small">{errors.remarks}</div>}
            </div>

            {/* Damage Reason */}
            {formData.remarks === "Yes" && (
              <div className="col-md-4">
                <label className="form-label">Damage Reason *</label>
                <input
                  type="text"
                  name="damageReasonInput"
                  value={formData.damageReasonInput}
                  onChange={handleChange}
                  className={`form-control ${errors.damageReasonInput ? "is-invalid" : ""}`}
                />
                {errors.damageReasonInput && (
                  <div className="text-danger small">{errors.damageReasonInput}</div>
                )}
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <button type="submit" className="btn btn-primary me-2 px-4">
              {editingId ? "Update Desktop" : "Save Desktop"}
            </button>

            <button type="button" className="btn btn-secondary px-4" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" />
        </div>
      ) : desktops.length === 0 ? (
        <p className="alert alert-info text-center fw-bold">No desktops found.</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}>
                    # {renderSortIcon("id")}
                  </th>
                  <th onClick={() => toggleSort("brand")} style={{ cursor: "pointer" }}>
                    Brand {renderSortIcon("brand")}
                  </th>
                  <th onClick={() => toggleSort("modelNumber")} style={{ cursor: "pointer" }}>
                    Model {renderSortIcon("modelNumber")}
                  </th>
                  <th>Asset Tag</th>
                  <th onClick={() => toggleSort("processor")} style={{ cursor: "pointer" }}>
                    Processor {renderSortIcon("processor")}
                  </th>
                  <th onClick={() => toggleSort("ram")} style={{ cursor: "pointer" }}>
                    RAM {renderSortIcon("ram")}
                  </th>
                  <th onClick={() => toggleSort("storage")} style={{ cursor: "pointer" }}>
                    Storage {renderSortIcon("storage")}
                  </th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {desktops.map((d, i) => (
                  <tr key={d.id}>
                    <td>{(page - 1) * pageSize + i + 1}</td>
                    <td>{d.brand}</td>
                    <td>{d.modelNumber}</td>
                    <td>{d.assetTag}</td>
                    <td>{d.processor}</td>
                    <td>{d.ram}</td>
                    <td>{d.storage}</td>
                    <td>{d.location}</td>

                    <td className="d-flex justify-content-center gap-2 flex-wrap">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => {
                          setSelectedDesktop(d);
                          setShowModal(true);
                        }}
                      >
                        View
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(d)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(d.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-3 gap-2">
            <button className="btn btn-outline-primary" disabled={page === 1} onClick={prevPage}>
              ◀ Prev
            </button>

            <span className="align-self-center">Page {page} of {totalPages}</span>

            <button
              className="btn btn-outline-primary"
              disabled={page === totalPages}
              onClick={nextPage}
            >
              Next ▶
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} scrollable centered>
        <Modal.Header closeButton>
          <Modal.Title>Desktop Details</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedDesktop &&
            Object.entries(selectedDesktop).map(([k, v]) => (
              <p key={k}>
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

      {/* Back */}
      <div className="text-center mt-4">
        <Link to="/adminpanel" className="btn btn-outline-dark px-4">
          ⬅ Back to Admin Panel
        </Link>
      </div>
    </div>
  );
}
