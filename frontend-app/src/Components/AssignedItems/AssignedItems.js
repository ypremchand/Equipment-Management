import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./style.css";

function AssignedItems() {
  const { requestId } = useParams();
  const [items, setItems] = useState([]);

  const API = "http://localhost:5083/api/assetrequests";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(API);
        const allRequests = res.data;

        const req = allRequests.find(x => x.id === Number(requestId));


        if (!req) {
          console.warn("Request not found for ID", requestId);
          setItems([]);
          return;
        }

        const assigned = [];

        req.assetRequestItems.forEach(item => {
          if (Array.isArray(item.assignedAssets)) {
            assigned.push(...item.assignedAssets);
          }
        });

        setItems(assigned);
      } catch (err) {
        console.error("Error loading assigned items:", err);
      }
    };

    load();
  }, [requestId]);

  // Grouping by assetTypes
  const laptops = items.filter(a => a.assetType?.toLowerCase() === "laptop");
  const mobiles = items.filter(a => a.assetType?.toLowerCase() === "mobile");
  const tablets = items.filter(a => a.assetType?.toLowerCase() === "tablet");

  const tabs = [
    { key: "laptops", label: "Laptops", data: laptops },
    { key: "mobiles", label: "Mobiles", data: mobiles },
    { key: "tablets", label: "Tablets", data: tablets },
  ].filter(t => t.data.length > 0);

  const firstTab = tabs.length > 0 ? tabs[0].key : null;

  return (
    <div className="assigned-items-page container mt-4">
      <h3 className="mb-4">Assigned Items for Request #{requestId}</h3>

      {items.length === 0 ? (
        <div className="alert alert-info mt-3">No assigned items found.</div>
      ) : (
        <>
          {/* Tabs */}
          <ul className="nav nav-tabs">
            {tabs.map(t => (
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

          {/* Tab Content */}
          <div className="tab-content border p-3 border-top-0">
            {tabs.map(t => (
              <div
                key={t.key}
                id={`tab-${t.key}`}
                className={`tab-pane fade show ${
                  firstTab === t.key ? "active" : ""
                }`}
              >
                <table className="table table-bordered mt-3">
                  <thead className="table-dark">
                    <tr>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Asset Tag</th>
                      <th>Status</th>
                      <th>Assigned Date</th>
                      <th>Returned Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.data.map(a => (
                      <tr key={a.id}>
                        <td>{a.detail?.brand}</td>
                        <td>{a.detail?.model || a.detail?.modelNumber}</td>
                        <td>{a.detail?.assetTag}</td>
                        <td>{a.status}</td>
                        <td>{a.assignedDate}</td>
                        <td>{a.returnedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table> 
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AssignedItems;
