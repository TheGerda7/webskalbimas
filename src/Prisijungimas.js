import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Prisijungimas = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.msg === "Prisijungimas sėkmingas.") {
        setMessage(data.msg || "Prisijungimas sėkmingas.");
        setMessageType("success");

        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("username", form.username);

        setTimeout(() => {
            navigate("/pasisveikinimas");
          }, 100);
      } else {
        setMessage(data.msg || "Prisijungimo klaida.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Serverio klaida.");
      setMessageType("error");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Prisijungimas</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-label">Slapyvardis</label>
        <input
          type="text"
          name="username"
          className="login-input"
          placeholder="Įveskite slapyvardį"
          value={form.username}
          onChange={handleChange}
        />

        <label className="login-label">Slaptažodis</label>
        <input
          type="password"
          name="password"
          className="password-login-register"
          placeholder="Įveskite slaptažodį"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit" className="login-button">Prisijungti</button>
        <label onClick={() => navigate("/registracija")} className="goto-registration">Registruotis</label>
      </form>

      {message && <p className={`login-message ${messageType}`}>{message}</p>}
    </div>
  );
};

export default Prisijungimas;