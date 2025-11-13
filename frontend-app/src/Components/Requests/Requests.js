import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Spinner, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5083/api/AssetRequests";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = (req) => {
    setSelectedRequest(req);
    setShowApproveModal(true);
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    await axios.post(`${API_URL}/reject/${id}`);
    fetchRequests();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this request permanently?")) return;
    await axios.delete(`${API_URL}/${id}`);
    fetchRequests();
  };

  const canView = (req) =>
    req.status.toLowerCase() === "approved" ||
    req.assetRequestItems?.some((i) => i.assignedAssetIds?.length > 0);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📦 Asset Requests</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" /> <p>Loading...</p>
        </div>
      ) : (
        <Table bordered hover responsive>
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
            {requests.map((req, i) => (
              <tr key={req.id}>
                <td>{i + 1}</td>
                <td>{req.user?.name}</td>
                <td>{req.user?.email}</td>
                <td>{req.location?.name}</td>
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
                  {canView(req) && (
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowApproveModal(true);
                      }}
                    >
                      View
                    </Button>
                  )}

                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleApprove(req)}
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

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(req.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <AssignApproveModal
        show={showApproveModal}
        onHide={() => setShowApproveModal(false)}
        request={selectedRequest}
        fetchRequests={fetchRequests}
      />
    </div>
  );
}

export default Requests;

/* ---------------------- MODAL COMPONENT ---------------------- */

function AssignApproveModal({ show, onHide, request, fetchRequests }) {
  const [localRequest, setLocalRequest] = useState(null);
  const [availableLaptops, setAvailableLaptops] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedIdsForItem, setSelectedIdsForItem] = useState({});
  const [finalizing, setFinalizing] = useState(false);

  const LAPTOPS_API = "http://localhost:5083/api/laptops/available";
  const API_URL = "http://localhost:5083/api/AssetRequests";

  useEffect(() => {
    if (!request) return;

    const clone = JSON.parse(JSON.stringify(request));
    setLocalRequest(clone);

    clone.assetRequestItems.forEach((item) => {
      // Initialize selection trackers
      setSelectedIdsForItem((prev) => ({ ...prev, [item.id]: [] }));

      if (item.asset?.name.toLowerCase().includes("laptop")) {
        loadLaptops(item.id);
      }
    });
  }, [request]);

  const loadLaptops = async (itemId) => {
    setLoading(true);
    try {
      const res = await axios.get(LAPTOPS_API);
      setAvailableLaptops((prev) => ({ ...prev, [itemId]: res.data }));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (itemId, laptopId) => {
    setSelectedIdsForItem((prev) => {
      const arr = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: arr.includes(laptopId)
          ? arr.filter((x) => x !== laptopId)
          : [...arr, laptopId],
      };
    });
  };

  const allAssigned = () => {
    if (!localRequest) return false;

    for (const item of localRequest.assetRequestItems) {
      if (item.asset?.name.toLowerCase().includes("laptop")) {
        const selected = selectedIdsForItem[item.id]?.length || 0;
        if (selected < item.requestedQuantity) return false;
      }
    }
    return true;
  };

  const handleConfirmApproval = async () => {
    if (!window.confirm("Approve this request and assign selected laptops?"))
      return;

    setFinalizing(true);

    try {
      const payload = {
        assignments: Object.keys(selectedIdsForItem).map((itemId) => ({
          itemId: Number(itemId),
          laptopIds: selectedIdsForItem[itemId],
        })),
      };

      await axios.post(`${API_URL}/confirm-approve/${localRequest.id}`, payload);

      fetchRequests();
      onHide();
    } catch (err) {
      console.error(err);
      alert("Approval Failed!");
    } finally {
      setFinalizing(false);
    }
  };

  if (!request) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Assign Items & Approve</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!localRequest ? (
          <p>Loading...</p>
        ) : (
          <>
            <p>
              <strong>User:</strong> {request.user.name} |{" "}
              <strong>Email:</strong> {request.user.email}
            </p>

            <Table bordered hover>
              <thead className="table-secondary">
                <tr>
                  <th>Asset</th>
                  <th>Requested</th>
                  <th>Select Laptops (if laptop)</th>
                </tr>
              </thead>

              <tbody>
                {localRequest.assetRequestItems.map((item) => {
                  const isLaptop = item.asset.name
                    .toLowerCase()
                    .includes("laptop");
                  const list = availableLaptops[item.id] || [];

                  return (
                    <tr key={item.id}>
                      <td>{item.asset.name}</td>
                      <td>{item.requestedQuantity}</td>

                      <td>
                        {isLaptop ? (
                          loading ? (
                            "Loading..."
                          ) : (
                            <div
                              style={{
                                maxHeight: 150,
                                overflowY: "auto",
                                border: "1px solid #ddd",
                                padding: 5,
                              }}
                            >
                              {list.map((lap) => (
                                <div key={lap.id} className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedIdsForItem[item.id]?.includes(
                                      lap.id
                                    )}
                                    onChange={() =>
                                      toggleSelect(item.id, lap.id)
                                    }
                                  />
                                  <label className="form-check-label">
                                    {lap.assetTag} ({lap.brand} -{" "}
                                    {lap.modelNumber})
                                  </label>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <em>Not applicable</em>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>

        <Button
          variant="success"
          disabled={!allAssigned() || finalizing}
          onClick={handleConfirmApproval}
        >
          {finalizing ? "Finalizing..." : "Confirm Approval"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
