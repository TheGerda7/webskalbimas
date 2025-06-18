import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

const RegisterForm = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok && data.msg === "Registracija sėkminga.") {
        setMessage(data.msg);
        setMessageType("success");

        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("username", form.username);

        setTimeout(() => {
          navigate("/pasisveikinimas");
        }, 100);
      } else {
        setMessage(data.msg || "Nepavyko užregistruoti vartotojo.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Klaida registruojant vartotoją.");
      setMessageType("error");
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Registracija</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <label className="register-label">Vardas</label>
        <input
          type="text"
          name="firstName"
          placeholder="Įveskite vardą"
          onChange={handleChange}
          value={form.firstName}
          className="register-input"
        />

        <label className="register-label">Pavardė</label>
        <input
          type="text"
          name="lastName"
          placeholder="Įveskite pavardę"
          onChange={handleChange}
          value={form.lastName}
          className="register-input"
        />

        <label className="register-label">Slapyvardis</label>
        <input
          type="text"
          name="username"
          placeholder="Įveskite slapyvardį"
          onChange={handleChange}
          value={form.username}
          className="register-input"
        />

        <label className="register-label">El. paštas</label>
        <input
          type="email"
          name="email"
          placeholder="Įveskite el. paštą"
          onChange={handleChange}
          value={form.email}
          className="register-input"
        />

        <label className="register-label">Slaptažodis</label>
        <input
          type="password"
          name="password"
          placeholder="Įveskite slaptažodį"
          onChange={handleChange}
          value={form.password}
          className="password-login-register"
        />

        <button type="submit" className="register-button">Registruotis</button>

        <label onClick={() => navigate("/prisijungimas")} className="goto-registration">Prisijungti</label>
      </form>

      {message && (
        <p className={`register-message ${messageType}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default RegisterForm;