const express = require("express");
const dotenv = require("dotenv");
const connectDB = require('./config/db')
const userRoutes = require("./routes/userRoutes");


dotenv.config();

connectDB();

const app = express();
app.use(express.json());

app.use("/users", userRoutes);
app.use('/tasks', require('./routes/taskRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
