import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css"

function AdminDeleteHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5083/api/AdminDeleteHistories")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error fetching history:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-delete-history-page container mt-4">
      <h3 className="text-center mb-4">🗑️ Admin Delete History</h3>
      {loading ? (
        <div className="text-center"><div className="spinner-border"></div></div>
      ) : logs.length === 0 ? (
        <p className="text-center">No deletion records found.</p>
      ) : (
        <table className="table table-striped table-bordered text-center">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Type</th>
              <th>Admin</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={log.id}>
                <td>{idx + 1}</td>
                <td>{log.deletedItemName}</td>
                <td>{log.itemType}</td>
                <td>{log.adminName}</td>
                <td>{new Date(log.deletedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDeleteHistory;
