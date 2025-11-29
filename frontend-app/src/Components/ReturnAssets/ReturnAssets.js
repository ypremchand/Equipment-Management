import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function ReturnAssets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;

  const API = "http://localhost:5083/api/assetrequests";
  const RETURN_API = "http://localhost:5083/api/contact/return";

  // Safe object getter (handles both PascalCase & camelCase)
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
      return;
    }

    try {
      const res = await axios.get(
        `${API}/by-email?email=${encodeURIComponent(user.email)}`
      );

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.requests ?? [];

      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReturn = async (id) => {
    if (!window.confirm("Are you sure you want to return these assets?")) return;

    try {
      await axios.put(`${RETURN_API}/${id}`);
      alert("Assets returned successfully!");
      fetchRequests();
    } catch (err) {
      console.error("Error returning assets:", err);
      alert("Failed to return assets.");
    }
  };

  return (
    <div className="return-asset-page container mt-4">
      <h3 className="text-center mb-4">Return My Assets</h3>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : requests.length === 0 ? (
        <div className="alert alert-info text-center fw-bold">No requests found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Request Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Assets</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r, i) => {
                const id = get(r, "id", "Id");
                const requestDate = get(r, "requestDate", "RequestDate");
                const status = get(r, "status", "Status");
                const location = get(r, "location", "Location") || {};

                return (
                  <tr key={id ?? i}>
                    <td>{i + 1}</td>

                    <td>{fmtDate(requestDate)}</td>

                    <td>{get(location, "name", "Name") ?? "—"}</td>

                    <td>
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
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/assigned-items/${id}`)}
                      >
                        View Assigned Items
                      </button>
                    </td>



                    <td>
                      {/* Edit button visible ONLY when Pending */}
                      {status === "Pending" && (
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => navigate(`/contact/${id}`)}
                        >
                          Edit
                        </button>
                      )}

                      {status === "Approved" && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReturn(id)}
                        >
                          Return
                        </button>
                      )}

                      {status === "Returned" && <em>Returned</em>}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReturnAssets;