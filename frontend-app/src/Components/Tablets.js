import React from 'react'
import { Link } from "react-router-dom";

function Tablets() {
    return (
        <div className="container mt-4">
      <h3>Tablets Page</h3>
      <p>Here you can manage or view all tablets.</p>
      <Link to="/adminpanel" className="btn btn-secondary mt-3">Back to Admin Panel</Link>
    </div>
    )
}

export default Tablets
