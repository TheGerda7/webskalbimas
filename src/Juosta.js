import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Meniu from "./Meniu";
import "./App.css";

const Juosta = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  const username = sessionStorage.getItem("username");

  // Mygtukas su slapyvardžiu, kuris nukreipia į profilio puslapį, paslepiamas esant registracijos, prisijungimo ir neprisijungusio naudotojo puslapiuose
  const hideUserButton = location.pathname === "/registracija" || location.pathname === "/prisijungimas" || location.pathname === "/";

  // Funkcija, kuri nukreipia į pasisveikinimo puslapį, kai paspaudžiama ant logotipo
  const handleLogoClick = () => {
    navigate("/pasisveikinimas");
  };

  return (
    <div className="juosta">
      {isAuthenticated && (
        <div className="menu-container">
          <Meniu />  {/* Meniu rodomas tik tada, kai yra prisijungiama prie paskyros */}
        </div>
      )}

      {/* Logotipo įterpimas su nukreipimo funkcija */}
      <img 
        src="/Logo.png" 
        alt="Skalbyklių sistema" 
        className="logo" 
        onClick={handleLogoClick} 
      />

      {/* Jeigu vartotojas yra prisijungęs ir nėra prisijungimo, registracijos ar neprisijungusio vartotojo puslapiuose, rodomas mygtukas su slapyvardžiu */}
      {!hideUserButton && isAuthenticated && (
        <button className="user-button" onClick={() => navigate("/Vartotojas")}>
          {username}
        </button>
      )}
    </div>
  );
};

export default Juosta;
