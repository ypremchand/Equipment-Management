import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5083/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      if (!res.ok) {
        const errJson = JSON.parse(text);
        throw new Error(errJson.message || "Invalid login credentials");
      }

      const data = JSON.parse(text);

      // Save user to localStorage (IMPORTANT!)
      localStorage.setItem("user", JSON.stringify(data.user));

      onLoginSuccess(data.user);

      if (data.user.email.includes("@admin")) {
        navigate("/adminpanel");
      } else {
        navigate("/");
      }
    } catch (err) {
      setMessage("Error: " + err.message);
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
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="form-control mb-3"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="form-control mb-3"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <div className="text-center">
                  <button type="submit" className="btn btn-primary w-50">
                    Login
                  </button>

                </div>

              </form>

              {/* ➕ Register Button */}
              <div className="text-center mt-3">
                <p className="mb-1">Don't have an account?</p>
                <button
                  className="btn btn-outline-secondary w-50"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </div>

              {message && (
                <div className="alert alert-info mt-3 text-center">{message}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
