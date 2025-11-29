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
  const [showViewModal, setShowViewModal] = useState(false);

  const API_URL = "http://localhost:5083/api/AssetRequests";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRequests(res.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
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
    try {
      if (!window.confirm("Reject this request?")) return;
      await axios.post(`${API_URL}/reject/${id}`);
      fetchRequests();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject request");
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Delete this request permanently?")) return;
      await axios.delete(`${API_URL}/${id}`);
      fetchRequests();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete request");
    }
  };

  const canView = (req) =>
    (req.status || "").toString().toLowerCase() === "approved" ||
    req.assetRequestItems?.some((i) => (i.assignedAssets?.length || 0) > 0);

  return (
    <div className="requests-page container mt-4">
      <h2 className="text-center mb-4">📦 Asset Requests</h2>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" /> <p>Loading...</p>
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center fw-bold">No requests found</p>
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
                <td>
                  {req.requestDate
                    ? new Date(req.requestDate).toLocaleString()
                    : ""}
                </td>

                <td>
                  <span
                    className={`badge ${(req.status || "").toLowerCase() === "pending"
                      ? "bg-warning text-dark"
                      : (req.status || "").toLowerCase() === "approved"
                        ? "bg-success"
                        : "bg-danger"
                      }`}
                  >
                    {req.status}
                  </span>
                </td>

                <td>
                  {/* VIEW BUTTON */}
                  {canView(req) && (
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowViewModal(true);
                      }}
                    >
                      View
                    </Button>
                  )}

                  {/* APPROVE BUTTON — ONLY IF PENDING */}
                  {(req.status || "").toLowerCase() === "pending" && (
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </Button>
                  )}
                  {/* Once the status is approved, disable Reject Button */}
                  {(req.status || "").toLowerCase() === "pending" && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="me-2"
                      onClick={() => handleReject(req.id)}
                    >
                      Reject
                    </Button>
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
            ))}
          </tbody>
        </Table>
      )}

      {/* ASSIGN + APPROVE MODAL */}
      <AssignApproveModal
        show={showApproveModal}
        onHide={() => setShowApproveModal(false)}
        request={selectedRequest}
        fetchRequests={fetchRequests}
      />

      {/* VIEW ASSIGNED ASSETS MODAL */}
      <ViewAssignedModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        request={selectedRequest}
      />
    </div>
  );
}

export default Requests;

/* -------------------------------------------------------------------
        ASSIGN & APPROVE MODAL
------------------------------------------------------------------- */

