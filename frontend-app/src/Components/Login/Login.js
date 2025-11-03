import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();
try {
  const res = await fetch("http://localhost:5083/api/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  const text = await res.text(); // get raw response text
  console.log("Response status:", res.status);
  console.log("Response body:", text);

  if (!res.ok) {
    throw new Error(text || "Invalid login credentials");
  }

  const data = JSON.parse(text);
  onLoginSuccess(data.user);

  if (data.user.email.includes("@admin")) {
    navigate("/adminpanel");
  } else {
    navigate("/");
  }
} catch (err) {
  console.error("Login error:", err);
  setMessage(err.message);
}
};


  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="text-center mb-4">Login</h3>
              <form onSubmit={handleSubmit}>
                <input type="email" name="email" placeholder="Email" className="form-control mb-3" value={form.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" className="form-control mb-3" value={form.password} onChange={handleChange} required />
                <button type="submit" className="btn btn-primary w-100">Login</button>
              </form>

              {message && <div className="alert alert-info mt-3 text-center">{message}</div>}

              <div className="text-center mt-3">
                <small>
                  Don’t have an account?{" "}
                  <button className="btn btn-link p-0 text-decoration-none" onClick={() => navigate("/register")}>
                    Register
                  </button>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
