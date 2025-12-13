import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./style.css";

function AdminReport() {
  const [reports, setReports] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [locationSummary, setLocationSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [search, setSearch] = useState("");

  const inventoryRef = useRef(null);
  const locationRef = useRef(null);
  const requestsRef = useRef(null);

  const navigate = useNavigate();

  const API = "http://localhost:5083/api/AdminReport";

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get(API);
        setReports(res.data.reports);
        setInventory(res.data.inventory);
        setLocationSummary(res.data.locationSummary);
      } catch (err) {
        console.error("Error loading admin report:", err);
      } finally {
        setLoading(false);
      }
    };

    // 🔐 LOAD ADMIN FROM LOCAL STORAGE
    const storedAdmin = localStorage.getItem("user"); // or "admin"
    if (storedAdmin) {
      setAdminData(JSON.parse(storedAdmin));
    } else {
      navigate("/admin-login");
    }

    loadData();
  }, [navigate]);



  // 👉 Navigate to Individual Asset Details Page
  const goToAssetDetails = (assetType) => {
    navigate(`/individual-details/asset/${assetType}`);
  };

  // 👉 Navigate to Individual Location Requests Page
  const goToLocationDetails = (location) => {
    navigate(`/individual-details/location/${location}`);
  };

  const filteredReports = reports.filter((req) => {
    const txt = search.toLowerCase();
    return (
      req.id.toString().includes(txt) ||
      req.status.toLowerCase().includes(txt) ||
      req.location.toLowerCase().includes(txt) ||
      req.user.toLowerCase().includes(txt) ||
      req.message.toLowerCase().includes(txt) ||
      req.assetItems.some((a) => a.name.toLowerCase().includes(txt))
    );
  });

  const downloadPDF = async (ref, filename) => {
    const elem = ref.current;
    const canvas = await html2canvas(elem, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, width, height);
    pdf.save(filename);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-report-page container mt-4">
      <h2>📊 Admin Report</h2>


      {/* ADMIN INFO */}
      <div className="card p-3 mb-4">
        <p><strong>Name:</strong> {adminData?.name || "—"}</p>
        <p><strong>Email:</strong> {adminData?.email || "—"}</p>
        <p><strong>Phone:</strong> {adminData?.phoneNumber || "—"}</p>

      </div>
      {!showPreview && (
        <div className="text-end mb-3">
          <button className="btn btn-primary" onClick={() => setShowPreview(true)}>
            📄 Show PDF Export
          </button>
        </div>
      )}

      {showPreview && (
        <div className="card p-4 shadow mb-4">

          {/* =============================
              INVENTORY SUMMARY
          ============================= */}
          <div ref={inventoryRef} className="bg-white p-3 mb-3">
            <h3 className="text-center mb-3">📦 Inventory Summary</h3>

            <table className="table table-bordered">
              <thead className="table-secondary">
                <tr>
                  <th>Asset Type</th>
                  <th>Total</th>
                  <th>Assigned</th>
                  <th>Available</th>
                </tr>
              </thead>

              <tbody>
                {inventory &&
                  <>
                    {Object.entries(inventory).map(([type, v]) => (
                      <tr key={type}>
                        <td
                          className="text-primary fw-bold"
                          style={{ cursor: "pointer" }}
                          onClick={() => goToAssetDetails(type.toLowerCase())}
                        >
                          {type.toLowerCase()}
                        </td>
                        <td>{v.total}</td>
                        <td>{v.assigned}</td>
                        <td>{v.available}</td>
                      </tr>
                    ))}

                    {/* ⭐ EXTRA ROW FOR ALL ASSETS */}
                    <tr>
                      <td
                        className="text-danger fw-bold"
                        style={{ cursor: "pointer" }}
                        onClick={() => goToAssetDetails("all")}
                      >
                        all
                      </td>
                      <td colSpan="3">View all assets combined</td>
                    </tr>
                  </>
                }
              </tbody>

            </table>
          </div>

          <div className="text-center mb-5">
            <button className="btn btn-success" onClick={() => downloadPDF(inventoryRef, "InventorySummary.pdf")}>
              ⬇ Download Inventory PDF
            </button>
          </div>

          {/* =============================
              LOCATION SUMMARY
          ============================= */}
          <div ref={locationRef} className="bg-white p-3 mb-3">
            <h3 className="text-center mb-3">📍 Location Summary</h3>

            <table className="table table-bordered">
              <thead className="table-info">
                <tr>
                  <th>Location</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Pending</th>
                </tr>
              </thead>

              <tbody>
                {locationSummary &&
                  Object.entries(locationSummary).map(([loc, s]) => (
                    <tr key={loc}>
                      <td
                        className="text-primary fw-bold"
                        style={{ cursor: "pointer" }}
                        onClick={() => goToLocationDetails(loc)}
                      >
                        {loc}
                      </td>
                      <td>{s.totalRequests}</td>
                      <td>{s.approved}</td>
                      <td>{s.pending}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mb-5">
            <button className="btn btn-success" onClick={() => downloadPDF(locationRef, "LocationSummary.pdf")}>
              ⬇ Download Location PDF
            </button>
          </div>

          {/* =============================
              REQUEST SUMMARY
          ============================= */}
          <label className="fw-bold">🔍 Search Requests:</label>
          <input
            className="form-control mb-3"
            placeholder="Search by ID, Status, User, Location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div ref={requestsRef} className="bg-white p-3">
            <h3 className="text-center mb-3">📋 All Requests Summary</h3>

            <table className="table table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>User</th>
                  <th>Location</th>
                  <th>Message</th>
                  <th>Assets</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.status}</td>
                    <td>{new Date(req.requestDate).toLocaleString()}</td>
                    <td>{req.user}</td>
                    <td>{req.location}</td>
                    <td>{req.message}</td>

                    {/* ❤️ Restored Assets Column With Partial Reason */}
                    <td>
                      {req.assetItems.map((item) => (
                        <div key={item.name}>
                          <strong>{item.name}</strong> —
                          {item.requestedQuantity} req / {item.approvedQuantity ?? 0} approved
                          {item.partialReason && (
                            <div className="text-danger small">
                              Reason: {item.partialReason}
                            </div>
                          )}
                        </div>
                      ))}
                    </td>

                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-danger">
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-success" onClick={() => downloadPDF(requestsRef, "RequestsSummary.pdf")}>
              ⬇ Download Requests PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReport;
