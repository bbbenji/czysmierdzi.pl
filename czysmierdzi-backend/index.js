const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Connection Events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to the database.");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from the database.");
});

// Gracefully handle application termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Mongoose connection closed due to application termination.");
  process.exit(0);
});

// Define Submission Schema
const submissionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["yes", "no", "uncertain"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Submission = mongoose.model("Submission", submissionSchema);

// Routes

// Get latest status
app.get("/api/latest", async (req, res) => {
  try {
    const latest = await Submission.findOne().sort({ timestamp: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get history
app.get("/api/history", async (req, res) => {
  try {
    const history = await Submission.find().sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a new status
app.post("/api/submit", async (req, res) => {
  const { status } = req.body;
  if (!["yes", "no"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const newSubmission = new Submission({ status });
    await newSubmission.save();
    res.status(201).json(newSubmission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
