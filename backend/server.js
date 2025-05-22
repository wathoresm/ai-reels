const express = require("express");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FFmpeg backend is live!");
});

// Sample video generation endpoint (adjust based on your actual logic)
app.post("/api/generate-video", async (req, res) => {
  const inputAudio = path.join(__dirname, "input.mp3");
  const outputVideo = path.join(__dirname, "output.mp4");
  const image = path.join(__dirname, "image.jpg");

  ffmpeg()
    .input(image)
    .loop(5)
    .input(inputAudio)
    .outputOptions("-shortest")
    .save(outputVideo)
    .on("end", () => {
      res.json({ message: "Video generated", url: "/output.mp4" });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "FFmpeg failed" });
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
