import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Video,
  ListMusic,
  Send,
  BarChart3,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Clip Library",
    description: "Upload and organize training drill videos",
  },
  {
    icon: ListMusic,
    title: "Drag & Drop Playlists",
    description: "Build custom homework sequences in seconds",
  },
  {
    icon: Send,
    title: "Assign to Clients",
    description: "Send homework with due dates and notes",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "See which drills your athletes complete",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Built for the court — works on any phone",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏀</span>
            <span className="font-bold text-stone-900">CourtWork</span>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4">
        <section className="py-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Homework playlists for{" "}
            <span className="text-orange-600">basketball trainers</span>
          </h1>
          <p className="mt-4 text-base text-stone-600">
            Drag-and-drop video clips into custom workout playlists. Assign
            homework to your clients and track their progress — all from your
            phone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-3 pb-16">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <Icon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">{title}</h3>
                <p className="text-sm text-stone-500">{description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Free to start</h2>
          <p className="mt-2 text-sm text-stone-600">
            3 clients · 10 clips · 3 playlists · homework & progress tracking
          </p>
          <Link href="/signup" className="mt-4 inline-block">
            <Button variant="outline">Create free account</Button>
          </Link>
        </section>

        <section className="mb-16 rounded-2xl bg-orange-600 p-6 text-center text-white">
          <h2 className="text-xl font-bold">Pro Plan — $29/mo</h2>
          <p className="mt-2 text-sm text-orange-100">
            Unlimited clients, clips, and playlists. Email notifications when
            homework is assigned.
          </p>
          <Link href="/signup" className="mt-4 inline-block">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              Get Started
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
