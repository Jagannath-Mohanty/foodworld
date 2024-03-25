import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    const data = {
      email: email,
      password: password,
    };

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          window.alert("Invalid User");
          throw new Error("Invalid email or password");
        }
        return response.json();
      })
      .then((data) => {
        if (!data) {
          window.alert("Invalid User");
        } else {
          window.alert("Login Successfull");
          console.log("====Token-Login====" + data.token);

          localStorage.setItem("token", JSON.stringify(data.token));
          navigate("/");
        }
      })
      .catch((error) => {
        // Handle errors
        setError(error.message);
      });
  }

  return (
    <>
      <div className="main-body">
        <div className="content">
          <div className="container">
            <span>User LogIn</span>
            <p>or</p>
            <span>
              <a href="/signup" className="login-link">
                <span>create an account</span>
              </a>
            </span>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  className="input-field"
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="off"
                  value={email}
                  required
                  placeholder="Enter  Email-Id"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <input
                  className="input-field"
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="off"
                  value={password}
                  required
                  placeholder="Enter Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="login-submit">
                <button type="submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
