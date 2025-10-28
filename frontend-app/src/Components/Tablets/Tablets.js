import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Tablets() {
    const [tablets, setTablets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        brand: "",
        model: "",
        serialNumber: "",
        assetTag: "",
        purchaseDate: "",
        processor: "",
        ram: "",
        storage: "",
        displaySize: "",
        batteryCapacity: "",
        operatingSystem: "",
        simSupport: "",
        networkType: "",
        location: "",
        status: "Available",
        assignedTo: "",
        remarks: "",
        lastServicedDate: ""
    });

    const API_URL = "http://localhost:5083/api/tablets";

    const fetchTablets = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setTablets(res.data);
        } catch (error) {
            console.error("Error fetching tablets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTablets();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_URL}/${editingId}`, form);
                alert("Tablet updated successfully!");
            } else {
                await axios.post(API_URL, form);
                alert("Tablet added successfully!");
            }
            resetForm();
            setShowForm(false);
            fetchTablets();
        } catch (error) {
            console.error("Error saving tablet:", error);
            alert("Failed to save tablet");
        }
    };

    const handleEdit = (tablet) => {
        setEditingId(tablet.id);
        setForm({ ...tablet });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tablet?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            alert("Tablet deleted successfully!");
            fetchTablets();
        } catch (error) {
            console.error("Error deleting tablet:", error);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            brand: "",
            model: "",
            serialNumber: "",
            assetTag: "",
            purchaseDate: "",
            processor: "",
            ram: "",
            storage: "",
            displaySize: "",
            batteryCapacity: "",
            operatingSystem: "",
            simSupport: "",
            networkType: "",
            location: "",
            status: "Available",
            assignedTo: "",
            remarks: "",
            lastServicedDate: ""
        });
    };

    const [showModal, setShowModal] = useState(false);
    const [selectedTablet, setSelectedTablet] = useState(null);

    return (
        <div className="container mt-4">
            <h3 className="text-center mb-4">Tablet Inventory</h3>

            {!showForm && (
                <div className="text-center mb-3">
                    <button className="btn btn-success" onClick={() => setShowForm(true)}>
                        Add New Tablet
                    </button>
                </div>
            )}

            {showForm && (
                <form className="card p-4 shadow-sm mb-4" onSubmit={handleSubmit}>
                    <h4>{editingId ? "Edit Tablet" : "Add Tablet"}</h4>
                    <div className="row">
                        {Object.keys(form).map((key) => (
                            <div className="col-md-4 mb-3" key={key}>
                                <label className="form-label text-capitalize">{key}</label>
                                <input
                                    type={key.toLowerCase().includes("date") ? "date" : "text"}
                                    name={key}
                                    value={form[key] || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <button type="submit" className="btn btn-primary me-2">
                            {editingId ? "Update" : "Save"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
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

            {loading ? (
                <div className="text-center my-3">
                    <div className="spinner-border" role="status"></div>
                </div>
            ) : tablets.length > 0 ? (
                <table className="table table-bordered text-center">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tablets.map((tablet, idx) => (
                            <tr key={tablet.id}>
                                <td>{idx + 1}</td>
                                <td>{tablet.brand}</td>
                                <td>{tablet.model}</td>
                                <td>{tablet.status}</td>
                                <td>
                                    <button
                                        className="btn btn-info btn-sm me-2"
                                        onClick={() => {
                                            setSelectedTablet(tablet);
                                            setShowModal(true);
                                        }}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        onClick={() => handleEdit(tablet)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(tablet.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No tablets found.</p>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Tablet Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTablet && (
                        <div>
                            {Object.keys(selectedTablet).map((key) => (
                                <p key={key}>
                                    <strong className="text-capitalize">{key}: </strong>
                                    {selectedTablet[key]?.toString()}
                                </p>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Link to="/adminpanel" className="btn btn-secondary mt-3">
                Back to Admin Panel
            </Link>
        </div>
    );
}

export default Tablets;
