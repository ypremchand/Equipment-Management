import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Contact() {
  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [assets, setAssets] = useState([]);              // from /api/assets
  const [locations, setLocations] = useState([]);        // from /api/locations
  const [selectedLocation, setSelectedLocation] = useState("");
  const [assetRequests, setAssetRequests] = useState([
    { assetName: "", processor: "", storage: "", ram: "", quantity: 0, requestedQuantity: "" }
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

  const categoryItemsCache = useRef({}); // { laptops: [...], mobiles: [...], ... }

  const totalRequested = assetRequests.reduce(
    (sum, req) => sum + Number(req.requestedQuantity || 0),
    0
  );

  // -------------------- Helpers for category items --------------------

  const categoryEndpoint = (assetName) => {
    if (!assetName) return null;
    return `http://localhost:5083/api/${assetName.toLowerCase().replace(/\s+/g, "")}`;
  };

  const loadCategoryItems = useCallback(async (assetName) => {
    if (!assetName) return [];

    const key = assetName.toLowerCase().replace(/\s+/g, "");

    if (categoryItemsCache.current[key]) return categoryItemsCache.current[key];

    const url = categoryEndpoint(assetName);
    if (!url) return [];

    try {
      const res = await axios.get(url);
      // paginated endpoints: { data: [...] }
      const items = res.data?.data ?? res.data ?? [];
      categoryItemsCache.current[key] = items;
      return items;
    } catch (err) {
      console.error("Load category items error:", err);
      categoryItemsCache.current[key] = [];
      return [];
    }
  }, []);

  // -------------------- Effects --------------------

  // 1) Prefill when redirected from Home with selectedAsset
  useEffect(() => {
    if (location.state?.selectedAsset) {
      const assetName = location.state.selectedAsset;

      setAssetRequests([
        {
          assetName,
          processor: "",
          storage: "",
          ram: "",
          quantity: 0,           // will be synced from /api/assets below
          requestedQuantity: ""
        }
      ]);

      loadCategoryItems(assetName);
    }
  }, [location.state, loadCategoryItems]);

  // 2) Load logged-in user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({
        name: parsed.username || parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phoneNumber || ""
      });
    }
  }, []);

  // 3) Load assets (Laptops/Mobiles/Tablets with quantity)
  useEffect(() => {
    axios
      .get(ASSETS_API)
      .then((res) => setAssets(res.data || []))
      .catch((e) => {
        console.error("Assets load error", e);
        setAssets([]);
      });
  }, []);

  // 4) Whenever assets change, sync quantities for selected asset rows
  useEffect(() => {
    if (!assets || assets.length === 0) return;

    setAssetRequests((prev) =>
      prev.map((row) => {
        if (!row.assetName) return row;
        const assetObj = assets.find((a) => a.name === row.assetName);
        return assetObj ? { ...row, quantity: assetObj.quantity } : row;
      })
    );
  }, [assets]);

  // 5) Load locations
  useEffect(() => {
    axios
      .get(LOCATIONS_API)
      .then((res) => setLocations(res.data || []))
      .catch((e) => {
        console.error("Locations load error", e);
        setLocations([]);
      });
  }, []);

  // 6) Load request for edit
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`${REQUEST_API}/${id}`);
        setEditData(res.data);
      } catch (err) {
        console.error("Error loading request for edit", err);
      }
    })();
  }, [id]);

  // 7) Build initial rows when editing (and assets loaded)
  useEffect(() => {
    if (!editData || assets.length === 0) return;

    setSelectedLocation(editData.location?.name || "");
    setMessage(editData.message || "");

    setUser((u) => ({ ...u, phone: editData.phoneNumber || u.phone }));

    const mapped = (editData.assetRequestItems || []).map((item) => {
      const assetObj = assets.find((a) => a.name === item.asset?.name);
      return {
        assetName: item.asset?.name || "",
        processor: item.processor || "",
        storage: item.storage || "",
        ram: item.ram || "",
        quantity: assetObj ? assetObj.quantity : 0,
        requestedQuantity: item.requestedQuantity ?? ""
      };
    });

    setAssetRequests((prev) => (mapped.length ? mapped : prev));
  }, [editData, assets]);

  // -------------------- Handlers --------------------

  const handleAssetChange = async (index, assetName) => {
    setAssetRequests((prev) => {
      const updated = [...prev];
      const assetObj = assets.find((a) => a.name === assetName);

      updated[index] = {
        assetName,
        processor: "",
        storage: "",
        ram: "",
        quantity: assetObj ? assetObj.quantity : 0, // always from /api/assets
        requestedQuantity: ""
      };

      return updated;
    });

    // Load category items for dropdowns
    await loadCategoryItems(assetName);
  };

  const handleSpecChange = (index, field, value) => {
    setAssetRequests((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // We DO NOT change quantity based on specs anymore (quantity is stock).
  };

  const handleQuantityChange = (index, value) => {
    const val = value === "" ? "" : Number(value);
    setAssetRequests((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], requestedQuantity: val };
      return updated;
    });
  };

  const handleAddRow = () => {
    setAssetRequests((prev) => [
      ...prev,
      { assetName: "", processor: "", storage: "", ram: "", quantity: 0, requestedQuantity: "" }
    ]);
  };

  const handleRemoveRow = (index) => {
    setAssetRequests((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: user.name,
      email: user.email,
      phoneNumber: user.phone,
      location: selectedLocation,
      assetRequests: assetRequests.map((r) => ({
        asset: r.assetName,
        processor: r.processor || null,
        storage: r.storage || null,
        ram: r.ram || null,
        requestedQuantity: Number(r.requestedQuantity || 0),
        availableQuantity: Number(r.quantity || 0)
      })),
      message:
        message ||
        assetRequests
          .map((r) => `Requesting ${r.requestedQuantity || 0} of ${r.assetName}`)
          .join(", ")
    };

    try {
      if (id) {
        await axios.put(`${CONTACT_API}/${id}`, payload);
        alert("Request updated successfully!");
      } else {
        await axios.post(CONTACT_API, payload);
        alert("Request created successfully!");
      }
      navigate("/returnassets");
    } catch (err) {
      console.error("Submit error", err);
      alert("Failed to submit request");
    }
  };

  // Build processor/storage/ram dropdown options from cached category items
  const getOptionsFor = (assetName, key) => {
    if (!assetName) return [];
    const k = assetName.toLowerCase().replace(/\s+/g, "");
    const items = categoryItemsCache.current[k] ?? [];
    const vals = items
      .map((it) => (it[key] ?? it[key?.toLowerCase?.()] ?? "").toString())
      .filter((v) => v);
    return [...new Set(vals)];
  };

  // -------------------- JSX --------------------

  return (
    <div className="contact-page container mt-4">
      <h3 className="text-center mb-4">{id ? "Edit Asset Request" : "Request Multiple Assets"}</h3>

      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: 900 }}>
        <form onSubmit={handleSubmit}>
          {/* USER INFO */}
          <div className="row gx-3">
            <div className="col-md-4 mb-3">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" value={user.name} readOnly />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={user.email} readOnly />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-control" value={user.phone} readOnly />
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
            const processorOptions = getOptionsFor(req.assetName, "processor");
            const storageOptions = getOptionsFor(req.assetName, "storage");
            const ramOptions = getOptionsFor(req.assetName, "ram");

            return (
              <div key={index} className="border rounded p-3 mb-3 bg-light">
                <div className="row g-2 align-items-center">
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
                    <input
                      type="text"
                      className="form-control"
                      value={req.quantity ?? 0}
                      readOnly
                    />
                  </div>

                  {/* REQUEST QTY */}
                  <div className="col-md-2">
                    <label className="form-label">Request Qty</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={req.requestedQuantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                    />
                  </div>

                  {/* SPECS */}
                  <div className="col-md-4">
                    <div className="row g-2">
                      <div className="col-4">
                        <label className="form-label small">Processor</label>
                        <select
                          className="form-select"
                          value={req.processor}
                          onChange={(e) => handleSpecChange(index, "processor", e.target.value)}
                        >
                          <option value="">Any</option>
                          {processorOptions.map((p, i) => (
                            <option key={i} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-4">
                        <label className="form-label small">Storage</label>
                        <select
                          className="form-select"
                          value={req.storage}
                          onChange={(e) => handleSpecChange(index, "storage", e.target.value)}
                        >
                          <option value="">Any</option>
                          {storageOptions.map((s, i) => (
                            <option key={i} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-4">
                        <label className="form-label small">RAM</label>
                        <select
                          className="form-select"
                          value={req.ram}
                          onChange={(e) => handleSpecChange(index, "ram", e.target.value)}
                        >
                          <option value="">Any</option>
                          {ramOptions.map((r, i) => (
                            <option key={i} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* REMOVE ROW */}
                  {assetRequests.length > 1 && (
                    <div className="col-md-1 text-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm mt-4"
                        onClick={() => handleRemoveRow(index)}
                      >
                        ✖
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ADD ROW & TOTAL */}
          <div className="d-flex gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={handleAddRow}
            >
              + Add Another Asset
            </button>

            <div className="ms-auto align-self-center">
              <strong>Total Requested:</strong>{" "}
              <span className="text-primary ms-2">{totalRequested}</span>
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
            <button type="submit" className="btn btn-primary w-50">
              {id ? "Update Request" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Contact;
