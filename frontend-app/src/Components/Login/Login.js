import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // -------------------------------
  // INPUT CHANGE — NO VALIDATION HERE
  // -------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------------
  // VALIDATE FULL FORM ON SUBMIT
  // -------------------------------
  const validateAll = () => {
    const newErrors = {};

    // EMAIL VALIDATION
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format.";
    }

    // PASSWORD VALIDATION (ALL ERRORS)
    const passwordErrors = [];

    if (!form.password.trim())
      passwordErrors.push("Password is required.");

    if (form.password.length < 8)
      passwordErrors.push("Password must be at least 8 characters.");

    if (!/[A-Za-z]/.test(form.password))
      passwordErrors.push("Password must contain at least 1 letter.");

    if (!/\d/.test(form.password))
      passwordErrors.push("Password must contain at least 1 number.");

    if (!/[@$!%*?&#]/.test(form.password))
      passwordErrors.push("Password must contain at least 1 special character.");

    if (passwordErrors.length > 0)
      newErrors.password = passwordErrors;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------
  // SUBMIT HANDLER
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      setMessage("Please fix the errors before logging in.");
      return;
    }

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

      // Save user
      localStorage.setItem("user", JSON.stringify(data.user));
      onLoginSuccess(data.user);

      // Redirect admin / user
      if (data.user.email.includes("@admin")) {
        navigate("/adminpanel");
      } else {
        navigate("/");
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  // -------------------------------
  // UI COMPONENT
  // -------------------------------
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="text-center mb-4">Login</h3>

              <form onSubmit={handleSubmit}>

                {/* EMAIL */}
                <input
                  type="text"
                  name="email"
                  placeholder="Email"
                  className="form-control mb-1"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="text-danger small mb-2">{errors.email}</div>
                )}

                {/* PASSWORD */}
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="form-control mb-1"
                  value={form.password}
                  onChange={handleChange}
                />

                {/* Show ALL password errors */}
                {errors.password && (
                  <ul className="text-danger small mb-2">
                    {errors.password.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                )}

                <div className="text-center mt-3">
                  <button type="submit" className="btn btn-primary w-50">
                    Login
                  </button>
                </div>
              </form>

              {/* REGISTER BUTTON */}
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
