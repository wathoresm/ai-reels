import { OpenAI } from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { celebrity } = req.body;

  if (!celebrity) {
    return res.status(400).json({ error: 'Celebrity name is required' });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // gpt-3.5-turbo, gpt-4o-mini 
      messages: [
        {
          role: 'user',
          content: `Write a 20-second script about the career highlights of ${celebrity}. which motivates reader and don't add narrator text`,
        }
      ],
    });

    const script = chatCompletion.choices[0]?.message?.content || '';
    //const script = "From a young boy in Madeira, Cristiano Ronaldo chased his dreams with relentless drive. He dazzled at Sporting Lisbon, then took the world by storm at Manchester United, winning three Premier League titles and his first Ballon d'Or. In Spain, he became Real Madrid's all-time top scorer, claiming four Champions League titles and adding four more Ballon d'Ors to his collection. A record-breaking goal scorer for Portugal, he lifted the European Championship trophy in 2016. Now in his later years, Ronaldo continues to redefine greatness, proving that passion and hard work can shatter limits. Chase your dreams relentlessly!";
    res.status(200).json({ script });
  } catch (error: any) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
}
