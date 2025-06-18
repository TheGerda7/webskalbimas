import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Vartotojas = () => {
  const username = sessionStorage.getItem("username");
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profilis");

  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    username: username,
    email: "",
  });

  const [subscriptions, setSubscriptions] = useState([]);
  const [reservation, setReservation] = useState([]);

  const [profileImage, setProfileImage] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate("/");
    }
  }, [username, navigate]);

  useEffect(() => {
    axios.get(`http://localhost:5000/user/${username}`)
      .then((res) => setUserData(res.data))
      .catch((err) => console.error("Klaida gaunant vartotojo duomenis:", err));
  }, [username]);

  useEffect(() => {
    if (userData.id) {
      const storageKey = `profileImage_${userData.id}`;
      setProfileImage(localStorage.getItem(storageKey));
    }
  }, [userData.id]);

  const fetchSubscriptions = () => {
    axios.get(`http://localhost:5000/sub/${userData.email}`)
      .then((res) => setSubscriptions(res.data))
      .catch((err) => console.error("Prenumeratų klaida:", err));
  };

  const fetchReservation = () => {
    axios.get(`http://localhost:5000/res/${userData.email}`)
      .then((res) => {
        setReservation(res.data || []);
      })
      .catch((err) => {
        console.error("Klaida gaunant rezervaciją:", err);
        setReservation([]);
      });
  };

  useEffect(() => {
    if (userData.email) {
      fetchSubscriptions();
      fetchReservation();
    }
  }, [userData.email]);

  const handleCancelSubscription = (machineId) => {
    axios.post(`http://localhost:5000/unsubscribe`, {
      machineId,
      email: userData.email,
    })
      .then(() => {
        fetchSubscriptions();
      })
      .catch((error) => {
        console.error("Klaida atšaukiant prenumeratą:", error);
      });
  };

  const handleCancelReservation = (machineId) => {
    axios.post(`http://localhost:5000/cancelReservation`, {
      machineId,
      email: userData.email,
    })
      .then(() => {
        fetchReservation();
      })
      .catch((error) => {
        console.error("Klaida atšaukiant rezervaciją:", error);
      });
  };

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const handleSubmit = (field) => {
    if (!userData[field]) {
      setErrorMessage(`${field} negali būti tuščias.`);
      return;
    }

    axios.put(`http://localhost:5000/user/${userData.id}`, {
      [field]: userData[field],
    })
      .then(() => {
        if (field === "username") {
          sessionStorage.setItem("username", userData.username);
        }
        setEditingField(null);
        setErrorMessage("");
      })
      .catch((error) => {
        const msg = error.response?.data?.msg || "Nepavyko atnaujinti duomenų.";
        setErrorMessage(msg);
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImage(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("profileImage", file);

      axios.post(`http://localhost:5000/uploadProfileImage/${userData.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
        .then((res) => {
          localStorage.setItem(`profileImage_${userData.id}`, res.data.imageUrl);
          setProfileImage(res.data.imageUrl);
        })
        .catch((err) => console.error("Klaida įkeliant nuotrauką:", err));
    }
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeMessage("Užpildykite visus laukus.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage("Nauji slaptažodžiai nesutampa.");
      return;
    }

    axios.put(`http://localhost:5000/changePsw/${userData.id}`, {
      oldPassword,
      newPassword,
    })
      .then((res) => {
        setPasswordChangeMessage("Slaptažodis sėkmingai pakeistas.");
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      })
      .catch((err) => {
        const msg = err.response?.data?.msg || "Nepavyko pakeisti slaptažodžio.";
        setPasswordChangeMessage(msg);
      });
  };

  return (
    <div className="user-container">
      <div className="tab-buttons">
        <button className="tab-button" onClick={() => setActiveTab("profilis")}>Profilio duomenys</button>
        <button className="tab-button" onClick={() => setActiveTab("prenumeratos")}>Prenumeratos</button>
        <button className="tab-button" onClick={() => setActiveTab("rezervacija")}>Rezervacija</button>
      </div>

      {/* Paskyros duomenų skyrius */}
      {activeTab === "profilis" && (
        <>
          <div className="profile-section">
            <div className="profile-image-container" onClick={() => document.getElementById("fileInput").click()}>
              {profileImage || newProfileImage ? (
                <img src={newProfileImage || profileImage} alt="Profilio nuotrauka" className="profile-image" />
              ) : (
                <div className="profile-placeholder">Nuotraukos nėra</div>
              )}
            </div>
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {["firstName", "lastName", "username", "email"].map((field) => (
            <div className="user-info-container" key={field}>
              <div className="user-info-wrapper">
                <p className="user-info">
                  {field === "username" ? "Slapyvardis" :
                    field === "firstName" ? "Vardas" :
                      field === "lastName" ? "Pavardė" : "El. paštas"}: {userData[field] || "Nenurodyta"}
                </p>
                <button className="edit-button" onClick={() => setEditingField(field)}>Redaguoti</button>
              </div>
              {editingField === field && (
                <>
                  <input type="text" name={field} value={userData[field]} onChange={handleChange} />
                  <div>
                  <button className="confirm-button" onClick={() => handleSubmit(field)}>Patvirtinti</button>
                  <button className="logout-button-user" onClick={() => setEditingField(null)}>Atšaukti</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="user-info-container">
  {!showPasswordChange ? (
    <p 
      className="password-change-toggle" 
      onClick={() => setShowPasswordChange(true)}
      style={{ cursor: "pointer", color: "blue", textDecoration: "underline", maxWidth: '300px' }}
    >
      Keisti slaptažodį
    </p>
  ) : (
    <div className="password-change-form">
      <input
        type="password"
        placeholder="Senas slaptažodis"
        className="password-profile"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Naujas slaptažodis"
        className="password-profile"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Pakartokite naują slaptažodį"
        className="password-profile"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
      />
      <button className="edit-button" onClick={handleChangePassword}>
        Keisti slaptažodį
      </button>
      <button 
        className="logout-button-user" 
        onClick={() => {
          setShowPasswordChange(false);
          setPasswordChangeMessage("");
          setOldPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
        }}
      >
        Atšaukti
      </button>
      {passwordChangeMessage && <p className="error-message">{passwordChangeMessage}</p>}
    </div>
  )}
</div>

        </>
      )}

      {/* Pranešimų prenumeratų skyrius */}
      {activeTab === "prenumeratos" && (
        <div>
          <h3>Prenumeruojamos skalbyklės:</h3>
          {subscriptions.length === 0 ? (
            <p>Nesate prenumeravęs pranešimų.</p>
          ) : (
            <ul>
              {subscriptions.map((m, i) => (
                <li key={i}>
                  Skalbyklė #{m.number}, adresas: {m.address}
                  <button className="cancel-button" onClick={() => handleCancelSubscription(m.machineID)}>
                    Atšaukti prenumeratą
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Skalbyklių rezervacijos skyrius */}
      {activeTab === "rezervacija" && (
        <div>
          <h3>Rezervuota skalbyklė:</h3>
          {reservation.length === 0 ? (
            <p>Nesate rezervavęs skalbimo mašinos.</p>
          ) : (
            <ul>
              {reservation.map((m, i) => (
                <li key={i}>
                  Skalbyklė #{m.machineNumber}, adresas: {m.userAddress}
                  <button className="cancel-button" onClick={() => handleCancelReservation(m.machineID)}>
                    Atšaukti rezervaciją
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button className="logout-button-user" onClick={handleLogout}>Atsijungti</button>
    </div>
  );
};

export default Vartotojas;