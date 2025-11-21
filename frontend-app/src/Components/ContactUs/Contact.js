import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function Contact() {
  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [assetRequests, setAssetRequests] = useState([
    { assetName: "", quantity: 0, requestedQuantity: "" }
  ]);
  const [message, setMessage] = useState("");

  const [editData, setEditData] = useState(null); // 🔥 Store edit response here

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams(); // 🔥 Edit mode if id exists

  const CONTACT_API = "http://localhost:5083/api/contact";
  const ASSETS_API = "http://localhost:5083/api/assets";
  const LOCATIONS_API = "http://localhost:5083/api/locations";
  const REQUEST_API = "http://localhost:5083/api/AssetRequests";

  const totalRequested = assetRequests.reduce(
    (sum, req) => sum + Number(req.requestedQuantity || 0),
    0
  );

  // Load logged-in user
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

  // Fetch assets
  useEffect(() => {
    axios.get(ASSETS_API).then((res) => setAssets(res.data));
  }, []);

  // Fetch locations
  useEffect(() => {
    axios.get(LOCATIONS_API).then((res) => setLocations(res.data));
  }, []);

  // Load the selected asset if navigating from Home page
  useEffect(() => {
    const selectedAsset = location.state?.selectedAsset;
    if (selectedAsset && assets.length > 0) {
      const assetData = assets.find((a) => a.name === selectedAsset);
      setAssetRequests([
        {
          assetName: selectedAsset,
          quantity: assetData ? assetData.quantity : 0,
          requestedQuantity: ""
        }
      ]);
    }
  }, [location.state, assets]);

  // 🔥 Fetch request for editing
  const loadRequestForEdit = async (requestId) => {
    try {
      const res = await axios.get(`${REQUEST_API}/${requestId}`);
      setEditData(res.data); // Store it and process later
    } catch (err) {
      console.error("Error loading request:", err);
    }
  };

  // 🔥 Trigger loading request data
  useEffect(() => {
    if (id) {
      loadRequestForEdit(id);
    }
  }, [id]);

  // 🔥 Build assetRequests ONLY after assets & editData both exist
  useEffect(() => {
    if (!editData || assets.length === 0) return;

    // Fill location
    setSelectedLocation(editData.location?.name || "");

    // Fill message
    setMessage(editData.message || "");

    // Fill phone
    setUser((u) => ({
      ...u,
      phone: editData.phoneNumber || u.phone
    }));

    // Prepare asset rows
    const mappedAssets = editData.assetRequestItems.map((item) => {
      const assetObj = assets.find((a) => a.name === item.asset.name);

      return {
        assetName: item.asset.name,
        quantity: assetObj ? assetObj.quantity : 0, // Available quantity
        requestedQuantity: item.requestedQuantity
      };
    });

    setAssetRequests(mappedAssets);

  }, [editData, assets]); // Run only when both are ready

  // Handle asset dropdown change
  const handleAssetChange = (index, assetName) => {
    const updated = [...assetRequests];
    const assetObj = assets.find((a) => a.name === assetName);

    updated[index] = {
      ...updated[index],
      assetName,
      quantity: assetObj ? assetObj.quantity : 0,
      requestedQuantity: ""
    };

    setAssetRequests(updated);
  };

  // Handle requested quantity change
  const handleQuantityChange = (index, value) => {
    const updated = [...assetRequests];
    updated[index].requestedQuantity = value;
    setAssetRequests(updated);
  };

  // Add asset row
  const handleAddRow = () => {
    setAssetRequests([
      ...assetRequests,
      { assetName: "", quantity: 0, requestedQuantity: "" }
    ]);
  };

  // Remove asset row
  const handleRemoveRow = (index) => {
    setAssetRequests(assetRequests.filter((_, i) => i !== index));
  };

  // Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: user.name,
      email: user.email,
      phoneNumber: user.phone,
      location: selectedLocation,
      assetRequests: assetRequests.map((r) => ({
        asset: r.assetName,
        requestedQuantity: Number(r.requestedQuantity),
        availableQuantity: Number(r.quantity)
      })),
      message:
        message ||
        assetRequests
          .map(
            (r) => `Requesting ${r.requestedQuantity} unit(s) of ${r.assetName}`
          )
          .join(", ")
    };

    try {
      if (id) {
        // 🔄 Update
        await axios.put(`${CONTACT_API}/${id}`, payload);
        alert("Request updated successfully!");
      } else {
        // ➕ Create new request
        await axios.post(CONTACT_API, payload);
        alert("Request created successfully!");
      }

      navigate("/returnassets");
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Failed to submit request");
    }
  };

  return (
    <div className="contact-page container mt-4">
      <h3 className="text-center mb-4">
        {id ? "Edit Asset Request" : "Request Multiple Assets"}
      </h3>

      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
        <form onSubmit={handleSubmit}>

          {/* Username */}
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" value={user.name} readOnly />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={user.email} readOnly />
          </div>

          {/* Phone */}
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
  type="tel"
  className="form-control"
  value={user.phone}
  readOnly
/>

          </div>

          {/* Location */}
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

          {/* Asset Rows */}
          {assetRequests.map((req, index) => (
            <div key={index} className="border rounded p-3 mb-3 bg-light">
              <div className="row g-3 align-items-center">

                <div className="col-md-5">
                  <label className="form-label">Asset</label>
                  <select
                    className="form-select"
                    value={req.assetName}
                    onChange={(e) => handleAssetChange(index, e.target.value)}
                  >
                    <option value="">-- Select Asset --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Available</label>
                  <input type="text" className="form-control" value={req.quantity} readOnly />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Request Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max={req.quantity}
                    value={req.requestedQuantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                  />
                </div>

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
          ))}

          <button
            type="button"
            className="btn btn-outline-success mb-3"
            onClick={handleAddRow}
          >
            + Add Another Asset
          </button>

          <div className="mb-3">
            <strong>Total Requested Quantity: </strong>
            <span className="text-primary">{totalRequested}</span>
          </div>

          {/* Message */}
          <div className="mb-3">
            <label className="form-label">Additional Message</label>
            <textarea
              className="form-control"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            {id ? "Update Request" : "Submit Request"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Contact;
