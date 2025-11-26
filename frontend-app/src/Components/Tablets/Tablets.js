// src/Components/Tablets/Tablets.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

// Export libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Tablets() {
  const API_URL = "http://localhost:5083/api/tablets";

  // data
  const [tablets, setTablets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // UI
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedTablet, setSelectedTablet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assetError, setAssetError] = useState("");

  // form
  const [form, setForm] = useState(getEmptyForm());

  function getEmptyForm() {
    return {
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
    };
  }

  // filters/search/sort
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    brand: "",
    ram: "",
    storage: "",
    location: ""
  });
  const [sort, setSort] = useState({ by: "id", dir: "asc" });
  const [allOptions, setAllOptions] = useState({
    brands: [],
    rams: [],
    storages: [],
    locations: []
  });

  // debounce
  const searchDebounceRef = useRef(null);

  // fetch options
  useEffect(() => {
    axios.get(API_URL + "/options")
      .then(res => setAllOptions(res.data))
      .catch(err => console.error("options error", err));
  }, []);

  // fetch with query params
  const fetchTablets = useCallback(async (currentPage = 1) => {
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

      setTablets(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setPage(data.currentPage ?? currentPage);
    } catch (err) {
      console.error("fetch error", err);
    }
    setLoading(false);
  }, [searchInput, filters, sort]);

  // watch search + filters + sort
  useEffect(() => {
    if (searchDebounceRef.current)
      clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      fetchTablets(1);
    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput, filters, sort, fetchTablets]);

  useEffect(() => {
    fetchTablets(page);
  }, [page, fetchTablets]);

  // form change
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    if (name === "assetTag") {
      if (!value.trim()) return setAssetError("");
      try {
        const res = await axios.get(`${API_URL}/check-duplicate`, {
          params: { assetTag: value }
        });
        setAssetError(res.data.exists ? "Asset number already exists" : "");
      } catch (err) {
        console.error("check error", err);
      }
    }
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (assetError) return alert("Fix asset tag error first.");

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...form });
        alert("✅Updated successfully");
      } else {
        await axios.post(API_URL, form);
        alert("✅Added successfully");
      }
      resetForm();
      fetchTablets(page);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setForm({
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tablet?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      alert("Deleted");
      fetchTablets(page);
    } catch (err) {
      alert("Delete failed");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setAssetError("");
    setShowForm(false);
  };

  const toggleSort = (field) => {
    setSort((s) => (s.by === field ? { by: field, dir: s.dir === "asc" ? "desc" : "asc" } : { by: field, dir: "asc" }));
  };

  //export to PDF
  const exportToPDF = () => {
    if (!tablets || tablets.length === 0) return alert("No data to export");

    const doc = new jsPDF({ orientation: "landscape" });

    autoTable(doc, {
      head: [["Brand", "Model", "AssetTag", "Processor", "RAM", "Storage", "Location"]],
      body: tablets.map((t) => [
        t.brand,
        t.model,
        t.assetTag,
        t.processor,
        t.ram,
        t.storage,
        t.location
      ]),
      startY: 18,
      styles: { fontSize: 8 }
    });

    doc.save(`tablets_${Date.now()}.pdf`);
  };


  return (
    <div className="tablets-page container-fluid mt-4 mb-5 px-2">
      <h3 className="text-center mb-4">📲 Tablets</h3>

      {/* Filters */}
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
              onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
            >
              <option value="">All Brands</option>
              {allOptions.brands.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* RAM */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.ram}
              onChange={(e) => setFilters((f) => ({ ...f, ram: e.target.value }))}
            >
              <option value="">All RAM</option>
              {allOptions.rams.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Storage */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.storage}
              onChange={(e) => setFilters((f) => ({ ...f, storage: e.target.value }))}
            >
              <option value="">All Storage</option>
              {allOptions.storages.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            >
              <option value="">All Locations</option>
              {allOptions.locations.map((x) => (
                <option key={x}>{x}</option>
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
          <button className="btn btn-success" onClick={() => setShowForm(true)}>
            ➕ Add New Tablet
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form className="card p-3 mb-3" onSubmit={handleSubmit}>
          <h5 className="text-center">{editingId ? "✏️Edit Tablet" : "🆕Add Tablet"}</h5>

          <div className="row">
            {Object.keys(form).map((k) => (
              <div className="col-md-4 mb-2" key={k}>
                <label className="form-label small">{k}</label>
                <input
                  type={k.toLowerCase().includes("date") ? "date" : "text"}
                  name={k}
                  value={form[k] || ""}
                  onChange={handleChange}
                  className={`form-control ${k === "assetTag" && assetError ? "is-invalid" : ""}`}
                />
                {k === "assetTag" && assetError && (
                  <div className="invalid-feedback">{assetError}</div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="btn btn-primary me-2" disabled={!!assetError}>
              {editingId ? "Update Tablet" : "Save Tablet"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* TABLE */}
      <div className="card p-2">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : tablets.length === 0 ? (
          <p className="text-center my-3">No tablets found</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped text-center">
              <thead className="table-dark">
                <tr>
                   <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}># {sort.by === "id" ? (sort.dir === "asc" ? "▲" : "▼") : ""}</th>
                  <th onClick={() => toggleSort("brand")} style={{ cursor: "pointer" }}>Brand {sort.by === "brand" ? (sort.dir === "asc" ? "▲" : "▼") : ""}</th>
                  <th onClick={() => toggleSort("brand")} style={{ cursor: "pointer" }}>
                    Brand
                  </th>
                  <th>Model</th>
                  <th>Processor</th>
                  <th>RAM</th>                   
                  <th>Storage</th>                 
                  <th>Location</th>                  
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {tablets.map((t, i) => (
                  <tr key={t.id}>
                    <td>{(page - 1) * pageSize + i + 1}</td>
                    <td>{t.brand}</td>
                    <td>{t.model}</td>
                    <td>{t.processor}</td>
                    <td>{t.ram}</td>
                    <td>{t.storage}</td>
                    <td>{t.location}</td>
                    <td className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-info btn-sm" onClick={() => { setSelectedTablet(t); setShowModal(true); }}>
                        View
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(t)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
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

      {/* PAGINATION */}
      <div className="d-flex justify-content-center gap-3 mt-3">
        <Button variant="dark" disabled={page === 1} onClick={() => setPage(page - 1)}>
          ◀ Prev
        </Button>
        <span>Page {page} of {totalPages}</span>
        <Button variant="dark" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next ▶
        </Button>
      </div>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Tablet Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTablet && Object.entries(selectedTablet).map(([k, v]) => (
            <p key={k}><strong>{k}:</strong> {typeof v === "object" ? JSON.stringify(v) : v || "-"}</p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="text-center mt-4">
        <Link to="/adminpanel" className="btn btn-outline-dark">⬅ Back</Link>
      </div>
    </div>
  );
}
