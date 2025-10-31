import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ Fetch requests from backend API
  useEffect(() => {
    fetchRequests();
  }, []);

const fetchRequests = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userEmail = storedUser?.email;

    if (!userEmail) {
      alert("No user logged in.");
      return;
    }

    const response = await axios.get(`http://localhost:5083/api/contact?email=${userEmail}`);
    setRequests(response.data);
  } catch (error) {
    console.error("Error fetching requests:", error);
    alert("Failed to fetch requests");
  } finally {
    setLoading(false);
  }
};


  // ✅ Delete a request
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      try {
        await axios.delete(`http://localhost:5083/api/contact/${id}`);
        setRequests(requests.filter((r) => r.id !== id));
      } catch (error) {
        console.error("Error deleting request:", error);
      }
    }
  };

  // ✅ Open edit modal
  const handleEdit = (request) => {
    setEditingRequest(request);
    setShowModal(true);
  };

  // ✅ Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingRequest({ ...editingRequest, [name]: value });
  };

  // ✅ Save updated request
  const handleSave = async () => {
    try {
       console.log("Sending update data:", editingRequest); // 🧠 Debug log

      await axios.put(
        `http://localhost:5083/api/contact/${editingRequest.id}`,
        editingRequest
      );
      setRequests(
        requests.map((r) =>
          r.id === editingRequest.id ? editingRequest : r
        )
      );
      setShowModal(false);
      setEditingRequest(null);
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  if (loading) return <p className="text-center mt-5">Loading...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Requests List</h2>

      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <table className="table table-dark table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Asset Name</th>
              <th>Requested Quantity</th>
              <th>Location</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.username}</td>
                <td>{req.email}</td>
                <td>{req.phoneNumber}</td>
               <td>
  {req.assetRequestItems && req.assetRequestItems.length > 0 ? (
    req.assetRequestItems.map((item, index) => (
      <div key={index}>{item.asset}</div>
    ))
  ) : (
    <em>No assets</em>
  )}
</td>
<td>
  {req.assetRequestItems && req.assetRequestItems.length > 0 ? (
    req.assetRequestItems.map((item, index) => (
      <div key={index}>{item.requestedQuantity}</div>
    ))
  ) : (
    "-"
  )}
</td>
 
                <td>{req.location}</td>
                <td>{req.message}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleEdit(req)}
                  >
                    Edit
                  </Button>{" "}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(req.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingRequest && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={editingRequest.username}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={editingRequest.email}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  name="phoneNumber"
                  value={editingRequest.phoneNumber || ""}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={editingRequest.location}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="message"
                  value={editingRequest.message || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Requests;
