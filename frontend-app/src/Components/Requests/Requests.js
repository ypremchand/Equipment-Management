import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const admin = JSON.parse(localStorage.getItem("user") || "{}");

  /*************************************
   * Load all requests
   *************************************/
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

  /*************************************
   * Load options for dropdown filters
   *************************************/
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

  /*************************************
   * FILTERING + SEARCH
   *************************************/
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

  /*************************************
   * PAGINATION
   *************************************/
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + pageSize
  );

  const nextPage = () => page < totalPages && setPage((p) => p + 1);
  const prevPage = () => page > 1 && setPage((p) => p - 1);

  /*************************************
   * ACTIONS
   *************************************/
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
    const reason = prompt("Please enter the reason for deleting this request:");

    if (!reason || reason.trim() === "") {
      alert("Deletion cancelled — reason is required.");
      return;
    }
    try {
      if (!window.confirm("Delete this request permanently?")) return;
      await axios.delete(`${API_URL}/${id}`, {
        data: {
          reason,
          adminName: admin?.name || "Unknown Admin"
        }
      });
      fetchRequests();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete request");
    }
  };

  const canView = (req) =>
    (req.status || "").toString().toLowerCase() === "approved" ||
    req.assetRequestItems?.some((i) => (i.assignedAssets?.length || 0) > 0);

  /*************************************
   * RENDER
   *************************************/
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
                      className={`badge ${req.status?.toLowerCase() === "pending"
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
          <div className="text-center my-4">
        <Link
          to="/adminpanel"
          className="btn btn-outline-dark px-3 px-sm-4 py-2 w-sm-auto"
        >
          ⬅ Back to Admin Panel
        </Link>
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

/* ============================================================================================
    ASSIGN & APPROVE MODAL — FINAL VERSION (WITH "NO ITEMS" CASE + PARTIAL < REQUEST RULE)
============================================================================================ */

function AssignApproveModal({ show, onHide, request, fetchRequests }) {
  const [localRequest, setLocalRequest] = useState(null);
  const [availableItems, setAvailableItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [selectedIdsForItem, setSelectedIdsForItem] = useState({});
  const [isPartialMode, setIsPartialMode] = useState({});
  const [partialReasons, setPartialReasons] = useState({});
  const [finalizing, setFinalizing] = useState(false);

  const API_URL = "http://localhost:5083/api/AssetRequests";
  const ITEM_API = "http://localhost:5083/api/asset-items/available";

  /* ------------------------------------------------------------
     NORMALIZE TYPE
  ------------------------------------------------------------- */
  function normalizeType(name) {
    if (!name) return "";
    const n = name.trim().toLowerCase();

    if (n.includes("laptop")) return "laptop";
    if (n.includes("mobile")) return "mobile";
    if (n.includes("tablet")) return "tablet";
    if (n.includes("desktop")) return "desktop";
    if (n.includes("printer")) return "printer";
    if (n.includes("scanner1")) return "scanner1";
    if (n.includes("scanner2")) return "scanner2";
    if (n.includes("scanner3")) return "scanner3";
    if (n.includes("barcode")) return "barcode";


    return n;
  }

  /* ------------------------------------------------------------
     FILTER FIELDS MAP
  ------------------------------------------------------------- */
  const categoryFields = {
    laptop: ["brand", "processor", "storage", "ram", "operatingSystem"],
    desktop: ["brand", "processor", "storage", "ram", "operatingSystem"],
    mobile: ["brand", "processor", "storage", "ram", "networkType", "simType"],
    tablet: ["brand", "processor", "storage", "ram", "networkType", "simSupport"],
    printer: ["printerType", "paperSize", "dpi"],
    scanner1: ["scanner1Type", "scanner1Resolution"],
    scanner2: ["scanner2Type", "scanner2Resolution"],
    scanner3: ["scanner3Type", "scanner3Resolution"],
    barcode: ["type", "technology"],

  };

  /* ------------------------------------------------------------
     EXTRACT FILTERS FOR REQUESTED ITEM
  ------------------------------------------------------------- */
  function extractFilters(item, type) {
    const filterObj = {};
    const allowed = categoryFields[type] || [];

    allowed.forEach((field) => {
      const val = item[field];
      if (val !== "" && val !== null && val !== undefined) {
        filterObj[field] = val;
      }
    });

    return filterObj;
  }

  /* ------------------------------------------------------------
     APPLY FILTERS TO AVAILABLE ITEMS
  ------------------------------------------------------------- */
  function applyFiltersToAvailable(available, filters) {
    if (!filters || Object.keys(filters).length === 0) return available;

    return available.filter((item) => {
      return Object.keys(filters).every((fKey) => {
        const itemVal =
          item[fKey] ||
          item?.detail?.[fKey] ||
          item[`scanner1${fKey.charAt(0).toUpperCase() + fKey.slice(1)}`] ||
          item[`scanner2${fKey.charAt(0).toUpperCase() + fKey.slice(1)}`] ||
          item[`scanner3${fKey.charAt(0).toUpperCase() + fKey.slice(1)}`];


        return (
          itemVal?.toString().toLowerCase() ===
          filters[fKey].toString().toLowerCase()
        );
      });
    });
  }

  /* ------------------------------------------------------------
     LOAD REQUEST DETAILS
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!request) return;

    const clone = JSON.parse(JSON.stringify(request));
    setLocalRequest(clone);

    const initSel = {};
    const initAvail = {};
    const initLoad = {};
    const initPartial = {};
    const initReasons = {};

    clone.assetRequestItems.forEach((item) => {
      initSel[item.id] = [];
      initAvail[item.id] = [];
      initLoad[item.id] = false;
      initPartial[item.id] = false;
      initReasons[item.id] = "";
    });

    setSelectedIdsForItem(initSel);
    setAvailableItems(initAvail);
    setLoadingItems(initLoad);
    setIsPartialMode(initPartial);
    setPartialReasons(initReasons);

    clone.assetRequestItems.forEach((item) =>
      loadAvailable(item.id, normalizeType(item.asset?.name), item)
    );
  }, [request]);

  /* ------------------------------------------------------------
     LOAD AVAILABLE ITEMS BASED ON TYPE + FILTERS
  ------------------------------------------------------------- */
  const loadAvailable = async (itemId, type, requestItem) => {
    setLoadingItems((p) => ({ ...p, [itemId]: true }));

    try {
      const res = await axios.get(`${ITEM_API}?type=${type}`);
      let list = res.data || [];

      const filters = extractFilters(requestItem, type);
      list = applyFiltersToAvailable(list, filters);

      setAvailableItems((prev) => ({ ...prev, [itemId]: list }));
    } finally {
      setLoadingItems((p) => ({ ...p, [itemId]: false }));
    }
  };

  /* ------------------------------------------------------------
     TOGGLE ITEM SELECTION
     (Partial mode must be < requested qty)
  ------------------------------------------------------------- */
  const toggleSelect = (itemId, itemUniqueId, requestedQty, isPartial) => {
    setSelectedIdsForItem((prev) => {
      const arr = prev[itemId] || [];

      if (arr.includes(itemUniqueId)) {
        return { ...prev, [itemId]: arr.filter((x) => x !== itemUniqueId) };
      }

      // NEW RULE: partial must be strictly less than requested qty
      if (isPartial && arr.length + 1 >= requestedQty) {
        alert(
          "Partial approval cannot be equal to or greater than the requested quantity."
        );
        return prev;
      }

      // Full approval cannot exceed required qty
      if (!isPartial && arr.length >= requestedQty) {
        alert("You can only select the requested quantity.");
        return prev;
      }

      return { ...prev, [itemId]: [...arr, itemUniqueId] };
    });
  };

  /* ------------------------------------------------------------
     VALIDATION FOR APPROVAL BUTTON
  ------------------------------------------------------------- */
  const canApprove = () => {
    if (!localRequest) return false;

    for (const item of localRequest.assetRequestItems) {
      const selected = selectedIdsForItem[item.id]?.length || 0;
      const partial = isPartialMode[item.id];
      const available = availableItems[item.id]?.length || 0;

      if (!partial) {
        if (available < item.requestedQuantity) return false;
        if (selected !== item.requestedQuantity) return false;
      } else {
        if (!partialReasons[item.id]?.trim()) return false;

        // NEW RULE: partial must be strictly LESS than requested qty
        if (selected >= item.requestedQuantity) return false;

        if (available > 0 && selected === 0) return false;
      }
    }

    return true;
  };

  /* ------------------------------------------------------------
     SUBMIT APPROVAL
  ------------------------------------------------------------- */
  const handleConfirmApproval = async () => {
    if (!localRequest) return;
    if (!canApprove()) {
      alert("Approval conditions not satisfied.");
      return;
    }

    if (!window.confirm("Approve and assign selected assets?")) return;

    setFinalizing(true);

    try {
      const assignments = Object.keys(selectedIdsForItem).map((key) => {
        const itemId = Number(key);
        const itemObj = localRequest.assetRequestItems.find(
          (i) => i.id === itemId
        );

        return {
          itemId,
          assetType: normalizeType(itemObj.asset?.name),
          assetTypeItemIds: selectedIdsForItem[itemId],
          partialReason: isPartialMode[itemId]
            ? partialReasons[itemId]
            : null,
        };
      });

      const admin = JSON.parse(localStorage.getItem("user"));

      await axios.post(
        `http://localhost:5083/api/AssetRequests/confirm-approve/${localRequest.id}`,
        {
          adminName: admin.name,     // 🔥 MUST EXIST
          assignments: assignments   // 🔥 MUST EXIST
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );


      fetchRequests();
      onHide();
      alert("✅ Approved successfully.");
    } finally {
      setFinalizing(false);
    }
  };

  if (!request) return null;

  /* ------------------------------------------------------------
     RENDER UI
  ------------------------------------------------------------- */

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Assign Items & Approve</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!localRequest ? (
          "Loading..."
        ) : (
          <Table bordered hover>
            <thead>
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
                const partial = isPartialMode[item.id];

                const requestQty = item.requestedQuantity;
                const availableQty = list.length;

                const allowFull = availableQty >= requestQty;

                return (
                  <tr key={item.id}>
                    <td>{item.asset?.name}</td>
                    <td>{requestQty}</td>

                    {/* FILTER LIST */}
                    <td>
                      <ul className="list-unstyled mb-0">
                        {Object.entries(
                          extractFilters(item, normalizeType(item.asset?.name))
                        ).map(([k, v]) => (
                          <li key={k}>
                            <strong>{k}:</strong> {v}
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* SELECT ITEMS */}
                    <td>
                      {/* CASE 1 — NO ITEMS AVAILABLE */}
                      {list.length === 0 ? (
                        <div>
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`noitems-${item.id}`}
                              checked={partial}
                              onChange={(e) => {
                                const checked = e.target.checked;

                                setIsPartialMode((p) => ({
                                  ...p,
                                  [item.id]: checked,
                                }));

                                setSelectedIdsForItem((p) => ({
                                  ...p,
                                  [item.id]: [],
                                }));

                                if (!checked) {
                                  setPartialReasons((p) => ({
                                    ...p,
                                    [item.id]: "",
                                  }));
                                }
                              }}
                            />
                            <label htmlFor={`noitems-${item.id}`}>
                              No available items found (partial approval only)
                            </label>
                          </div>

                          {partial && (
                            <>
                              <div className="text-warning fw-bold mt-2">
                                Partial approval → reason required
                              </div>
                              <textarea
                                className="form-control mt-2"
                                placeholder="Enter reason"
                                value={partialReasons[item.id] || ""}
                                onChange={(e) =>
                                  setPartialReasons((p) => ({
                                    ...p,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* CASE 2 — ITEMS AVAILABLE */}

                          {/* FULL APPROVE */}
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`all-${item.id}`}
                              disabled={!allowFull || partial}
                              checked={
                                allowFull &&
                                !partial &&
                                selectedIdsForItem[item.id]?.length ===
                                requestQty
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const ids = list
                                    .slice(0, requestQty)
                                    .map((a) => a.id);

                                  setSelectedIdsForItem((p) => ({
                                    ...p,
                                    [item.id]: ids,
                                  }));

                                  setIsPartialMode((p) => ({
                                    ...p,
                                    [item.id]: false,
                                  }));
                                } else {
                                  setSelectedIdsForItem((p) => ({
                                    ...p,
                                    [item.id]: [],
                                  }));
                                }
                              }}
                            />
                            <label htmlFor={`all-${item.id}`}>
                              Select all requested quantity
                            </label>
                          </div>

                          {/* PARTIAL APPROVE */}
                          <div className="form-check mt-1">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`partial-${item.id}`}
                              checked={partial}
                              onChange={(e) => {
                                const checked = e.target.checked;

                                setIsPartialMode((p) => ({
                                  ...p,
                                  [item.id]: checked,
                                }));

                                if (checked) {
                                  setSelectedIdsForItem((p) => ({
                                    ...p,
                                    [item.id]: [],
                                  }));
                                } else {
                                  setPartialReasons((p) => ({
                                    ...p,
                                    [item.id]: "",
                                  }));
                                }
                              }}
                            />
                            <label htmlFor={`partial-${item.id}`}>
                              Select partial requested quantity
                            </label>
                          </div>

                          {/* AVAILABLE ITEMS LIST */}
                          <div
                            style={{
                              maxHeight: 200,
                              overflowY: "auto",
                              border: "1px solid #ccc",
                              padding: 8,
                            }}
                          >
                            {list.map((a) => (
                              <div key={a.id} className="form-check mb-1">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedIdsForItem[item.id]?.includes(
                                    a.id
                                  )}
                                  onChange={() =>
                                    toggleSelect(
                                      item.id,
                                      a.id,
                                      requestQty,
                                      partial
                                    )
                                  }
                                />
                                <label className="ms-2">
                                  {a.scanner2AssetTag ||
                                    a.scanner1AssetTag ||
                                    a.scanner3AssetTag ||
                                    a.assetTag ||
                                    a.serialNumber} (
                                  {a.scanner2Brand ||
                                    a.scanner1Brand ||
                                    a.scanner3Brand ||
                                    a.brand}{" "}
                                  -{" "}
                                  {a.scanner2Model ||
                                    a.scanner1Model ||
                                    a.scanner3Model ||
                                    a.model ||
                                    a.modelNumber}
                                  )
                                </label>
                              </div>
                            ))}
                          </div>

                          {/* COUNTER OR PARTIAL REASON */}
                          {partial ? (
                            <>
                              <div className="text-warning mt-2 fw-bold">
                                Partial approval → reason required
                              </div>
                              <textarea
                                className="form-control mt-2"
                                placeholder="Enter reason"
                                value={partialReasons[item.id]}
                                onChange={(e) =>
                                  setPartialReasons((p) => ({
                                    ...p,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              />
                            </>
                          ) : allowFull ? (
                            <div className="mt-2 text-danger fw-bold">
                              {selectedIdsForItem[item.id]?.length || 0}/
                              {requestQty} selected
                            </div>
                          ) : null}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" disabled={finalizing} onClick={onHide}>
          Close
        </Button>

        <Button
          variant="success"
          disabled={finalizing || !canApprove()}
          onClick={handleConfirmApproval}
        >
          {finalizing ? "Finalizing..." : "Confirm Approval"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}





/* ============================================================================================
    VIEW ASSIGNED ASSETS MODAL
============================================================================================ */

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
              <p className="text-danger">Approved by Admin, but User not yet recieve.</p>
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