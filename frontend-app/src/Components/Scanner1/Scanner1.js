import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Scanner1() {
    const API_URL = "http://localhost:5083/api/scanner1";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [formData, setFormData] = useState(getEmptyForm());
    const [errors, setErrors] = useState({});
    const [assetError, setAssetError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [filters, setFilters] = useState({
        brand: "",
        type: "",
        resolution: "",
        location: "",
    });

    const [sort, setSort] = useState({ by: "id", dir: "asc" });

    const [allOptions, setAllOptions] = useState({
        brands: [],
        types: [],
        resolutions: [],
        locations: [],
    });

    const searchDebounceRef = useRef(null);
    const admin = JSON.parse(localStorage.getItem("user") || "{}");

    // Empty form
    function getEmptyForm() {
        return {
            scanner1Brand: "",
            scanner1Model: "",
            scanner1Type: "",
            scanner1Resolution: "",
            scanner1AssetTag: "",
            purchaseDate: "",
            scanner1Location: "",
            remarks: "",
            damageReasonInput: "",
        };
    }

    // Validation
    const validateForm = () => {
        const newErrors = {};
        const isEmpty = (v) => !v?.toString().trim();

        if (isEmpty(formData.scanner1Brand)) newErrors.scanner1Brand = "Brand is required";
        if (isEmpty(formData.scanner1Model)) newErrors.scanner1Model = "Model is required";
        if (isEmpty(formData.scanner1Type)) newErrors.scanner1Type = "Type is required";
        if (isEmpty(formData.scanner1Resolution)) newErrors.scanner1Resolution = "Resolution is required";
        if (isEmpty(formData.scanner1AssetTag)) newErrors.scanner1AssetTag = "Asset Tag is required";
        if (isEmpty(formData.purchaseDate)) newErrors.purchaseDate = "Purchase Date is required";
        if (isEmpty(formData.scanner1Location)) newErrors.scanner1Location = "Location is required";

        if (isEmpty(formData.remarks)) newErrors.remarks = "Remarks is required";
        else if (formData.remarks === "Yes" && isEmpty(formData.damageReasonInput))
            newErrors.damageReasonInput = "Damage Reason required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fetch Scanner1 list
    const fetchItems = useCallback(
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
                    type: filters.type || undefined,
                    resolution: filters.resolution || undefined,
                    location: filters.location || undefined,
                };

                const res = await axios.get(API_URL, { params });

                setItems(res.data?.data || []);
                setTotalPages(res.data?.totalPages || 1);
                setPage(res.data?.currentPage || 1);
            } catch (err) {
                console.error("Error fetching scanner1", err);
            } finally {
                setLoading(false);
            }
        },
        [filters, searchInput, sort]
    );

    // Debounce search
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => fetchItems(1), 300);
        return () => clearTimeout(searchDebounceRef.current);
    }, [searchInput, filters, sort, fetchItems]);

    // Load page
    useEffect(() => {
        fetchItems(page);
    }, [page, fetchItems]);

    // Load dropdown options
    useEffect(() => {
        axios.get(API_URL + "/options")
            .then((res) => setAllOptions(res.data))
            .catch((err) => console.error("Options load error", err));
    }, []);

    // Input handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    // Duplicate AssetTag check
    const handleAssetTagChange = async (value) => {
        setFormData((prev) => ({ ...prev, scanner1AssetTag: value }));
        if (!value.trim()) return setAssetError("");

        try {
            const res = await axios.get(`${API_URL}/check-duplicate`, {
                params: { assetTag: value },
            });
            setAssetError(res.data?.exists ? "Asset Tag already exists" : "");
        } catch (err) {
            console.error(err);
        }
    };

    // Filter handler
    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (assetError) {
            alert("Fix duplicate Asset Tag before saving");
            return;
        }

        const payload = { ...formData };

        try {
            if (editingId) {
                await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...payload });
                alert("✅ Scanner1(DOCS Scanner) updated successfully");
            } else {
                await axios.post(API_URL, payload);
                alert("✅ Scanner1(DOCS Scanner) added successfully");
            }

            resetForm();
            fetchItems(page);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save scanner");
        }
    };

    // Edit
    const handleEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            scanner1Brand: p.scanner1Brand,
            scanner1Model: p.scanner1Model,
            scanner1Type: p.scanner1Type,
            scanner1Resolution: p.scanner1Resolution,
            scanner1AssetTag: p.scanner1AssetTag,
            purchaseDate: p.purchaseDate?.split("T")[0] || "",
            scanner1Location: p.scanner1Location,
            remarks: p.remarks,
            damageReasonInput: "",
        });
        setShowForm(true);
    };

    // Delete
    const handleDelete = async (id) => {
        const reason = prompt("Enter reason for deleting:");
        if (!reason?.trim()) return alert("Reason is required");
        if (!window.confirm("Delete this scanner?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`, {
                data: { reason, adminName: admin?.name || "Unknown Admin" },
            });
            alert("Scanner deleted");
            fetchItems(page);
        } catch {
            alert("Delete failed");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(getEmptyForm());
        setErrors({});
        setAssetError("");
        setShowForm(false);
    };

    const toggleSort = (field) => {
        setSort((prev) =>
            prev.by === field
                ? { by: field, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { by: field, dir: "asc" }
        );
    };

    const nextPage = () => page < totalPages && setPage(page + 1);
    const prevPage = () => page > 1 && setPage(page - 1);

    const renderSortIcon = (field) =>
        sort.by === field ? (sort.dir === "asc" ? " ▲" : " ▼") : "";

    // PDF Export
    const exportToPDF = () => {
        if (!items.length) return alert("No data to export");

        const doc = new jsPDF({ orientation: "landscape" });

        autoTable(doc, {
            head: [[
                "#", "Brand", "Model", "Type", "Resolution",
                "Asset Tag", "Location",
            ]],
            body: items.map((p, i) => [
                (page - 1) * pageSize + i + 1,
                p.scanner1Brand,
                p.scanner1Model,
                p.scanner1Type,
                p.scanner1Resolution,
                p.scanner1AssetTag,
                p.scanner1Location,
            ]),
        });

        doc.save(`scanner1_${Date.now()}.pdf`);
    };

    return (
        <div className="scanner1-page container-fluid mt-4 mb-5 px-2">
            <h3 className="text-center mb-4">📠 Scanner1(DOCS Scanner)</h3>

            {/* Filters */}
            <div className="card p-3 mb-3">
                <div className="row g-2 align-items-center">
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
                            name="brand"
                            className="form-select"
                            value={filters.brand}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Brands</option>
                            {allOptions.brands.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-auto">
                        <select
                            name="type"
                            className="form-select"
                            value={filters.type}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Types</option>
                            {allOptions.types.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-auto">
                        <select
                            name="resolution"
                            className="form-select"
                            value={filters.resolution}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Resolutions</option>
                            {allOptions.resolutions.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-auto">
                        <select
                            name="location"
                            className="form-select"
                            value={filters.location}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Locations</option>
                            {allOptions.locations.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col ms-auto d-flex gap-2 justify-content-end">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setFilters({ brand: "", type: "", resolution: "", location: "" });
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

            {/* Add Scanner Button */}
            {!showForm && (
                <div className="text-center mb-3">
                    <button
                        className="btn btn-success px-4 py-2"
                        onClick={() => setShowForm(true)}
                    >
                        ➕ Add Scanner1(DOCS Scanner)
                    </button>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <form className="card p-3 shadow-sm mb-4" onSubmit={handleSubmit}>
                    <h5 className="text-center fw-bold mb-3">
                        {editingId ? "✏️ Edit Scanner1(DOCS Scanner)" : "🆕 Add Scanner1(DOCS Scanner)"}
                    </h5>

                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Brand *</label>
                            <input
                                type="text"
                                name="scanner1Brand"
                                value={formData.scanner1Brand}
                                onChange={handleChange}
                                className={`form-control ${errors.scanner1Brand ? "is-invalid" : ""}`}
                            />
                            {errors.scanner1Brand && <div className="text-danger small">{errors.scanner1Brand}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Model *</label>
                            <input
                                type="text"
                                name="scanner1Model"
                                value={formData.scanner1Model}
                                onChange={handleChange}
                                className={`form-control ${errors.scanner1Model ? "is-invalid" : ""}`}
                            />
                            {errors.scanner1Model && <div className="text-danger small">{errors.scanner1Model}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Type *</label>
                            <select
                                name="scanner1Type"
                                value={formData.scanner1Type}
                                onChange={handleChange}
                                className={`form-select ${errors.scanner1Type ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Type</option>
                                <option value="Flatbed">Flatbed</option>
                                <option value="Sheet-fed">Sheet-fed</option>
                                <option value="Portable">Portable</option>
                                <option value="Document Scanner">Document Scanner</option>
                            </select>
                            {errors.scanner1Type && <div className="text-danger small">{errors.scanner1Type}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Resolution *</label>
                            <select
                                name="scanner1Resolution"
                                value={formData.scanner1Resolution}
                                onChange={handleChange}
                                className={`form-select ${errors.scanner1Resolution ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Resolution</option>
                                <option value="600">600</option>
                                <option value="1200">1200</option>
                                <option value="2400">2400</option>
                            </select>
                            {errors.scanner1Resolution && <div className="text-danger small">{errors.scanner1Resolution}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Asset Tag *</label>
                            <input
                                type="text"
                                name="scanner1AssetTag"
                                value={formData.scanner1AssetTag}
                                onChange={(e) => handleAssetTagChange(e.target.value)}
                                className={`form-control ${errors.scanner1AssetTag || assetError ? "is-invalid" : ""}`}
                            />
                            {errors.scanner1AssetTag && <div className="text-danger small">{errors.scanner1AssetTag}</div>}
                            {assetError && <div className="text-danger small">{assetError}</div>}
                        </div>

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

                        <div className="col-md-4">
                            <label className="form-label">Location *</label>
                            <input
                                type="text"
                                name="scanner1Location"
                                value={formData.scanner1Location}
                                onChange={handleChange}
                                className={`form-control ${errors.scanner1Location ? "is-invalid" : ""}`}
                            />
                            {errors.scanner1Location && <div className="text-danger small">{errors.scanner1Location}</div>}
                        </div>

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
                                        damageReasonInput: value === "Yes" ? prev.damageReasonInput : "",
                                    }));
                                }}
                                className={`form-select ${errors.remarks ? "is-invalid" : ""}`}
                            >
                                <option value="">Select</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                            {errors.remarks && <div className="text-danger small">{errors.remarks}</div>}
                        </div>

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
                        <button type="submit" className="btn btn-primary px-4 me-2">
                            {editingId ? "Update" : "Save"}
                        </button>
                        <button type="button" className="btn btn-secondary px-4" onClick={resetForm}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center">
                    <div className="spinner-border"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="alert alert-info text-center">No scanner records found</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped table-hover text-center">
                            <thead className="table-dark">
                                <tr>
                                    <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}>
                                        # {renderSortIcon("id")}
                                    </th>
                                    <th onClick={() => toggleSort("brand")} style={{ cursor: "pointer" }}>
                                        Brand {renderSortIcon("brand")}
                                    </th>
                                    <th onClick={() => toggleSort("model")} style={{ cursor: "pointer" }}>
                                        Model {renderSortIcon("model")}
                                    </th>
                                    <th>Type</th>
                                    <th>Resolution</th>
                                    <th>Asset Tag</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{(page - 1) * pageSize + i + 1}</td>
                                        <td>{p.scanner1Brand}</td>
                                        <td>{p.scanner1Model}</td>
                                        <td>{p.scanner1Type}</td>
                                        <td>{p.scanner1Resolution}</td>
                                        <td>{p.scanner1AssetTag}</td>
                                        <td>{p.scanner1Location}</td>

                                        <td className="d-flex justify-content-center gap-2 flex-wrap">
                                            <button
                                                className="btn btn-info btn-sm"
                                                onClick={() => {
                                                    setSelectedItem(p);
                                                    setShowModal(true);
                                                }}
                                            >
                                                View
                                            </button>

                                            <button className="btn btn-warning btn-sm" onClick={() => handleEdit(p)}>
                                                Edit
                                            </button>

                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
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
                            ◀ Prev
                        </button>

                        <span className="align-self-center">
                            Page {page} of {totalPages}
                        </span>

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
            <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Scanner Details</Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    {selectedItem &&
                        Object.entries(selectedItem).map(([key, value]) => (
                            <p key={key}>
                                <strong className="text-capitalize">{key}:</strong>{" "}
                                {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : value?.toString() || "-"}
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
