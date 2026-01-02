import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function AdminDeleteHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");   // used
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;  // used

  // 🔥 Fetch paginated + searchable logs
  useEffect(() => {
    setLoading(true);

    axios
      .get("http://localhost:5083/api/AdminDeleteHistories", {
        params: {
          page,
          pageSize,
          search
        },
      })
      .then((res) => {
        console.log("Delete history:", res.data);

        setLogs(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [page, search]); // 🔥 Refetch when page or search changes

  return (
    <div className="admin-delete-history-page container mt-4">
      <h3 className="text-center mb-4">🗑️ Admin Delete History</h3>

      {/* 🔍 Search */}
      <div className="mb-3 d-flex justify-content-center">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Search by item name, type, or admin..."
          value={search}
          onChange={(e) => {
            setPage(1);       // reset to page 1 after search
            setSearch(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" />
        </div>
      ) : logs.length === 0 ? (
        <p className="alert alert-info text-center fw-bold">
          No records found.
        </p>
      ) : (
        <table className="table table-striped table-bordered text-center">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Type</th>
              <th>Admin</th>
              <th>Date</th>
              <th>Reason</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, idx) => (
              <tr key={log.id}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{log.deletedItemName}</td>
                <td>{log.itemType}</td>
                <td>{log.adminName}</td>
                <td>{new Date(log.deletedAt).toLocaleString()}</td>
                <td>{log.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-3 gap-2">
        <button
          className="btn btn-dark"
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Prev
        </button>

        <span className="align-self-center">
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-dark"
          disabled={page === totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
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
    </div>
  );
}

export default AdminDeleteHistory;
