import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Laptop() {
    const [laptops, setLaptops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false); // <-- Toggle form visibility

    // Form fields
    const [brand, setBrand] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [assetTag, setAssetTag] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [warrantyExpiry, setWarrantyExpiry] = useState("");
    const [processor, setProcessor] = useState("");
    const [ram, setRam] = useState("");
    const [storage, setStorage] = useState("");
    const [graphicsCard, setGraphicsCard] = useState("");
    const [displaySize, setDisplaySize] = useState("");
    const [operatingSystem, setOperatingSystem] = useState("");
    const [batteryCapacity, setBatteryCapacity] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState("Available");
    const [assignedTo, setAssignedTo] = useState("");
    const [remarks, setRemarks] = useState("");
    const [lastServicedDate, setLastServicedDate] = useState("");

    const API_URL = "http://localhost:5083/api/laptops";

    const fetchLaptops = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setLaptops(res.data);
        } catch (error) {
            console.error("Error fetching laptops:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLaptops();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!brand.trim() || !serialNumber.trim()) {
            alert("Brand and Serial Number are required");
            return;
        }

        const laptopData = {
            brand,
            serialNumber,
            assetTag,
            purchaseDate: purchaseDate || null,
            warrantyExpiry: warrantyExpiry || null,
            processor,
            ram,
            storage,
            graphicsCard,
            displaySize,
            operatingSystem,
            batteryCapacity,
            location,
            status,
            assignedTo,
            remarks,
            lastServicedDate: lastServicedDate || null,
        };

        try {
            if (editingId) {
                await axios.put(`${API_URL}/${editingId}`, laptopData);
                alert("Laptop updated successfully!");
            } else {
                await axios.post(API_URL, laptopData);
                alert("Laptop added successfully!");
            }
            resetForm();
            setShowForm(false); // hide form after submit
            fetchLaptops();
        } catch (error) {
            console.error("Error saving laptop:", error);
            alert("Failed to save laptop");
        }
    };

    const handleEdit = (laptop) => {
        setEditingId(laptop.id);
        setBrand(laptop.brand);
        setSerialNumber(laptop.serialNumber);
        setAssetTag(laptop.assetTag);
        setPurchaseDate(laptop.purchaseDate ? laptop.purchaseDate.split("T")[0] : "");
        setWarrantyExpiry(laptop.warrantyExpiry ? laptop.warrantyExpiry.split("T")[0] : "");
        setProcessor(laptop.processor);
        setRam(laptop.ram);
        setStorage(laptop.storage);
        setGraphicsCard(laptop.graphicsCard);
        setDisplaySize(laptop.displaySize);
        setOperatingSystem(laptop.operatingSystem);
        setBatteryCapacity(laptop.batteryCapacity);
        setLocation(laptop.location);
        setStatus(laptop.status);
        setAssignedTo(laptop.assignedTo);
        setRemarks(laptop.remarks);
        setLastServicedDate(laptop.lastServicedDate ? laptop.lastServicedDate.split("T")[0] : "");
        setShowForm(true); // show form when editing
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this laptop?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            alert("Laptop deleted successfully!");
            fetchLaptops();
        } catch (error) {
            console.error("Error deleting laptop:", error);
            alert("Failed to delete laptop");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setBrand("");
        setSerialNumber("");
        setAssetTag("");
        setPurchaseDate("");
        setWarrantyExpiry("");
        setProcessor("");
        setRam("");
        setStorage("");
        setGraphicsCard("");
        setDisplaySize("");
        setOperatingSystem("");
        setBatteryCapacity("");
        setLocation("");
        setStatus("Available");
        setAssignedTo("");
        setRemarks("");
        setLastServicedDate("");
    };

    const [showModal, setShowModal] = useState(false);
    const [selectedLaptop, setSelectedLaptop] = useState(null);

    const handleShowModal = (laptop) => {
        setSelectedLaptop(laptop);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setSelectedLaptop(null);
        setShowModal(false);
    };

    return (
        <div className="container mt-4">
            <h3 className="text-center mb-4">Laptop Inventory</h3>

            {/* Add New Laptop Button */}
            {!showForm && (
                <div className="mb-3 text-center">
                    <button className="btn btn-success" onClick={() => setShowForm(true)}>
                        Add New Laptop
                    </button>
                </div>
            )}

            {/* Laptop Form */}
            {showForm && (
                <div className="card p-4 shadow-sm mb-4">
                    <h4>{editingId ? "Edit Laptop" : "Add Laptop"}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Brand</label>
                                <input type="text" className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Serial Number</label>
                                <input type="text" className="form-control" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Asset Tag</label>
                                <input type="text" className="form-control" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} />
                            </div>
                            {/* Rest of the form fields here... */}
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Purchase Date</label>
                                <input type="date" className="form-control" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Warranty Expiry</label>
                                <input type="date" className="form-control" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Processor</label>
                                <input type="text" className="form-control" value={processor} onChange={(e) => setProcessor(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">RAM</label>
                                <input type="text" className="form-control" value={ram} onChange={(e) => setRam(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Storage</label>
                                <input type="text" className="form-control" value={storage} onChange={(e) => setStorage(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Graphics Card</label>
                                <input type="text" className="form-control" value={graphicsCard} onChange={(e) => setGraphicsCard(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Display Size</label>
                                <input type="text" className="form-control" value={displaySize} onChange={(e) => setDisplaySize(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">OS</label>
                                <input type="text" className="form-control" value={operatingSystem} onChange={(e) => setOperatingSystem(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Battery</label>
                                <input type="text" className="form-control" value={batteryCapacity} onChange={(e) => setBatteryCapacity(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Location</label>
                                <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Status</label>
                                <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option>Available</option>
                                    <option>Assigned</option>
                                    <option>Under Repair</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Assigned To</label>
                                <input type="text" className="form-control" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
                            </div>
                            <div className="col-md-5 mb-3">
                                <label className="form-label">Remarks</label>
                                <input type="text" className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Last Serviced Date</label>
                                <input type="date" className="form-control" value={lastServicedDate} onChange={(e) => setLastServicedDate(e.target.value)} />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary me-2">{editingId ? "Update Laptop" : "Add Laptop"}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
                    </form>
                </div>
            )}

            {/* Laptop Table */}
            {loading ? (
                <div className="text-center my-3">
                    <div className="spinner-border" role="status"></div>
                </div>
            ) : laptops.length > 0 ? (
                <>
                    <table className="table table-bordered text-center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Brand</th>
                                <th>Serial Number</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {laptops.map((laptop, idx) => (
                                <tr key={laptop.id}>
                                    <td>{idx + 1}</td>
                                    <td>{laptop.brand}</td>
                                    <td>{laptop.serialNumber}</td>
                                    <td>{laptop.status}</td>
                                    <td>
                                        <button
                                            className="btn btn-info btn-sm me-2"
                                            onClick={() => handleShowModal(laptop)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            onClick={() => handleEdit(laptop)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(laptop.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Modal moved outside the table */}
                    <Modal show={showModal} onHide={handleCloseModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Laptop Details</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {selectedLaptop && (
                                <div>
                                    <p><strong>Brand:</strong> {selectedLaptop.brand}</p>
                                    <p><strong>Serial Number:</strong> {selectedLaptop.serialNumber}</p>
                                    <p><strong>Asset Tag:</strong> {selectedLaptop.assetTag}</p>
                                    <p><strong>Processor:</strong> {selectedLaptop.processor}</p>
                                    <p><strong>RAM:</strong> {selectedLaptop.ram}</p>
                                    <p><strong>Storage:</strong> {selectedLaptop.storage}</p>
                                    <p><strong>Graphics Card:</strong> {selectedLaptop.graphicsCard}</p>
                                    <p><strong>Display Size:</strong> {selectedLaptop.displaySize}</p>
                                    <p><strong>OS:</strong> {selectedLaptop.operatingSystem}</p>
                                    <p><strong>Battery:</strong> {selectedLaptop.batteryCapacity}</p>
                                    <p><strong>Location:</strong> {selectedLaptop.location}</p>
                                    <p><strong>Status:</strong> {selectedLaptop.status}</p>
                                    <p><strong>Assigned To:</strong> {selectedLaptop.assignedTo}</p>
                                    <p><strong>Remarks:</strong> {selectedLaptop.remarks}</p>
                                    <p><strong>Purchase Date:</strong> {selectedLaptop.purchaseDate}</p>
                                    <p><strong>Warranty Expiry:</strong> {selectedLaptop.warrantyExpiry}</p>
                                    <p><strong>Last Serviced:</strong> {selectedLaptop.lastServicedDate}</p>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            ) : (
                <p>No laptops found.</p>
            )}

            <Link to="/adminpanel" className="btn btn-secondary mt-3">Back to Admin Panel</Link>
        </div>
    );
}

export default Laptop;
