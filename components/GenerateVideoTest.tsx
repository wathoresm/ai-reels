// components/GenerateVideoTest.tsx

'use client';

import { useState } from 'react';

export default function GenerateVideoTest() {
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ celebrityName: 'Virat Kohli' }),
      });
      const data = await res.json();
      setVideoData(data.video);
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate AI Video'}
      </button>

      {videoData && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">{videoData.title}</h2>
          <p className="my-2">{videoData.script}</p>
          <audio controls src={videoData.audioUrl} className="my-2" />
          <video controls src={videoData.videoUrl} className="w-full max-w-md my-2" />
          <div className="flex gap-2">
            {videoData.images.map((img: string) => (
              <img key={img} src={img} alt="Frame" className="w-24 h-24 object-cover rounded" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
