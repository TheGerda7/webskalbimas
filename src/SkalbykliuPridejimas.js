import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

const SkalbykliuPridejimas = () => {
    const navigate = useNavigate();

  useEffect(() => {
    // Tikrinama, ar vartotojas yra prisijungęs prie paskyros
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    if (isAuthenticated !== "true") {
      // Jeigu vartotojas nėra prisijungęs prie paskyros, nukreipiama į neprisijungusio naudotojo puslapį
      navigate("/");
    }
  }, [navigate]);

  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('http://localhost:5000/addWashing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, quantity }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg);
        setMessageType('success');
      } else {
        setMessage(data.msg);
        setMessageType('error');
      }
    } catch (err) {
      console.error('Klaida:', err);
      setMessage('Nepavyko susisiekti su serveriu.');
      setMessageType('error');
    }
  };

  return (
    <div className="App">
      <div className="skalbykles-container">
        <h2 className="login-title">Pridėti skalbimo mašinas</h2>
        <div className="login-form">
          <label className="login-label" htmlFor="address">Adresas</label>
          <input
            className="login-input"
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Įveskite adresą"
          />
          
          <label className="login-label" htmlFor="quantity">Kiekis</label>
          <input
            className="login-input"
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
          
          <button className="register-button" onClick={handleSubmit}>Pridėti</button>

        {message && (
            <p className={`register-message ${messageType}`}>
                {message}
            </p>
        )}
        </div>
      </div>
    </div>
  );
};

export default SkalbykliuPridejimas;