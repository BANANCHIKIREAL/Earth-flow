import { useCallback, useRef, useState } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const gapi: any;

export function useGoogleDrivePicker() {
  const [picking, setPicking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const openPicker = useCallback(async (onFile: (file: File) => void) => {
    setPicking(true);
    try {
      await Promise.all([
        loadScript("https://apis.google.com/js/api.js"),
        loadScript("https://accounts.google.com/gsi/client"),
      ]);

      const token = await new Promise<string>((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.readonly",
          callback: (resp: { error?: string; access_token: string }) => {
            if (resp.error) reject(new Error(resp.error));
            else { tokenRef.current = resp.access_token; resolve(resp.access_token); }
          },
        });
        client.requestAccessToken({ prompt: tokenRef.current ? "" : "consent" });
      });

      await new Promise<void>((resolve) => gapi.load("picker", resolve));

      const view = new google.picker.DocsView()
        .setIncludeFolders(false)
        .setMimeTypes(
          "audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac,audio/mp4,audio/x-m4a,audio/webm,audio/x-wav"
        );

      new google.picker.PickerBuilder()
        .setTitle("Select an audio file")
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback(async (data: { action: string; docs?: Array<{ id: string; name: string }> }) => {
          if (data.action !== "picked") { setPicking(false); return; }
          const doc = data.docs![0];
          setPicking(false);
          setDownloading(true);
          try {
            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const file = new File([blob], doc.name, { type: blob.type || "audio/mpeg" });
            onFile(file);
          } finally {
            setDownloading(false);
          }
        })
        .build()
        .setVisible(true);
    } catch {
      setPicking(false);
      setDownloading(false);
    }
  }, []);

  return { openPicker, picking, downloading };
}
