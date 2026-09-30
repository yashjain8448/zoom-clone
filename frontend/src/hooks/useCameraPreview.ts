"use client";

import { useEffect, useRef, useState } from "react";

export type CameraStatus = "starting" | "on" | "denied" | "unavailable";

/**
 * Local camera preview. While `enabled` is true it holds a MediaStream; when it turns
 * false, or the component unmounts, every track is stopped so the camera light goes off.
 * The <video> element must always be rendered, because the stream is attached by ref.
 */
export function useCameraPreview(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let stream: MediaStream | null = null;

    const request = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: true })
      : Promise.reject(new Error("unsupported"));

    request
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop()); // resolved after unmount
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus("on");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const denied = err instanceof DOMException && err.name === "NotAllowedError";
        setStatus(denied ? "denied" : "unavailable");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      setStatus("starting"); // reset for the next time it's enabled
    };
  }, [enabled]);

  return { videoRef, status: enabled ? status : ("off" as const) };
}