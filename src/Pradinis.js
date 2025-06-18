import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Pradinis = () => {
  const navigate = useNavigate();

  return (
    <div className="system-container center-content">
      <div className="system-card">
        <h1 className="welcome-title">Sveiki atvykę į skalbimo mašinų užimtumo stebėjimo sistemos svetainę!</h1>
        <p className="welcome-message">Registruotiems vartotojams suteikiamos šias funkcijos:</p>
        <p className="welcome-message">• Peržiūrėti skalbimo mašinų būsenas realiu laiku;</p>
        <p className="welcome-message">• Rasti skalbimo mašinų patalpų adresus;</p>
        <p className="welcome-message">• Gauti pranešimus, kai pasirinktos skalbimo mašinos baigia darbą.</p>
        <p className="welcome-message">• Rezervuoti pasirinktą skalbimo mašiną.</p>
        <div className="system-buttons">
          <button onClick={() => navigate("/registracija")} className="system-button register-button">
            Registracija
          </button>
          <button onClick={() => navigate("/prisijungimas")} className="system-button login-button">
            Prisijungimas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pradinis;