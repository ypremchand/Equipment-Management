import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./style.css";

function AssignedItems() {
  const { requestId } = useParams();

  const [requestData, setRequestData] = useState(null);
  const [assignedItems, setAssignedItems] = useState([]);

  const API = "http://localhost:5083/api/assetrequests";

  // Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRemark, setReturnRemark] = useState("No");
  const [damageReason, setDamageReason] = useState("");
  const [selectedAssignedId, setSelectedAssignedId] = useState(null);

  // Load assigned items
  const loadData = useCallback(async () => {
    try {
      const res = await axios.get(API);
      const all = res.data;

      const req = all.find((x) => x.id === Number(requestId));

      if (!req) {
        setRequestData(null);
        setAssignedItems([]);
        return;
      }

      setRequestData(req);

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

  // Open Return Modal
  const openReturnModal = (assignedId) => {
    setSelectedAssignedId(assignedId);
    setReturnRemark("No");
    setDamageReason("");
    setShowReturnModal(true);
  };

  // Submit return
  const submitReturn = async () => {
    try {
      await axios.post(`${API}/return-item/${selectedAssignedId}`, {
        isDamaged: returnRemark === "Yes",
        damageReason: damageReason
      });

      alert("Asset returned successfully!");

      setShowReturnModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to return asset.");
    }
  };

  if (!requestData) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info">Request not found.</div>
      </div>
    );
  }

  const groupBy = (type) =>
    assignedItems.filter((a) => a.assetType?.toLowerCase() === type);

  const laptops = groupBy("laptop");
  const mobiles = groupBy("mobile");
  const tablets = groupBy("tablet");
  const desktops = groupBy("desktop");
  const printers = groupBy("printer");
  const scanner1 = groupBy("scanner1");
   const scanner2 = groupBy("scanner2");
   const scanner3 = groupBy("scanner3");

  // DO NOT FILTER TABS — SHOW ALL ALWAYS
  const tabs = [
    { key: "laptop", label: "Laptops", data: laptops },
    { key: "mobile", label: "Mobiles", data: mobiles },
    { key: "tablet", label: "Tablets", data: tablets },
    { key: "desktop", label: "Desktops", data: desktops },
    { key: "printer", label: "Printers", data: printers },
    { key: "scanner1", label: "Scanner1", data: scanner1 },
    { key: "scanner2", label: "Scanner2", data: scanner2 },
     { key: "scanner3", label: "Scanner3", data: scanner3 }
  ];

  const firstTab = tabs[0].key;

  return (
    <div className="assigned-items-page container mt-4">
      <h3 className="mb-4">Assigned Items for Request #{requestId}</h3>

      {/* Request Summary */}
      <div className="card mb-4">
  <div className="card-body">
    <p>
      <strong>Status:</strong> {requestData.status}
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
    const title = requestData.message || "";

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


    {/* APPROVED QUANTITY OUTPUT */}
   <p>
  <strong>Approved Quantity:</strong>{" "}
  {requestData.assetRequestItems?.map((item, index) => {
    const count = item.assignedAssets?.length || 0;
    const name = item.asset?.name || "Asset";

    // Convert plural → singular
    const singular = name.endsWith("s") ? name.slice(0, -1) : name;

    return (
      <span key={item.id}>
        {count} {singular}
        {index < requestData.assetRequestItems.length - 1 ? ", " : ""}
      </span>
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


      {/* Tabs */}
      <ul className="nav nav-tabs">
        {tabs.map((t) => (
          <li className="nav-item" key={t.key}>
            <a
              className={`nav-link ${firstTab === t.key ? "active" : ""}`}
              data-bs-toggle="tab"
              href={`#tab-${t.key}`}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>

      {/* TAB CONTENT */}
      <div className="tab-content border p-3 border-top-0">
        {tabs.map((t) => (
          <div
            key={t.key}
            id={`tab-${t.key}`}
            className={`tab-pane fade show ${firstTab === t.key ? "active" : ""
              }`}
          >
            {/* CASE — NO ITEMS FOR THIS TAB */}
            {t.data.length === 0 ? (
              <div className="text-center text-danger fw-bold mt-3">
                No available items for this Request.
              </div>
            ) : (
              /* CASE — ITEMS AVAILABLE → SHOW TABLE */
              <table className="table table-bordered mt-3">
                <thead className="table-dark">
                  <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Asset Tag</th>
                    <th>Status</th>
                    <th>Assigned Date</th>
                    <th>Returned Date</th>
                    <th>Return</th>
                  </tr>
                </thead>

                <tbody>
                  {t.data.map((a) => (
                    <tr key={a.id}>
                      {/* BRAND */}
                      <td>
                        {a.assetType === "scanner1"
                          ? a.detail?.scanner1Brand
                          : a.assetType === "scanner2"
                          ? a.detail?.scanner2Brand
                          : a.assetType === "scanner3"
                          ? a.detail?.scanner3Brand
                          : a.detail?.brand}
                      </td>

                      {/* MODEL + DETAILS */}
                      <td>
                        {a.assetType === "scanner1" ? (
                          <>
                            {a.detail?.scanner1Model}
                            {/* <div className="text-muted small">
                              Type: {a.detail?.scanner1Type}<br />
                              Resolution: {a.detail?.scanner1Resolution}
                            </div> */}
                          </>
                        ) : a.assetType === "scanner2" ? (
                          <>
                            {a.detail?.scanner2Model}
                            {/* <div className="text-muted small">
                              Type: {a.detail?.scanner2Type}<br />
                              Resolution: {a.detail?.scanner2Resolution}
                            </div> */}
                          </>
                        ) : a.assetType === "scanner3" ? (
                          <>
                            {a.detail?.scanner3Model}
                            {/* <div className="text-muted small">
                              Type: {a.detail?.scanner3Type}<br />
                              Resolution: {a.detail?.scanner3Resolution}
                            </div> */}
                          </>
                        ) : (
                          a.detail?.model || a.detail?.modelNumber
                        )}
                      </td>

                      {/* ASSET TAG */}
                      <td>
                        {a.assetType === "scanner1"
                          ? a.detail?.scanner1AssetTag
                          : a.assetType === "scanner2"
                          ? a.detail?.scanner2AssetTag
                          : a.assetType === "scanner3"
                          ? a.detail?.scanner3AssetTag
                          : a.detail?.assetTag}
                      </td>

                      <td>{a.status}</td>

                      <td>
                        {a.assignedDate
                          ? new Date(a.assignedDate).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        {a.returnedDate
                          ? new Date(a.returnedDate).toLocaleString()
                          : "—"}
                      </td>

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
        ))}
      </div>

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Return Asset</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReturnModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <label className="form-label fw-bold">
                  Is the item damaged?
                </label>
                <select
                  className="form-select"
                  value={returnRemark}
                  onChange={(e) => setReturnRemark(e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>

                {returnRemark === "Yes" && (
                  <div className="mt-3">
                    <label className="form-label fw-bold">Damage Reason</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={damageReason}
                      onChange={(e) => setDamageReason(e.target.value)}
                    ></textarea>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReturnModal(false)}
                >
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
