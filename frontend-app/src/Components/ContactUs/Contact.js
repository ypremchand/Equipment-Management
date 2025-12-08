// --- FULL CONTACT.JS ---
// (Dynamic fields for Laptops, Mobiles, Tablets, Scanners, Printers)

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Contact() {
  const [user, setUser] = useState({ name: "", email: "", phone: "" });

  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  const [assetRequests, setAssetRequests] = useState([
    {
      assetName: "",
      quantity: 0,
      requestedQuantity: "",

      // Laptops/Mobiles/Tablets
      brand: "",
      processor: "",
      storage: "",
      ram: "",
      operatingSystem: "", // laptops only
      networkType: "", // mobiles/tablets
      simType: "", // mobiles
      simSupport: "", // tablets

      // Scanners
      scannerType: "",
      scanSpeed: "",

      // Printers
      printerType: "",
      paperSize: "",
      dpi: ""
    }
  ]);

  const [message, setMessage] = useState("");
  const [editData, setEditData] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const CONTACT_API = "http://localhost:5083/api/contact";
  const ASSETS_API = "http://localhost:5083/api/assets";
  const LOCATIONS_API = "http://localhost:5083/api/locations";
  const REQUEST_API = "http://localhost:5083/api/AssetRequests";

  // Cache category items
  const categoryItemsCache = useRef({});

  // ============================================================
  // CATEGORY FIELD MAP (dropdown visibility)
  // ============================================================

 const categoryFields = {
  Laptops: ["brand", "processor", "storage", "ram", "operatingSystem"],
  Mobiles: ["brand", "processor", "storage", "ram", "networkType", "simType"],
  Tablets: ["brand", "processor", "storage", "ram", "networkType", "simSupport"],
  Desktops: ["brand", "processor", "storage", "ram", "operatingSystem"],
  Scanners: ["scannerType", "scanSpeed"],
  Printers: ["printerType", "paperSize", "dpi"],
  default: []
};


  const shouldShowField = (assetName, field) =>
    categoryFields[assetName]?.includes(field);

  // ============================================================
  // API ENDPOINT MAPPER
  // ============================================================

  const categoryEndpoint = (assetName) => {
    if (!assetName) return null;
    return `http://localhost:5083/api/${assetName.toLowerCase()}`;
  };

  // Load category items for dropdowns
  const loadCategoryItems = useCallback(async (assetName) => {
    if (!assetName) return [];
    const key = assetName.toLowerCase();

    if (categoryItemsCache.current[key])
      return categoryItemsCache.current[key];

    const url = categoryEndpoint(assetName);
    if (!url) return [];

    try {
      const res = await axios.get(url);
      const items = res.data?.data ?? res.data ?? [];
      categoryItemsCache.current[key] = items;
      return items;
    } catch (err) {
      console.error("Error loading category items:", err);
      return [];
    }
  }, []);

  // Extract dropdown values for a field
  const getOptionsFor = (assetName, field) => {
    if (!assetName) return [];
    const items = categoryItemsCache.current[assetName.toLowerCase()] ?? [];
    const vals = items.map((i) => i[field]).filter((v) => v);
    return [...new Set(vals)];
  };

  const totalRequested = assetRequests.reduce(
    (sum, req) => sum + Number(req.requestedQuantity || 0),
    0
  );

  // ============================================================
  // EFFECTS
  // ============================================================

  // Prefill From Home
  useEffect(() => {
    if (location.state?.selectedAsset) {
      const assetName = location.state.selectedAsset;

      setAssetRequests([
        {
          assetName,
          quantity: 0,
          requestedQuantity: "",

          brand: "",
          processor: "",
          storage: "",
          ram: "",
          operatingSystem: "",
          networkType: "",
          simType: "",
          simSupport: "",
          scannerType: "",
          scanSpeed: "",
          printerType: "",
          paperSize: "",
          dpi: ""
        }
      ]);

      loadCategoryItems(assetName);
    }
  }, [location.state, loadCategoryItems]);

  // Load Logged-in User
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser({
        name: u.username || u.name || "",
        email: u.email,
        phone: u.phoneNumber
      });
    }
  }, []);

  // Load Assets
  useEffect(() => {
    axios.get(ASSETS_API)
      .then((res) => setAssets(res.data || []))
      .catch(() => setAssets([]));
  }, []);

  // Sync Available Quantity
  useEffect(() => {
    if (!assets.length) return;
    setAssetRequests((prev) =>
      prev.map((row) => {
        if (!row.assetName) return row;
        const assetObj = assets.find((a) => a.name === row.assetName);
        return assetObj ? { ...row, quantity: assetObj.quantity } : row;
      })
    );
  }, [assets]);

  // Load Locations
  useEffect(() => {
    axios.get(LOCATIONS_API)
      .then((res) => setLocations(res.data || []))
      .catch(() => setLocations([]));
  }, []);

  // Load Request Edit
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`${REQUEST_API}/${id}`);
        setEditData(res.data);
      } catch (err) {
        console.error("Error loading edit data:", err);
      }
    })();
  }, [id]);

  // Build Rows When Editing
  useEffect(() => {
    if (!editData || assets.length === 0) return;

    const loadForEdit = async () => {

      // 1️⃣ Load dropdown data for every asset row
      for (const item of editData.assetRequestItems) {
        const assetName = item.asset?.name;
        if (assetName) {
          await loadCategoryItems(assetName);
        }
      }

      // 2️⃣ Once data loaded → map saved values correctly
      const mapped = editData.assetRequestItems.map((item) => {
        const assetName = item.asset?.name;
        const assetObj = assets.find((a) => a.name === assetName);

        return {
          assetName,
          quantity: assetObj ? assetObj.quantity : 0,
          requestedQuantity: item.requestedQuantity ?? "",

          brand: item.brand ?? "",

          processor: assetName === "Laptops"
            ? (item.processor || "i5")
            : (item.processor || ""),

          storage: assetName === "Laptops"
            ? (item.storage || "512GB")
            : (item.storage || ""),

          ram: assetName === "Laptops"
            ? (item.ram || "8GB")
            : (item.ram || ""),

          operatingSystem: assetName === "Laptops"
            ? (item.operatingSystem || "Windows 10")
            : (item.operatingSystem || ""),

          networkType: item.networkType ?? "",
          simType: item.simType ?? "",
          simSupport: item.simSupport ?? "",
          scannerType: item.scannerType ?? "",
          scanSpeed: item.scanSpeed ?? "",
          printerType: item.printerType ?? "",
          paperSize: item.paperSize ?? "",
          dpi: item.dpi ?? ""
        };
      });



      // 3️⃣ Update UI state
      setAssetRequests(mapped);
      setSelectedLocation(editData.location?.name ?? "");
      setMessage(editData.message ?? "");
    };

    loadForEdit();
  }, [editData, assets, loadCategoryItems]);  // ← required

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleAssetChange = async (index, assetName) => {
    const assetObj = assets.find((a) => a.name === assetName);

    // First reset row
    setAssetRequests((prev) => {
      const updated = [...prev];
      updated[index] = {
        assetName,
        quantity: assetObj ? assetObj.quantity : 0,
        requestedQuantity: "",

        brand: "",
        processor: "",
        storage: "",
        ram: "",
        operatingSystem: "",
        networkType: "",
        simType: "",
        simSupport: "",
        scannerType: "",
        scanSpeed: "",
        printerType: "",
        paperSize: "",
        dpi: "",
      };
      return updated;
    });

    // Load dropdown API data first
    await loadCategoryItems(assetName);

    // Apply defaults AFTER the options exist
    if (assetName === "Laptops") {
      setAssetRequests((prev) => {
        const updated = [...prev];
        updated[index].processor = "i5";
        updated[index].storage = "512GB";
        updated[index].ram = "8GB";
        updated[index].operatingSystem = "Windows 10";
        return updated;
      });
    }
  };




  const handleSpecChange = (index, field, value) => {
    setAssetRequests((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleQuantityChange = (index, value) => {
    const val = value === "" ? "" : Number(value);
    setAssetRequests((prev) => {
      const updated = [...prev];
      updated[index].requestedQuantity = val;
      return updated;
    });
  };

  const handleAddRow = () => {
    setAssetRequests((prev) => [
      ...prev,
      {
        assetName: "",
        quantity: 0,
        requestedQuantity: "",

        brand: "",
        processor: "",
        storage: "",
        ram: "",
        operatingSystem: "",
        networkType: "",
        simType: "",
        simSupport: "",
        scannerType: "",
        scanSpeed: "",
        printerType: "",
        paperSize: "",
        dpi: ""
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    setAssetRequests((prev) => prev.filter((_, i) => i !== index));
  };


  const includeDefault = (options, def) => {
    if (!def) return options;
    return options.includes(def) ? options : [def, ...options];
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: user.name,
      email: user.email,
      phoneNumber: user.phone,
      location: selectedLocation,
      assetRequests: assetRequests.map((r) => ({
        asset: r.assetName,
        brand: r.brand,
        processor: r.processor,
        storage: r.storage,
        ram: r.ram,
        operatingSystem: r.operatingSystem,
        networkType: r.networkType,
        simType: r.simType,
        simSupport: r.simSupport,
        scannerType: r.scannerType,
        scanSpeed: r.scanSpeed,
        printerType: r.printerType,
        paperSize: r.paperSize,
        dpi: r.dpi,
        requestedQuantity: Number(r.requestedQuantity || 0),
        availableQuantity: Number(r.quantity || 0)
      })),
      message:
        message ||
        assetRequests
          .map((r) => `Requesting ${r.requestedQuantity} of ${r.assetName}`)
          .join(", ")
    };
    try {
      if (id) {
        await axios.put(`${CONTACT_API}/${id}`, payload);
        alert("Request updated successfully!");
      } else {
        await axios.post(CONTACT_API, payload);
        alert("Request submitted successfully!");
      }
      navigate("/returnassets");
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit request");
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="contact-page container mt-4">
      <h3 className="text-center mb-4">
        {id ? "Edit Asset Request" : "Request Multiple Assets"}
      </h3>

      <div className="card shadow p-4 mx-auto" style={{ maxWidth: 900 }}>
        <form onSubmit={handleSubmit}>

          {/* USER INFO */}
          <div className="row gx-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Username</label>
              <input className="form-control" value={user.name} readOnly />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input className="form-control" value={user.email} readOnly />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" value={user.phone} readOnly />
            </div>
          </div>

          {/* LOCATION */}
          <div className="mb-3">
            <label className="form-label">Select Location</label>
            <select
              className="form-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">-- Select Location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* ROWS */}
          {assetRequests.map((req, index) => {
            const brandOptions = getOptionsFor(req.assetName, "brand");
            const processorOptions = includeDefault(
              getOptionsFor(req.assetName, "processor"),
              req.assetName === "Laptops" ? "i5" : ""
            );

            const storageOptions = getOptionsFor(req.assetName, "storage");
            const ramOptions = includeDefault(
              getOptionsFor(req.assetName, "ram"),
              req.assetName === "Laptops" ? "8GB" : ""
            );

            const osOptions = includeDefault(
              getOptionsFor(req.assetName, "operatingSystem"),
              req.assetName === "Laptops" ? "Windows 10" : ""
            );

            const networkOptions = getOptionsFor(req.assetName, "networkType");
            const simTypeOptions = getOptionsFor(req.assetName, "simType");
            const simSupportOptions = getOptionsFor(req.assetName, "simSupport");

            return (
              <div key={index} className="border rounded p-3 mb-3 bg-light">
                <div className="row g-3">

                  {/* ASSET */}
                  <div className="col-md-4">
                    <label className="form-label">Asset</label>
                    <select
                      className="form-select"
                      value={req.assetName}
                      onChange={(e) => handleAssetChange(index, e.target.value)}
                    >
                      <option value="">-- Select Asset --</option>
                      {assets
                        .filter(
                          (a) =>
                            !assetRequests.some(
                              (r, i2) => r.assetName === a.name && i2 !== index
                            )
                        )
                        .map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name}
                          </option>
                        ))}


                    </select>
                  </div>

                  {/* AVAILABLE */}
                  <div className="col-md-2">
                    <label className="form-label">Available</label>
                    <input className="form-control" value={req.quantity} readOnly />

                  </div>

                  {/* REQUEST QTY */}
                  <div className="col-md-2">
                    <label className="form-label">Request Qty</label>
                    <input
                      type="number"
                      className="form-control"
                      value={req.requestedQuantity}
                      min="1"
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                    />
                  </div>

                  {/* DYNAMIC FIELDS */}
                  <div className="col-md-4">
                    <div className="row g-2">

                      {/* Brand */}
                      {shouldShowField(req.assetName, "brand") && (
                        <div className="col-6">
                          <label className="form-label small">Brand</label>
                          <select
                            className="form-select"
                            value={req.brand}
                            onChange={(e) =>
                              handleSpecChange(index, "brand", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {brandOptions.map((b, i) => (
                              <option key={i} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Processor */}
                      {shouldShowField(req.assetName, "processor") && (
                        <div className="col-6">
                          <label className="form-label small">Processor</label>
                          <select
                            className="form-select"
                            value={req.processor}
                            onChange={(e) =>
                              handleSpecChange(index, "processor", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {processorOptions.map((p, i) => (
                              <option key={i} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Storage */}
                      {shouldShowField(req.assetName, "storage") && (
                        <div className="col-6">
                          <label className="form-label small">Storage</label>
                          <select
                            className="form-select"
                            value={req.storage}
                            onChange={(e) =>
                              handleSpecChange(index, "storage", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {storageOptions.map((s, i) => (
                              <option key={i} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* RAM */}
                      {shouldShowField(req.assetName, "ram") && (
                        <div className="col-6">
                          <label className="form-label small">RAM</label>
                          <select
                            className="form-select"
                            value={req.ram}
                            onChange={(e) =>
                              handleSpecChange(index, "ram", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {ramOptions.map((r, i) => (
                              <option key={i} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* OS (Laptops Only) */}
                      {shouldShowField(req.assetName, "operatingSystem") && (
                        <div className="col-6">
                          <label className="form-label small">Operating System</label>
                          <select
                            className="form-select"
                            value={req.operatingSystem}
                            onChange={(e) =>
                              handleSpecChange(index, "operatingSystem", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {osOptions.map((o, i) => (
                              <option key={i} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Network Type */}
                      {shouldShowField(req.assetName, "networkType") && (
                        <div className="col-6">
                          <label className="form-label small">Network Type</label>
                          <select
                            className="form-select"
                            value={req.networkType}
                            onChange={(e) =>
                              handleSpecChange(index, "networkType", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {networkOptions.map((n, i) => (
                              <option key={i} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* SIM TYPE (Mobiles) */}
                      {shouldShowField(req.assetName, "simType") && (
                        <div className="col-6">
                          <label className="form-label small">SIM Type</label>
                          <select
                            className="form-select"
                            value={req.simType}
                            onChange={(e) =>
                              handleSpecChange(index, "simType", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {simTypeOptions.map((s, i) => (
                              <option key={i} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* SIM SUPPORT (Tablets) */}
                      {shouldShowField(req.assetName, "simSupport") && (
                        <div className="col-6">
                          <label className="form-label small">SIM Support</label>
                          <select
                            className="form-select"
                            value={req.simSupport}
                            onChange={(e) =>
                              handleSpecChange(index, "simSupport", e.target.value)
                            }
                          >
                            <option value="">Any</option>
                            {simSupportOptions.map((s, i) => (
                              <option key={i} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Scanner fields */}
                      {shouldShowField(req.assetName, "scannerType") && (
                        <div className="col-6">
                          <label className="form-label small">Scanner Type</label>
                          <input
                            className="form-control"
                            value={req.scannerType}
                            onChange={(e) =>
                              handleSpecChange(index, "scannerType", e.target.value)
                            }
                          />
                        </div>
                      )}

                      {shouldShowField(req.assetName, "scanSpeed") && (
                        <div className="col-6">
                          <label className="form-label small">Scan Speed</label>
                          <input
                            type="number"
                            className="form-control"
                            value={req.scanSpeed}
                            onChange={(e) =>
                              handleSpecChange(index, "scanSpeed", e.target.value)
                            }
                          />
                        </div>
                      )}

                      {/* Printer fields */}
                      {shouldShowField(req.assetName, "printerType") && (
                        <div className="col-6">
                          <label className="form-label small">Printer Type</label>
                          <input
                            className="form-control"
                            value={req.printerType}
                            onChange={(e) =>
                              handleSpecChange(index, "printerType", e.target.value)
                            }
                          />
                        </div>
                      )}

                      {shouldShowField(req.assetName, "paperSize") && (
                        <div className="col-6">
                          <label className="form-label small">Paper Size</label>
                          <input
                            className="form-control"
                            value={req.paperSize}
                            onChange={(e) =>
                              handleSpecChange(index, "paperSize", e.target.value)
                            }
                          />
                        </div>
                      )}

                      {shouldShowField(req.assetName, "dpi") && (
                        <div className="col-6">
                          <label className="form-label small">DPI</label>
                          <input
                            type="number"
                            className="form-control"
                            value={req.dpi}
                            onChange={(e) =>
                              handleSpecChange(index, "dpi", e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REMOVE ROW */}
                  {assetRequests.length > 1 && (
                    <div className="col-12 text-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveRow(index)}
                      >
                        ✖ Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ADD ROW */}
          <div className="d-flex mb-3">
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={handleAddRow}
            >
              + Add Asset
            </button>

            <div className="ms-auto align-self-center">
              <strong>Total Requested:</strong>{" "}
              <span className="text-primary">{totalRequested}</span>
            </div>
          </div>

          {/* MESSAGE */}
          <div className="mb-3">
            <label className="form-label">Additional Message</label>
            <textarea
              className="form-control"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* SUBMIT */}
          <div className="text-center">
            <button className="btn btn-primary" type="submit">
              {id ? "Update Request" : "Submit Request"}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

export default Contact;