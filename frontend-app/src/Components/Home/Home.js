import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ import navigation hook
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css"

function Home() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ initialize navigation

  const ASSETS_API = "http://localhost:5083/api/assets";

  // Fetch assets when page loads
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await axios.get(ASSETS_API);
        setAssets(res.data);
      } catch (error) {
        console.error("Error fetching assets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // ✅ handle redirect with asset name
  const handleRequestAsset = (assetName) => {
    navigate("/contact", { state: { selectedAsset: assetName } });
  };

  return (
    <div className="home-page container mt-4">
      <h2 className="text-center mb-4">Available Assets</h2>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="alert alert-info text-center">
          No assets available at the moment.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>Asset Name</th>
                <th>Quantity Remaining</th>
                <th>Request for Asset</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>{asset.quantity}</td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleRequestAsset(asset.name)} // ✅ redirect to Contact
                    >
                      Request For {asset.name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Home;
