  import React, { useEffect, useState } from "react";
  import { Link, useParams } from "react-router-dom";
  import axios from "axios";
  import "./style.css";

  function IndividualDetails() {
    const { assetType, locationName } = useParams();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔥 History modal states
    const [showHistory, setShowHistory] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const isAssetPage = Boolean(assetType);
    const isLocationPage = Boolean(locationName);

    /* ============================================================
      UNIVERSAL VALUE MAPPER
    ============================================================ */
    const getValue = (item, field) => {
      if (field === "brand") {
        return (
          item.brand ||
          item.scanner1Brand ||
          item.scanner2Brand ||
          item.scanner3Brand ||
          "-"
        );
      }

      if (field === "model") {
        return (
          item.model ||
          item.modelNumber ||
          item.scanner1Model ||
          item.scanner2Model ||
          item.scanner3Model ||
          "-"
        );
      }

      if (field === "location") {
        return (
          item.location ||
          item.scanner1Location ||
          item.scanner2Location ||
          item.scanner3Location ||
          "-"
        );
      }

      if (field === "assetTag") {
        return (
          item.assetTag ||
          item.scanner1AssetTag ||
          item.scanner2AssetTag ||
          item.scanner3AssetTag ||
          "-"
        );
      }

      if (field === "remarks") {
        return item.remarks ?? "No";
      }

      return item[field] ?? "-";
    };

    const columns = [
      { key: "id", label: "ID" },
      { key: "brand", label: "Brand" },
      { key: "model", label: "Model" },
      { key: "location", label: "Location" },
      { key: "assetTag", label: "Asset Tag" },
      { key: "remarks", label: "Remarks" },
    ];

    /* ============================================================
      LOAD DATA
    ============================================================ */
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
            const res = await axios.get(
              "http://localhost:5083/api/AdminReport"
            );
            setData(
              res.data.reports.filter(
                (r) => r.location === locationName
              )
            );
          }
        } catch (err) {
          console.error("Error loading details:", err);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [assetType, locationName]);

    /* ============================================================
      VIEW HISTORY HANDLER
    ============================================================ */
    const handleViewHistory = async (item) => {
      setSelectedItem(item);
      setShowHistory(true);
      setHistory([]);
      setHistoryLoading(true);

      try {
        const res = await axios.get(
          `http://localhost:5083/api/AssetHistory/${item.assetTag}`
        );
        setHistory(res.data);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (loading) {
      return (
        <h3 className="individual-details-page text-center mt-3">
          Loading...
        </h3>
      );
    }

    /* ============================================================
      ALL ASSETS PAGE
    ============================================================ */
    if (assetType === "all") {
      return (
        <div className="individual-details-page container mt-4">
          <h2>📦 All Assets — Complete Inventory</h2>

          {Object.entries(data).map(([type, list]) => (
            <div key={type} className="mb-5">
              <h3 className="text-primary">{type.toUpperCase()}</h3>

              <div className="asset-scroll-box">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark sticky-top">
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key}>{c.label}</th>
                      ))}
                      <th>Status</th>
                      <th>History</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.map((item) => (
                      <tr key={item.id}>
                        {columns.map((c) => (
                          <td key={c.key}>{getValue(item, c.key)}</td>
                        ))}
                        <td>
                          {item.isAssigned ? "Assigned" : "Available"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewHistory(item)}
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="text-center mt-4">
            <Link to="/admin-report" className="btn btn-outline-dark">
              ⬅ Back to Admin Report
            </Link>
          </div>

          {/* 🔥 HISTORY MODAL */}
          {renderHistoryModal()}
        </div>
      );
    }

    /* ============================================================
      SINGLE ASSET TYPE PAGE
    ============================================================ */
    if (isAssetPage && assetType !== "all") {
      return (
        <div className="individual-details-page container mt-4">
          <h2>🖥️ {assetType.toUpperCase()} — Asset Details</h2>

          <div className="asset-scroll-box">
            <table className="table table-bordered table-striped">
              <thead className="table-dark sticky-top">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th>Status</th>
                  <th>History</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    {columns.map((c) => (
                      <td key={c.key}>{getValue(item, c.key)}</td>
                    ))}
                    <td>
                      {item.isAssigned ? "Assigned" : "Available"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewHistory(item)}
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-4">
            <Link to="/admin-report" className="btn btn-outline-dark">
              ⬅ Back to Admin Report
            </Link>
          </div>

          {/* 🔥 HISTORY MODAL */}
          {renderHistoryModal()}
        </div>
      );
    }

    /* ============================================================
      LOCATION PAGE
    ============================================================ */
    return (
      <div className="individual-details-page container mt-4">
        <h2>📍 {locationName} — Request Details</h2>

        <table className="table table-bordered">
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
            {data.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.user}</td>
                <td>{req.status}</td>
                <td>
                  {new Date(req.requestDate).toLocaleString()}
                </td>
                <td>{req.message}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-center mt-4">
          <Link to="/admin-report" className="btn btn-outline-dark">
            ⬅ Back to Admin Report
          </Link>
        </div>
      </div>
    );

    /* ============================================================
      HISTORY MODAL RENDER
    ============================================================ */
    function renderHistoryModal() {
      if (!showHistory) return null;

      return (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    🕘 Asset History — {selectedItem?.assetTag}
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowHistory(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  {historyLoading ? (
                    <p>Loading history...</p>
                  ) : history.length === 0 ? (
                    <p className="text-muted">No history available.</p>
                  ) : (
                    <table className="table table-bordered table-striped">
                      <thead className="table-dark">
                        <tr>
                          <th>ID</th>
                          <th>Asset Tag</th>
                          <th>Brand</th>
                          <th>Location</th>
                          <th>Requested Date</th>
                          <th>Requested By</th>
                          <th>Assigned Date</th>
                          <th>Assigned By</th>
                          <th>Return Date</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, i) => (
                          <tr key={i}>
                            <td>{h.id}</td>
                            <td>{h.assetTag}</td>
                            <td>{h.brand}</td>
                            <td>{h.location}</td>
                            <td>{h.requestedDate ? new Date(h.requestedDate).toLocaleString() : "—"}</td>
                            <td>{h.requestedBy || "—"}</td>
                            <td>{h.assignedDate ? new Date(h.assignedDate).toLocaleString() : "—"}</td>
                            <td>{h.assignedBy || "—"}</td>
                            <td>{h.returnDate ? new Date(h.returnDate).toLocaleString() : "—"}</td>
                            <td>{h.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowHistory(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      );
    }
  }

  export default IndividualDetails;
