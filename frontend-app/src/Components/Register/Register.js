import { useState } from "react";
import { useNavigate, } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Password Validation
  const validations = {
    length: form.password.length >= 8,
    letter: /[A-Za-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[@$!%*?&#]/.test(form.password),
    match: form.password === form.confirmPassword && form.password !== "",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="form-control mb-3"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

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
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  className="form-control mb-3"
                  value={form.phoneNumber}
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

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="form-control mb-3"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <div className="small mb-3">
                  <input type="checkbox" checked={validations.match} readOnly /> Passwords
                  match
                </div>

                <div className="text-center">
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
