// express.js įskiepis
const express = require("express");
// cors įskiepis serverio pusės ir svetainės programų pasiekiamumui
const cors = require("cors");
// mysql2 įskiepis prisijungimui prie MySQL duomenų bazių valdymo sistemos
const mysql = require("mysql2");
// path įskiepis skirtas dirbti su failų, katalogų keliais
const path = require("path");
// multer įskiepis skirtas failų įkėlimui į serverį
const multer = require("multer");
// bcryptjs įskiepis skirtas slaptažodžių kodavimui ir tikrinimui
const bcrypt = require("bcryptjs");
// nodemailer įskiepis skirtas el. laiškų siuntimui iš serverio pusės
const nodemailer = require("nodemailer");
// timers įskiepis skirtas kodo vykdymui periodiškai
const { setInterval } = require('timers');
const SibApiV3Sdk = require("sib-api-v3-sdk");
const apiKey = 'smuss';

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = ''; // naudojamas api raktas gautas iš Brevo svetainės
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
require("dotenv").config();

const app = express();

// el. laiškų siuntimo metodas
const sendEmail = (toEmail, machineAddress, machineNumber, subscriberId) => {
        console.log(`Siunčiamas el. laiškas: ${toEmail}, ${machineAddress}, ${machineNumber}, {subscriberId}`);
        const mailOptions = {
                to: [{ email: toEmail }],
                sender: { name: 'SMUSS', email: 'skalbimomuss@gmail.com' },
                subject: 'Skalbyklės būsenos pasikeitimas',
                textContent: `Skalbyklė Nr. ${machineNumber}, esanti adresu ${machineAddress}, jau atsilaisvino.`,
        };
        console.log("Praėjo mailOptions.")
        apiInstance.sendTransacEmail(mailOptions).then((data) => {
                console.log("Laiškas išsiųstas:", data.messageId || data);

                dbPromise.query("DELETE FROM subscribers WHERE id = ?", [subscriberId], (err, result) => {
                        if (err) {
                                console.error("Klaida pašalinant prenumeratorių: ", err);
                        } else {
                                console.log("Prenumeratorius pašalintas.");
                        }
                });
        }).catch((error) => {
                console.error("Nepavyko išsiųsti laiško: ", error);
        });
};

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createConnection({
        host: "", // IP adresas
        user: "", // prisijungimai
        password: "", // prisijungimai
        database: "Sensoriai",
});

const storage = multer.diskStorage({
        destination: (req, file, cb) => {
                cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
                cb(null, `${req.params.id}_${Date.now()}${path.extname(file.originalname)}`);
        },
});

const upload = multer({ storage: storage});

// nuotraukos įkėlimo į profilį metodas, kur nuotraukos yra saugojamos "uploads" kataloge
app.post('/uploadProfileImage/:id', upload.single('profileImage'), (req, res) => {
        if (!req.file) {
                return res.status(400).send({ msg: "Nuotrauka nebuvo įkelta." });
        }

        try {
                const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
                res.json({ imageUrl });
        } catch (err) {
                console.error("Klaida įkeliant nuotrauką:", err);
                return res.status(500).json({ msg: "Klaida įkeliant nuotrauką." });
        }
});

const dbPromise = mysql.createPool({
        host: "", // IP adresas
        user: "", // prisijungimai
        password: "", // prisijungimai
        database: "Sensoriai",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
}).promise();

dbPromise.getConnection()
        .then(() => {
                console.log("Sėkmingai prisijungta prie DB.");
        })
        .catch((err) => {
                console.error("Klaida jungiantis prie DB.");
        });

// skalbyklių darbo imitavimo metodas, kur skalbyklių būsenos keičiasi kas 1min, išskyrus tą skalbimo mašiną, kurios ID lygs 1
async function imitateWork() {
        const query = `UPDATE washing SET status = CASE WHEN RAND() < 0.5 THEN 'Laisva' ELSE 'Užimta' END WHERE id != 1 AND id IN ( SELECT DISTINCT washingID FROM devices WHERE washingID IS NOT NULL )`;

        try {
                const [results] = await dbPromise.query(query);
        } catch (err) {
                console.log("Klaida naujinant būsenas: ", err);
        }
}

// imitateWork metodas nustatomas, jog būtų vykdomas kas 1min
setInterval(imitateWork, 60000);

