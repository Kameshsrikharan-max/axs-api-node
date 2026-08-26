require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db/connection");
const routes = require("./route");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

connectDB();

app.use("/", routes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AXS auth API running on http://localhost:${PORT}`));
