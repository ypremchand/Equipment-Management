import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    validateField(name, value);
  };

  // ---- FIELD VALIDATIONS ----
  const validateField = (name, value) => {
    let errorMsg = "";

    if (name === "name") {
      if (!value.trim()) errorMsg = "Name is required.";
      else if (value.length < 3) errorMsg = "Name must be at least 3 characters.";
      else if (!/^[A-Za-z ]+$/.test(value)) errorMsg = "Name can contain only letters.";
    }

    if (name === "email") {
      if (!value.trim()) errorMsg = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        errorMsg = "Invalid email format.";
    }

    if (name === "phoneNumber") {
      if (!value.trim()) errorMsg = "Phone number is required.";
      else if (!/^\d{10}$/.test(value))
        errorMsg = "Phone number must be exactly 10 digits.";
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // ---- PASSWORD VALIDATION ----
  const validations = {
    length: form.password.length >= 8,
    letter: /[A-Za-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[@$!%*?&#]/.test(form.password),
    match: form.password === form.confirmPassword && form.password !== "",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submitting
    ["name", "email", "phoneNumber"].forEach((field) =>
      validateField(field, form[field])
    );

    // Check if any error exists
    const hasErrors = Object.values(errors).some((msg) => msg);
    if (hasErrors) {
      setMessage("Please fix the errors before submitting.");
      return;
    }

    const isStrong =
      validations.length &&
      validations.letter &&
      validations.number &&
      validations.special &&
      validations.match;

    if (!isStrong) {
      setMessage("Please meet all password requirements.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5083/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage(data.message || "Registration successful!");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.message || "Server error");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="text-center mb-4">Register</h3>

              <form onSubmit={handleSubmit}>
                {/* NAME */}
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="form-control mb-1"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && (
                  <div className="text-danger small mb-2">{errors.name}</div>
                )}

                {/* EMAIL */}
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="form-control mb-1"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && (
                  <div className="text-danger small mb-2">{errors.email}</div>
                )}

                {/* PHONE */}
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  className="form-control mb-1"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />
                {errors.phoneNumber && (
                  <div className="text-danger small mb-2">{errors.phoneNumber}</div>
                )}

                {/* PASSWORD */}
                <input
                  type="password"  
                  name="password"
                  placeholder="Password"
                  className="form-control mb-3"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                {/* Password Requirements */}
                <div className="mb-3 small">
                  <label className="fw-bold">Password must contain:</label>
                  <ul className="list-unstyled ms-2">
                    <li>
                      <input type="checkbox" checked={validations.length} readOnly /> 8+
                      characters
                    </li>
                    <li>
                      <input type="checkbox" checked={validations.letter} readOnly /> At
                      least 1 letter
                    </li>
                    <li>
                      <input type="checkbox" checked={validations.number} readOnly /> At
                      least 1 number
                    </li>
                    <li>
                      <input type="checkbox" checked={validations.special} readOnly /> At
                      least 1 special character
                    </li>
                  </ul>
                </div>

                {/* CONFIRM PASSWORD */}
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="form-control mb-1"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {!validations.match && form.confirmPassword && (
                  <div className="text-danger small mb-2">
                    Passwords do not match.
                  </div>
                )}

                <div className="text-center mt-3">
                  <button type="submit" className="btn btn-primary w-50">
                    Register
                  </button>
                </div>
              </form>

              {message && (
                <div className="alert alert-info mt-3 text-center">{message}</div>
              )}

              <div className="text-center mt-3">
                <p className="mb-1">Already have an account?</p>
                <button
                  className="btn btn-outline-secondary w-50"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
