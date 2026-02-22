const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from "public" folder
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
