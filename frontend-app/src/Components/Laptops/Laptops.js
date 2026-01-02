import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Laptops() {
  const API_URL = "http://localhost:5083/api/laptops";

  // Data
  const [laptops, setLaptops] = useState([]);
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
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  // Search / filters / sort
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    brand: "",
    ram: "",
    storage: "",
    location: ""
  });
  const [sort, setSort] = useState({ by: "id", dir: "asc" });

  // Options for filters
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
      displaySize: "",
      operatingSystem: "",
      batteryCapacity: "",
      location: "",
      remarks: "",
      damageReason: "",
      lastServicedDate: ""
    };
  }

  // 🔐 Manual Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    } else if (formData.brand.trim().length < 2) {
      newErrors.brand = "Brand must be at least 2 characters";
    }
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
    } else if (formData.remarks === "Yes" && !formData.damageReason.trim()) {
      newErrors.damageReason = "Damage Reason is required when Remarks is Yes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔄 Fetch laptop list (with search, filters, sort, pagination)
  const fetchLaptops = useCallback(
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
        const data = res.data;

        setLaptops(data.data || []);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.currentPage ?? currentPage);
      } catch (err) {
        console.error("fetchLaptops error", err);
      } finally {
        setLoading(false);
      }
    },
    [searchInput, filters, sort]
  );

  // 🔁 Debounced fetch when search / filters / sort change
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchLaptops(1);
    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput, filters, sort, fetchLaptops]);

  // 🔁 Fetch when page changes (Prev/Next)
  useEffect(() => {
    fetchLaptops(page);
  }, [page, fetchLaptops]);

  // 📥 Load dropdown options for filters
  useEffect(() => {
    axios
      .get(API_URL + "/options")
      .then((res) => setAllOptions(res.data))
      .catch((err) => console.error("options load error", err));
  }, []);

  // 🖊 Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (assetError) {
      alert("Asset number already exists. Please fix it before saving.");
      return;
    }

    try {
      const payload = { ...formData };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...payload });
        alert("✅ Laptop updated successfully");
      } else {
        await axios.post(API_URL, payload);
        alert("✅ Laptop added successfully");
      }

      resetForm();
      fetchLaptops(page);
    } catch (err) {
      console.error("save error", err);
      alert(err.response?.data?.message || "Failed to save laptop");
    }
  };

  const fetchNextLaptopAssetTag = async () => {
    try {
      const res = await axios.get(`${API_URL}/next-asset-tag`);
      setFormData((p) => ({
        ...p,
        assetTag: res.data.assetTag || ""
      }));
    } catch (err) {
      alert("No available laptop asset tags. Please create a purchase order.");
    }
  };


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
      damageReason: "",
      lastServicedDate: l.lastServicedDate?.split("T")[0] || ""
    });
    setErrors({});
    setAssetError("");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const reason = prompt("Please enter the reason for deleting this laptop:");

    if (!reason || reason.trim() === "") {
      alert("Deletion cancelled — reason is required.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this laptop?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        data: {
          reason,
          adminName: admin?.name || "Unknown Admin"
        }
      });

      alert("Laptop deleted successfully");
      fetchLaptops(page);
    } catch (err) {
      alert("Failed to delete laptop");
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

  // 📄 Export to PDF
  const exportToPDF = () => {
    if (!laptops || laptops.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const columns = ["#", "Brand", "Model", "Asset Tag", "Processor", "RAM", "Storage", "Location"];
    const rows = laptops.map((l, index) => [
      (page - 1) * pageSize + index + 1,
      l.brand,
      l.modelNumber,
      l.assetTag,
      l.processor,
      l.ram,
      l.storage,
      l.location
    ]);

    doc.text("Laptops Export", 14, 12);
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 18,
      styles: { fontSize: 8 }
    });
    doc.save(`laptops_${Date.now()}.pdf`);
  };

  const renderSortIcon = (field) => {
    if (sort.by !== field) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="laptops-page container-fluid mt-4 mb-5 px-2" style={{ maxWidth: "100vw" }}>
      <h3 className="text-center mb-4">💻 Laptops</h3>

      {/* 🔎 Filters/Search/Export */}
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

          {/* Brand Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
            >
              <option value="">All Brands</option>
              {allOptions.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* RAM Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              name="ram"
              value={filters.ram}
              onChange={handleFilterChange}
            >
              <option value="">All RAM</option>
              {allOptions.rams.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Storage Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              name="storage"
              value={filters.storage}
              onChange={handleFilterChange}
            >
              <option value="">All Storage</option>
              {allOptions.storages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="">All Locations</option>
              {allOptions.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Right Side Buttons */}
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
          <button
            className="btn btn-success px-3 px-sm-4 py-2 w-sm-auto"
            onClick={() => {
              setShowForm(true);
              fetchNextLaptopAssetTag();
            }}
          >
            ➕ Add New Laptop
          </button>

        </div>
      )}

      {/* 📝 Form */}
      {showForm && (
        <form className="card p-3 p-sm-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h5 className="mb-3 text-center fw-bold">
            {editingId ? "✏️ Edit Laptop" : "🆕 Add Laptop"}
          </h5>

          <div className="row g-3 mx-0">
            {/* Brand */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={`form-control ${errors.brand ? "is-invalid" : ""}`}
              />
              {errors.brand && <div className="invalid-feedback d-block">{errors.brand}</div>}
            </div>

            {/* Model Number */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Model Number *</label>
              <input
                type="text"
                name="modelNumber"
                value={formData.modelNumber}
                onChange={handleChange}
                className={`form-control ${errors.modelNumber ? "is-invalid" : ""}`}
              />
              {errors.modelNumber && (
                <div className="invalid-feedback d-block">{errors.modelNumber}</div>
              )}
            </div>

            {/* Asset Tag */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Asset Tag *</label>
              <input
                type="text"
                name="assetTag"
                value={formData.assetTag}
                readOnly
                className={`form-control ${errors.assetTag ? "is-invalid" : ""} bg-light`}
              />

              <small className="text-muted">
                Auto-generated from Purchase Orders
              </small>


            </div>

            {/* Purchase Date */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Purchase Date *</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className={`form-control ${errors.purchaseDate ? "is-invalid" : ""}`}
              />
              {errors.purchaseDate && (
                <div className="invalid-feedback d-block">{errors.purchaseDate}</div>
              )}
            </div>

            {/* Processor */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Processor *</label>
              <input
                type="text"
                name="processor"
                value={formData.processor}
                onChange={handleChange}
                className={`form-control ${errors.processor ? "is-invalid" : ""}`}
              />
              {errors.processor && (
                <div className="invalid-feedback d-block">{errors.processor}</div>
              )}
            </div>

            {/* RAM */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">RAM *</label>
              <input
                type="text"
                name="ram"
                value={formData.ram}
                onChange={handleChange}
                className={`form-control ${errors.ram ? "is-invalid" : ""}`}
              />
              {errors.ram && <div className="invalid-feedback d-block">{errors.ram}</div>}
            </div>

            {/* Storage */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Storage *</label>
              <input
                type="text"
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                className={`form-control ${errors.storage ? "is-invalid" : ""}`}
              />
              {errors.storage && (
                <div className="invalid-feedback d-block">{errors.storage}</div>
              )}
            </div>

            {/* Graphics Card */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Graphics Card</label>
              <input
                type="text"
                name="graphicsCard"
                value={formData.graphicsCard}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Display Size */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Display Size</label>
              <input
                type="text"
                name="displaySize"
                value={formData.displaySize}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Operating System */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Operating System *</label>
              <input
                type="text"
                name="operatingSystem"
                value={formData.operatingSystem}
                onChange={handleChange}
                className={`form-control ${errors.operatingSystem ? "is-invalid" : ""}`}
              />
              {errors.operatingSystem && (
                <div className="invalid-feedback d-block">{errors.operatingSystem}</div>
              )}
            </div>

            {/* Battery Capacity */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Battery Capacity</label>
              <input
                type="text"
                name="batteryCapacity"
                value={formData.batteryCapacity}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Location */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`form-control ${errors.location ? "is-invalid" : ""}`}
              />
              {errors.location && (
                <div className="invalid-feedback d-block">{errors.location}</div>
              )}
            </div>

            {/* Last Serviced Date */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Last Serviced Date</label>
              <input
                type="date"
                name="lastServicedDate"
                value={formData.lastServicedDate}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Remarks */}
            <div className="col-12 col-sm-6 col-md-4 px-2">
              <label className="form-label small fw-semibold">Remarks *</label>
              <select
                name="remarks"
                value={formData.remarks}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    remarks: value,
                    damageReason: value === "Yes" ? prev.damageReason : ""
                  }));
                  setErrors((prev) => ({ ...prev, remarks: "", damageReason: "" }));
                }}
                className={`form-select ${errors.remarks ? "is-invalid" : ""}`}
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              {errors.remarks && (
                <div className="invalid-feedback d-block">{errors.remarks}</div>
              )}
            </div>

            {/* Damage Reason (conditional) */}
            {formData.remarks === "Yes" && (
              <div className="col-12 col-sm-6 col-md-4 px-2">
                <label className="form-label small fw-semibold">Damage Reason *</label>
                <input
                  type="text"
                  name="damageReason"
                  value={formData.damageReason}
                  onChange={handleChange}
                  className={`form-control ${errors.damageReason ? "is-invalid" : ""}`}
                />
                {errors.damageReason && (
                  <div className="invalid-feedback d-block">
                    {errors.damageReason}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center mt-4">
            <button
              type="submit"
              className="btn btn-primary me-2 px-3 px-sm-4 py-2 w-sm-auto"
              disabled={!!assetError}
            >
              {editingId ? "Update Laptop" : "Save Laptop"}
            </button>
            <button
              type="button"
              className="btn btn-secondary px-3 px-sm-4 py-2 w-sm-auto"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 📋 Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status" />
        </div>
      ) : laptops.length === 0 ? (
        <p className="alert alert-info text-center fw-bold">No laptops found.</p>
      ) : (
        <>
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="table table-bordered text-center align-middle table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th
                    onClick={() => toggleSort("id")}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    # {renderSortIcon("id")}
                  </th>
                  <th
                    onClick={() => toggleSort("brand")}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Brand {renderSortIcon("brand")}
                  </th>
                  <th
                    onClick={() => toggleSort("modelNumber")}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Model {renderSortIcon("modelNumber")}
                  </th>
                  <th>Asset Tag</th>
                  <th
                    onClick={() => toggleSort("processor")}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Processor {renderSortIcon("processor")}
                  </th>
                  <th
                    onClick={() => toggleSort("ram")}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    RAM {renderSortIcon("ram")}
                  </th>
                  <th
                    onClick={() => toggleSort("storage")}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Storage {renderSortIcon("storage")}
                  </th>
                  <th>Location</th>
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
                    <td className="text-break">{l.storage}</td>
                    <td className="text-break">{l.location}</td>
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

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-3 gap-2">
            <button
              className="btn btn-outline-primary"
              disabled={page === 1}
              onClick={prevPage}
            >
              ◀️ Prev
            </button>

            <span className="align-self-center">
              Page {page} of {totalPages}
            </span>

            <button
              className="btn btn-outline-primary"
              disabled={page === totalPages}
              onClick={nextPage}
            >
              Next ▶️
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        scrollable
        centered
      >
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
        <Link
          to="/adminpanel"
          className="btn btn-outline-dark px-3 px-sm-4 py-2 w-sm-auto"
        >
          ⬅ Back to Admin Panel
        </Link>
      </div>
    </div>
  );
}
