import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function ReturnAssets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 6;
  

  const navigate = useNavigate();

  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;

  const API = "http://localhost:5083/api/assetrequests";

  // Safe getter that handles camelCase or PascalCase
  const get = (obj, ...keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
  };

const fetchRequests = useCallback(async () => {
  if (!user?.email) {
    setRequests([]);
    setLoading(false);
    setTotalPages(1);
    setPage(1);
    return;
  }

  try {
    const res = await axios.get(
      `${API}/by-email?email=${encodeURIComponent(user.email)}`
    );

    const data = Array.isArray(res.data)
      ? res.data
      : res.data?.requests ?? [];

    setRequests(data);
    setTotalPages(Math.ceil(data.length / pageSize));
    setPage(1); //default page
  } catch (err) {
    console.error("Error fetching requests:", err);
    setRequests([]);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
}, [user?.email, pageSize]);


  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // DELETE handler
  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this request? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/user-delete/${id}`, {
        headers: { "Content-Type": "application/json" },
        data: {
          adminName: user?.name || "User",
          reason: "User deleted their request"
        }
      });
      setRequests((prev) => prev.filter((r) => get(r, "id", "Id") !== id));
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete the request. Please try again.");
    }
  };

  const paginatedRequests = requests.slice(
  (page - 1) * pageSize,
  page * pageSize
);
  const nextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  return (
    <div className="return-asset-page container mt-4">
      <h3 className="text-center mb-4">Requested Assets</h3>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : requests.length === 0 ? (
        <div className="alert alert-info text-center fw-bold">
          No requests found.
        </div>
      ) : (
        <div className="row g-3">
          {paginatedRequests.map((r, i) => {
            const id = get(r, "id", "Id");
            const requestDate = get(r, "requestDate", "RequestDate");
            const status = get(r, "status", "Status");
            const location = get(r, "location", "Location") || {};

            return (
              <div className="col-md-6 col-lg-4" key={id ?? i}>
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    {/* Header */}
                    <div className="d-flex justify-content-between">
                     <h5 className="card-title">
  Request #{(page - 1) * pageSize + i + 1}
</h5>
                      <span
                        className={`badge ${status === "Returned"
                          ? "bg-success"
                          : status === "Pending"
                            ? "bg-warning text-dark"
                            : status === "Approved"
                              ? "bg-primary"
                              : "bg-secondary"
                          }`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* Details */}
                    <p className="text-muted small mb-1">
                      <strong>Date:</strong> {fmtDate(requestDate)}
                    </p>

                    <p className="text-muted small mb-1">
                      <strong>Location:</strong>{" "}
                      {get(location, "name", "Name") ?? "—"}
                    </p>

                    <p className="text-muted small mb-2">
                      <strong>Message:</strong> {r.message || "—"}
                    </p>

                    {/* ============================== */}
                    {/*      ASSET ITEMS + FILTERS      */}
                    {/* ============================== */}
                    <div className="mt-2">
                      {r.assetRequestItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className="border rounded p-2 mb-2 bg-light"
                        >
                          <strong>{item.asset?.name}</strong>{" "}
                          — Requested: {item.requestedQuantity}<br></br>
                          <strong>{item.asset?.name}</strong>{" "}
                          — Approved: {item.approvedQuantity}
                          <div
                            className="small mt-1"
                            style={{ lineHeight: "1.25" }}
                          >
                            {item.brand && <div>• Brand: {item.brand}</div>}
                            {item.processor && (
                              <div>• Processor: {item.processor}</div>
                            )}
                            {item.storage && (
                              <div>• Storage: {item.storage}</div>
                            )}
                            {item.ram && <div>• RAM: {item.ram}</div>}
                            {item.operatingSystem && (
                              <div>• OS: {item.operatingSystem}</div>
                            )}
                            {item.networkType && (
                              <div>• Network: {item.networkType}</div>
                            )}
                            {item.simType && (
                              <div>• SIM Type: {item.simType}</div>
                            )}
                            {item.simSupport && (
                              <div>• SIM Support: {item.simSupport}</div>
                            )}
                            {item.printerType && (
                              <div>• Printer Type: {item.printerType}</div>
                            )}
                            {item.paperSize && (
                              <div>• Paper Size: {item.paperSize}</div>
                            )}
                            {item.dpi && <div>• DPI: {item.dpi}</div>}
                            {/* Scanner1 fields */}
                            {item.scanner1Type && (
                              <div>• Scanner1 Type: {item.scanner1Type}</div>
                            )}

                            {item.scanner1Resolution && (
                              <div>• Scanner1 Resolution: {item.scanner1Resolution}</div>
                            )}
                            {/* Scanner2 fields */}
                            {item.scanner2Type && (
                              <div>• Scanner2 Type: {item.scanner2Type}</div>
                            )}

                            {item.scanner2Resolution && (
                              <div>• Scanner2 Resolution: {item.scanner2Resolution}</div>
                            )}
                            {/* Scanner3 fields */}
                            {item.scanner3Type && (
                              <div>• Scanner3 Type: {item.scanner3Type}</div>
                            )}

                            {item.scanner3Resolution && (
                              <div>• Scanner3 Resolution: {item.scanner3Resolution}</div>
                            )}

                            {/*Barcode Scanner fields */}
                            {item.type && (
                              <div>• Barcode Type: {item.type}</div>
                            )}

                            {item.technology && (
                              <div>• Barcode Technology: {item.technology}</div>
                            )}

                          </div>
                        </div>
                      ))}
                    </div>
                    {/*BUTTONS*/}
                    <div className="mt-3 d-flex justify-content-between">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/assigned-items/${id}`)}
                      >
                        View Assigned Items
                      </button>

                      {/* <button
                        className="btn btn-sm btn-outline-success"
                      >
                        Recieved
                      </button> */}

                      {status === "Pending" && (
                        <div>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => navigate(`/contact/${id}`)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {status === "Approved" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={async () => {
                            try {
                              await axios.post(`${API}/mark-received/${id}`, {
                                userName: user?.name || "User"
                              });

                              alert("✅ Assets received successfully");
                              fetchRequests(); // refresh list
                            } catch (err) {
                              alert("Failed to mark assets as received");
                            }
                          }}
                        >
                          Received
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Pagination */}
          <div className="d-flex justify-content-center mt-3 gap-2">
            <button
              className="btn btn-outline-primary"
              disabled={page === 1}
              onClick={prevPage}
            >
              ◀️ Prev
            </button>

            <span className="align-self-center">
              Page {page} of {totalPages}
            </span>

            <button
              className="btn btn-outline-primary"
              disabled={page === totalPages}
              onClick={nextPage}
            >
              Next ▶️
            </button>
          </div>
    </div>
  );
}

export default ReturnAssets;
