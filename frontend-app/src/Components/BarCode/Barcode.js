import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Scanner1() {
    const API_URL = "http://localhost:5083/api/barcodes";

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
        technology: "",
        location: "",
    });
    const [sort, setSort] = useState({ by: "id", dir: "asc" });
    const [allOptions, setAllOptions] = useState({
        brands: [],
        types: [],
        technology: [],
        locations: [],
    });
    const searchDebounceRef = useRef(null);
    const admin = JSON.parse(localStorage.getItem("user") || "{}");

    // Empty form
    function getEmptyForm() {
        return {
            Brand: "",
            Model: "",
            Type: "",
            Technology: "",
            AssetTag: "",
            purchaseDate: "",
            Location: "",
            remarks: "",
            damageReasonInput: "",
        };
    }

    // Validation
    const validateForm = () => {
        const newErrors = {};
        const isEmpty = (v) => !v?.toString().trim();
        if (isEmpty(formData.Brand)) newErrors.Brand = "Brand is required";
        if (isEmpty(formData.Model)) newErrors.Model = "Model is required";
        if (isEmpty(formData.Type)) newErrors.Type = "Type is required";
        if (isEmpty(formData.Technology)) newErrors.Technology = "Technology is required";
        if (isEmpty(formData.purchaseDate)) newErrors.purchaseDate = "Purchase Date is required";
        if (isEmpty(formData.Location)) newErrors.Location = "Location is required";

        if (isEmpty(formData.remarks)) newErrors.remarks = "Remarks is required";
        else if (formData.remarks === "Yes" && isEmpty(formData.damageReasonInput))
            newErrors.damageReasonInput = "Damage Reason required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fetch Barcode list
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
                    technology: filters.technology || undefined,
                    location: filters.location || undefined,
                };

                const res = await axios.get(API_URL, { params });

                setItems(res.data?.data || []);
                setTotalPages(res.data?.totalPages || 1);
                setPage(res.data?.currentPage || 1);
            } catch (err) {
                console.error("Error fetching barcode scanners", err);
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
                alert("✅ Barcode Scanner updated successfully");
            } else {
                await axios.post(API_URL, payload);
                alert("✅ Barcode Scanner added successfully");
            }

            resetForm();
            fetchItems(page);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save scanner");
        }
    };


    const fetchNextBarCodeAssetTag = async () => {
        try {
            const res = await axios.get(`${API_URL}/next-asset-tag`);
            setFormData((p) => ({
                ...p,
                AssetTag: res.data.assetTag || ""
            }));
        } catch (err) {
            alert("No available barcode scanner asset tags. Please create a purchase order.");
        }
    };

    // Edit
    const handleEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            Brand: p.Brand,
            Model: p.Model,
            Type: p.Type,
            Technology: p.Technology,
            AssetTag: p.AssetTag,
            purchaseDate: p.purchaseDate?.split("T")[0] || "",
            Location: p.Location,
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
                "#", "Brand", "Model", "Type", "Technology",
                "Asset Tag", "Location",
            ]],
            body: items.map((p, i) => [
                (page - 1) * pageSize + i + 1,
                p.Brand,
                p.Model,
                p.Type,
                p.Technology,
                p.AssetTag,
                p.Location,
            ]),
        });

        doc.save(`barcodes${Date.now()}.pdf`);
    };

    return (
        <div className="barcode-page container-fluid mt-4 mb-5 px-2">
            <h3 className="text-center mb-4">📠 Barcode Scanner</h3>

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
                            name="technology"
                            className="form-select"
                            value={filters.technology}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Technologies</option>
                            {allOptions.technology.map((p) => (
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
                                setFilters({ brand: "", type: "", technology: "", location: "" });
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

            {/* Add Barcode Button */}
            {!showForm && (
                <div className="text-center mb-3">
                    <button
                        className="btn btn-success px-4 py-2"
                        onClick={() => {
                            setShowForm(true);
                            fetchNextBarCodeAssetTag();
                        }}>
                        ➕ Add Barcode Scanner
                    </button>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <form className="card p-3 shadow-sm mb-4" onSubmit={handleSubmit}>
                    <h5 className="text-center fw-bold mb-3">
                        {editingId ? "✏️ Edit Barcode Scanner" : "🆕 Add Barcode Scanner"}
                    </h5>

                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Brand *</label>
                            <input
                                type="text"
                                name="Brand"
                                value={formData.Brand}
                                onChange={handleChange}
                                className={`form-control ${errors.Brand ? "is-invalid" : ""}`}
                            />
                            {errors.Brand && <div className="text-danger small">{errors.Brand}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Model *</label>
                            <input
                                type="text"
                                name="Model"
                                value={formData.Model}
                                onChange={handleChange}
                                className={`form-control ${errors.Model ? "is-invalid" : ""}`}
                            />
                            {errors.Model && <div className="text-danger small">{errors.Model}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Type *</label>
                            <select
                                name="Type"
                                value={formData.Type}
                                onChange={handleChange}
                                className={`form-select ${errors.Type ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Type</option>
                                <option value="Flatbed">Flatbed</option>
                                <option value="Sheet-fed">Sheet-fed</option>
                                <option value="Portable">Portable</option>
                                <option value="Document Scanner">Document Scanner</option>
                            </select>
                            {errors.Type && <div className="text-danger small">{errors.Type}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Technology *</label>
                            <select
                                name="Technology"
                                value={formData.Technology}
                                onChange={handleChange}
                                className={`form-select ${errors.Technology ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Technology</option>
                                <option value="600">600</option>
                                <option value="1200">1200</option>
                                <option value="2400">2400</option>
                            </select>
                            {errors.Technology && <div className="text-danger small">{errors.Technology}</div>}
                        </div>

                        {/* Asset Tag */}
                        <div className="col-12 col-sm-6 col-md-4 px-2">
                            <label className="form-label small fw-semibold">Asset Tag *</label>
                            <input
                                type="text"
                                name="AssetTag"
                                value={formData.AssetTag}
                                readOnly
                                className={`form-control ${errors.assetTag ? "is-invalid" : ""} bg-light`}
                            />
                            <small className="text-muted">
                                Auto-generated from Purchase Orders
                            </small>
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
                                name="Location"
                                value={formData.Location}
                                onChange={handleChange}
                                className={`form-control ${errors.Location ? "is-invalid" : ""}`}
                            />
                            {errors.Location && <div className="text-danger small">{errors.Location}</div>}
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
                <div className="alert alert-info text-center">No Barcode Scanner records found</div>
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
                                    <th>Technology</th>
                                    <th>Asset Tag</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{(page - 1) * pageSize + i + 1}</td>
                                        <td>{p.brand}</td>
                                        <td>{p.model}</td>
                                        <td>{p.type}</td>
                                        <td>{p.technology}</td>
                                        <td>{p.assetTag}</td>
                                        <td>{p.location}</td>
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
                    <Modal.Title>Barcode Scanner Details</Modal.Title>
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