// metodas, kuriame trikrinama, ar yra laisvų skalbimo mašinų. Jei yra, tikrinama, ar yra prenumeratų šioms skalbyklėms, jei yra - kreipiamasi į metodą, jog būtų siunčiami el. laiškai
const checkMachineStatus = async () => {
        console.log("Atėjo į checkMachineStatus");
        try {
                const [machines] = await dbPromise.query("SELECT * FROM washing WHERE status = ?", ['Laisva']);
                if (machines.length === 0) {
                        console.log("Laisvų skalbimo mašinų nerasta.");
                }
                console.log("Rasta skalbimo mašinų:" + machines.length);

                for (let machine of machines) {
                        const [subscribers] = await dbPromise.query("SELECT id, email, address, number FROM subscribers WHERE machineID = ?", [machine.id]);
                        if(subscribers.length === 0) {
                                console.log(`Nėra prenumeratorių šiam id - ${machine.id}`);
                                continue;
                        }

                        console.log(`Rasta ${subscribers.length} prenumeratorių šiam id - ${machine.id}`);
                        console.log("SUB: " + JSON.stringify(subscribers));
                        for (let sub of subscribers) {
                                console.log(`Kviečiama sendEmail - ${sub.email}`);
                                await sendEmail(sub.email, sub.address, sub.number, sub.id);
                        }
                }
        } catch (err) {
                console.error("Klaida tikrinant skalbimo mašinas:", err);
        }
};

// checkMachineStatus metodas nustatomas, jog būtų vykdomas kas 10sec
setInterval(() => {
        console.log("Tikrinamos skalbimo mašinos...");
        checkMachineStatus();
}, 10000);

// metodas, kuris gauna duomenis iš mikrovaldiklio programos, kai jutikliai nustato pasikeitusią skalbyklės būseną
app.post('/api', async (req, res) => {
        const {deviceId, status } = req.body;

        const [washingID] = await dbPromise.query("SELECT washingID FROM devices WHERE id = ?", [deviceId]);
        if (washingID.length == 0) {
                console.log("Nerasta skalbimo mašina pagal įrenginio ID.");
                return res.status(400).json({ msg: "Nėra tokios skalbyklės pagal įrenginio ID." });
        }

        const neededID = washingID[0].washingID;

        const query = "UPDATE washing SET status = ? WHERE id = ?";
        db.query(query, [status, neededID], (err, result) => {
                if (err) {
                        return res.status(500).json({ msg: "Klaida atnaujinant skalbyklės būseną." });
                }
                        res.status(200).json({ msg: "Skalbyklės būsena atnaujinta sėkmingai." });
        });
});

// registracijos metodas, kuriame sukuriamas naujas įrašas duomenų bazėje, jeigu duomenys įvesti teisingai, slaptažodis užkoduojamas
app.post("/register", async (req, res) => {
        const { firstName, lastName, username, email, password } = req.body;

        if (!firstName || !lastName || !username || !email || !password) {
                return res.status(400).json({ error: "Užpildykite visus laukus!" });
        }

        try {
                const [existUsername] = await dbPromise.query("SELECT * FROM users WHERE BINARY username = ?", [username]);
                const [existEmail] = await dbPromise.query("SELECT * FROM users WHERE BINARY email = ?", [email]);

                if (existUsername.length > 0 && existEmail.length > 0) {
                        return res.status(400).json({ msg: "Slapyvardis ir el. paštas jau egzistuoja." });
                } else if (existUsername.length > 0) {
                        return res.status(400).json({ msg: "Slapyvardis jau egzistuoja." });
                } else if (existEmail.length > 0) {
                        return res.status(400).json({ msg: "El. paštas jau egzsituoja." });
                }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const type = "user";

        const query = 'INSERT INTO users (firstName, lastName, username, email, password, accType) VALUES (?, ?, ?, ?, ?, ?)';
        await dbPromise.query(query, [firstName, lastName, username, email, hashPassword, type]);

        return res.status(200).json({ msg: "Registracija sėkminga." });

        } catch (error) {
                console.log(error);
                return res.status(500).json({ msg: "Klaida su DB." });
        }
});

// prisijungimo metodas, kurio metu yra tikrinami duomenų bazėje gauti duomenys iš svetainės
app.post("/login", (req, res) => {
        const { username, password } = req.body;
        const sql = "SELECT * FROM users WHERE BINARY username = ?";
        db.query(sql, [username], async (err, results) => {
                if (err) {
                        console.error("Prisijungimo klaida:", err);
                        return res.status(500).json({ msg: "Serverio klaida." });
                }
                if (results.length === 0) {
                        return res.status(401).json({ msg: "Neteisingas slapyvardis arba slaptažodis." });
                }

                const user = results[0];
                const matchPassword = await bcrypt.compare(password, user.password);
                if (!matchPassword) {
                        return res.status(401).json({ msg: "Neteisingas slapyvardis arba slaptažodis." });
                }

                res.json({ msg: "Prisijungimas sėkmingas.", user: { username: user.username} });
        });
});