function AssignApproveModal({ show, onHide, request, fetchRequests }) {
  const [localRequest, setLocalRequest] = useState(null);
  const [availableItems, setAvailableItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [selectedIdsForItem, setSelectedIdsForItem] = useState({});
  const [finalizing, setFinalizing] = useState(false);

  const API_URL = "http://localhost:5083/api/AssetRequests";
  const ITEM_API = "http://localhost:5083/api/asset-items/available";

  const normalizeType = (name) => {
    if (!name) return "";
    const t = name.toLowerCase();
    if (t.includes("laptop")) return "laptop";
    if (t.includes("mobile")) return "mobile";
    if (t.includes("tablet")) return "tablet";
    if (t.includes("desktop")) return "desktop";
    if (t.includes("scanner")) return "scanner";
    return t;
  };

  // When modal opens or request changes — clone request and load available items per requested row
  useEffect(() => {
    if (!request) {
      setLocalRequest(null);
      return;
    }

    const clone = JSON.parse(JSON.stringify(request));
    setLocalRequest(clone);

    // reset selections and available lists
    const initSelected = {};
    const initLoading = {};
    const initAvailable = {};
    clone.assetRequestItems?.forEach((item) => {
      initSelected[item.id] = [];
      initLoading[item.id] = false;
      initAvailable[item.id] = [];
    });

    setSelectedIdsForItem(initSelected);
    setAvailableItems(initAvailable);
    setLoadingItems(initLoading);

    // fetch available items for each row
    clone.assetRequestItems?.forEach((item) => {
      const type = normalizeType(item.asset?.name);
      loadAvailable(item.id, type);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const loadAvailable = async (itemId, type) => {
    setLoadingItems((p) => ({ ...p, [itemId]: true }));
    try {
      const res = await axios.get(`${ITEM_API}?type=${type}`);
      setAvailableItems((prev) => ({ ...prev, [itemId]: res.data || [] }));
    } catch (err) {
      console.error("Load available items error:", err);
      setAvailableItems((prev) => ({ ...prev, [itemId]: [] }));
    } finally {
      setLoadingItems((p) => ({ ...p, [itemId]: false }));
    }
  };

  const toggleSelect = (itemId, itemUniqueId, requestedQty) => {
    setSelectedIdsForItem((prev) => {
      const arr = prev[itemId] || [];
      // deselect
      if (arr.includes(itemUniqueId)) {
        return { ...prev, [itemId]: arr.filter((x) => x !== itemUniqueId) };
      }
      // select - ensure not exceeding requestedQty
      if (arr.length >= requestedQty) {
        alert("You can only select the requested quantity.");
        return prev;
      }
      return { ...prev, [itemId]: [...arr, itemUniqueId] };
    });
  };

  const allAssigned = () => {
    if (!localRequest) return false;
    for (const item of localRequest.assetRequestItems) {
      const selected = selectedIdsForItem[item.id]?.length || 0;
      if (selected !== item.requestedQuantity) return false;
    }
    return true;
  };

  const handleConfirmApproval = async () => {
    if (!localRequest) return;
    if (!window.confirm("Approve and assign selected assets?")) return;
    setFinalizing(true);

    try {
      const assignments = Object.keys(selectedIdsForItem).map((itemIdStr) => {
        const itemId = Number(itemIdStr);
        const itemObj = localRequest.assetRequestItems.find((i) => i.id === itemId);
        const assetType = normalizeType(itemObj?.asset?.name);
        return {
          itemId,
          assetType,
          assetTypeItemIds: selectedIdsForItem[itemId],
        };
      });

      const payload = { assignments };

      await axios.post(`${API_URL}/confirm-approve/${localRequest.id}`, payload);

      fetchRequests();
      onHide();
      alert("Approved & assigned successfully.");
    } catch (err) {
      console.error("Approval error:", err);
      alert("Approval failed: " + (err?.response?.data || err.message));
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
          <Table bordered hover>
            <thead className="table-secondary">
              <tr>
                <th>Asset</th>
                <th>Requested</th>
                <th>Select Items</th>
              </tr>
            </thead>

            <tbody>
              {localRequest.assetRequestItems.map((item) => {
                const list = availableItems[item.id] || [];
                const loading = loadingItems[item.id];

                return (
                  <tr key={item.id}>
                    <td>{item.asset?.name}</td>
                    <td>{item.requestedQuantity}</td>

                    <td>
                      {loading ? (
                        "Loading..."
                      ) : list.length === 0 ? (
                        <em>No available items</em>
                      ) : (
                        <div
                          style={{
                            maxHeight: 180,
                            overflowY: "auto",
                            border: "1px solid #ddd",
                            padding: 8,
                          }}
                        >
                          {list.map((a) => (
                            <div key={a.id} className="form-check mb-1">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedIdsForItem[item.id]?.includes(a.id)}
                                onChange={() =>
                                  toggleSelect(item.id, a.id, item.requestedQuantity)
                                }
                              />
                              <label className="form-check-label ms-2">
                                {a.assetTag || a.imeiNumber || a.serialNumber}{" "}
                                ({a.brand} - {a.modelNumber || a.model || a.processor})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2">
                        {selectedIdsForItem[item.id]?.length === item.requestedQuantity ? (
                          <span className="text-success fw-bold">✔ Exact quantity selected</span>
                        ) : (
                          <span className="text-danger fw-bold">
                            {(selectedIdsForItem[item.id]?.length || 0)} / {item.requestedQuantity} selected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={finalizing}>
          Close
        </Button>

        <Button variant="success" disabled={!allAssigned() || finalizing} onClick={handleConfirmApproval}>
          {finalizing ? "Finalizing..." : "Confirm Approval"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/* -------------------------------------------------------------------
        VIEW ASSIGNED ASSETS MODAL
------------------------------------------------------------------- */
function ViewAssignedModal({ show, onHide, request }) {
  if (!request) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Assigned Asset Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {request.assetRequestItems.map((item) => (
          <div key={item.id} className="mb-4">
            <h5>{item.asset?.name}</h5>

            {item.assignedAssets?.length === 0 ? (
              <p className="text-danger">No assets assigned</p>
            ) : (
              <Table bordered>
                <thead>
                  <tr>
                    <th>Asset Tag / IMEI</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Assigned Date</th>
                    <th>Returned Date</th>
                  </tr>
                </thead>
                <tbody>
                  {item.assignedAssets.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.detail?.assetTag ||
                          a.detail?.imeiNumber ||
                          a.detail?.serialNumber ||
                          "—"}
                      </td>
                      <td>{a.detail?.brand || "—"}</td>
                      <td>
                        {a.detail?.modelNumber ||
                          a.detail?.model ||
                          a.detail?.processor ||
                          "—"}
                      </td>
                      <td>
                        {a.assignedDate
                          ? new Date(a.assignedDate).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        {a.returnedDate
                          ? new Date(a.returnedDate).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        ))}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}