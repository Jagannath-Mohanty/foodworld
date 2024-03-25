import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
const Signup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    work: "",
    password: "",
    cpassword: "",
    role: "user",
  });
  let name, value;
  const handelInputs = (e) => {
    console.log(e);
    name = e.target.name;
    value = e.target.value;
    setUser({ ...user, [name]: value });
  };

  const PostData = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, cpassword } = user;
    const res = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        cpassword,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      window.alert("Invalid Registration");
      console.log("invalid Registration");
    } else {
      window.alert("Registration successfull");
      console.log("Successfull Registration");
      navigate("/login");
    }
  };

  return (
    <>
      <div className="main-body">
        <div className="content">
          <div className="container">
            <span>User Registration</span>

            <form method="POST">
              <div className="form-group">
                <input
                  className="input-field"
                  type="text"
                  id="name"
                  name="name"
                  required
                  autoComplete="off"
                  value={user.name}
                  onChange={handelInputs}
                  placeholder="Enter Name"
                />
              </div>
              <div className="form-group">
                <input
                  className="input-field"
                  type="email"
                  id="email"
                  name="email"
                  required
                  autoComplete="off"
                  value={user.email}
                  onChange={handelInputs}
                  placeholder="Enter Email-id"
                />
              </div>
              <div className="form-group">
                <input
                  className="input-field"
                  type="text"
                  id="mobile"
                  name="phone"
                  required
                  autoComplete="off"
                  value={user.phone}
                  onChange={handelInputs}
                  placeholder=" Mobile Number"
                />
              </div>

              <div className="form-group">
                <input
                  className="input-field"
                  type="password"
                  id="password"
                  name="password"
                  required
                  autoComplete="off"
                  value={user.password}
                  onChange={handelInputs}
                  placeholder="Create Password"
                />
              </div>
              <div className="form-group">
                <input
                  className="input-field"
                  type="password"
                  id="cpassword"
                  name="cpassword"
                  required
                  autoComplete="off"
                  value={user.cpassword}
                  onChange={handelInputs}
                  placeholder="Confirm Password"
                />
              </div>

              <div className="login-submit">
                <button type="submit" name="signup" onClick={PostData}>
                  Register
                </button>
                <a href="/login" className="signup-link">
                  user-login
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
