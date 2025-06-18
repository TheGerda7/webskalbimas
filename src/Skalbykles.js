import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

function Skalbykles() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    if (isAuthenticated !== "true") {
      navigate("/registracija");
    }
  }, [navigate]);

  const fetchMachineData = () => {
    fetch('http://localhost:5000/machines')
      .then(response => response.json())
      .then(data => {
        const machinesWithMessages = data.map(machine => ({
          ...machine,
          subscriptionMessage: null,
          reservationMessage: null
        }));
        setMachines(machinesWithMessages);
        setLoading(false);
      })
      .catch(error => {
        console.error('Klaida gaunant duomenis:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMachineData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMachineData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const subscribeToMachine = (machineId, index) => {
    fetch(`http://localhost:5000/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, username }),
    })
      .then(response => response.json())
      .then(data => {
        const newMachines = [...machines];
        newMachines[index].subscriptionMessage = data.msg === "Prenumerata sėkminga!"
          ? { type: "success", text: "Sėkmingai atlikta pranešimų prenumerata!" }
          : { type: "error", text: data.msg };
        setMachines(newMachines);
      })
      .catch(error => {
        console.error("Klaida siunčiant prenumeratos užklausą:", error);
        const newMachines = [...machines];
        newMachines[index].subscriptionMessage = { type: "error", text: "Klaida siunčiant užklausą." };
        setMachines(newMachines);
      });
  };

  const reserveMachine = (machineId, index) => {
    fetch(`http://localhost:5000/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, username }),
    })
      .then(response => response.json())
      .then(data => {
        const newMachines = [...machines];
        newMachines[index].reservationMessage = data.msg === "Rezervacija sėkminga!"
          ? { type: "success", text: "Sėkmingai atlikta skalbyklės rezervacija!" }
          : { type: "error", text: data.msg };
        setMachines(newMachines);
      })
      .catch(error => {
        console.error("Klaida siunčiant rezervacijos užklausą:", error);
        const newMachines = [...machines];
        newMachines[index].reservationMessage = { type: "error", text: "Klaida siunčiant užklausą." };
        setMachines(newMachines);
      });
  };

  if (loading) {
    return <div>Įkeliama...</div>;
  }

  return (
    <div className="skalbykles-container">
      <h1 className="skalbykles-title">Skalbimo mašinų būsenos</h1>

      <table className="machines-table">
        <thead>
          <tr>
            <th>Numeris</th>
            <th>Adresas</th>
            <th>Būsena</th>
            <th>Pranešimai</th>
            <th>Rezervacija</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine, index) => (
            <tr key={index}>
              <td>{machine.number}</td>
              <td>{machine.address}</td>
              <td>{machine.status}</td>
              <td>
                {(machine.status === "Užimta" || machine.status === "Nenurodyta") ? (
                  <>
                    <button
                      className="subscribe-button"
                      onClick={() => subscribeToMachine(machine.id, index)}
                    >
                      Prenumeruoti
                    </button>
                    {machine.subscriptionMessage && (
                      <div
                        className={
                          machine.subscriptionMessage.type === "success"
                            ? "success-message"
                            : "error-message"
                        }
                      >
                        {machine.subscriptionMessage.text}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="info-message">Prenumeruoti laisvos mašinos negalima</div>
                )}
              </td>
              <td>
                {(machine.status === "Užimta" || machine.status === "Laisva") ? (
                  machine.reservation === "Ne" || machine.reservation === "Nenurodyta" ? (
                    <>
                      <button
                        className="subscribe-button"
                        onClick={() => reserveMachine(machine.id, index)}
                      >
                        Rezervuoti
                      </button>
                      {machine.reservationMessage && (
                        <div
                          className={
                            machine.reservationMessage.type === "success"
                              ? "success-message"
                              : "error-message"
                          }
                        >
                          {machine.reservationMessage.text}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="info-message">Skalbimo mašina jau yra rezervuota</div>
                  )
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Skalbykles;
