"use client";

import { useEffect, useRef, useState } from "react";

const sounds = [
  { label: "Relax", src: null },
  { label: "Contento", src: "/audio/orsufo-2.wav" },
  { label: "Paura", src: "/audio/orsufo-3.wav" },
  { label: "Fame", src: "/audio/orsufo-4.wav" },
];

export function OrsufoSoundboard() {
  const playing = useRef(new Set<HTMLAudioElement>());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    for (const audio of playing.current) {
      audio.pause();
      audio.src = "";
    }
    playing.current.clear();
  }, []);

  const play = (src: string) => {
    setError(null);
    const audio = new Audio(src);
    playing.current.add(audio);
    audio.addEventListener("ended", () => playing.current.delete(audio), { once: true });
    audio.addEventListener("error", () => {
      playing.current.delete(audio);
      setError("Impossibile riprodurre il file audio.");
    }, { once: true });
    void audio.play().catch(() => {
      playing.current.delete(audio);
      setError("Impossibile riprodurre il file audio.");
    });
  };

  return <section aria-label="Suoni di Orsufo" className="grid grid-cols-2 gap-4">
    {sounds.map((sound) => <button
      key={sound.src}
      type="button"
      disabled={!sound.src}
      onClick={() => { if (sound.src) play(sound.src); }}
      className="flex min-h-36 touch-manipulation items-center justify-center rounded-3xl border border-line bg-accent px-4 text-center text-2xl font-bold text-on-accent shadow-lg active:scale-[0.98] active:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-45"
    >{sound.label}{!sound.src && <span className="sr-only"> — file audio mancante</span>}</button>)}
    <p className="col-span-2 text-center text-sm text-ink-soft">Il WAV di Relax non è ancora disponibile.</p>
    {error && <p role="alert" className="col-span-2 rounded-xl bg-surface px-4 py-3 text-sm text-danger-strong">{error}</p>}
  </section>;
}
