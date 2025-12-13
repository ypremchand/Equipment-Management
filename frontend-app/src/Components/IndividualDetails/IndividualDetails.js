import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./style.css";

function IndividualDetails() {
  const { assetType, locationName } = useParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAssetPage = Boolean(assetType);
  const isLocationPage = Boolean(locationName);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isAssetPage) {
          const res = await axios.get(
            `http://localhost:5083/api/AdminReport/by-type/${assetType}`
          );
          setData(res.data);
        }

        if (isLocationPage) {
          const res = await axios.get("http://localhost:5083/api/AdminReport");
          const filtered = res.data.reports.filter(
            (r) => r.location === locationName
          );
          setData(filtered);
        }
      } catch (err) {
        console.error("Error loading details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assetType, locationName]);

  if (loading) return <h3 className="text-center mt-3">Loading...</h3>;

  // ============================================================
  // ⭐ SPECIAL PAGE FOR "all" ASSETS WITH SCROLLBAR + DYNAMIC COLUMNS
  // ============================================================
  if (assetType === "all") {
    return (
      <div className="individual-details-page container mt-4">
        <h2>📦 All Assets — Complete Inventory</h2>

        {Object.entries(data).map(([type, list]) => {
          if (!list || list.length === 0) return null;

          // Detect every column dynamically
          const allColumns = new Set();
          list.forEach((item) => {
            Object.keys(item).forEach((key) => {
              if (key !== "__v" && key !== "isAssigned") {
                allColumns.add(key);
              }
            });
          });

          const columns = Array.from(allColumns);

          return (
            <div key={type} className="mb-5">
              <h3 className="text-primary">{type.toUpperCase()}</h3>

              {/* Scroll Box */}
              <div className="asset-scroll-box">
                <table className="table table-bordered table-striped mt-2">
                  <thead className="table-dark sticky-top">
                    <tr>
                      {columns.map((col) => (
                        <th key={col}>{col.toUpperCase()}</th>
                      ))}
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.map((item) => (
                      <tr key={item.id}>
                        {columns.map((col) => (
                          <td key={col}>
                            {item[col] === null ||
                            item[col] === undefined ||
                            item[col] === ""
                              ? "-"
                              : item[col].toString()}
                          </td>
                        ))}

                        {/* Final Status */}
                        <td>{item.isAssigned ? "Assigned" : "Available"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // ⭐ NORMAL INDIVIDUAL ASSET PAGE (DYNAMIC FOR EACH ASSET TYPE)
  // ============================================================
  if (isAssetPage && assetType !== "all") {
    // Auto-detect all columns
    const allColumns = new Set();

    if (data.length > 0) {
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (key !== "__v" && key !== "isAssigned") {
            allColumns.add(key);
          }
        });
      });
    }

    const columns = Array.from(allColumns);

    return (
      <div className="individual-details-page container mt-4">
        <h2>🖥️ {assetType.toUpperCase()} — Asset Details</h2>

        <div className="asset-scroll-box">
          <table className="table table-bordered table-striped mt-3">
            <thead className="table-dark sticky-top">
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col.toUpperCase()}</th>
                ))}
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center">
                    No items found.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    {columns.map((col) => (
                      <td key={col}>
                        {item[col] === null ||
                        item[col] === undefined ||
                        item[col] === ""
                          ? "-"
                          : item[col].toString()}
                      </td>
                    ))}
                    <td>{item.isAssigned ? "Assigned" : "Available"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============================================================
  // ⭐ LOCATION REQUEST DETAILS PAGE
  // ============================================================
  return (
    <div className="individual-details-page container mt-4">
      <h2>📍 {locationName} — Request Details</h2>

      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Status</th>
            <th>Date</th>
            <th>Message</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No requests found.
              </td>
            </tr>
          ) : (
            data.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.user}</td>
                <td>{req.status}</td>
                <td>{new Date(req.requestDate).toLocaleString()}</td>
                <td>{req.message}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default IndividualDetails;
