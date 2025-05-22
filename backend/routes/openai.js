import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in Render.com or .env locally
// });

router.post("/generate-script", async (req, res) => {
  const { celebrity } = req.body;

  if (!celebrity) {
    return res.status(400).json({ error: "Celebrity name is required" });
  }

  try {
    // const chatCompletion = await openai.chat.completions.create({
    //   model: "gpt-4o-mini",
    //   messages: [
    //     {
    //       role: "user",
    //       content: `Write a 20-second script about the career highlights of ${celebrity}. which motivates reader and don't add narrator text`,
    //     },
    //   ],
    // });

    // const script = chatCompletion.choices[0]?.message?.content || "";
    const script = "Pele, the King of Football, captured hearts worldwide with his dazzling skills. At just 17, he became the youngest ever World Cup champion in 1958. With three World Cup titles in total—58, 62, and 70—his legacy is unparalleled. Scoring over 1,280 goals throughout his career, he redefined the game, inspiring generations. Beyond the pitch, he championed social causes, using his fame to promote peace and unity. Pele’s relentless passion reminds us that with dedication, greatness knows no bounds. ";
    res.status(200).json({ script });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

export default router;
