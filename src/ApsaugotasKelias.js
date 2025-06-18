import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from 'axios';

const ApsaugotasKelias = ({ allowedRoles }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const username = sessionStorage.getItem('username');

    console.log("USERNAME - " + username);

    // Kreipiamasi į serverio pusės programą, jog būtų gaunami vartotojo duomenys
    useEffect(() => {
        if (username) {
            axios.get(`http://localhost:5000/user/${username}`)
                .then((response) => {
                    console.log("Gauti vartotojo duomenys:", response.data);
                    setUserData(response.data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Klaida gaunant vartotojo duomenis:", error);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [username]);

    // Tikriname, ar duomenys užkrauti
    if (loading) {
        return <div>Loading...</div>;
    }
    console.log("USER DATA - " + userData);

    // Jeigu vartotojas nėra prisijungęs prie paskyros, nukreipiama į neprisijungusio naudotojo puslapį
    if (!userData) {
        console.log("Neprisijungęs vartotojas! Peradresuojame į /");
        return <Navigate to="/" replace />;
    }

    // Jei vartotojo rolė nėra iš leidžiamų sąrašo, nukreipiama į pasisveikinimo puslapį
    if (!allowedRoles.includes(userData.accType)) {
        console.log(`Vartotojo rolė (${userData.accType}) nėra tarp leidžiamų:`, allowedRoles);
        return <Navigate to="/pasisveikinimas" replace />;
    }

    // Jei vartotojas yra prisijungęs ir turi leidžiamą rolę, puslapiai rodomi
    console.log("Vartotojas turi teisę pasiekti puslapį!");
    return <Outlet />;
};

export default ApsaugotasKelias;
