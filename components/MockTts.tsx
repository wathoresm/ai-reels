"use client";

import React, { useState } from "react";

export default function MockTts() {
  const [tts, setTts] = useState("");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
     try {
      const res = await fetch("/api/mock-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unknown error");
      }

      const data = await res.json();
      setTts(data.audioUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Mock TTS</h2>
      <input
        type="text"
        placeholder="Enter sports celebrity script"
        className="w-full border border-gray-300 rounded px-3 py-2"
        value={script}
        onChange={(e) => setScript(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={loading || !script.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Generate TTS"}
      </button>

      {error && <p className="text-red-600">Error: {error}</p>}

      {tts && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          <h3 className="font-bold mb-2">Generated TTS:</h3>
          <p>{tts}</p>
        </div>
      )}
    </div>
  );
}
