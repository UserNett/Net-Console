const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔧 Variabili ambiente
const PORT = process.env.PORT || 3000;
const MONGO_URI = "mongodb+srv://AdminNC:NetConsole2025!@netconsolecluster.ht6hwey.mongodb.net/netconsole";

// 📦 Connessione al database MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connesso a MongoDB"))
  .catch((err) => console.error("❌ Errore di connessione a MongoDB:", err));

// 🧩 Schema e modello utente
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance:  { type: Number, default: 0 }, // credito per skin o acquisti futuri
});

const User = mongoose.model("User", userSchema);

// 🔹 API: Registrazione utente
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "Tutti i campi sono obbligatori." });

    // Controllo se esiste già username o email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res.status(400).json({ message: "Username o email già esistenti." });

    // Cripta la password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva nuovo utente
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "✅ Registrazione completata con successo!" });
  } catch (error) {
    console.error("Errore registrazione:", error);
    res.status(500).json({ message: "Errore del server." });
  }
});

// 🔹 API: Login utente
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email e password sono obbligatorie." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "❌ Utente non trovato." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "❌ Password errata." });

    res.json({ 
      message: `👋 Benvenuto, ${user.username}!`,
      username: user.username,
      balance: user.balance 
    });
  } catch (error) {
    console.error("Errore login:", error);
    res.status(500).json({ message: "Errore del server." });
  }
});

// 🔹 API: Lista utenti (per amministratore)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // esclude la password
    res.json(users);
  } catch (error) {
    console.error("Errore recupero utenti:", error);
    res.status(500).json({ message: "Errore del server." });
  }
});

// 🔹 API: Aggiungere fondi a un utente (admin o demo)
app.post("/add-funds", async (req, res) => {
  try {
    const { username, amount } = req.body;
    const user = await User.findOne({ username });

    if (!user)
      return res.status(400).json({ message: "Utente non trovato." });

    user.balance += amount;
    await user.save();

    res.json({ message: `💰 Aggiunti ${amount} crediti a ${username}.`, balance: user.balance });
  } catch (error) {
    console.error("Errore aggiunta fondi:", error);
    res.status(500).json({ message: "Errore del server." });
  }
});

// 🚀 Avvio server
app.listen(PORT, () => {
  console.log(`🚀 Server NetConsole attivo su porta ${PORT}`);
});
