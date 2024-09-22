// index.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http"); // Import HTTP module
const { Server } = require("socket.io"); // Import Socket.IO

dotenv.config();

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
// Get history within a date range
app.get("/api/history", async (req, res) => {
  const { startDate, endDate } = req.query;

  // Validate dates
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && isNaN(start.getTime())) {
    return res.status(400).json({ error: "Invalid startDate" });
  }

  if (end && isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid endDate" });
  }

  try {
    const filter = {};
    if (start || end) {
      filter.timestamp = {};
      if (start) filter.timestamp.$gte = start;
      if (end) filter.timestamp.$lte = end;
    }

    const history = await Submission.find(filter).sort({ timestamp: 1 });
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

    // Emit the new submission to all connected clients
    io.emit("newSubmission", newSubmission);

    res.status(201).json(newSubmission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get averages of 'yes' submissions within a date range
app.get("/api/average", async (req, res) => {
  const { startDate, endDate } = req.query;

  // Validate dates
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && isNaN(start.getTime())) {
    return res.status(400).json({ error: "Invalid startDate" });
  }

  if (end && isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid endDate" });
  }

  try {
    // Build the filter based on provided dates
    const filter = {};
    if (start || end) {
      filter.timestamp = {};
      if (start) filter.timestamp.$gte = start;
      if (end) filter.timestamp.$lte = end;
    }

    // Perform the aggregation to calculate averages
    const history = await Submission.aggregate([
      {
        $match: filter,
      },
      {
        // Group submissions into 15-minute blocks
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$timestamp" },
                { $mod: [{ $toLong: "$timestamp" }, 1000 * 60 * 15] }, // 15-minute intervals
              ],
            },
          },
          totalSubmissions: { $sum: 1 },
          yesCount: { $sum: { $cond: [{ $eq: ["$status", "yes"] }, 1, 0] } },
          noCount: { $sum: { $cond: [{ $eq: ["$status", "no"] }, 1, 0] } },
        },
      },
      {
        // Project the result to include the percentage of "yes" responses
        $project: {
          _id: 0,
          timeBlock: "$_id",
          yesPercentage: {
            $multiply: [{ $divide: ["$yesCount", "$totalSubmissions"] }, 100],
          },
          totalSubmissions: 1,
          yesCount: 1,
          noCount: 1,
        },
      },
      {
        // Sort by the time block
        $sort: { timeBlock: 1 },
      },
    ]);

    // If no data is found within the date range, fetch boundary data points
    if (history.length === 0 && (start || end)) {
      const boundaryData = [];

      // Fetch the last submission before the startDate
      if (start) {
        const lastBefore = await Submission.findOne({
          timestamp: { $lt: start },
        })
          .sort({ timestamp: -1 })
          .exec();

        if (lastBefore) {
          boundaryData.push(formatSubmissionToAverage(lastBefore));
        }
      }

      // Fetch the first submission after the endDate
      if (end) {
        const firstAfter = await Submission.findOne({ timestamp: { $gt: end } })
          .sort({ timestamp: 1 })
          .exec();

        if (firstAfter) {
          boundaryData.push(formatSubmissionToAverage(firstAfter));
        }
      }

      // Return the boundary data if available
      if (boundaryData.length > 0) {
        return res.json(boundaryData);
      }
    }

    // If data exists within the date range, return the aggregation result
    res.json(history);
  } catch (err) {
    console.error("Error in /api/average:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to format a single submission to match the aggregation output
function formatSubmissionToAverage(submission) {
  const timeBlock = alignTo15Minutes(submission.timestamp);

  return {
    timeBlock: timeBlock,
    yesPercentage: submission.status === "yes" ? 100 : 0,
    totalSubmissions: 1,
    yesCount: submission.status === "yes" ? 1 : 0,
    noCount: submission.status === "no" ? 1 : 0,
  };
}

// Helper function to align a timestamp to the nearest 15-minute block
function alignTo15Minutes(timestamp) {
  const date = new Date(timestamp);
  const minutes = date.getMinutes();
  const alignedMinutes = Math.floor(minutes / 15) * 15;
  date.setMinutes(alignedMinutes, 0, 0);
  return date;
}

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Update this to your frontend's URL in production
    methods: ["GET", "POST"],
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server using the HTTP server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
