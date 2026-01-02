import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./style.css";

function AdminReport() {
  const [reports, setReports] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [inventory, setInventory] = useState({});
  const [locationSummary, setLocationSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const inventoryRef = useRef(null);
  const locationRef = useRef(null);
  const requestsRef = useRef(null);
  const navigate = useNavigate();
  const API = "http://localhost:5083/api/AdminReport";

  /* ============================================================
     LOAD DATA
  ============================================================ */
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get(API);
        setReports(res.data?.reports || []);
        setInventory(res.data?.inventory || {});
        setLocationSummary(res.data?.locationSummary || {});
      } catch (err) {
        console.error("Error loading admin report:", err);
      } finally {
        setLoading(false);
      }
    };

    const storedAdmin = localStorage.getItem("user");
    if (storedAdmin) {
      setAdminData(JSON.parse(storedAdmin));
    } else {
      navigate("/admin-login");
    }

    loadData();
  }, [navigate]);

  /* ============================================================
     NAVIGATION
  ============================================================ */
  const goToAssetDetails = (assetType) => {
    navigate(`/individual-details/asset/${assetType}`);
  };

  const goToLocationDetails = (location) => {
    navigate(`/individual-details/location/${location}`);
  };
  const totalInventory = Object.values(inventory).reduce(
    (acc, item) => {
      acc.total += item.total || 0;
      acc.assigned += item.assigned || 0;
      acc.available += item.available || 0;
      return acc;
    },
    { total: 0, assigned: 0, available: 0 }
  );

  /* ============================================================
     SEARCH FILTER
  ============================================================ */
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

  /* ============================================================
     PDF DOWNLOAD (SCROLL SAFE)
  ============================================================ */
  const downloadPDF = async (ref, filename) => {
    const elem = ref.current;
    if (!elem) return;

    const canvas = await html2canvas(elem, {
      scale: 2,
      useCORS: true,
      windowWidth: elem.scrollWidth,
      windowHeight: elem.scrollHeight,
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  };

  if (loading) {
    return <div className="text-center mt-4">Loading...</div>;
  }

  /* ================= PAGINATION ================= */
  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedReports = filteredReports.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="admin-report-page container mt-4">
      <h2>📊 Admin Report</h2>

      {/* ================= ADMIN INFO ================= */}
      <div className="card p-3 mb-4">
        <p><strong>Name:</strong> {adminData?.name || "—"}</p>
        <p><strong>Email:</strong> {adminData?.email || "—"}</p>
        <p><strong>Phone:</strong> {adminData?.phoneNumber || "—"}</p>
      </div>

      <div className="card p-4 shadow mb-4">

        {/* ================= INVENTORY SUMMARY ================= */}
        <div ref={inventoryRef} className="bg-white p-3 mb-3">
          <div className="d-flex justify-content-between py-3">
            <h3 className="text-center">📦 Inventory Summary</h3>
            <div className="text-center">
              <button
                className="btn btn-success"
                onClick={() => downloadPDF(inventoryRef, "InventorySummary.pdf")}
              >
                ⬇ Download Inventory PDF
              </button>
            </div>
          </div>

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

              <tr>
                <td
                  className="text-danger fw-bold"
                  style={{ cursor: "pointer" }}
                  onClick={() => goToAssetDetails("all")}
                >
                  All Assets
                </td>
                <td>{totalInventory.total}</td>
                <td>{totalInventory.assigned}</td>
                <td>{totalInventory.available}</td>
              </tr>
            </tbody>
          </table>
        </div>



        {/* ================= LOCATION SUMMARY ================= */}
        <div ref={locationRef} className="bg-white p-3 mb-3">
          <div className="d-flex justify-content-between py-3">
            <h3 className="text-center">📍 Location Summary</h3>
            <div className="text-center">
              <button
                className="btn btn-success"
                onClick={() => downloadPDF(locationRef, "LocationSummary.pdf")}
              >
                ⬇ Download Location PDF
              </button>
            </div>
          </div>


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
              {Object.entries(locationSummary).map(([loc, s]) => (
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



        {/* ================= REQUEST SUMMARY ================= */}
        <label className="fw-bold">🔍 Search Requests:</label>
        <input
          className="form-control mb-3"
          placeholder="Search by ID, Status, User, Location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div ref={requestsRef} className="bg-white p-3">
          <div className="d-flex justify-content-between py-3">
            <h3 className="text-center">📋 All Requests Summary</h3>
            <div className="text-center ">
              <button
                className="btn btn-success"
                onClick={() => downloadPDF(requestsRef, "RequestsSummary.pdf")}
              >
                ⬇ Download Requests PDF
              </button>
            </div>
          </div>


          <table className="table table-bordered">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Date</th>
                <th>User</th>
                <th>Location</th>
                <th className="w-25">Message</th>
                <th>Assets</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.status}</td>
                  <td>{new Date(req.requestDate).toLocaleString()}</td>
                  <td>{req.user}</td>
                  <td>{req.location}</td>
                  <td>{req.message}</td>
                  <td>
                    {req.assetItems.map((item) => (
                      <div key={item.name} className="mb-2">
                        <strong>{item.name}</strong><br />
                        Requested: {item.requestedQuantity}, Approved: {item.approvedQuantity}
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

              {paginatedReports.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-danger">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
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

export default AdminReport;
