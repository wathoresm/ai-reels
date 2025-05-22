"use client";

import React, { useState } from "react";

export default function ScriptGenerator() {
  const [celebrity, setCelebrity] = useState("");
  const [audio, setAudio] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [script, setScript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isScriptGenerated, setIsScriptGenerated] = useState(false);
  const [isAudioGenerated, setIsAudioGenerated] = useState(false);
  const [isImageDownloaded, setIsImageDownloaded] = useState(false);
  const [isVideoGenerated, setIsVideoGenerated] = useState(false);

  
  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setScript(null);
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    console.log(apiUrl);
    try {
      /* Script Generation Started */
      const res = await fetch(`${apiUrl}/api/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celebrity }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unknown error");
      }

      const data = await res.json();
      console.log(data);
      setScript(data.script);
      setIsScriptGenerated(true);
      /* Script Generation End */

      
      if(res.ok && data?.script){
        /* Audio Generation From Script Started */
        const resAudio = await fetch(`${apiUrl}/api/generate-audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script:data.script, celebrity:celebrity }),
        });

        if (!resAudio.ok) {
          const errAudio = await resAudio.json();
          throw new Error(errAudio.error || "Unknown error Audio Generation");
        }

        const dataAudio = await resAudio.json();
        console.log(dataAudio);
        setAudio(dataAudio.name);
        setIsAudioGenerated(true);
        /* Audio Generation From Script End */

        if(resAudio.ok && dataAudio?.name) {
          /* Images downlaod Script Started */
          const resImage = await fetch(`${apiUrl}/api/fetch-images?query=${encodeURIComponent(celebrity)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        if (!resImage.ok) {
          const errImage = await resImage.json();
          throw new Error(errImage.error || "Unknown error Image Download");
        }

        const dataImage = await resImage.json();
        console.log(dataImage);
        setImage(dataImage.files);
        setIsImageDownloaded(true);
          /* Images downlaod Script End */
        
          if(resImage.ok && dataImage?.files) {
            /* Video generation from audio + downloaded images Started */
            const resVideo = await fetch(`${apiUrl}/api/generate-video`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio:dataAudio.name, celebrity:celebrity, script:data.script }),
            });

            if (!resVideo.ok) {
              const errVideo = await resVideo.json();
              throw new Error(errVideo.error || "Unknown error Video Generation");
            }

            const dataVideo = await resVideo.json();
            console.log(dataVideo);
            setVideo(dataVideo.url);
            setIsVideoGenerated(true);

            /* Video generation from audio + downloaded images End */

          }
        }

        

      }
      

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Script Generator</h2>
      <input
        type="text"
        placeholder="Enter sports celebrity name"
        className="w-full border border-gray-300 rounded px-3 py-2"
        value={celebrity}
        onChange={(e) => setCelebrity(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={loading || !celebrity.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Generate Script"}
      </button>

      {error && <p className="text-red-600">Error: {error}</p>}
      <p>
        {isScriptGenerated ? "Script generated" : "Script generating..."}
      </p>
      <p>
        {isScriptGenerated && (
          isAudioGenerated ?  "Audio generated" : "Audio generating..."
        )}
        {audio && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          <h3 className="font-bold mb-2">Generated audio:</h3>
          <p>{audio}</p>
        </div>  
        )}
      </p>
      <p>
        {isAudioGenerated && (
          isImageDownloaded ?  "Images downloaded" : "Images downloading..."
        )}
        {image && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          <h3 className="font-bold mb-2">Downloaded Images:</h3>
          <p>{JSON.stringify({ image })}</p>
        </div>  
        )}
      </p>
      <p>
        {isImageDownloaded && (
          isVideoGenerated ?  "Video generated" : "Video generating..."
        )}
        {video && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          <h3 className="font-bold mb-2">Generated Video:</h3>
          <p>{video}</p>
        </div>  
        )}
      </p>

      {script && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          <h3 className="font-bold mb-2">Generated Script:</h3>
          <p>{script}</p>
        </div>
      )}
    </div>
  );
}
