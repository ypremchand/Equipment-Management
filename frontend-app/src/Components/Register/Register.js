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

  // ------------------------------------
  // HANDLE INPUT CHANGE
  // ------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    // Validate each field on typing
    validateField(name, value);
  };

  // ------------------------------------
  // SINGLE FIELD VALIDATION
  // ------------------------------------
  const validateField = (name, value) => {
    let errorMsg = "";

    if (name === "name") {
      if (!value.trim()) errorMsg = "Name is required.";
      else if (value.trim().length < 3)
        errorMsg = "Name must be at least 3 characters.";
      else if (!/^[A-Za-z ]+$/.test(value))
        errorMsg = "Name can contain only letters.";
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

    if (name === "password") {
      if (!value.trim()) errorMsg = "Password is required.";
    }

    if (name === "confirmPassword") {
      if (!value.trim()) errorMsg = "Confirm Password is required.";
      else if (value !== form.password)
        errorMsg = "Passwords do not match.";
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // ------------------------------------
  // FORM VALIDATION BEFORE SUBMIT
  // ------------------------------------
  const validateAll = () => {
    const newErrors = {};

    // Name
    if (!form.name.trim()) newErrors.name = "Name is required.";
    else if (form.name.trim().length < 3)
      newErrors.name = "Name must be at least 3 characters.";
    else if (!/^[A-Za-z ]+$/.test(form.name))
      newErrors.name = "Name can contain only letters.";

    // Email
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format.";

    // Phone
    if (!form.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.phoneNumber))
      newErrors.phoneNumber = "Phone number must be exactly 10 digits.";

    // Password
    if (!form.password.trim())
      newErrors.password = "Password is required.";
    else {
      if (form.password.length < 8)
        newErrors.password = "Password must be at least 8 characters.";
      else if (!/[A-Za-z]/.test(form.password))
        newErrors.password = "Password must contain at least 1 letter.";
      else if (!/\d/.test(form.password))
        newErrors.password = "Password must contain at least 1 number.";
      else if (!/[@$!%*?&#]/.test(form.password))
        newErrors.password = "Password must contain at least 1 special character.";
    }

    // Confirm Password
    if (!form.confirmPassword.trim())
      newErrors.confirmPassword = "Confirm Password is required.";
    else if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ------------------------------------
  // SUBMIT HANDLER
  // ------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      setMessage("Please fill all the above fields before submitting.");
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

  // Password strength indicators
  const validations = {
    length: form.password.length >= 8,
    letter: /[A-Za-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[@$!%*?&#]/.test(form.password),
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
                />
                {errors.name && <div className="text-danger small mb-2">{errors.name}</div>}

                {/* EMAIL */}
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="form-control mb-1"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="text-danger small mb-2">{errors.email}</div>}

                {/* PHONE */}
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  className="form-control mb-1"
                  value={form.phoneNumber}
                  onChange={handleChange}
                />
                {errors.phoneNumber && (
                  <div className="text-danger small mb-2">{errors.phoneNumber}</div>
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
                {errors.password && (
                  <div className="text-danger small mb-2">{errors.password}</div>
                )}

                {/* Password Requirements */}
                <div className="mb-3 small">
                  <label className="fw-bold">Password must contain:</label>
                  <ul className="list-unstyled ms-2">
                    <li>
                      <input type="checkbox" checked={validations.length} readOnly /> 8+ characters
                    </li>
                    <li>
                      <input type="checkbox" checked={validations.letter} readOnly /> At least 1 letter
                    </li>
                    <li>
                      <input type="checkbox" checked={validations.number} readOnly /> At least 1 number
                    </li>
                    <li>
                      <input type="checkbox" checked={validations.special} readOnly /> At least 1 special character
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
                />
                {errors.confirmPassword && (
                  <div className="text-danger small mb-2">{errors.confirmPassword}</div>
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
