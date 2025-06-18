import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

function Adresai() {
  const navigacija = useNavigate();

  useEffect(() => {
    // Tikrinama, ar vartotojas yra prisijungęs prie paskyros
    const arPrisijunges = sessionStorage.getItem("isAuthenticated");

    if (arPrisijunges !== "true") {
      // Jeigu vartotojas nėra prisijungęs prie paskyros, nukreipiama į neprisijungusio naudotojo puslapį
      navigacija("/");
    }
  }, [navigacija]);

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kreipiamasi į serverio pusės programą, jog būtų gaunamos skalbimo mašinos
  useEffect(() => {
    fetch('http://localhost:5000/machines')
      .then(response => response.json())
      .then(data => {
        console.log("Gauti duomenys:", data);
        setMachines(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Klaida gaunant duomenis:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Įkeliama...</div>;
  }

  // Suskaičiuojama, kiek skalbimo mašinų yra unikaliuose adresuose
  const adresuKiekisUnikalus = machines.reduce((acc, machine) => {
    acc[machine.address] = acc[machine.address] ? acc[machine.address] + 1 : 1;
    return acc;
  }, {});

  // Suskaičiuoja, kiek skalbimo mašinų yra unikaliuose adresuose, bet skaičiuoja tik tas mašinas, kurios yra laisvos būsenos
  const laisvuMasinuKiekis = machines.reduce((acc, machine) => {
    if (machine.status === "Laisva") {
      acc[machine.address] = acc[machine.address] ? acc[machine.address] + 1 : 1;
    }
    return acc;
  }, {});

  const unikalusAdresai = Object.keys(adresuKiekisUnikalus);

  return (
    <div className="skalbykles-container">
      <h1 className="skalbykles-title">Skalbimo mašinų adresai</h1>
      <table className="machines-table">
        <thead>
          <tr>
            <th>Adresas</th>
            <th>Skalbimo mašinų kiekis</th>
            <th>Laisvų skalbyklių kiekis adrese</th>
          </tr>
        </thead>
        <tbody>
          {unikalusAdresai.map((address, index) => (
            <tr key={index}>
              <td>{address}</td>
              <td>{adresuKiekisUnikalus[address]}</td>
              <td>{laisvuMasinuKiekis[address] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Adresai;