import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Spinner, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5083/api/AssetRequests";

  // ✅ Fetch all requests (admin view)
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setMessage("❌ Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ Approve a request
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this request?")) return;
    try {
      await axios.post(`${API_URL}/approve/${id}`);
      setMessage("✅ Request approved successfully!");
      fetchRequests();
      window.dispatchEvent(new Event("assetsUpdated"));
    } catch (error) {
      console.error(error);
      setMessage("❌ Error approving request");
    }
  };

  // ✅ Reject a request
  const handleReject = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await axios.post(`${API_URL}/reject/${id}`);
      setMessage("🚫 Request rejected successfully!");
      fetchRequests();
      window.dispatchEvent(new Event("assetsUpdated"));
    } catch (error) {
      console.error(error);
      setMessage("❌ Error rejecting request");
    }
  };

  // ✅ View request details (Modal)
  const handleView = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // ✅ Delete request (permanent)
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this request? (If approved, stock will be restored automatically)"
      )
    )
      return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setMessage("🗑️ Request deleted successfully!");
      fetchRequests();
      window.dispatchEvent(new Event("assetsUpdated"));
    } catch (error) {
      console.error(error);
      setMessage("❌ Error deleting request");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📦 Asset Requests (Admin Panel)</h2>

      {message && <div className="alert alert-info text-center">{message}</div>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading requests...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-dark text-center">
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Email</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-center align-middle">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="7">No requests found.</td>
              </tr>
            ) : (
              requests.map((req, index) => (
                <tr key={req.id}>
                  <td>{index + 1}</td>
                  <td>{req.user?.name || "N/A"}</td>
                  <td>{req.user?.email || "N/A"}</td>
                  <td>{req.location?.name || "N/A"}</td>
                  <td>{new Date(req.requestDate).toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        String(req.status).trim().toLowerCase() === "pending" ||
                        String(req.status).trim().toLowerCase() === "requested" ||
                        String(req.status).trim() === "0"
                          ? "bg-warning text-dark"
                          : String(req.status).trim().toLowerCase() === "approved"
                          ? "bg-success"
                          : String(req.status).trim().toLowerCase() === "rejected"
                          ? "bg-danger"
                          : "bg-secondary"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => handleView(req)}
                    >
                      View
                    </Button>

                    {/* ✅ Approve/Reject only for pending/requested */}
                    {["pending", "requested", "0"].includes(
                      String(req.status).trim().toLowerCase()
                    ) && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleApprove(req.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="me-2"
                          onClick={() => handleReject(req.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(req.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {/* ✅ Request Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📝 Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <p>
                <strong>User:</strong> {selectedRequest.user?.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedRequest.user?.email}
              </p>
              <p>
                <strong>Location:</strong> {selectedRequest.location?.name}
              </p>
              <p>
                <strong>Status:</strong> {selectedRequest.status}
              </p>
              <hr />
              <h5>Requested Items:</h5>

              {/* ✅ Embed assignment logic here */}
              <Table bordered hover responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Asset</th>
                    <th>Requested Qty</th>
                    <th>Approved Qty</th>
                    <th>Assign Laptops</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.assetRequestItems?.map((item) => (
                    <RequestItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Requests;

/* ✅ Child component inside same file */
function RequestItemRow({ item }) {
  const [availableLaptops, setAvailableLaptops] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const API_URL = "http://localhost:5083/api/AssetRequests";
  const LAPTOPS_API = "http://localhost:5083/api/laptops";

  useEffect(() => {
    if (item.asset?.name?.toLowerCase().includes("laptop")) {
      axios.get(LAPTOPS_API).then((res) => {
        setAvailableLaptops(res.data.data || []);
      });
    }
  }, [item]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one laptop.");
      return;
    }
    setAssigning(true);
    try {
      await axios.post(`${API_URL}/assign/${item.id}`, selectedIds);
      alert("✅ Laptops assigned successfully!");
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to assign laptops.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <tr>
      <td>{item.asset?.name}</td>
      <td>{item.requestedQuantity}</td>
      <td>{item.approvedQuantity || "-"}</td>
      <td>
        {item.asset?.name?.toLowerCase().includes("laptop") ? (
          <>
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                border: "1px solid #ddd",
                padding: "5px",
                borderRadius: "5px",
              }}
            >
              {availableLaptops.map((l) => (
                <div key={l.id} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`laptop-${l.id}`}
                    checked={selectedIds.includes(l.id)}
                    onChange={() => toggleSelect(l.id)}
                    disabled={assigning}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`laptop-${l.id}`}
                  >
                    {l.assetTag} ({l.brand} - {l.modelNumber})
                  </label>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="primary"
              className="mt-2"
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning ? "Assigning..." : "Assign Selected"}
            </Button>
          </>
        ) : (
          <em>Not applicable</em>
        )}
      </td>
    </tr>
  );
}
