import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./style.css";
import { Button } from "bootstrap";

function IndividualDetails() {
  const { assetType, locationName } = useParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 🔥 History modal
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
    if (!item) return "-";

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
     SEARCH FILTER (ALL ASSETS)
  ============================================================ */
  const matchesSearch = (item) => {
    if (!search) return true;

    const txt = normalizeText(search);

    return (
      normalizeText(item.id).includes(txt) ||
      normalizeText(getValue(item, "brand")).includes(txt) ||
      normalizeText(getValue(item, "model")).includes(txt) ||
      normalizeText(getValue(item, "location")).includes(txt) ||
      normalizeText(getValue(item, "assetTag")).includes(txt) ||
      (item.isAssigned ? "assigned" : "available").includes(txt)
    );
  };


  const normalizeText = (value = "") =>
    value
      .toString()
      .toLowerCase()
      // remove spaces and hyphens completely
      .replace(/[\s-]+/g, "");



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
  }, [assetType, locationName, isAssetPage, isLocationPage]);   /* [assetType, locationName]);*/


  //Get Filtered Data
  const getFilteredDataForExport = () => {
    // ALL assets page (object)
    if (assetType === "all") {
      const result = {};
      Object.entries(data).forEach(([type, list]) => {
        const filtered = list.filter(matchesSearch);
        if (filtered.length > 0) {
          result[type] = filtered;
        }
      });
      return result;
    }

    // Single asset page (array)
    if (Array.isArray(data)) {
      return data.filter(matchesSearch);
    }

    return [];
  };

  // Export To PDF
  const exportToPDF = () => {
    let exportRows = [];
    let slNo = 1;

    const exportData = getFilteredDataForExport();

    // CASE 1: All assets page
    if (assetType === "all") {
      Object.entries(exportData).forEach(([type, list]) => {
        list.forEach(item => {
          exportRows.push([
            slNo++,
            type.toUpperCase(),
            getValue(item, "brand"),
            getValue(item, "model"),
            getValue(item, "assetTag"),
            getValue(item, "location"),
            item.isAssigned ? "Assigned" : "Available"
          ]);
        });
      });
    }

    // CASE 2: Single asset page
    else if (Array.isArray(exportData)) {
      exportRows = exportData.map(item => ([
        slNo++,
        getValue(item, "brand"),
        getValue(item, "model"),
        getValue(item, "assetTag"),
        getValue(item, "location"),
        item.isAssigned ? "Assigned" : "Available"
      ]));
    }

    if (exportRows.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    const headers =
      assetType === "all"
        ? ["Sl.No", "Asset Type", "Brand", "Model", "Asset Tag", "Location", "Status"]
        : ["Sl.No", "Brand", "Model", "Asset Tag", "Location", "Status"];

    doc.text("Asset Inventory Report", 14, 12);

    autoTable(doc, {
      head: [headers],
      body: exportRows,
      startY: 18,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 40, 40] }
    });

    doc.save(`assets_${assetType || locationName}_${Date.now()}.pdf`);
  };



  /* ============================================================
     VIEW HISTORY
  ============================================================ */
  const handleViewHistory = async (item, type) => {
    const assetTag = getValue(item, "assetTag");

    if (!type || assetTag === "-") {
      console.error("Missing assetType or assetTag", type, item);
      return;
    }

    // Normalize selected item so modal always has assetTag
    setSelectedItem({ ...item, assetTag });

    setShowHistory(true);
    setHistory([]);
    setHistoryLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5083/api/AssetHistory/${type.toLowerCase()}/${assetTag}`
      );
      setHistory(res.data);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };



  if (loading) {
    return <h3 className="text-center mt-4">Loading...</h3>;
  }

  /* ============================================================
     ALL ASSETS PAGE
  ============================================================ */
  if (assetType === "all") {
    return (
      <div className="individual-details-page container mt-4">
        <h2>📦 All Assets — Complete Inventory</h2>

        <div>
          <label className="fw-bold mt-3">🔍 Search Assets:</label>
          <input
            className="form-control mb-4"
            placeholder="Search by ID, Brand, Model, Location, Asset Tag, Status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="btn btn-outline-danger" onClick={exportToPDF}>
            Export PDF
          </button>
        </div>

        {Object.entries(data).map(([type, list]) => {
          const filteredList = list.filter(matchesSearch);

          return (
            <div key={type} className="mb-5">
              <h4 className="text-primary">{type.toUpperCase()}</h4>

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
                    {filteredList.map((item) => (
                      <tr key={item.id}>
                        {columns.map((c) => (
                          <td key={c.key}>{getValue(item, c.key)}</td>
                        ))}
                        <td>{item.isAssigned ? "Assigned" : "Available"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewHistory(item, type)}
                          >
                            View History
                          </button>

                        </td>
                      </tr>
                    ))}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-danger">
                          No matching records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div className="text-center mb-3">
          <Link to="/admin-report" className="btn btn-outline-dark">
            ⬅ Back to Admin Report
          </Link>
        </div>

        {renderHistoryModal()}
      </div>
    );
  }

  /* ============================================================
     SINGLE ASSET TYPE PAGE
  ============================================================ */
  if (isAssetPage) {
    return (
      <div className="individual-details-page container mt-4">
        <h2>🖥️ {assetType.toUpperCase()} — Asset Details</h2>

        <label className="fw-bold mt-3">🔍 Search Assets:</label>
        <input
          className="form-control mb-4"
          placeholder="Search by ID, Brand, Model, Location, Asset Tag, Status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="pb-4">
          <button className="btn btn-outline-danger" onClick={exportToPDF}>
            Export PDF
          </button>
        </div>


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
              {data.filter(matchesSearch).map((item) => (
                <tr key={item.id}>
                  {columns.map((c) => (
                    <td key={c.key}>{getValue(item, c.key)}</td>
                  ))}
                  <td>{item.isAssigned ? "Assigned" : "Available"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleViewHistory(item, assetType)}
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}

              {data.filter(matchesSearch).length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-danger">
                    No matching records
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        <div className="text-center mt-3">
          <Link to="/admin-report" className="btn btn-outline-dark">
            ⬅ Back to Admin Report
          </Link>
        </div>

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
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Req.Date</th>
            <th>Status</th>
            <th>Apr.Date</th>
            <th>Message</th>
          </tr>
        </thead>

        <tbody>
          {data.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.user}</td>
              <td>{new Date(req.requestDate).toLocaleString()}</td>
              <td>{req.status}</td>
              <td>{new Date(req.aprovedDate).toLocaleString()}</td>
              <td>{req.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center my-4">
        <Link to="/admin-report" className="btn btn-outline-dark">
          ⬅ Back to Admin Report
        </Link>
      </div>
    </div>
  );

  /* ============================================================
     HISTORY MODAL
  ============================================================ */
  function renderHistoryModal() {
    if (!showHistory) return null;

    return (
      <>
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  🕘 Asset History — {selectedItem?.assetTag}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowHistory(false)}
                />
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
