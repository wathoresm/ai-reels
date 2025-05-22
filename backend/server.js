import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pollyRoute from './routes/polly.js';
import openAiRoute from './routes/openai.js';
import unsplashRoute from './routes/unsplash.js'; 
import videoGenerateRoute from './routes/video.js'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// Mount Api route
app.use("/api", openAiRoute); // now your route is at /api/generate-script
app.use('/api', pollyRoute); // now your route is at /api/generate-audio
app.use('/api', unsplashRoute); // now your route is at /api/fetch-images
app.use('/api', videoGenerateRoute); // now your route is at /api/generate-video

app.get("/", (req, res) => {
  res.send("Backend is live!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
