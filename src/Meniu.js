import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import axios from "axios";
import "./App.css";

const menuItems = [
  { title: "Profilis", path: "/vartotojas", roles: ["user", "admin"] },
  { title: "Pradinis puslapis", path: "/pasisveikinimas", roles: ["user", "admin"] },
  { title: "Skalbyklių būsenos", path: "/skalbykles", roles: ["user", "admin"] },
  { title: "Skalbyklių pridėjimas", path: "/skalbykliuPridejimas", roles: ["admin"] },
  { title: "Skalbyklių adresai", path: "/adresai", roles: ["user", "admin"] },
  { title: "Įrenginių pridėjimas", path: "/irenginioPridejimas", roles: ["admin"] },
];

const Meniu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const username = sessionStorage.getItem("username");
  const location = useLocation();

  // Kreipiamasi į serverio pusės programą, jog būtų gaunami vartotojo duomenys
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
        });
    }
  }, [username]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (path) => {
    if (location.pathname === path) {
      window.location.reload();  // Puslapio perkrovimas
    }
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="navbar">
      <button className="menu-button" onClick={toggleMenu}>
        <FiMenu />
      </button>
      {isOpen && (
        <ul className="nav-links">
          {menuItems
            .filter((item) => item.roles.includes(user.accType)) // Priklausomai nuo rolės (paprastas vartotojas ar administratorius) rodoma skirtingi meniu
            .map((item, index) => (
              <li key={index} onClick={toggleMenu}>
                <Link to={item.path} onClick={() => handleLinkClick(item.path)}>
                  {item.title}
                </Link>
              </li>
            ))}
        </ul>
      )}
    </nav>
  );
};

export default Meniu;
