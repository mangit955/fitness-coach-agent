"use client";

import { useState } from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/chat";
const promptSuggestions = [
  "I want to lose fat and train 4 days a week",
  "Give me a muscle gain workout plan",
  "How much protein should I eat?",
  "log weight 72.4",
  "show my progress",
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await axios.post(apiUrl, {
        message: trimmedMessage,
        user_id: "web-user",
      });
      setResponse(res.data.response);
    } catch {
      setError("Unable to reach the backend. Check NEXT_PUBLIC_API_URL and the FastAPI server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,194,112,0.35),_transparent_32%),linear-gradient(180deg,_#fff6ea_0%,_#f4efe7_40%,_#e8efe9_100%)] px-6 py-10 text-stone-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[2rem] border border-stone-900/10 bg-white/75 p-6 shadow-[0_30px_80px_rgba(30,20,10,0.12)] backdrop-blur md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-orange-700">
              Fitness Coach AI
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950 md:text-6xl">
              Workout plans, nutrition answers, and progress tracking in one coach.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-700">
              Describe your goal, ask a nutrition question, or log your latest weight to keep the coaching loop moving.
            </p>
          </div>
          <div className="rounded-3xl bg-stone-950 px-5 py-4 text-sm text-stone-100">
            Web app and Telegram bot can both point at the same FastAPI backend.
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.5rem] border border-stone-900/10 bg-stone-50 p-5">
            <label className="mb-3 block text-sm font-medium text-stone-700" htmlFor="coach-message">
              Ask the coach
            </label>
            <textarea
              id="coach-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Example: I want to lose fat and can train 4 days a week."
              className="min-h-40 w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-orange-500"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={send}
                disabled={loading}
                className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending..." : "Send to coach"}
              </button>
              {error ? <p className="self-center text-sm text-red-700">{error}</p> : null}
            </div>
            <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-stone-700">Coach response</p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-stone-900">
                {response || "Your response will appear here."}
              </pre>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-stone-900/10 bg-stone-950 p-5 text-stone-100">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-300">
              Prompt ideas
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setMessage(prompt)}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm leading-6 transition hover:border-orange-300/60 hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
