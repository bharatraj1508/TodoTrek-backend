require("dotenv").config();
require("./src/models/users");
require("./src/models/hashTable");

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes/auth");

const app = express();

app.use(cors());

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// MongoDB connection URI
const mongoUri = process.env.MONGOURI;

// Connecting to MongoDB
mongoose.connect(mongoUri);

// Event handler for successful MongoDB connection
mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance");
});

// Event handler for MongoDB connection error
mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo", err);
});

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).send({ message: "TodoTrek is online" });
});

// Starting the server
app.listen(3000, () => {
  console.log("listening on port 3000");
});
