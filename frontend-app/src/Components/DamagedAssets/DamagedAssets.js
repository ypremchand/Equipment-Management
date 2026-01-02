import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./style.css";

function DamagedAssets() {
  const API_URL = "http://localhost:5083/api/damagedassets";

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(API_URL, {
        params: {
          page,
          pageSize,
          search: search || undefined
        },
      });

      const api = res.data;

      setData(api.data || []);
      setTotalPages(api.totalPages || 1);

    } catch (err) {
      console.error("error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRepair = async (id) => {
    if (!window.confirm("Mark this asset as repaired?")) return;

    try {
      await axios.post(`${API_URL}/repair/${id}`);
      alert("Asset marked as repaired");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to repair asset");
    }
  };

  return (
    <div className="container mt-5 pt-4">
      <h2 className="text-center mb-4">Damaged Assets</h2>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search (tag / type / reason)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-center">No damaged assets found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered text-center">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Asset Type</th>
                  <th>Asset Tag</th>
                  <th>Reason</th>
                  <th>Reported At</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, i) => (
                  <tr key={item.id}>
                    <td>{(page - 1) * pageSize + i + 1}</td>
                    <td>
                      {item.assetType
                        ? item.assetType.charAt(0).toUpperCase() + item.assetType.slice(1).toLowerCase()
                        : "-"}
                    </td>

                    <td>{item.assetTag}</td>
                    <td>{item.reason}</td>
                    <td>{new Date(item.reportedAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleRepair(item.id)}
                      >
                        Repair
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="d-flex justify-content-center mt-3 gap-2">
        <button
          className="btn btn-dark"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span className="align-self-center">
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-dark"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
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

export default DamagedAssets;
