# 🎬 AI Reels Generation App

This project is a full-stack AI-powered application that generates short reels about sports celebrities. It uses OpenAI for script generation, Amazon Polly for audio synthesis, Unsplash for fetching images, and FFmpeg for final video creation.

---

## 🧠 Technical Breakdown

### Frontend (Next.js)
- Displays generated video reels fetched from AWS S3.
- Fetches reels via: [`/api/s3`](https://ai-reels-sandy.vercel.app/api/s3)
- Deployed on Vercel: [https://ai-reels-sandy.vercel.app](https://ai-reels-sandy.vercel.app)

### Backend (Node.js)
Deployed on Render: [https://ai-reels-generation.onrender.com](https://ai-reels-generation.onrender.com)

#### API Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/generate-script` | Generates a script using OpenAI based on a celebrity name. |
| `/api/generate-audio` | Converts the generated script to speech using Amazon Polly. |
| `/api/fetch-images` | Fetches relevant images from Unsplash using the celebrity name. |
| `/api/generate-video` | Uses FFmpeg to combine the audio and images into a video. |

---

## 🚀 Demo Pipeline (Try It Live)

To experience the full AI reel generation pipeline:

🔗 [AI Script Generator Component](https://ai-reels-sandy.vercel.app/ai-script-generator)

Steps:
1. Enter a sports celebrity name.
2. Generates a script with OpenAI.
3. Converts the script to audio using Amazon Polly.
4. Downloads related images from Unsplash.
5. Generates a video using FFmpeg.
6. Uploads the video to AWS S3.
7. Reels are displayed on the homepage.

---

## 🌐 Deployment Links

| Component | Tech Stack | URL |
|----------|------------|-----|
| **Frontend** | Next.js (Vercel) | [https://ai-reels-sandy.vercel.app](https://ai-reels-sandy.vercel.app) |
| **Backend** | Node.js (Render) | [https://ai-reels-generation.onrender.com](https://ai-reels-generation.onrender.com) |

---

## 📂 Folder Structure

```
/frontend      # Next.js frontend app
/backend       # Node.js backend API services
```

---

## 🛠️ Technologies Used

- OpenAI GPT
- Amazon Polly
- Unsplash API
- FFmpeg
- AWS S3
- Next.js
- Node.js
- Render
- Vercel

---

## ✍️ Author

Developed by [Sandeep Wathore]