// vartotojo duomenų gavimas pagal jo slapyvardį
app.get("/user/:username", (req, res) => {
        const { username } = req.params;
        const query = "SELECT id, firstName, lastName, username, email, accType FROM users WHERE BINARY username = ?";
        db.query(query, [username], (err, result) => {
                if (err) {
                        return res.status(500).json({ msg: "Klaida gaunant duomenis." });
                }
                if (result.length === 0) {
                        return res.status(404).json({ msg: "Vartotojas nerastas." });
                }
                res.json(result[0]);
        });
});

// profilio duomenų redagavimo metodas
app.put("/user/:id", (req, res) => {
        const { id } = req.params;
        const { firstName, lastName, username, email } = req.body;

        if (username) {
                const usernameQuery = "SELECT id FROM users WHERE BINARY username = ? AND id != ?";
                db.query(usernameQuery, [username, id], (err, result) => {
                        if (err) {
                                return res.status(500).json({ msg: "Klaida tikrinant vartotojo slapyvardį."});
                        }
                        if (result.length > 0) {
                                return res.status(400).json({ msg: "Šis slapyvardis jau yra užimtas."});
                        }
                        const query = "UPDATE users SET username = ? WHERE id = ?";
                        db.query(query, [username, id], (err, result) => {
                                if (err) {
                                        return res.status(500).json({ msg: "Klaida atnaujinant slapyvardį." });
                                }
                                res.status(200).json({ msg: "Slapyvardis atnaujintas sėkmingai." });
                        });
                });
        }

        if (email) {
                const emailQuery = "SELECT id FROM users WHERE BINARY email = ? AND id != ?";
                db.query(emailQuery, [email, id], (err, result) => {
                        if (err) {
                                return res.status(500).json({ msg: "Klaida tikrinant vartotojo el. paštą." });
                        }
                        if (result.length > 0) {
                                return res.status(400).json({ msg: "Šis el. paštas jau yra užimtas." });
                        }
                        const query = "UPDATE users SET email = ? WHERE id = ?";
                        db.query(query, [email, id], (err, result) => {
                                if (err) {
                                        return res.status(500).json({ msg: "Klaida atnaujinant el. paštą." });
                                }
                                res.status(200).json({ msg: "El. paštas atnaujintas sėkmingai" });
                        });
                });
        }

        if (firstName) {
                const query = "UPDATE users SET firstName = ? WHERE id = ?";
                db.query(query, [firstName, id], (err, result) => {
                        if (err) {
                                return res.status(500).json({ msg: "Klaida atnaujinant vardą." });
                        }
                        res.status(200).json({ msg: "Vardas atnaujintas sėkmingai." });
                });
        }

         if (lastName) {
                const query = "UPDATE users SET lastName = ? WHERE id = ?";
                db.query(query, [lastName, id], (err, result) => {
                        if (err) {
                                return res.status(500).json({ msg: "Klaida atnaujinant pavardę." });
                        }
                        res.status(200).json({ msg: "Pavardė atnaujinta sėkmingai." });
                });
        }

});

// skalbyklių pridėjimo metodas
app.post('/addWashing', async (req, res) => {
        const { address, quantity } = req.body;

        if(!address || quantity <= 0) {
                return res.status(400).json({ msg: "Įveskite adresą ir teisingą kiekį."});
        }

        const [existAddress] = await dbPromise.query("SELECT * FROM washing WHERE BINARY address = ?", [address]);

        if (existAddress.length > 0) {
                return res.status(400).json({ msg: "Adresas jau egzistuoja." });
        }

        const machines = [];
        for (let i = 0; i < quantity; i++) {
                const machineNumber = i + 1;
                machines.push([address, machineNumber, 'Nenurodyta', 'Nenurodyta', 'Nenurodyta']);
        }

        const query = 'INSERT INTO washing (address, number, status, notification, reservation) VALUES ?';

        db.query(query, [machines], (err) => {
                if (err) {
                        console.error('Klaida įrašant į duomenų bazę:', err);
                        return res.status(500).json({ msg: "Klaida įrašant į DB."});
                }
                res.status(200).json({ msg: "Skalbimo mašinos sėkmingai pridėtos."});
        });
});

