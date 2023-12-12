const config = require("../config");
const path = require("path");
require("dotenv").config({ path: path.join(config.DIR, ".env") });

const mongoose = require("mongoose");
const { runBot } = require("./controller/botController");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const compression = require("compression");

const routes = require("./routes");

const app = express();
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));
app.use(cors("*"));

app.set("views", path.join(__dirname, "../build")); // this is the folder where you keep html for rendering

// static folder
app.use(express.static(path.join(__dirname, "../build")));

app.use("/api", routes);
app.get("*", (req, res) => res.sendFile(`${config.DIR}/build/index.html`));

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database is connected");
    const port = process.env.PORT || 2002;
    const http = require("http").createServer(app);
    http.listen(port);
    runBot();
    console.log("Server listening on:", port);
  });
