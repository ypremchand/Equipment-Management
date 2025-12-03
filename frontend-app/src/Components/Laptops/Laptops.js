import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

// Export libs (ensure these are installed in your project)

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Laptops() {
  const API_URL = "http://localhost:5083/api/laptops";

  // Data
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // server page size param

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getEmptyForm());
  const [assetError, setAssetError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  // Filters / search / sort (these are sent to backend as query params)
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ brand: "", ram: "", storage: "", location: "" });
  const [sort, setSort] = useState({ by: "id", dir: "asc" });
  const [allOptions, setAllOptions] = useState({ brands: [], rams: [], storages: [], locations: [] });

  // debounce ref
  const searchDebounceRef = useRef(null);

  // Fetch data from backend with server-side filtering/sorting/pagination
  const fetchLaptops = useCallback(async (currentPage = 1) => {
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

      setLaptops(data.data || []);
      setTotalPages(data.totalPages ?? 1);
      setPage(data.currentPage ?? currentPage);
    } catch (err) {
      console.error("fetchLaptops error", err);
    } finally {
      setLoading(false);
    }
  }, [searchInput, filters, sort]);


  // initial + page + when filters/search/sort change
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      fetchLaptops(1);
    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput, filters, sort, fetchLaptops]);



  useEffect(() => {
    fetchLaptops(page);
  }, [page, fetchLaptops]);

  useEffect(() => {
    axios.get(API_URL + "/options")
      .then(res => setAllOptions(res.data))
      .catch(err => console.error("options load error", err));
  }, []);

  // Helpers
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
      lastServicedDate: "",
    };
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAssetTagChange = async (v) => {
    setFormData((p) => ({ ...p, assetTag: v }));
    if (!v?.trim()) return setAssetError("");
    try {
      const res = await axios.get(`${API_URL}/check-duplicate`, { params: { assetTag: v } });
      setAssetError(res.data?.exists ? "Asset number already exists" : "");
    } catch (err) {
      console.error("asset check", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (assetError) return alert("Please fix errors before saving.");

    const required = ["brand", "modelNumber", "assetTag", "purchaseDate", "processor", "ram", "storage", "operatingSystem", "location"];
    if (required.some((f) => !formData[f]?.toString()?.trim())) return alert("Please fill all required fields.");

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...formData });
        alert("✅Updated successfully");
      } else {
        await axios.post(API_URL, formData);
        alert("✅Added successfully");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(getEmptyForm());
      fetchLaptops(page);
    } catch (err) {
      console.error("save error", err);
      alert(err.response?.data?.message || "Failed to save laptop");
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
      lastServicedDate: l.lastServicedDate?.split("T")[0] || "",
    });
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
      data: { reason }   // <-- send reason to backend
    });

    alert("Laptop deleted successfully");
    fetchLaptops(page);
  } catch (err) {
    console.error("delete error", err);
    alert("Failed to delete laptop");
  }
};


  const resetForm = () => {
    setEditingId(null);
    setFormData(getEmptyForm());
    setAssetError("");
    setShowForm(false);
  };

  const toggleSort = (field) => {
    setSort((s) => (s.by === field ? { by: field, dir: s.dir === "asc" ? "desc" : "asc" } : { by: field, dir: "asc" }));
  };

  const nextPage = () => page < totalPages && setPage((p) => p + 1);
  const prevPage = () => page > 1 && setPage((p) => p - 1);

  // Export helpers

  const exportToPDF = () => {
    if (!laptops || laptops.length === 0) return alert("No data to export");
    const doc = new jsPDF({ orientation: "landscape" });
    const cols = ["Brand", "Model", "AssetTag", "Processor", "RAM", "Storage", "Location"];
    const rows = laptops.map((l) => [l.brand, l.modelNumber, l.assetTag, l.processor, l.ram, l.storage, l.location]);
    doc.text("Laptops Export", 14, 12);
    autoTable(doc, { head: [cols], body: rows, startY: 18, styles: { fontSize: 8 } });
    doc.save(`laptops_${Date.now()}.pdf`);
  };


  return (
    <div className="laptops-page container-fluid mt-4 mb-5 px-2" style={{ maxWidth: "100vw", overflowX: "hidden", paddingLeft: "10px", paddingRight: "10px" }}>
      <h3 className="text-center mb-4">💻 Laptops</h3>

      {/* Filters/Search/Export */}
      <div className="card p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <input className="form-control" placeholder="🔍 Search (brand/model/assetTag...)" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>

          <div className="col-auto">
            <select className="form-select" value={filters.brand} onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}>
              <option value="">All Brands</option>
              {allOptions.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <select className="form-select" value={filters.ram} onChange={(e) => setFilters((p) => ({ ...p, ram: e.target.value }))}>
              <option value="">All RAM</option>
              {allOptions.rams.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <select className="form-select" value={filters.storage} onChange={(e) => setFilters((p) => ({ ...p, storage: e.target.value }))}>
              <option value="">All Storage</option>
              {allOptions.storages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <select className="form-select" value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}>
              <option value="">All Locations</option>
              {allOptions.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
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
          <button className="btn btn-success px-3 px-sm-4 py-2 w-sm-auto" onClick={() => setShowForm(true)}>
            ➕ Add New Laptop
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form className="card p-3 p-sm-4 shadow-sm mb-4" onSubmit={handleSubmit}>
          <h5 className="mb-3 text-center fw-bold">{editingId ? "✏️ Edit Laptop" : "🆕 Add Laptop"}</h5>

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
                  onChange={name === "assetTag" ? (e) => handleAssetTagChange(e.target.value) : handleChange}
                  className={`form-control ${name === "assetTag" && assetError ? "is-invalid" : ""}`}
                  required={label.includes("*")}
                />
                {name === "assetTag" && assetError && <div className="invalid-feedback">{assetError}</div>}
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary me-2 px-3 px-sm-4 py-2 mb-2 mb-sm-0 w-sm-auto" disabled={!!assetError}>
              {editingId ? "Update Laptop" : "Save Laptop"}
            </button>
            <button type="button" className="btn btn-secondary px-3 px-sm-4 py-2  w-sm-auto" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : laptops.length > 0 ? (
        <>
          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="table table-bordered text-center align-middle table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}># {sort.by === "id" ? (sort.dir === "asc" ? "▲" : "▼") : ""}</th>
                  <th onClick={() => toggleSort("brand")} style={{ cursor: "pointer" }}>Brand {sort.by === "brand" ? (sort.dir === "asc" ? "▲" : "▼") : ""}</th>
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
                      <button className="btn btn-info btn-sm" onClick={() => { setSelectedLaptop(l); setShowModal(true); }}>View</button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(l)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-3">
            <button className="btn btn-outline-primary me-2" disabled={page === 1} onClick={prevPage}>◀️ Prev</button>
            <span className="align-self-center">Page {page} of {totalPages}</span>
            <button className="btn btn-outline-primary ms-2" disabled={page === totalPages} onClick={nextPage}>Next ▶️</button>
          </div>
        </>
      ) : (
        <p className="text-center">No laptops found.</p>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} scrollable centered>
        <Modal.Header closeButton>
          <Modal.Title>Laptop Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedLaptop && Object.entries(selectedLaptop).map(([k, v]) => (
            <p key={k} className="mb-1"><strong className="text-capitalize">{k}:</strong> {typeof v === "object" ? JSON.stringify(v) : v?.toString() || "-"}</p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="text-center mt-4">
        <Link to="/adminpanel" className="btn btn-outline-dark px-3 px-sm-4 py-2 w-sm-auto">⬅ Back to Admin Panel</Link>
      </div>
    </div>
  );
}