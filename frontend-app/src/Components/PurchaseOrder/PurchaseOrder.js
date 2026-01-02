import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./style.css";

function PurchaseOrder() {
  const [assets, setAssets] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [fileInputKey, setFileInputKey] = useState({});



  // MULTI ROW STATE (LIKE Contact.js)
  const [rows, setRows] = useState([
    {
      assetId: "",
      asset: null,
      quantity: "",
      assetTags: []
    }
  ]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const ASSETS_API = "http://localhost:5083/api/assets";
  const PURCHASE_API = "http://localhost:5083/api/purchaseorders";

  /* ================= LOAD ASSETS ================= */
  useEffect(() => {
    axios.get(ASSETS_API)
      .then(res => setAssets(res.data))
      .catch(err => console.error(err));
  }, []);

  /* ================= LOAD PURCHASE HISTORY ================= */
  const loadPurchaseOrders = async () => {
    try {
      const res = await axios.get(PURCHASE_API);
      setPurchaseOrders(res.data);
      // setPage(1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  /* ================= ADD / REMOVE ROW ================= */
  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      { assetId: "", asset: null, quantity: "", assetTags: [] }
    ]);
  };

  const handleRemoveRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  /* ================= ASSET CHANGE ================= */
  const handleAssetChange = (index, assetId) => {
    const asset = assets.find(a => a.id === Number(assetId));

    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        assetId,
        asset,
        quantity: "",
        assetTags: []
      };
      return updated;
    });
  };

  /* ================= QUANTITY CHANGE ================= */
  const handleQuantityChange = async (index, value) => {
    const qty = Number(value);

    if (!rows[index].asset || qty <= 0) {
      setRows(prev => {
        const updated = [...prev];
        updated[index].quantity = value;
        updated[index].assetTags = [];
        return updated;
      });
      return;
    }

    try {
      const asset = rows[index].asset;

      const res = await axios.get(
        `${PURCHASE_API}/next-sequence`,
        {
          params: {
            assetId: asset.id,
            preCode: asset.preCode
          }
        }
      );

      const start = res.data.nextNumber;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      const tags = Array.from({ length: qty }, (_, i) =>
        `${asset.preCode}-${year}-${month}-${start + i}`
      );

      setRows(prev => {
        const updated = [...prev];
        updated[index].quantity = qty;
        updated[index].assetTags = tags;
        return updated;
      });

    } catch (err) {
      console.error(err);
      alert("Unable to generate asset tags");
    }
  };




  const getAvailableAssets = (currentIndex) => {
    return assets.filter(asset =>
      !rows.some(
        (row, rowIndex) =>
          rowIndex !== currentIndex &&
          Number(row.assetId) === asset.id   // 🔥 FIX HERE
      )
    );
  };


  const canAddRow = () => {
    const lastRow = rows[rows.length - 1];

    return (
      lastRow.asset &&
      Number(lastRow.quantity) > 0 &&
      lastRow.assetTags.length > 0
    );
  };


  /* ================= SAVE PURCHASE ================= */
  const handlePurchase = async () => {
    try {
      for (const row of rows) {
        if (!row.asset || row.assetTags.length === 0) continue;

        await axios.post(PURCHASE_API, {
          assetId: row.asset.id,
          assetName: row.asset.name,
          preCode: row.asset.preCode,
          quantity: row.quantity,
          assetTags: row.assetTags
        });
      }

      alert("✅ Purchase Orders saved successfully");
      loadPurchaseOrders();
      setRows([{ assetId: "", asset: null, quantity: "", assetTags: [] }]);

    } catch (err) {
      console.error(err);
      alert("Failed to save purchase orders");
    }
  };
  // Upload A Files
  const handleFileChange = (purchaseId, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [purchaseId]: file
    }));
  };
  //Upload To Backend
  const uploadFiles = async () => {
    for (const [purchaseId, file] of Object.entries(uploadedFiles)) {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `http://localhost:5083/api/purchaseorders/upload/${purchaseId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    }
  };



  /* ================= SEARCH ================= */
  const normalize = (v) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filteredOrders = purchaseOrders.filter(po => {
    const search = normalize(searchInput);
    return (
      normalize(po.assetName).includes(search) ||
      normalize(po.preCode).includes(search) ||
      po.assetTags.some(t => normalize(t).includes(search))
    );
  });

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );



  return (
    <div className="purchase-order-page container mt-4">
      <h2>Purchase Order</h2>

      {/* FORM */}
      <div className="card p-3 mt-3">

        {rows.map((row, index) => (
          <div key={index} className="border rounded p-3 mb-3">

            <div className="mb-2">
              <label>Asset Name</label>
              <select
                className="form-select"
                value={row.assetId}
                onChange={(e) => handleAssetChange(index, e.target.value)}
              >
                <option value="">-- Select Asset --</option>
                {getAvailableAssets(index).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}

              </select>
            </div>

            <div className="mb-2">
              <label>Asset PreCode</label>
              <input
                className="form-control"
                value={row.asset?.preCode || ""}
                readOnly
              />
            </div>

            <div className="mb-2">
              <label>Purchase Quantity</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={row.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
            </div>

            {row.assetTags.length > 0 && (
              <ul className="list-group mb-2">
                <h5>Auto Generated Asset Tags</h5>
                {row.assetTags.map((t, i) => (
                  <li key={i} className="list-group-item">{t}</li>
                ))}
              </ul>
            )}

            {rows.length > 1 && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => handleRemoveRow(index)}
              >
                ✖ Remove
              </button>
            )}
          </div>
        ))}

        <button
          className="btn btn-outline-success w-25"
          onClick={handleAddRow}
          disabled={!canAddRow()}
        >
          + Add Asset
        </button>

      </div>

      <button className="btn btn-primary mt-3" onClick={handlePurchase}>
        Purchase
      </button>

      <hr />

      {/* SEARCH */}
      <div className="col-md-4 mb-3">
        <input
          className="form-control"
          placeholder="🔍 Search asset / precode / tag..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Asset</th>
            <th>PreCode</th>
            <th>Qty</th>
            <th>Date</th>
            <th>Tags</th>
            <th>Upload File</th>
            <th>Document</th>
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">
                No records found
              </td>
            </tr>
          ) : (
            paginatedOrders.map((po, i) => (
              <tr key={po.id}>
                <td>{(page - 1) * pageSize + i + 1}</td>
                <td>{po.assetName}</td>
                <td>{po.preCode}</td>
                <td>{po.quantity}</td>
                <td>{new Date(po.purchaseDate).toLocaleDateString()}</td>
                <td>
                  <ul className="mb-0">
                    {po.assetTags.map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </td>

                {/* FILE UPLOAD */}
                <td>
                  <input
                    key={fileInputKey[po.id] || 0}
                    type="file"
                    className="form-control form-control-sm mb-1"
                    onChange={(e) =>
                      handleFileChange(po.id, e.target.files[0])
                    }
                  />


                  <button
                    className="btn btn-sm btn-primary"
                    disabled={!uploadedFiles[po.id]}
                    onClick={async () => {
                      const formData = new FormData();
                      formData.append("file", uploadedFiles[po.id]);

                      try {
                        await axios.post(
                          `http://localhost:5083/api/purchaseorders/upload/${po.id}`,
                          formData
                        );

                        alert("✅ File uploaded successfully");

                        // clear selected file
                        setUploadedFiles(prev => {
                          const copy = { ...prev };
                          delete copy[po.id];
                          return copy;
                        });

                        // reset file input
                        setFileInputKey(prev => ({
                          ...prev,
                          [po.id]: Date.now()
                        }));

                        loadPurchaseOrders();

                      } catch (err) {
                        console.error("Upload failed:", err);
                        alert("❌ File upload failed");
                      }
                    }}
                  >
                    Upload
                  </button>


                </td>
                <td>
                  {po.documentPath ? (
                    <a
                      href={`http://localhost:5083${po.documentPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>

      </table>

      {/* PAGINATION */}
      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          className="btn btn-outline-primary"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          ◀ Prev
        </button>
        <span>Page {page} of {totalPages || 1}</span>
        <button
          className="btn btn-outline-primary"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next ▶
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

export default PurchaseOrder;
