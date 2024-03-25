import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import "./Admin.css";
const Admin = () => {
  const [data, setData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [category, setCatagory] = useState(false);

  const navigate = useNavigate();

  const sendDataToBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        throw new Error("Token not found in localStorage");
      }

      const response = await fetch("/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Failed to send data to backend");
      }

      const responseData = await response.json();
      console.log("Response from backend:", responseData);

      if (Array.isArray(responseData)) {
        setData(responseData);
      } else {
        throw new Error("Invalid response data format");
      }

      setIsAdmin(responseData.isAdmin);
    } catch (error) {
      console.error("Error:", error.message);
      setShowModal(true);
    }
  };

  const handleAdmin = async (userId, cheked) => {
    console.log("User========Id   ", userId);
    try {
      const user_id = userId;
      const response = await fetch("/make-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, category }),
      });
    } catch (error) {
      console.log("====> Error From MakeAdmin " + error);
    }
  };

  useEffect(() => {
    // sendDataToBackend();
    handleAdmin();
  }, [category]);

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (!data) {
    return (
      <div className="admin-reject">
        <div className="admin-reject-heading">Only Admin Can Accessable</div>
        <br />

        <a href="/login">Login</a>
      </div>
    );
  }

  return (
    <div className="main-body">
      <Modal
        isOpen={showModal}
        message="You are not authorized!"
        onClose={handleCloseModal}
      />
      <form method="GET">
        <div className="container">
          <Link to="/additem">
            <button className="admin-button">ADD ITEM</button>
          </Link>
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {" "}
              {data.map((user, index) => (
                <tr key={index} className="user-data">
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.orders}</td>
                  <td>
                    {user.role}
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={user.role === "admin"}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            handleAdmin(user._id, setCatagory(true));
                          } else {
                            handleAdmin(user._id, setCatagory());
                          }
                        }}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};

export default Admin;
