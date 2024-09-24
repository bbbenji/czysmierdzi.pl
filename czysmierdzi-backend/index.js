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
    type: Number,
    min: 0,
    max: 10,
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

  // Validate that status is a number between 0 and 10
  if (typeof status !== "number" || status < 0 || status > 10) {
    return res
      .status(400)
      .json({ error: "Invalid status. Must be a number between 0 and 10." });
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

// Get Average Status in 15-Minute Windows with Last Known Value for Missing Windows
app.get("/api/average", async (req, res) => {
  try {
    // Step 1: Determine the range of timestamps
    const aggResult = await Submission.aggregate([
      {
        $group: {
          _id: null,
          minTimestamp: { $min: "$timestamp" },
          maxTimestamp: { $max: "$timestamp" },
        },
      },
    ]);

    if (!aggResult || aggResult.length === 0) {
      return res.json([]); // No data available
    }

    const { minTimestamp, maxTimestamp } = aggResult[0];

    // Debugging Logs
    console.log("Minimum Timestamp:", minTimestamp);
    console.log("Maximum Timestamp:", maxTimestamp);

    // Step 2: Generate all 15-minute windows within the range
    const generateTimeBuckets = (start, end, intervalInMinutes) => {
      const buckets = [];
      const current = new Date(start);
      current.setUTCSeconds(0, 0); // Align to the start of the minute

      // Ensure the start time is aligned to the 15-minute interval
      const minutes = current.getUTCMinutes();
      const remainder = minutes % intervalInMinutes;
      if (remainder !== 0) {
        current.setUTCMinutes(minutes - remainder + intervalInMinutes);
      }

      while (current <= end) {
        buckets.push(new Date(current));
        current.setUTCMinutes(current.getUTCMinutes() + intervalInMinutes);
      }
      return buckets;
    };

    const allWindows = generateTimeBuckets(minTimestamp, maxTimestamp, 15);

    // Debugging Logs
    console.log("Generated Time Windows:", allWindows.length);

    // Step 3: Aggregate actual average data
    const averages = await Submission.aggregate([
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: "minute",
              binSize: 15,
              timezone: "UTC", // Adjust timezone if necessary
            },
          },
          averageStatus: { $avg: "$status" },
        },
      },
      {
        $project: {
          _id: 0,
          windowStart: "$_id",
          averageStatus: { $round: ["$averageStatus", 2] }, // Round to 2 decimal places
        },
      },
      { $sort: { windowStart: 1 } },
    ]);

    // Debugging Logs
    console.log("Aggregated Averages:", averages.length);

    // Step 4: Create a map for quick lookup
    const averagesMap = new Map();
    averages.forEach((item) => {
      averagesMap.set(item.windowStart.getTime(), item.averageStatus);
    });

    // Step 5: Fill missing windows with the last known average
    const filledAverages = [];
    let lastKnownAverage = null;

    allWindows.forEach((windowStart) => {
      const timestamp = windowStart.getTime();
      if (averagesMap.has(timestamp)) {
        lastKnownAverage = averagesMap.get(timestamp);
        filledAverages.push({
          windowStart: windowStart.toISOString(),
          averageStatus: lastKnownAverage,
        });
      } else if (lastKnownAverage !== null) {
        filledAverages.push({
          windowStart: windowStart.toISOString(),
          averageStatus: lastKnownAverage,
        });
      } else {
        // If there's no previous average, set it to null or a default value
        filledAverages.push({
          windowStart: windowStart.toISOString(),
          averageStatus: null, // or some default value like 0
        });
      }
    });

    // Debugging Logs
    console.log("Filled Averages:", filledAverages.length);

    res.json(filledAverages);
  } catch (err) {
    console.error("Error fetching average data:", err);
    res.status(500).json({ error: err.message });
  }
});

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
