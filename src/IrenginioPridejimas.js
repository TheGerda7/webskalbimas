import { useState, useEffect } from "react";
import './App.css';

export default function WashingPage() {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [washingData, setWashingData] = useState([]);
  const [uniqueAddresses, setUniqueAddresses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [assignedDeviceId, setAssignedDeviceId] = useState(null);

  useEffect(() => {
    fetchWashingData();
  }, []);

  // Kreipiamasi į serverio pusės programą, jog būtų gaunamos skalbimo mašinos
  async function fetchWashingData() {
    try {
      const response = await fetch("http://localhost:5000/machines");
      if (!response.ok) throw new Error("Klaida gaunant duomenis");
      const data = await response.json();
      setWashingData(data);

      // Filtruojami tik unikalūs adresai
      const addresses = new Set();
      data.forEach((item) => addresses.add(item.address));
      setUniqueAddresses(Array.from(addresses));

      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Klaida gaunant duomenis: " + error.message);
      setSuccessMessage("");
      setAssignedDeviceId(null);
    }
  }

  // Kreipiamasi į serverio pusės programą, jog būtų priskirtas įrenginys skalbimo mašinai
  const handleAssign = async (washingId) => {
    console.log("Siunčiami duomenys:", { address: selectedAddress, washingID: washingId });
    try {
      const response = await fetch("http://localhost:5000/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedAddress,
          washingID: washingId,
        }),
      });

      const responseData = await response.json();
      console.log("Gautas atsakymas:", responseData);

      if (!response.ok) throw new Error(responseData.msg || "Priskyrimo klaida");

      console.log("Įrenginys priskirtas sėkmingai");

      setSuccessMessage("Skalbimo mašina priskirta sėkmingai!");

      // Gaunamas naujai priskirto įrenginio ID atvaizdavimui puslapyje
      setAssignedDeviceId(responseData.deviceId);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage("");
      setAssignedDeviceId(null);
    }
  };

  const handleAddressChange = (e) => {
    setSelectedAddress(e.target.value);
    setErrorMessage("");
    setSuccessMessage("");
    setAssignedDeviceId(null);
  };

  return (
    <div className="washing-page-container">
      <div className="address-selector">
        <select 
          className="address-dropdown"
          onChange={handleAddressChange}
        >
          <option value="">Pasirinkite adresą</option>
          {uniqueAddresses.length > 0 ? (
            uniqueAddresses.map((address) => (
              <option key={address} value={address}>{address}</option>
            ))
          ) : (
            <option disabled>Adresų nėra</option>
          )}
        </select>
      </div>

      {/* Klaidos pranešimas */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Sėkmės pranešimas */}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Priskirto įrenginio ID */}
      {assignedDeviceId !== null && (
        <div className="success-message">Priskirto įrenginio ID: {assignedDeviceId}</div>
      )}

      <div className="washing-list">
        {washingData
          .filter((item) => item.address === selectedAddress)
          .map((wash) => (
            <div key={wash.id} className="washing-item">
              <span>{wash.id} - {wash.address} (Būsena: {wash.status})</span>
              <button 
                className="assign-button"
                onClick={() => handleAssign(wash.id)}
              >
                Priskirti
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
