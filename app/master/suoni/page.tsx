import Link from "next/link";
import { OrsufoSoundboard } from "./OrsufoSoundboard";

export default function OrsufoSoundsPage() {
  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-4">
    <header className="flex items-center gap-3">
      <Link href="/master" aria-label="Torna a Master" className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft active:bg-card">←</Link>
      <div>
        <h1 className="text-xl font-bold text-heading">Suoni Orsufo</h1>
        <p className="text-sm text-ink-soft">Tocca un suono per riprodurlo.</p>
      </div>
    </header>
    <OrsufoSoundboard />
  </main>;
}
