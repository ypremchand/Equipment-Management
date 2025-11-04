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
    fetchRequests(); // already refreshes requests

    // ✅ refresh AdminPanel assets count too (optional)
    // You can trigger fetchAssets in AdminPanel via global state or simple page reload
    // window.location.reload(); // simplest approach
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
    } catch (error) {
      console.error(error);
      setMessage("❌ Error rejecting request");
    }
  };
  const handleCancel = async (id) => {
  if (!window.confirm("Cancel this approved request? This will restore the stock.")) return;
  try {
    await axios.post(`${API_URL}/cancel/${id}`);
    setMessage("❌ Request cancelled and stock restored!");
    fetchRequests();
  } catch (error) {
    console.error(error);
    setMessage("❌ Error cancelling request");
  }
};



  // ✅ View request details (Modal)
  const handleView = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
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
                        req.status === "Pending"
                          ? "bg-warning text-dark"
                          : req.status === "Approved"
                          ? "bg-success"
                          : "bg-danger"
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
                   {req.status === "Pending" && (
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
      onClick={() => handleReject(req.id)}
    >
      Reject
    </Button>
  </>
)}

{req.status === "Approved" && (
  <Button
    variant="warning"
    size="sm"
    onClick={() => handleCancel(req.id)}
  >
    Cancel
  </Button>
)}

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
              <p><strong>User:</strong> {selectedRequest.user?.name}</p>
              <p><strong>Email:</strong> {selectedRequest.user?.email}</p>
              <p><strong>Location:</strong> {selectedRequest.location?.name}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              <hr />
              <h5>Requested Items:</h5>
              <Table bordered hover responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Asset</th>
                    <th>Requested Quantity</th>
                    <th>Approved Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.assetRequestItems?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.asset?.name}</td>
                      <td>{item.requestedQuantity}</td>
                      <td>{item.approvedQuantity || "-"}</td>
                    </tr>
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
