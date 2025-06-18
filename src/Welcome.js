import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css"; // Įsitikink, kad įtraukta nauja CSS klasė

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Patikriname, ar vartotojas yra prisijungęs
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    if (isAuthenticated !== "true") {
      // Jei vartotojas nėra prisijungęs, nukreipiame jį į registracijos puslapį
      navigate("/registracija");
    }
  }, [navigate]);

  return (
    <>
      <div className="welcome-container">
        <h2 className="welcome-title">Sveiki!</h2>
        <p className="welcome-message">Sėkmingai prisijungėte arba prisiregistravote!</p>
      </div>
    </>
  );
};

export default Welcome;