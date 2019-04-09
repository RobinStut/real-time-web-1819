const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const findCacheDir = require("find-cache-dir");
const app = express();
const path = require("path");
const https = require("https");

findCacheDir({ name: "RTW" });

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
// express.use
app.use(express.static(path.join(__dirname, "./static")));
app.use(compression());
app.use((req, res, next) => {
  // todo: set cache header to 1 year
  res.setHeader("Cache-Control", "max-age=" + 365 * 24 * 60 * 60);
  next();
});

//express.set(view engine = ejs)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.render("pages/index"));

app.listen(process.env.PORT || 3000);
