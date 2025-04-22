// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const indexRoute = require("./route/indexRoute");

// Initialize Passport configuration
require("./config/passport");

const app = express();

// Middleware to parse URL-encoded data (from forms)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data (if you need it)
app.use(express.json());

// Set EJS as the view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); 

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Express Session middleware
// Express Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
    }
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());


// route middleware
app.use("/", indexRoute);

// Start the server
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
