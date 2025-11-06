import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function ReturnAssets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));
  const CONTACT_API = "http://localhost:5083/api/contact";

  // ✅ Define fetchRequests outside, but memoized with useCallback
  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${CONTACT_API}?email=${user.email}`);
      setRequests(res.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [user.email, CONTACT_API]);

  // ✅ Fetch once when user loads or email changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ✅ Handle Return
  const handleReturn = async (id) => {
    if (!window.confirm("Are you sure you want to return these assets?")) return;

    try {
      await axios.put(`${CONTACT_API}/return/${id}`);
      alert("Assets returned successfully!");
      fetchRequests(); // ✅ Works now (in scope)
    } catch (error) {
      console.error("Error returning assets:", error);
      alert("Failed to return assets.");
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Return My Assets</h3>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="alert alert-info text-center">No requests found.</div>
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
              {requests.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{new Date(r.requestDate).toLocaleString()}</td>
                  <td>{r.location}</td>
                  <td>
                    <span
                      className={`badge ${
                        r.status === "Returned"
                          ? "bg-success"
                          : r.status === "Pending"
                          ? "bg-warning text-dark"
                          : "bg-primary"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <ul className="mb-0">
                      {r.assetRequestItems.map((a, idx) => (
                        <li key={idx}>
                          {a.assetName} – {a.requestedQuantity} unit(s)
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    {r.status === "Approved" && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleReturn(r.id)}
                      >
                        Return
                      </button>
                    )}
                    {r.status === "Returned" && <em>Returned</em>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReturnAssets;
