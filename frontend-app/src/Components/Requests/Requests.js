import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Spinner, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Requests() {
  const API_URL = "http://localhost:5083/api/AssetRequests";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Search + Filters
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    user: "",
    email: "",
    location: ""
  });

  const [allOptions, setAllOptions] = useState({
    users: [],
    emails: [],
    locations: []
  });

  // Load all requests
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

  // Populate dropdowns from loaded data
  useEffect(() => {
    if (requests.length > 0) {
      const users = new Set();
      const emails = new Set();
      const locations = new Set();

      requests.forEach(r => {
        if (r.user?.name) users.add(r.user.name);
        if (r.user?.email) emails.add(r.user.email);
        if (r.location?.name) locations.add(r.location.name);
      });

      setAllOptions({
        users: [...users],
        emails: [...emails],
        locations: [...locations]
      });
    }
  }, [requests]);

  // FILTERING + SEARCH
  const filteredRequests = requests.filter((req) => {
    const name = req.user?.name?.toLowerCase() || "";
    const email = req.user?.email?.toLowerCase() || "";
    const location = req.location?.name?.toLowerCase() || "";

    const search = searchInput.toLowerCase();

    const matchesSearch =
      name.includes(search) ||
      email.includes(search) ||
      location.includes(search);

    const matchesUser =
      !filters.user || name === filters.user.toLowerCase();

    const matchesEmail =
      !filters.email || email === filters.email.toLowerCase();

    const matchesLocation =
      !filters.location || location === filters.location.toLowerCase();

    return matchesSearch && matchesUser && matchesEmail && matchesLocation;
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + pageSize
  );

  const nextPage = () => page < totalPages && setPage((p) => p + 1);
  const prevPage = () => page > 1 && setPage((p) => p - 1);

  // ACTIONS
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

  // VIEW BUTTON LOGIC
  const canView = (req) =>
    (req.status || "").toString().toLowerCase() === "approved" ||
    req.assetRequestItems?.some((i) => (i.assignedAssets?.length || 0) > 0);

  return (
    <div className="requests-page container mt-4">
      <h2 className="text-center mb-4">📦 Asset Requests</h2>

      {/* FILTER + SEARCH BOX */}
      <div className="card p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="🔍 Search (users/emails/locations...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* User Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.user}
              onChange={(e) => setFilters((p) => ({ ...p, user: e.target.value }))}
            >
              <option value="">All Users</option>
              {allOptions.users.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Email Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.email}
              onChange={(e) => setFilters((p) => ({ ...p, email: e.target.value }))}
            >
              <option value="">All Emails</option>
              {allOptions.emails.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="col-auto">
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
            >
              <option value="">All Locations</option>
              {allOptions.locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* RESET */}
          <div className="col ms-auto d-flex gap-2 justify-content-end">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setFilters({ user: "", email: "", location: "" });
                setSearchInput("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" /> <p>Loading...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <p className="text-center fw-bold">No requests found</p>
      ) : (
        <>
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
              {paginatedRequests.map((req, i) => (
                <tr key={req.id}>
                  <td>{startIndex + i + 1}</td>
                  <td>{req.user?.name}</td>
                  <td>{req.user?.email}</td>
                  <td>{req.location?.name}</td>
                  <td>{req.requestDate ? new Date(req.requestDate).toLocaleString() : ""}</td>

                  <td>
                    <span
                      className={`badge ${
                        req.status?.toLowerCase() === "pending"
                          ? "bg-warning text-dark"
                          : req.status?.toLowerCase() === "approved"
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
                          setShowViewModal(true);
                        }}
                      >
                        View
                      </Button>
                    )}

                    {req.status?.toLowerCase() === "pending" && (
                      <>
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
              ))}
            </tbody>
          </Table>

          {/* PAGINATION */}
          <div className="d-flex justify-content-center mt-3">
            <button
              className="btn btn-outline-primary me-2"
              disabled={page === 1}
              onClick={prevPage}
            >
              ◀️ Prev
            </button>

            <span className="align-self-center">
              Page {page} of {totalPages}
            </span>

            <button
              className="btn btn-outline-primary ms-2"
              disabled={page === totalPages}
              onClick={nextPage}
            >
              Next ▶️
            </button>
          </div>
        </>
      )}

      {/* MODALS */}
      <AssignApproveModal
        show={showApproveModal}
        onHide={() => setShowApproveModal(false)}
        request={selectedRequest}
        fetchRequests={fetchRequests}
      />

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


  function normalizeType(name) {
    if (!name) return "";

    const n = name.trim().toLowerCase();
    if (n.includes("laptop")) return "laptop";
    if (n.includes("mobile")) return "mobile";
    if (n.includes("tablet")) return "tablet";
    return n;
  }

 const categoryFields = {
  laptop: ["brand", "processor", "storage", "ram", "operatingSystem"],
  mobile: ["brand", "processor", "storage", "ram", "networkType", "simType"],
  tablet: ["brand", "processor", "storage", "ram", "networkType", "simSupport"],
  scanner: ["scannerType", "scanSpeed"],
  printer: ["printerType", "paperSize", "dpi"],
  default: []
};


const shouldShowFilter = (assetName, field) =>
  categoryFields[normalizeType(assetName)]?.includes(field);



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
                <th>Filters</th>
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
                      <ul className="list-unstyled mb-0">
                        {[
                          ["brand", item.brand],
                          ["processor", item.processor],
                          ["storage", item.storage],
                          ["ram", item.ram],
                          ["operatingSystem", item.operatingSystem],
                          ["networkType", item.networkType],
                          ["simType", item.simType],
                          ["simSupport", item.simSupport],
                          ["scannerType", item.scannerType],
                          ["scanSpeed", item.scanSpeed],
                          ["printerType", item.printerType],
                          ["paperSize", item.paperSize],
                          ["dpi", item.dpi]
                        ]
                          .filter(([field, value]) => shouldShowFilter(item.asset?.name, field) && value)
                          .map(([field, value]) => (
                            <li key={field}>
                              <strong>{field}:</strong> {value}
                            </li>
                          ))}
                      </ul>
                    </td>


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

  {/* Primary Line */}
  {a.assetTag || a.imeiNumber || a.serialNumber}{" "}
  ({a.brand} - {a.modelNumber || a.model || a.processor})

  {/* Actual item details */}
  <div style={{ fontSize: "0.75rem", color: "#444" }}>
    {a.processor && <span className="me-2"><strong>Processor:</strong> {a.processor}</span>}
    {a.ram && <span className="me-2"><strong>RAM:</strong> {a.ram}</span>}
    {a.storage && <span className="me-2"><strong>Storage:</strong> {a.storage}</span>}
    {a.operatingSystem && <span className="me-2"><strong>OS:</strong> {a.operatingSystem}</span>}
    {a.networkType && <span className="me-2"><strong>Network:</strong> {a.networkType}</span>}
    {a.simType && <span className="me-2"><strong>SIM Type:</strong> {a.simType}</span>}
    {a.simSupport && <span className="me-2"><strong>SIM Support:</strong> {a.simSupport}</span>}
    {a.scannerType && <span className="me-2"><strong>Scanner:</strong> {a.scannerType}</span>}
    {a.scanSpeed && <span className="me-2"><strong>Speed:</strong> {a.scanSpeed}</span>}
    {a.printerType && <span className="me-2"><strong>Printer:</strong> {a.printerType}</span>}
    {a.paperSize && <span className="me-2"><strong>Paper:</strong> {a.paperSize}</span>}
    {a.dpi && <span className="me-2"><strong>DPI:</strong> {a.dpi}</span>}
  </div>
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