const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/users", require("./routes/userRoutes"));
app.use("/tasks", require("./routes/taskRoutes"));

app.get("/", (req, res) => {
  res.send("Fast Minds Club API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Google Redirect URI: ${process.env.GOOGLE_REDIRECT_URI}`);
});
