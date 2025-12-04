import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Mobiles() {
  const API_URL = "http://localhost:5083/api/mobiles";

  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMobile, setSelectedMobile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assetError, setAssetError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ brand: "", ram: "", storage: "", location: "" });
  const [sort, setSort] = useState({ by: "id", dir: "asc" });

  const [allOptions, setAllOptions] = useState({ brands: [], rams: [], storages: [], locations: [] });

  const searchDebounceRef = useRef(null);

  const [form, setForm] = useState(getEmptyForm());

  function getEmptyForm() {
    return {
      brand: "",
      model: "",
      IMEINumber: "",
      assetTag: "",
      purchaseDate: "",
      processor: "",
      ram: "",
      storage: "",
      batteryCapacity: "",
      displaySize: "",
      SIMType: "",
      networkType: "",
      location: "",
      remarks: "",
      damageReason: "",   // NEW
      lastServicedDate: "",
    };
  }

  // ===================================================================
  // FETCH MOBILES
  // ===================================================================
  const fetchMobiles = useCallback(
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
          location: filters.location || undefined,
        };

        const res = await axios.get(API_URL, { params });
        const data = res.data;

        setMobiles(data.data || []);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.currentPage ?? currentPage);
      } catch (err) {
        console.error("Fetch mobiles error", err);
      } finally {
        setLoading(false);
      }
    },
    [searchInput, filters, sort]
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      fetchMobiles(1);
    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput, filters, sort, fetchMobiles]);

  useEffect(() => {
    fetchMobiles(page);
  }, [page, fetchMobiles]);

  useEffect(() => {
    axios.get(API_URL + "/options")
      .then((res) => setAllOptions(res.data))
      .catch((err) => console.error("Options load error", err));
  }, []);

  // ===================================================================
  // FORM HANDLERS
  // ===================================================================
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    if (name === "assetTag") {
      if (!value.trim()) return setAssetError("");

      try {
        const res = await axios.get(`${API_URL}/check-duplicate`, {
          params: { assetTag: value },
        });
        setAssetError(res.data.exists ? "Asset number already exists" : "");
      } catch (err) {
        console.error("Asset check error", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assetError) return alert("Please fix asset tag issue.");

    const required = ["brand", "model", "assetTag", "purchaseDate", "processor", "ram", "storage", "location"];
    if (required.some((f) => !form[f]?.trim())) {
      return alert("Please fill all required fields.");
    }

    if (form.remarks === "Yes" && !form.damageReason.trim()) {
      return alert("Please enter Damage Reason when Remarks is Yes.");
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        alert("Updated successfully");
      } else {
        await axios.post(API_URL, form); // damageReason included
        alert("Added successfully");
      }

      resetForm();
      fetchMobiles(page);
    } catch (err) {
      console.error("Save error", err);
      alert(err.response?.data?.message || "Failed to save");
    }
  };

  const handleEdit = (m) => {
    setEditingId(m.id);
    setForm({
      brand: m.brand || "",
      model: m.model || "",
      IMEINumber: m.imeiNumber || m.IMEINumber || "",
      assetTag: m.assetTag || "",
      purchaseDate: m.purchaseDate?.split("T")[0] || "",
      processor: m.processor || "",
      ram: m.ram || "",
      storage: m.storage || "",
      batteryCapacity: m.batteryCapacity || "",
      displaySize: m.displaySize || "",
      SIMType: m.simType || m.SIMType || "",
      networkType: m.networkType || "",
      location: m.location || "",
      remarks: m.remarks || "",
      damageReason: "",
      lastServicedDate: m.lastServicedDate?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Deleted");
      fetchMobiles(page);
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setAssetError("");
    setShowForm(false);
  };

  const toggleSort = (field) => {
    setSort((s) =>
      s.by === field ? { by: field, dir: s.dir === "asc" ? "desc" : "asc" } : { by: field, dir: "asc" }
    );
  };

  // ===================================================================
  // EXPORT
  // ===================================================================
  const exportToPDF = () => {
    if (!mobiles.length) return alert("No data");

    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Brand", "Model", "IMEI", "AssetTag", "Processor", "RAM", "Storage", "Location"]],
      body: mobiles.map((m) => [
        m.brand,
        m.model,
        m.imeiNumber || m.IMEINumber,
        m.assetTag,
        m.processor,
        m.ram,
        m.storage,
        m.location,
      ]),
      startY: 18,
      styles: { fontSize: 8 },
    });

    doc.save(`mobiles_${Date.now()}.pdf`);
  };

  // ===================================================================
  // UI
  // ===================================================================
  return (
    <div className="mobiles-page container-fluid mt-4 mb-5 px-2">
      <h3 className="text-center mb-4">📱 Mobiles</h3>

      {/* FILTERS */}
      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="🔍 Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.brand}
              onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}
            >
              <option value="">All Brands</option>
              {allOptions.brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* RAM */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.ram}
              onChange={(e) => setFilters((p) => ({ ...p, ram: e.target.value }))}
            >
              <option value="">All RAM</option>
              {allOptions.rams.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Storage */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.storage}
              onChange={(e) => setFilters((p) => ({ ...p, storage: e.target.value }))}
            >
              <option value="">All Storage</option>
              {allOptions.storages.map((s) =>
                <option key={s}>{s}</option>
              )}
            </select>
          </div>

          {/* Location */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
            >
              <option value="">All Locations</option>
              {allOptions.locations.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Reset + Export */}
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
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            ➕ Add New Mobile
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* FORM */}
      {/* ========================================================= */}
      {showForm && (
        <form className="card p-3 mb-3" onSubmit={handleSubmit}>
          <h5 className="text-center mb-3">
            {editingId ? "✏️ Edit Mobile" : "🆕 Add Mobile"}
          </h5>

          <div className="row g-3">

            {/* Standard fields */}
            {[
              ["brand", "Brand *"],
              ["model", "Model *"],
              ["IMEINumber", "IMEI Number"],
              ["assetTag", "Asset Tag *"],
              ["purchaseDate", "Purchase Date *", "date"],
              ["processor", "Processor *"],
              ["ram", "RAM *"],
              ["storage", "Storage *"],
              ["batteryCapacity", "Battery Capacity"],
              ["displaySize", "Display Size"],
              ["SIMType", "SIM Type"],
              ["networkType", "Network Type"],
              ["location", "Location *"],
              ["lastServicedDate", "Last Serviced Date", "date"],
            ].map(([name, label, type = "text"]) => (
              <div key={name} className="col-md-4">
                <label className="form-label small fw-semibold">{label}</label>

                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
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

            {/* ===================== */}
            {/* Remarks Dropdown */}
            {/* ===================== */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Remarks *</label>
              <select
                name="remarks"
                value={form.remarks}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({
                    ...p,
                    remarks: v,
                    damageReason: v === "Yes" ? p.damageReason : ""
                  }));
                }}
                className="form-select"
                required
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* ===================== */}
            {/* Damage Reason */}
            {/* ===================== */}
            {form.remarks === "Yes" && (
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Damage Reason *</label>
                <input
                  type="text"
                  name="damageReason"
                  value={form.damageReason}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <button type="submit" disabled={!!assetError} className="btn btn-primary me-2">
              {editingId ? "Update Mobile" : "Save Mobile"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TABLE */}
      {/* ========================================================= */}
      <div className="card p-2">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : mobiles.length === 0 ? (
          <p className="text-center my-3">No mobiles found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered text-center table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}>
                    # {sort.by === "id" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th onClick={() => toggleSort("brand")} style={{ cursor: "pointer" }}>
                    Brand {sort.by === "brand" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Model</th>
                  <th>Asset Tag</th>
                  <th>Processor</th>
                  <th>RAM</th>
                  <th>Storage</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {mobiles.map((m, idx) => (
                  <tr key={m.id}>
                    <td>{(page - 1) * pageSize + idx + 1}</td>
                    <td>{m.brand}</td>
                    <td>{m.model}</td>
                    <td>{m.assetTag}</td>
                    <td>{m.processor}</td>
                    <td>{m.ram}</td>
                    <td>{m.storage}</td>
                    <td>{m.location}</td>
                    <td className="d-flex justify-content-center gap-2">
                      <button className="btn btn-info btn-sm" onClick={() => { setSelectedMobile(m); setShowModal(true); }}>
                        View
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(m)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-3 gap-3">
        <Button variant="dark" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ◀ Prev
        </Button>
        <span>Page {page} of {totalPages}</span>
        <Button variant="dark" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
          Next ▶
        </Button>
      </div>

      {/* View Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Mobile Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMobile && Object.entries(selectedMobile).map(([k, v]) => (
            <p key={k}>
              <strong className="text-capitalize">{k}: </strong>
              {typeof v === "object" ? JSON.stringify(v) : v || "-"}
            </p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="text-center mt-4">
        <Link to="/adminpanel" className="btn btn-outline-dark">⬅ Back to Admin Panel</Link>
      </div>
    </div>
  );
}
