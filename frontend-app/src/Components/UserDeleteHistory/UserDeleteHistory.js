import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function UserDeleteHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5083/api/UserDeleteHistories")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error fetching history:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">🧑‍💻 User Delete History</h3>
      {loading ? (
        <div className="text-center"><div className="spinner-border"></div></div>
      ) : logs.length === 0 ? (
        <p className="text-center">No user deletions recorded.</p>
      ) : (
        <table className="table table-striped table-bordered text-center">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Type</th>
              <th>User</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={log.id}>
                <td>{idx + 1}</td>
                <td>{log.deletedItemName}</td>
                <td>{log.itemType}</td>
                <td>{log.userName}</td>
                <td>{new Date(log.deletedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserDeleteHistory;
