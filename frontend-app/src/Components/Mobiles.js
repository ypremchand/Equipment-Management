import React from 'react'
import { Link } from "react-router-dom";

function Mobiles() {
    return (
        <div className="container mt-4">
      <h3>Mobiles Page</h3>
      <p>Here you can manage or view all mobiless.</p>
      <Link to="/adminpanel" className="btn btn-secondary mt-3">Back to Admin Panel</Link>
    </div>
    )
}

export default Mobiles
