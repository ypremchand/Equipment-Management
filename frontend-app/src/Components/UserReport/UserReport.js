import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./style.css";

function UserReport() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showTablePreview, setShowTablePreview] = useState(false);
  const [search, setSearch] = useState(""); // NEW SEARCH STATE

  const reportRef = useRef(null);

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const API = "http://localhost:5083/api/UserReport";

  useEffect(() => {
    const loadReport = async () => {
      try {
        if (!loggedUser?.id) return;

        const res = await axios.get(`${API}/${loggedUser.id}`);
        setUserData(res.data);
      } catch (err) {
        console.error("Error loading user report:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  // 📌 FILTER BASED ON SEARCH
  const filteredRequests = userData?.requests?.filter((req) => {
    const text = search.toLowerCase();

    return (
      req.id.toString().includes(text) ||
      req.status.toLowerCase().includes(text) ||
      req.location.toLowerCase().includes(text) ||
      req.message.toLowerCase().includes(text) ||
      req.assetItems.some((a) =>
        a.assetName.toLowerCase().includes(text)
      )
    );
  });

  // ===========================
  // 📌 DOWNLOAD PDF
  // ===========================
  const downloadPDF = async () => {
    const element = reportRef.current;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`UserReport_${userData.name}.pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>No report found</div>;

  return (
    <div className="user-report-page container mt-4">
      <h2>📄 User Report</h2>

      {/* USER INFO */}
      <div className="card p-3 mb-4">
        <p><strong>Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone:</strong> {userData.phoneNumber}</p>
      </div>

      {/* EXPORT BUTTON */}
      {!showTablePreview && (
        <div className="text-end mb-3">
          <button
            className="btn btn-primary"
            onClick={() => setShowTablePreview(true)}
          >
            📄 Export PDF
          </button>
        </div>
      )}

      {/* ===========================
          SEARCH + TABLE PREVIEW
      ============================ */}
      {showTablePreview && (
        <div className="card p-4 mb-4 shadow">

          {/* 🔍 SEARCH BOX */}
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search by Request ID, Status, Location, Message, Asset Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <h4 className="mb-3">📄 PDF Preview</h4>

          <div ref={reportRef} className="p-3" style={{ background: "white" }}>
            <h3 className="text-center mb-3">Requested Assets Summary</h3>

            {/* TABLE */}
            <table className="table table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>Request ID</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Message</th>
                  <th>Assets</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests?.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.status}</td>
                    <td>{new Date(req.requestDate).toLocaleString()}</td>
                    <td>{req.location}</td>
                    <td className="w-25">{req.message}</td>

                    <td>
                      <div className="asset-scroll-box">
                        {req.assetItems.map((item) => (
                          <div key={item.id} style={{ marginBottom: "6px" }}>
                            <strong>{item.assetName}</strong>
                            <br />
                            Requested: {item.requestedQuantity}, Approved: {item.approvedQuantity}

                            {item.approvedQuantity < item.requestedQuantity && item.partialReason && (
                              <div className="text-danger">
                                Reason: {item.partialReason}
                              </div>
                            )}

                            <ul style={{ marginLeft: "15px" }}>
                              {item.brand && <li>Brand: {item.brand}</li>}
                              {item.processor && <li>Processor: {item.processor}</li>}
                              {item.storage && <li>Storage: {item.storage}</li>}
                              {item.ram && <li>RAM: {item.ram}</li>}
                              {item.operatingSystem && <li>OS: {item.operatingSystem}</li>}
                              {item.scanner1Type && <li>Scanner Type: {item.scanner1Type}</li>}
                              {item.scanner1Resolution && <li>Scanner Res: {item.scanner1Resolution}</li>}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* NO RESULTS FOUND */}
                {filteredRequests?.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-danger">
                      No matching results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Download PDF button */}
          <div className="text-center mt-3">
            <button className="btn btn-success" onClick={downloadPDF}>
              ⬇ Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserReport;