// skalbimo mašinų gavimo metodas
app.get('/machines', async (req, res) => {
    try {
        const result = await dbPromise.query('SELECT * FROM washing');
        if (result && result[0] && result[0].length > 0) {
            res.json(result[0]);
        } else {
            console.log('Nerasta skalbimo mašinų.');
            return res.status(400).json({ msg: "Nerasta skalbimo mašinų." });
        }
    } catch (error) {
        console.error('Klaida gaunant duomenis:', error);
        return res.status(500).json({ msg: "Klaida serverio pusėje." });
    }
});

// įrenginio skalbimo mašinai priskyrimo metodas
app.post('/assign', async (req, res) => {
    try {
        const { address, washingID } = req.body;

        if (!address || !washingID) {
            return res.status(400).json({ msg: "Trūksta duomenų" });
        }

        const checkQuery = "SELECT * FROM devices WHERE address = ? AND washingID = ?";
        const [existDevice] = await dbPromise.query(checkQuery, [address, washingID]);

        if (existDevice.length > 0) {
            return res.status(400).json({ msg: "Įrenginys jau egzistuoja" });
        }

        const insertQuery = "INSERT INTO devices (address, washingID) VALUES (?, ?)";
        const [result] = await dbPromise.query(insertQuery, [address, washingID]);

        return res.status(200).json({ msg: "Naujas įrenginys sukurtas sėkmingai", deviceId: result.insertId });

    } catch (error) {
        console.error("Klaida kuriant įrenginį:", error);
        return res.status(500).json({ msg: "Serverio klaida" });
    }
});

// pranešimų prenumeravimo metodas, kuriame naudotojas pridedamas į prenumeratorių sąrašą
app.post("/subscribe", async (req, res) => {
        const { machineId, username } = req.body;

        try {
                const user = await dbPromise.query("SELECT email FROM users WHERE username = ?", [username]);
                console.log("User:", user);
                if (user.length === 0) {
                        return res.status(400).json({ success: false, message: "Vartotojas nerastas" });
                }

                const email = user[0][0].email;

                const machine = await dbPromise.query("SELECT address, number FROM washing WHERE id = ?", [machineId]);
                if (machine.length === 0) {
                        return res.status(400).json({ msg: "Skalbimo mašina nerasta." });
                }

                const address = machine[0][0].address;
                const number = machine[0][0].number;

                const existSub = await dbPromise.query("SELECT * FROM subscribers WHERE machineID = ? AND email = ?", [machineId, email]);

                if (existSub[0].length > 0) {
                        console.log("Prenumerata jau yra, nepridėta.");
                        return res.status(400).json({ msg: "Jau esate užsiprenumeravęs šios skalbyklės pranešimus."});
                }

                await dbPromise.query("INSERT INTO subscribers (machineID, email, address, number) VALUES (?, ?, ?, ?)", [machineId, email, address, number]);

                console.log("Prenumerata sėkmingai pridėta.");
                return res.status(200).json({ msg: "Prenumerata sėkminga!" });
        } catch (error) {
                console.error("Prenumeratos klaida:", error);
                return res.status(500).json({ msg: "Serverio klaida." });
        }
});

// rezervacijos metodas, kuriame naudotojas pridedamas į rezervuojančių naudotojų sąrašą
app.post('/reserve', async (req, res) => {
        const { machineId, username } = req.body;

        try {

                const user = await dbPromise.query("SELECT email FROM users WHERE username = ?", [username]);
                console.log("User:", user);
                if (user.length === 0) {
                        return res.status(400).json({ success: false, message: "Vartotojas nerastas" });
                }

                const email = user[0][0].email;

                const machine = await dbPromise.query("SELECT address, number FROM washing WHERE id = ?", [machineId]);
                if (machine.length === 0) {
                        return res.status(400).json({ msg: "Skalbimo mašina nerasta." });
                }

                const address = machine[0][0].address;
                const number = machine[0][0].number;

                const existRes = await dbPromise.query("SELECT * FROM reserver WHERE userEmail = ?", [email]);

                if (existRes[0].length > 0) {
                        console.log("Vartotojas jau yra atlikęs rezervaciją.");
                        return res.status(400).json({ msg: "Jau esate rezervavęs skalbyklę, daugiau rezervuoti negalima."});
                }

                const existReservation = await dbPromise.query("SELECT * FROM reserver WHERE machineID = ?", [machineId]);
                if (existReservation[0].length > 0) {
                        console.log("Ši skalbyklė jau yra rezervuota.");
                        return res.status(400).json({ msg: "Ši skalbyklė jau yra rezervuota."});
                }

                await dbPromise.query("INSERT INTO reserver (machineID, userEmail, userAddress, machineNumber) VALUES (?, ?, ?, ?)", [machineId, email, address, number]);
                await dbPromise.query(`UPDATE washing SET reservation = 'Taip' WHERE id = ?`, [machineId]);

                await dbPromise.query("INSERT INTO subscribers (machineID, email, address, number) VALUES (?, ?, ?, ?)", [machineId, email, address, number]);

                console.log("Rezervacija sėkmingai atlikta.");
                return res.status(200).json({ msg: "Rezervacija sėkminga!" });

        } catch (error) {
                console.error("Rezervacijos klaida:", error);
                return res.status(500).json({ msg: "Serverio klaida." });
        }
});

