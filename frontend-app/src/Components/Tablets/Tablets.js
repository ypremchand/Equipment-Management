// src/Components/Tablets/Tablets.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Tablets() {
  const API_URL = "http://localhost:5083/api/tablets";

  const [tablets, setTablets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTablet, setSelectedTablet] = useState(null);

  const [assetError, setAssetError] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(getEmptyForm());
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    brand: "",
    ram: "",
    storage: "",
    location: "",
  });

  const [sort, setSort] = useState({ by: "id", dir: "asc" });

  const [allOptions, setAllOptions] = useState({
    brands: [],
    rams: [],
    storages: [],
    locations: [],
  });

  const searchDebounceRef = useRef(null);

  const admin = JSON.parse(localStorage.getItem("user") || "{}");

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
      damageReason: "",
      lastServicedDate: "",
    };
  }

  // ------------------------------------------------------------
  // 🔎 Manual validation (like Laptops / Mobiles)
  // ------------------------------------------------------------
  const validateForm = () => {
    const newErrors = {};

    if (!form.brand.trim()) {
      newErrors.brand = "Brand is required";
    } else if (form.brand.trim().length < 2) {
      newErrors.brand = "Brand must be at least 2 characters";
    }
    if (!form.model.trim()) newErrors.model = "Model is required";
    if (!form.assetTag.trim()) newErrors.assetTag = "Asset Tag is required";
    if (!form.purchaseDate.trim())
      newErrors.purchaseDate = "Purchase Date is required";
    if (!form.processor.trim())
      newErrors.processor = "Processor is required";
    if (!form.ram.trim()) newErrors.ram = "RAM is required";
    if (!form.storage.trim()) newErrors.storage = "Storage is required";
    if (!form.location.trim()) newErrors.location = "Location is required";

    if (!form.simSupport.trim())
      newErrors.simSupport = "SIM Support is required";
    else if (form.simSupport === "Yes" && !form.imeiNumber.trim()) {
      newErrors.imeiNumber =
        "IMEI Number is required when SIM Support is Yes";
    }

    if (!form.remarks.trim()) newErrors.remarks = "Remarks is required";
    else if (form.remarks === "Yes" && !form.damageReason.trim()) {
      newErrors.damageReason =
        "Damage Reason is required when Remarks is Yes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------------------------------------------------
  // Load dropdown options
  // ------------------------------------------------------------
  useEffect(() => {
    axios
      .get(API_URL + "/options")
      .then((res) => setAllOptions(res.data))
      .catch((err) => console.error("options error", err));
  }, []);

  //------------------------------------------------------------
  // Fetch Tablets (search + filters + sort + pagination)
  //------------------------------------------------------------
  const fetchTablets = useCallback(
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

        setTablets(data.data || []);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.currentPage ?? currentPage);
      } catch (err) {
        console.error("Fetch Tablets Error:", err);
      }
      setLoading(false);
    },
    [searchInput, filters, sort]
  );

  useEffect(() => {
    if (searchDebounceRef.current)
      clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => fetchTablets(1), 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput, filters, sort, fetchTablets]);

  useEffect(() => {
    fetchTablets(page);
  }, [page, fetchTablets]);

  //------------------------------------------------------------
  // Form Handlers
  //------------------------------------------------------------
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "assetTag") {
      if (!value.trim()) return setAssetError("");

      try {
        const res = await axios.get(`${API_URL}/check-duplicate`, {
          params: { assetTag: value },
        });
        setAssetError(
          res.data.exists ? "Asset number already exists" : ""
        );
      } catch (err) {
        console.error("dup check error", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (assetError) {
      alert("Fix asset tag error first.");
      return;
    }

    try {
      const payload = { ...form };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
        alert("✅ Updated successfully");
      } else {
        await axios.post(API_URL, payload);
        alert("✅ Added successfully");
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
      damageReason: "",
      lastServicedDate: t.lastServicedDate?.split("T")[0] || "",
    });

    setErrors({});
    setAssetError("");
    setShowForm(true);
  };


  const fetchNextTabletAssetTag = async () => {
    try {
      const res = await axios.get(`${API_URL}/next-asset-tag`);
      setForm((p) => ({
        ...p,
        assetTag: res.data.assetTag || ""
      }));
    } catch {
      alert("No available tablet asset tags. Please create a purchase order.");
    }
  };
  const handleDelete = async (id) => {
    const reason = prompt(
      "Please enter the reason for deleting this tablet:"
    );

    if (!reason || reason.trim() === "") {
      alert("Deletion cancelled — reason is required.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this tablet?"))
      return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        data: {
          reason,
          adminName: admin?.name || "Unknown Admin",
        },
      });

      alert("Tablet deleted successfully");
      fetchTablets(page);
    } catch (err) {
      alert("Failed to delete tablet");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setAssetError("");
    setErrors({});
    setShowForm(false);
  };

  //------------------------------------------------------------
  // Sorting helpers
  //------------------------------------------------------------
  const toggleSort = (field) => {
    setSort((prev) =>
      prev.by === field
        ? { by: field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { by: field, dir: "asc" }
    );
  };

  const renderSortIcon = (field) => {
    if (sort.by !== field) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  };

  //------------------------------------------------------------
  // Export PDF
  //------------------------------------------------------------
  const exportToPDF = () => {
    if (!tablets.length) return alert("No data to export");

    const doc = new jsPDF({ orientation: "landscape" });

    autoTable(doc, {
      head: [
        [
          "#",
          "Brand",
          "Model",
          "AssetTag",
          "Processor",
          "RAM",
          "Storage",
          "Location",
        ],
      ],
      body: tablets.map((t, index) => [
        (page - 1) * pageSize + index + 1,
        t.brand,
        t.model,
        t.assetTag,
        t.processor,
        t.ram,
        t.storage,
        t.location,
      ]),
      startY: 18,
      styles: { fontSize: 8 },
    });

    doc.save(`tablets_${Date.now()}.pdf`);
  };

  //------------------------------------------------------------
  // UI
  //------------------------------------------------------------
  return (
    <div className="tablets-page container-fluid mt-4 mb-5 px-2">
      <h3 className="text-center mb-4">📲 Tablets</h3>

      {/* ---------------- FILTERS ---------------- */}
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

          <div className="col-auto">
            <select
              className="form-select"
              value={filters.brand}
              onChange={(e) =>
                setFilters((p) => ({ ...p, brand: e.target.value }))
              }
            >
              <option value="">All Brands</option>
              {allOptions.brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <select
              className="form-select"
              value={filters.ram}
              onChange={(e) =>
                setFilters((p) => ({ ...p, ram: e.target.value }))
              }
            >
              <option value="">All RAM</option>
              {allOptions.rams.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <select
              className="form-select"
              value={filters.storage}
              onChange={(e) =>
                setFilters((p) => ({ ...p, storage: e.target.value }))
              }
            >
              <option value="">All Storage</option>
              {allOptions.storages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) =>
                setFilters((p) => ({ ...p, location: e.target.value }))
              }
            >
              <option value="">All Locations</option>
              {allOptions.locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="col ms-auto d-flex gap-2 justify-content-end">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setFilters({
                  brand: "",
                  ram: "",
                  storage: "",
                  location: "",
                });
                setSearchInput("");
              }}
            >
              Reset
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={exportToPDF}
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- ADD BUTTON ---------------- */}
      {!showForm && (
        <div className="text-center mb-3">
          <button
            className="btn btn-success"
            onClick={() => {
              setShowForm(true);
              fetchNextTabletAssetTag();
            }}
          >
            ➕ Add New Tablet
          </button>
        </div>
      )}

      {/* ---------------- FORM ---------------- */}
      {showForm && (
        <form className="card p-3 mb-3" onSubmit={handleSubmit}>
          <h5 className="text-center mb-3">
            {editingId ? "✏️ Edit Tablet" : "🆕 Add Tablet"}
          </h5>

          <div className="row g-3">
            {/* Basic Fields */}
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
                  readOnly={name === "assetTag"}   // ✅ ONLY assetTag locked
                  className={`form-control ${errors[name] ? "is-invalid" : ""
                    } ${name === "assetTag" ? "bg-light" : ""}`}
                />

                {errors[name] && (
                  <div className="invalid-feedback d-block">{errors[name]}</div>
                )}

                {name === "assetTag" && (
                  <small className="text-muted">
                    Auto-generated from Purchase Orders
                  </small>
                )}
              </div>
            ))}


            {/* SIM Support */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">
                SIM Support *
              </label>
              <select
                name="simSupport"
                value={form.simSupport}
                className={`form-select ${errors.simSupport ? "is-invalid" : ""
                  }`}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    simSupport: value,
                    imeiNumber: value === "Yes" ? prev.imeiNumber : "",
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    simSupport: "",
                    imeiNumber: "",
                  }));
                }}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.simSupport && (
                <div className="invalid-feedback d-block">
                  {errors.simSupport}
                </div>
              )}
            </div>

            {/* IMEI */}
            {form.simSupport === "Yes" && (
              <div className="col-md-4">
                <label className="form-label small fw-semibold">
                  IMEI Number *
                </label>
                <input
                  type="text"
                  name="imeiNumber"
                  value={form.imeiNumber}
                  onChange={handleChange}
                  className={`form-control ${errors.imeiNumber ? "is-invalid" : ""
                    }`}
                />
                {errors.imeiNumber && (
                  <div className="invalid-feedback d-block">
                    {errors.imeiNumber}
                  </div>
                )}
              </div>
            )}

            {/* Remarks */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">
                Remarks *
              </label>
              <select
                name="remarks"
                className={`form-select ${errors.remarks ? "is-invalid" : ""
                  }`}
                value={form.remarks}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    remarks: v,
                    damageReason:
                      v === "Yes" ? prev.damageReason : "",
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    remarks: "",
                    damageReason: "",
                  }));
                }}
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              {errors.remarks && (
                <div className="invalid-feedback d-block">
                  {errors.remarks}
                </div>
              )}
            </div>

            {/* Damage Reason */}
            {form.remarks === "Yes" && (
              <div className="col-md-4">
                <label className="form-label small fw-semibold">
                  Damage Reason *
                </label>
                <input
                  type="text"
                  name="damageReason"
                  value={form.damageReason}
                  onChange={handleChange}
                  className={`form-control ${errors.damageReason ? "is-invalid" : ""
                    }`}
                />
                {errors.damageReason && (
                  <div className="invalid-feedback d-block">
                    {errors.damageReason}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={!!assetError}
            >
              {editingId ? "Update Tablet" : "Save Tablet"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ---------------- TABLE ---------------- */}
      <div className="card p-2">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : tablets.length === 0 ? (
          <p className="text-center my-3">No tablets found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered text-center table-striped">
              <thead className="table-dark">
                <tr>
                  <th
                    onClick={() => toggleSort("id")}
                    style={{ cursor: "pointer" }}
                  >
                    # {renderSortIcon("id")}
                  </th>
                  <th
                    onClick={() => toggleSort("brand")}
                    style={{ cursor: "pointer" }}
                  >
                    Brand {renderSortIcon("brand")}
                  </th>
                  <th>Model</th>
                  <th>Asset Tag</th>
                  <th>Processor</th>
                  <th
                    onClick={() => toggleSort("ram")}
                    style={{ cursor: "pointer" }}
                  >
                    RAM {renderSortIcon("ram")}
                  </th>
                  <th
                    onClick={() => toggleSort("storage")}
                    style={{ cursor: "pointer" }}
                  >
                    Storage {renderSortIcon("storage")}
                  </th>
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
                    <td>{t.assetTag}</td>
                    <td>{t.processor}</td>
                    <td>{t.ram}</td>
                    <td>{t.storage}</td>
                    <td>{t.location}</td>
                    <td className="d-flex justify-content-center gap-2">
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
        )}
      </div>

      {/* ---------------- PAGINATION ---------------- */}
      <div className="d-flex justify-content-center gap-3 mt-3">
        <Button
          variant="dark"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          ◀ Prev
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="dark"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next ▶
        </Button>
      </div>

      {/* ---------------- MODAL ---------------- */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Tablet Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTablet &&
            Object.entries(selectedTablet).map(([k, v]) => (
              <p key={k}>
                <strong>{k}: </strong>
                {typeof v === "object" ? JSON.stringify(v) : v || "-"}
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
        <Link to="/adminpanel" className="btn btn-outline-dark">
          ⬅ Back to Admin Panel
        </Link>
      </div>
    </div>
  );
}
