import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./style.css";

function AssignedItems() {
  const { requestId } = useParams();
  const API = "http://localhost:5083/api/assetrequests";

  const [requestData, setRequestData] = useState(null);
  const [assignedItems, setAssignedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("laptop");

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRemark, setReturnRemark] = useState("No");
  const [damageReason, setDamageReason] = useState("");
  const [selectedAssignedId, setSelectedAssignedId] = useState(null);

  /* ================= LOAD DATA ================= */
  const loadData = useCallback(async () => {
    try {
      const res = await axios.get(API);
      const req = res.data.find((x) => x.id === Number(requestId));

      if (!req) {
        setRequestData(null);
        setAssignedItems([]);
        return;
      }

      setRequestData(req);

      // Show assigned items only after Received
      if (req.status !== "Received") {
        setAssignedItems([]);
        return;
      }

      const flat = [];
      req.assetRequestItems.forEach((i) => {
        if (i.assignedAssets?.length) {
          flat.push(...i.assignedAssets);
        }
      });

      setAssignedItems(flat);
    } catch (err) {
      console.error("Error loading assigned items:", err);
    }
  }, [API, requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= GROUPING ================= */
  const groupBy = (type) =>
    assignedItems.filter((a) => a.assetType?.toLowerCase() === type);

  const tabs = [
    { key: "laptop", label: "Laptops", data: groupBy("laptop") },
    { key: "mobile", label: "Mobiles", data: groupBy("mobile") },
    { key: "tablet", label: "Tablets", data: groupBy("tablet") },
    { key: "desktop", label: "Desktops", data: groupBy("desktop") },
    { key: "printer", label: "Printers", data: groupBy("printer") },
    { key: "scanner1", label: "Scanner1", data: groupBy("scanner1") },
    { key: "scanner2", label: "Scanner2", data: groupBy("scanner2") },
    { key: "scanner3", label: "Scanner3", data: groupBy("scanner3") },
    { key: "barcode", label: "Barcodes", data: groupBy("barcode") },
  ];

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    const active = tabs.find((t) => t.key === activeTab);

    if (!active || active.data.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    const rows = active.data.map((a, i) => [
      i + 1,
      a.detail?.brand ||
        a.detail?.scanner1Brand ||
        a.detail?.scanner2Brand ||
        a.detail?.scanner3Brand ||
        "—",
      a.detail?.model ||
        a.detail?.modelNumber ||
        a.detail?.scanner1Model ||
        a.detail?.scanner2Model ||
        a.detail?.scanner3Model ||
        "—",
      a.detail?.assetTag ||
        a.detail?.scanner1AssetTag ||
        a.detail?.scanner2AssetTag ||
        a.detail?.scanner3AssetTag ||
        "—",
      a.status,
      a.assignedDate ? new Date(a.assignedDate).toLocaleString() : "—",
      a.returnedDate ? new Date(a.returnedDate).toLocaleString() : "—",
    ]);

    autoTable(doc, {
      head: [[
        "#",
        "Brand",
        "Model",
        "Asset Tag",
        "Status",
        "Assigned Date",
        "Returned Date"
      ]],
      body: rows,
      styles: { fontSize: 8 },
    });

    doc.save(`${active.label}_${Date.now()}.pdf`);
  };

  /* ================= RETURN ================= */
  const openReturnModal = (id) => {
    setSelectedAssignedId(id);
    setReturnRemark("No");
    setDamageReason("");
    setShowReturnModal(true);
  };

  const submitReturn = async () => {
    try {
      await axios.post(`${API}/return-item/${selectedAssignedId}`, {
        isDamaged: returnRemark === "Yes",
        damageReason,
      });
      alert("✅ Asset returned successfully!");
      setShowReturnModal(false);
      loadData();
    } catch {
      alert("Failed to return asset.");
    }
  };

  if (!requestData) {
    return (
      <div className="container mt-4 alert alert-info">
        Request not found.
      </div>
    );
  }

  return (
    <div className="assigned-items-page container mt-4">
      <h3 className="mb-4">Assigned Items for Request #{requestId}</h3>

      {/* Request Summary */}
      <div className="card mb-4">
        <div className="card-body">
          <p>
            <strong>Status:</strong>{" "}
            {requestData.status === "Approved"
              ? "Approved (Not Yet Received)"
              : requestData.status}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(requestData.requestDate).toLocaleString()}
          </p>
          <p>
            <strong>Location:</strong> {requestData.location?.name}
          </p>
          <p>
            <strong>Requested:</strong>
            <br />

            {requestData.assetRequestItems?.map((item) => {
              // const title = requestData.message || "";

              const filters = {
                Brand: item.brand,
                Processor: item.processor,
                Storage: item.storage,
                Ram: item.ram,
                OperatingSystem: item.operatingSystem,
                NetworkType: item.networkType,
                SimType: item.simType,
                SimSupport: item.simSupport,
                PrinterType: item.printerType,
                PaperSize: item.paperSize,
                Dpi: item.dpi,
                Scanner1Type: item.scanner1Type,
                Scanner1Resolution: item.scanner1Resolution,
                Scanner2Type: item.scanner2Type,
                Scanner2Resolution: item.scanner2Resolution,
                Scanner3Type: item.scanner3Type,
                Scanner3Resolution: item.scanner3Resolution,
                Type: item.Type,
                Technology: item.Technology,
              };

              const filterText = Object.entries(filters)
                .filter(([k, v]) => v && v !== "")
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");

              return (
                <div key={item.id} style={{ marginLeft: "50px", marginBottom: "6px" }}>
                  • Requesting {item.requestedQuantity} of {item.asset?.name}
                  {filterText ? ` (${filterText})` : ""}
                </div>
              );
            })}
          </p>

          <p>
            {requestData.assetRequestItems?.map((item) => {
              const approvedQty = item.requestedQuantity || 0;
              const assignedQty = item.assignedAssets?.length || 0;

              const name = item.asset?.name || "Asset";
              const singular = name.endsWith("s") ? name.slice(0, -1) : name;

              return (
                <div key={item.id}>
                  <p>
                    <strong>Approved Quantity:</strong> {approvedQty} {singular}
                  </p>
                  <p>
                    <strong>Assigned Quantity:</strong> {assignedQty} {singular}
                  </p>
                </div>
              );
            })}
          </p>

          {/* REASON DISPLAY FIX */}
          <p>
            <strong>Reason:</strong>{" "}
            {requestData.assetRequestItems?.some((x) => x.partialReason) ? (
              requestData.assetRequestItems
                .filter((item) => item.partialReason)
                .map((item) => {
                  const name = item.asset?.name || "Asset";
                  return `${name} – ${item.partialReason}`;
                })
                .join(", ")
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>
 {/* ================= ACTIONS ================= */}
      <button className="btn btn-outline-danger mb-3" onClick={exportToPDF}>
        Export PDF
      </button>

      {/* ================= TABS ================= */}
      <ul className="nav nav-tabs">
        {tabs.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* ================= TAB CONTENT ================= */}
      <div className="border p-3 border-top-0">
        {tabs.find((t) => t.key === activeTab)?.data.length === 0 ? (
          <div className="text-center text-danger fw-bold">
            No available items for this request.
          </div>
        ) : (
          <table className="table table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Asset Tag</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Returned</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {tabs
                .find((t) => t.key === activeTab)
                ?.data.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.detail?.brand ||
                        a.detail?.scanner1Brand ||
                        a.detail?.scanner2Brand ||
                        a.detail?.scanner3Brand}
                    </td>
                    <td>
                      {a.detail?.model ||
                        a.detail?.modelNumber ||
                        a.detail?.scanner1Model ||
                        a.detail?.scanner2Model ||
                        a.detail?.scanner3Model}
                    </td>
                    <td>
                      {a.detail?.assetTag ||
                        a.detail?.scanner1AssetTag ||
                        a.detail?.scanner2AssetTag ||
                        a.detail?.scanner3AssetTag}
                    </td>
                    <td>{a.status}</td>
                    <td>{a.assignedDate ? new Date(a.assignedDate).toLocaleString() : "—"}</td>
                    <td>{a.returnedDate ? new Date(a.returnedDate).toLocaleString() : "—"}</td>
                    <td>
                      {a.status === "Returned" ? (
                        <span className="badge bg-success">Returned</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => openReturnModal(a.id)}
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= RETURN MODAL ================= */}
      {showReturnModal && (
        <div className="modal fade show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Return Asset</h5>
                <button className="btn-close" onClick={() => setShowReturnModal(false)} />
              </div>

              <div className="modal-body">
                <select
                  className="form-select"
                  value={returnRemark}
                  onChange={(e) => setReturnRemark(e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>

                {returnRemark === "Yes" && (
                  <textarea
                    className="form-control mt-2"
                    placeholder="Damage reason"
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                  />
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitReturn}>
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        </div>
         )}

      
    </div>
  );
}

export default AssignedItems;