// metodas, skirtas gauti prenumeratorius pagal el. paštą
app.get('/sub/:email', async (req, res) => {
        const email = req.params.email;

        try {
                const result = await dbPromise.query('SELECT machineID, address, number FROM subscribers WHERE email = ?', [email]);
                if (result && result[0] && result[0].length > 0) {
                res.json(result[0]);
                } else {
                console.log('Nerasta prenaumeratų.');
                return res.status(400).json({ msg: "Nerasta pranešimų prenumeratų." });
                }
        } catch (error) {
                console.error('Klaida gaunant duomenis:', error);
                return res.status(500).json({ msg: "Klaida serverio pusėje." });
        }
});

// metodas, skirtas gauti rezervuojančius naudotojus pagal el. paštą
app.get('/res/:email', async (req, res) => {
        const email = req.params.email;

         try {
                const result = await dbPromise.query('SELECT machineID, userAddress, machineNumber FROM reserver WHERE userEmail = ?', [email]);
                if (result && result[0] && result[0].length > 0) {
                res.json(result[0]);
                } else {
                console.log('Nerasta rezervacija.');
                return res.status(400).json({ msg: "Rezervacija nerasta." });
                }
        } catch (error) {
                console.error('Klaida gaunant duomenis:', error);
                return res.status(500).json({ msg: "Klaida serverio pusėje." });
        }
});

// prenumeratos atšaukimo metodas
app.post('/unsubscribe', async (req, res) => {
        const { machineId, email } = req.body;

        try {
                const result = await dbPromise.query("DELETE FROM subscribers WHERE machineID = ? AND email = ?", [machineId, email]);
                console.log(result[0].affectedRows);
                if (result[0].affectedRows > 0) {
                        console.log("Atejau i affected Rows");
                        return res.status(200).json({ msg: "Sėkmingai atšaukta prenumerata." });
                }
        } catch (error) {
                console.error("Klaida atšaukiant:", error);
                return res.status(500).json({ msg: "Klaida serverio pusėje." });
        }
});

// rezervacijos atšaukimo metodas
app.post('/cancelReservation', async (req, res) => {
        const { machineId, email } = req.body;

        try {
                const result = await dbPromise.query("DELETE FROM reserver WHERE machineID = ? AND userEmail = ?", [machineId, email]);
                console.log(result[0].affectedRows);
                if (result[0].affectedRows > 0) {
                        await dbPromise.query(`UPDATE washing SET reservation = 'Ne' WHERE id = ?`, [machineId]);
                        return res.status(200).json({ msg: "Sėkmingai atšaukta rezervacija." });
                }
        } catch (error) {
                console.error("Klaida atšaukiant:", error);
                return res.status(500).json({ msg: "Klaida serverio pusėje." });
        }
});

app.put("/changePsw/:id", async (req, res) => {
        const {id} = req.params;
        const {oldPassword, newPassword} = req.body;

        if (!oldPassword || !newPassword) {
                return res.status(400).json ({ msg: "Trūksta laukų." });
        }

        try {
                const [query] = await dbPromise.query("SELECT password FROM users WHERE id = ?", [id]);
                if (!query || query.length === 0) {
                        return res.status(500).json({ msg: "Nepavyko rasi vartotojo su duotu ID." });
                }

                const hashPassword = query[0].password;
                const isMatch = await bcrypt.compare(oldPassword, hashPassword);

                if(!isMatch) {
                        return res.status(401).json({ msg: "Neteisingas senas slaptažodis." });
                }

                const salt = await bcrypt.genSalt(10);
                const newHashedPassword = await bcrypt.hash(newPassword, salt);
                await dbPromise.query("UPDATE users SET password = ? WHERE id = ?", [newHashedPassword, id]);
                return res.status(200).json({ msg: "Slaptažodis atnaujintas sėkmingai." });

        } catch (err) {
                console.error("Slaptažodžio keitimo klaida:", err);
                return res.status(500).json({ msg: "Serverio klaida." });
        }
});

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => console.log('Serveris klauso ant 5000 porto.'));