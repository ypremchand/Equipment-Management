import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ Added useNavigate
import "bootstrap/dist/css/bootstrap.min.css";

function Contact() {
  const [user, setUser] = useState({ name: "", email: "" });
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [assetRequests, setAssetRequests] = useState([
    { assetName: "", quantity: 0, requestedQuantity: "" },
  ]);
  const [message, setMessage] = useState("");
  // ✅ Compute total requested quantity dynamically
  const totalRequested = assetRequests.reduce(
    (sum, req) => sum + Number(req.requestedQuantity || 0),
    0
  );


  const location = useLocation();
  const navigate = useNavigate(); // ✅ Hook for redirection

  const CONTACT_API = "http://localhost:5083/api/contact";
  const ASSETS_API = "http://localhost:5083/api/assets";
  const LOCATIONS_API = "http://localhost:5083/api/locations";

  // Load logged-in user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser({
        name: parsedUser.username || parsedUser.name || "",
        email: parsedUser.email || "",
      });
    }
  }, []);

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await axios.get(ASSETS_API);
        setAssets(res.data);
      } catch (error) {
        console.error("Error fetching assets:", error);
      }
    };
    fetchAssets();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(LOCATIONS_API);
        setLocations(res.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // ✅ Preselect the asset passed from Home page
  // ✅ Preselect the asset passed from Home page
  useEffect(() => {
    const selectedAsset = location.state?.selectedAsset;
    if (selectedAsset && assets.length > 0) {
      const selectedAssetData = assets.find((a) => a.name === selectedAsset);
      setAssetRequests([
        {
          assetName: selectedAsset,
          quantity: selectedAssetData ? selectedAssetData.quantity : 0, // ✅ unified property
          requestedQuantity: "",
        },
      ]);
    }
  }, [location.state, assets]);



  // Handle asset dropdown change
  const handleAssetChange = (index, assetName) => {
    const updatedRequests = [...assetRequests];
    const assetData = assets.find((a) => a.name === assetName);

    updatedRequests[index].assetName = assetName;
    updatedRequests[index].quantity = assetData ? assetData.quantity : 0; // ✅ lowercase
    updatedRequests[index].requestedQuantity = "";
    setAssetRequests(updatedRequests);
  };

  // Handle requested quantity change
  const handleQuantityChange = (index, value) => {
    const updatedRequests = [...assetRequests];
    updatedRequests[index].requestedQuantity = value;
    setAssetRequests(updatedRequests);
  };

  // Add new asset row
  const handleAddAssetRow = () => {
    setAssetRequests([
      ...assetRequests,
      { assetName: "", availableQuantity: "", requestedQuantity: "" },
    ]);
  };

  // Remove asset row
  const handleRemoveAssetRow = (index) => {
    const updatedRequests = assetRequests.filter((_, i) => i !== index);
    setAssetRequests(updatedRequests);
  };

  // ✅ Submit form
  // ✅ Submit form
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedLocation) {
    alert("Please select a location");
    return;
  }

  if (!user.phone || !/^\d{10}$/.test(user.phone)) {
    alert("Please enter a valid 10-digit phone number");
    return;
  }

  if (
    assetRequests.some(
      (req) =>
        !req.assetName ||
        !req.requestedQuantity ||
        isNaN(req.requestedQuantity) ||
        req.requestedQuantity <= 0
    )
  ) {
    alert("Please fill all asset fields correctly");
    return;
  }

  if (assetRequests.some((req) => req.requestedQuantity > req.Quantity)) {
    alert("One or more requested quantities exceed available stock");
    return;
  }

  // 🧩 ADD THIS DEBUG LOG HERE
  console.log("Submitting Request:", {
    username: user.name,
    email: user.email,
    phoneNumber: user.phone,
    location: selectedLocation,
    assetRequests: assetRequests.map((r) => ({
      asset: r.assetName,
      requestedQuantity: Number(r.requestedQuantity),
      availableQuantity: Number(r.Quantity),
    })),
    message:
      message ||
      assetRequests
        .map(
          (r) => `Requesting ${r.requestedQuantity} unit(s) of ${r.assetName}`
        )
        .join(", "),
  });

  try {
    await axios.post(CONTACT_API, {
      username: user.name,
      email: user.email,
      phoneNumber: user.phone,
      location: selectedLocation,
      assetRequests: assetRequests.map((r) => ({
        asset: r.assetName,
        requestedQuantity: Number(r.requestedQuantity),
        availableQuantity: Number(r.quantity),
      })),
      message:
        message ||
        assetRequests
          .map(
            (r) => `Requesting ${r.requestedQuantity} unit(s) of ${r.assetName}`
          )
          .join(", "),
    });

    alert("Request sent successfully!");
    navigate("/");

    // Reset form
    setAssetRequests([{ assetName: "", availableQuantity: 0, requestedQuantity: "" }]);
    setSelectedLocation("");
    setMessage("");
  } catch (error) {
    console.error("Error sending request:", error);
    alert("Failed to send request");
  }
};


  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Request Multiple Assets</h3>

      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={user.name}
              readOnly
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={user.email}
              readOnly
            />
          </div>

          {/* Phone Number with validation */}
          <div className="mb-3">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              className={`form-control ${user.phone && user.phone.length < 10 ? "is-invalid" : ""
                }`}
              id="phoneNumber"
              value={user.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  setUser({ ...user, phone: value });
                }
              }}
              placeholder="Enter 10-digit phone number"
            />
            {user.phone && user.phone.length < 10 && (
              <div className="invalid-feedback">
                Phone number must be 10 digits long.
              </div>
            )}
          </div>

          {/* Location Dropdown */}
          <div className="mb-3">
            <label htmlFor="location" className="form-label">
              Select Location
            </label>
            <select
              id="location"
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

          {/* Dynamic Asset Requests */}
          {assetRequests.map((req, index) => (
            <div key={index} className="border rounded p-3 mb-3 bg-light">
              <div className="row g-3 align-items-center">
                {/* Asset Dropdown */}
                <div className="col-md-5">
                  <label className="form-label">Asset</label>
                  <select
                    className="form-select"
                    value={req.assetName}
                    onChange={(e) => handleAssetChange(index, e.target.value)}
                  >
                    <option value="">-- Select Asset --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Quantity */}
                <div className="col-md-3">
                  <label className="form-label">Available</label>
                  <input
                    type="text"
                    className="form-control"
                    value={req.quantity}
                    readOnly
                  />

                </div>

                {/* Requested Quantity */}
                <div className="col-md-3">
                  <label className="form-label">Request Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max={req.availableQuantity}
                    value={req.requestedQuantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                  />
                </div>

                {/* Remove Row Button */}
                {assetRequests.length > 1 && (
                  <div className="col-md-1 text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm mt-4"
                      onClick={() => handleRemoveAssetRow(index)}
                    >
                      ✖
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Asset Row Button */}
          <button
            type="button"
            className="btn btn-outline-success mb-3"
            onClick={handleAddAssetRow}
          >
            + Add Another Asset
          </button>

          {/* ✅ Total Requested Quantity */}
          <div className="mb-3">
            <strong>Total Requested Quantity:</strong>{" "}
            <span className="text-primary">{totalRequested}</span>
          </div>


          {/* Message */}
          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              Additional Message (optional)
            </label>
            <textarea
              id="message"
              className="form-control"
              rows="3"
              placeholder="Add any notes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
