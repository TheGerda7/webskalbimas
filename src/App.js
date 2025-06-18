import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./Registracija";
import Welcome from "./Welcome";
import Prisijungimas from "./Prisijungimas";
import Juosta from "./Juosta";
import Vartotojas from "./Vartotojas";
import Pradinis from "./Pradinis";
import SkalbykliuPridejimas from "./SkalbykliuPridejimas";
import Skalbykles from "./Skalbykles";
import Adresai from "./Adresai";
import IrenginioPridejimas from "./IrenginioPridejimas";
import ApsaugotasKelias from "./ApsaugotasKelias";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    if (username) {
      axios
        .get(`http://localhost:5000/user/${username}`)
        .then((response) => {
          console.log("Gauti vartotojo duomenys:", response.data);
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Klaida gaunant vartotojo duomenis:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [username]);

  if (isLoading) {
    return <div>Kraunama...</div>;
  }

  return (
    <Router>
      <Juosta />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Pradinis />} />
          <Route path="/registracija" element={<RegisterForm />} />
          <Route path="/pasisveikinimas" element={<Welcome />} />
          <Route path="/prisijungimas" element={<Prisijungimas />} />
          <Route path="/vartotojas" element={<Vartotojas />} />
          <Route path="/skalbykles" element={<Skalbykles />} />
          <Route path="/adresai" element={<Adresai />} />

          <Route element={<ApsaugotasKelias allowedRoles={["admin"]} user={user} />}>
            <Route path="/skalbykliuPridejimas" element={<SkalbykliuPridejimas />} />
            <Route path="/irenginioPridejimas" element={<IrenginioPridejimas />} />
          </Route>

        </Routes>
      </div>
    </Router>
  );
};

export default App;
