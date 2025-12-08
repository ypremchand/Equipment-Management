import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Printers() {
    const API_URL = "http://localhost:5083/api/printers";

    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(null);

    const [formData, setFormData] = useState(getEmptyForm());
    const [errors, setErrors] = useState({});
    const [assetError, setAssetError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [filters, setFilters] = useState({
        brand: "",
        printerType: "",
        paperSize: "",
        location: "",
    });

    const [sort, setSort] = useState({ by: "id", dir: "asc" });

    const [allOptions, setAllOptions] = useState({
        brands: [],
        printerTypes: [],
        paperSizes: [],
        locations: [],
    });

    const searchDebounceRef = useRef(null);
    const admin = JSON.parse(localStorage.getItem("user") || "{}");

    // Empty form structure
    function getEmptyForm() {
        return {
            brand: "",
            model: "",
            printerType: "",
            paperSize: "",
            dpi: "",
            assetTag: "",
            purchaseDate: "",
            location: "",
            remarks: "",
            damageReasonInput: "",
        };
    }

    // Validation
    const validateForm = () => {
        const newErrors = {};
        const isEmpty = (v) => !v?.toString().trim();

        if (isEmpty(formData.brand)) newErrors.brand = "Brand is required";
        if (isEmpty(formData.model)) newErrors.model = "Model is required";
        if (isEmpty(formData.printerType)) newErrors.printerType = "Printer Type is required";
        if (isEmpty(formData.paperSize)) newErrors.paperSize = "Paper Size is required";
        if (isEmpty(formData.dpi)) newErrors.dpi = "DPI is required";
        if (isEmpty(formData.assetTag)) newErrors.assetTag = "Asset Tag is required";
        if (isEmpty(formData.purchaseDate)) newErrors.purchaseDate = "Purchase Date is required";
        if (isEmpty(formData.location)) newErrors.location = "Location is required";

        if (isEmpty(formData.remarks)) newErrors.remarks = "Remarks is required";
        else if (formData.remarks === "Yes" && isEmpty(formData.damageReasonInput))
            newErrors.damageReasonInput = "Damage Reason required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fetch printers
    const fetchPrinters = useCallback(
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
                    printerType: filters.printerType || undefined,
                    paperSize: filters.paperSize || undefined,
                    location: filters.location || undefined,
                };

                const res = await axios.get(API_URL, { params });

                setPrinters(res.data?.data || []);
                setTotalPages(res.data?.totalPages || 1);
                setPage(res.data?.currentPage || 1);
            } catch (err) {
                console.error("Error fetching printers", err);
            } finally {
                setLoading(false);
            }
        },
        [filters, searchInput, sort]
    );

    // Debounce search
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => fetchPrinters(1), 300);
        return () => clearTimeout(searchDebounceRef.current);
    }, [searchInput, filters, sort, fetchPrinters]);

    // Fetch pages
    useEffect(() => {
        fetchPrinters(page);
    }, [page, fetchPrinters]);

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

    // Duplicate asset check
    const handleAssetTagChange = async (value) => {
        setFormData((prev) => ({ ...prev, assetTag: value }));
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

    // Filter
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
                alert("✅ Printer updated successfully");
            } else {
                await axios.post(API_URL, payload);
                alert("✅ Printer added successfully");
            }

            resetForm();
            fetchPrinters(page);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save printer");
        }
    };

    // Edit
    const handleEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            brand: p.brand,
            model: p.model,
            printerType: p.printerType,
            paperSize: p.paperSize,
            dpi: p.dpi,
            assetTag: p.assetTag,
            purchaseDate: p.purchaseDate?.split("T")[0] || "",
            location: p.location,
            remarks: p.remarks,
            damageReasonInput: "",
        });
        setShowForm(true);
    };

    // Delete
    const handleDelete = async (id) => {
        const reason = prompt("Enter reason for deleting this printer:");
        if (!reason?.trim()) return alert("Reason is required");
        if (!window.confirm("Delete this printer?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`, {
                data: { reason, adminName: admin?.name || "Unknown Admin" },
            });
            alert("Printer deleted");
            fetchPrinters(page);
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

    // Export to PDF
    const exportToPDF = () => {
        if (!printers.length) return alert("No data to export");

        const doc = new jsPDF({ orientation: "landscape" });

        autoTable(doc, {
            head: [[
                "#", "Brand", "Model", "Type", "Paper Size",
                "DPI", "Asset Tag", "Location",
            ]],
            body: printers.map((p, i) => [
                (page - 1) * pageSize + i + 1,
                p.brand,
                p.model,
                p.printerType,
                p.paperSize,
                p.dpi,
                p.assetTag,
                p.location,
            ]),
        });

        doc.save(`printers_${Date.now()}.pdf`);
    };

    return (
        <div className="printers-page container-fluid mt-4 mb-5 px-2">
            <h3 className="text-center mb-4">🖨️ Printers</h3>

            {/* Filters */}
            <div className="card p-3 mb-3">
                <div className="row g-2 align-items-center">

                    {/* Search */}
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
                            name="brand"
                            className="form-select"
                            value={filters.brand}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Brands</option>
                            {(allOptions.brands || []).map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}

                        </select>
                    </div>

                    {/* Type */}
                    <div className="col-auto">
                        <select
                            name="printerType"
                            className="form-select"
                            value={filters.printerType}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Types</option>
                            {(allOptions.printerTypes || []).map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}

                        </select>
                    </div>

                    {/* Paper Size */}
                    <div className="col-auto">
                        <select
                            name="paperSize"
                            className="form-select"
                            value={filters.paperSize}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Paper Sizes</option>
                            {(allOptions.paperSizes || []).map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}

                        </select>
                    </div>

                    {/* Location */}
                    <div className="col-auto">
                        <select
                            name="location"
                            className="form-select"
                            value={filters.location}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Locations</option>
                            {(allOptions.locations || []).map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}

                        </select>
                    </div>

                    <div className="col ms-auto d-flex gap-2 justify-content-end">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setFilters({ brand: "", printerType: "", paperSize: "", location: "" });
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

            {/* Add Printer Button */}
            {!showForm && (
                <div className="text-center mb-3">
                    <button
                        className="btn btn-success px-4 py-2"
                        onClick={() => setShowForm(true)}
                    >
                        ➕ Add Printer
                    </button>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <form className="card p-3 shadow-sm mb-4" onSubmit={handleSubmit}>
                    <h5 className="text-center fw-bold mb-3">
                        {editingId ? "✏️ Edit Printer" : "🆕 Add Printer"}
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

                        {/* Model */}
                        <div className="col-md-4">
                            <label className="form-label">Model *</label>
                            <select
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className={`form-select ${errors.model ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Model</option>
                                <option value="HP 1020">HP 1020</option>
                                <option value="HP LaserJet 1320">HP LaserJet 1320</option>
                                <option value="Canon LBP2900">Canon LBP2900</option>
                                <option value="Epson L3110">Epson L3110</option>
                                <option value="Brother HL-L2321D">Brother HL-L2321D</option>
                            </select>
                            {errors.model && <div className="text-danger small">{errors.model}</div>}
                        </div>

                        {/* Printer Type */}
                        <div className="col-md-4">
                            <label className="form-label">Printer Type *</label>
                            <select
                                name="printerType"
                                value={formData.printerType}
                                onChange={handleChange}
                                className={`form-select ${errors.printerType ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Type</option>
                                <option value="Laser">Laser</option>
                                <option value="Inkjet">Inkjet</option>
                                <option value="Dot-Matrix">Dot-Matrix</option>
                                <option value="Thermal">Thermal</option>
                                <option value="All-in-One">All-in-One</option>
                            </select>
                            {errors.printerType && <div className="text-danger small">{errors.printerType}</div>}
                        </div>

                        {/* Paper Size */}
                        <div className="col-md-4">
                            <label className="form-label">Paper Size *</label>
                            <select
                                name="paperSize"
                                value={formData.paperSize}
                                onChange={handleChange}
                                className={`form-select ${errors.paperSize ? "is-invalid" : ""}`}
                            >
                                <option value="">Select Paper Size</option>
                                <option value="A4">A4</option>
                                <option value="A5">A5</option>
                                <option value="Letter">Letter</option>
                                <option value="Legal">Legal</option>
                                <option value="Executive">Executive</option>
                            </select>
                            {errors.paperSize && <div className="text-danger small">{errors.paperSize}</div>}
                        </div>

                        {/* DPI */}
                        <div className="col-md-4">
                            <label className="form-label">DPI *</label>
                            <select
                                name="dpi"
                                value={formData.dpi}
                                onChange={handleChange}
                                className={`form-select ${errors.dpi ? "is-invalid" : ""}`}
                            >
                                <option value="">Select DPI</option>
                                <option value="300">300</option>
                                <option value="600">600</option>
                                <option value="1200">1200</option>
                            </select>
                            {errors.dpi && <div className="text-danger small">{errors.dpi}</div>}
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
                            {errors.location && <div className="text-danger small">{errors.location}</div>}
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
                        <button type="submit" className="btn btn-primary px-4 me-2">
                            {editingId ? "Update Printer" : "Save Printer"}
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
            ) : printers.length === 0 ? (
                <div className="alert alert-info text-center">No printers found</div>
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
                                    <th>Paper Size</th>
                                    <th>DPI</th>
                                    <th>Asset Tag</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {printers.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{(page - 1) * pageSize + i + 1}</td>
                                        <td>{p.brand}</td>
                                        <td>{p.model}</td>
                                        <td>{p.printerType}</td>
                                        <td>{p.paperSize}</td>
                                        <td>{p.dpi}</td>
                                        <td>{p.assetTag}</td>
                                        <td>{p.location}</td>

                                        <td className="d-flex justify-content-center gap-2 flex-wrap">
                                            <button
                                                className="btn btn-info btn-sm"
                                                onClick={() => {
                                                    setSelectedPrinter(p);
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
                    <Modal.Title>Printer Details</Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    {selectedPrinter &&
                        Object.entries(selectedPrinter).map(([key, value]) => (
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
