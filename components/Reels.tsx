'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

interface VideoMeta {
  key: string;
  size: number;
  lastModified: string;
  presignedUrl: string;
}

const Reels = () => {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [playingStates, setPlayingStates] = useState<boolean[]>([]);
  const [mutedStates, setMutedStates] = useState<boolean[]>([]);

  // Fetch video metadata from API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/s3');
        const data = await res.json();
        const filtered = (data.contents || []).filter((file: VideoMeta) =>
          file.key.endsWith('.mp4')
        );
        setVideos(filtered);
        setPlayingStates(new Array(filtered.length).fill(false));
        setMutedStates(new Array(filtered.length).fill(true));
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Auto-play video in view and pause others
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          const video = videoRefs.current[index];
          if (!video) return;

          if (entry.isIntersecting) {
            video.play();
            setPlayingStates((prev) => {
              const updated = [...prev];
              updated[index] = true;
              return updated;
            });
          } else {
            video.pause();
            setPlayingStates((prev) => {
              const updated = [...prev];
              updated[index] = false;
              return updated;
            });
          }
        });
      },
      {
        threshold: 0.75,
      }
    );

    videoRefs.current.forEach((videoEl, idx) => {
      if (videoEl) observer.observe(videoEl);
    });

    return () => observer.disconnect();
  }, [videos]);

  const togglePlay = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
      setPlayingStates((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });
    } else {
      video.pause();
      setPlayingStates((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  const toggleMute = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.muted = !video.muted;
    setMutedStates((prev) => {
      const updated = [...prev];
      updated[index] = video.muted;
      return updated;
    });
  };

  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <span className="ml-4 text-lg">Loading reels...</span>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {videos.map((video, index) => (
        <div
          key={video.key}
          className="snap-start h-screen w-full flex justify-center items-center"
        >
          <div className="relative w-full h-full sm:w-[400px] sm:h-full">
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              data-index={index}
              src={`${video.presignedUrl}`}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              {/* Metadata bottom-left */}
              <div className="mt-auto text-white bg-black/60 p-2 rounded-md w-fit pointer-events-auto">
                <div className="font-semibold truncate text-sm">
                  {video?.metadata?.name ? video?.metadata?.name.replace(/\.[^/.]+$/, '') : video.key.replace(/\.[^/.]+$/, '')}
                </div>
                <div className="text-xs opacity-80">
                  {new Date(video.lastModified).toLocaleString()}
                </div>
              </div>

              {/* Controls bottom-right */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-3 pointer-events-auto">
                <button
                  onClick={() => togglePlay(index)}
                  className="bg-black/60 text-white p-3 rounded-full hover:bg-black/80"
                >
                  {playingStates[index] ? <FaPause /> : <FaPlay />}
                </button>
                <button
                  onClick={() => toggleMute(index)}
                  className="bg-black/60 text-white p-3 rounded-full hover:bg-black/80"
                >
                  {mutedStates[index] ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reels;
