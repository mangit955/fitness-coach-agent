"use client";

import axios, { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";

import { PulsatingButton } from "@/components/pulsating-button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const quickPrompts = ["fat loss plan", "protein target", "log weight 72.4"];

type TerminalEntry = {
  id: string;
  kind: "system" | "user" | "assistant" | "error";
  text: string;
};

const initialEntries: TerminalEntry[] = [
  {
    id: "boot-1",
    kind: "system",
    text: "fitness-coach-agent :: session booted",
  },
  {
    id: "boot-2",
    kind: "system",
    text: "capabilities loaded :: planning · nutrition · progress tracking",
  },
  {
    id: "boot-3",
    kind: "assistant",
    text: "Ready. Describe your goal, ask a nutrition question, or log weight with `log weight 72.4`.",
  },
];

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const getRequestErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      detail?: string;
      response?: string;
    }>;
    if (axiosError.response) {
      const payload = axiosError.response.data;
      const detail =
        typeof payload === "string"
          ? payload
          : payload?.detail || payload?.response || "request failed";
      return `backend request failed :: ${axiosError.response.status} ${detail}`;
    }
    if (axiosError.request) {
      return `backend request failed :: no response from ${apiUrl}`;
    }
    return `backend request failed :: ${axiosError.message}`;
  }

  return "backend request failed :: check NEXT_PUBLIC_API_URL and the FastAPI server";
};

export default function Home() {
  const [command, setCommand] = useState("");
  const [entries, setEntries] = useState<TerminalEntry[]>(initialEntries);
  const [isTerminalFocused, setIsTerminalFocused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState("idle");
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    outputRef.current?.scrollTo({
      top: outputRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries]);

  const appendEntry = (entry: TerminalEntry) => {
    setEntries((current) => [...current, entry]);
  };

  const updateEntry = (id: string, text: string) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, text } : entry)),
    );
  };

  const streamAssistantResponse = async (responseText: string) => {
    const assistantId = `${Date.now()}-assistant`;
    appendEntry({
      id: assistantId,
      kind: "assistant",
      text: "",
    });

    const chunks = responseText.split(/(\s+)/);
    let rendered = "";

    for (const chunk of chunks) {
      rendered += chunk;
      updateEntry(assistantId, rendered);
      await wait(chunk.trim() ? 22 : 8);
    }
  };

  const submitCommand = async (rawCommand?: string) => {
    const nextCommand = (rawCommand ?? command).trim();
    if (!nextCommand || isRunning) {
      return;
    }

    setCommand("");
    setIsRunning(true);
    setCurrentStage("thinking");

    appendEntry({
      id: `${Date.now()}-user`,
      kind: "user",
      text: `> ${nextCommand}`,
    });

    try {
      const response = await axios.post(apiUrl, {
        message: nextCommand,
        user_id: "web-user",
      });
      setCurrentStage("responding");
      await streamAssistantResponse(response.data.response);
      setCurrentStage("idle");
    } catch (error) {
      appendEntry({
        id: `${Date.now()}-error`,
        kind: "error",
        text: getRequestErrorMessage(error),
      });
      setCurrentStage("idle");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-8 text-zinc-100 md:px-8">
      <section className="w-full max-w-4xl">
        <div className="overflow-hidden rounded-[1.1rem] border border-zinc-800 bg-black shadow-[0_12px_48px_rgba(0,0,0,0.35)]">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                  Fitness Coach Agent
                </p>
                <h1 className="mt-2 text-lg font-semibold text-zinc-100">
                  Train smarter. Eat better. Track progress.
                </h1>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-[11px] text-zinc-400">
                <span className="rounded-full border border-zinc-800 bg-black px-3 py-1">
                  workouts
                </span>
                <span className="rounded-full border border-zinc-800 bg-black px-3 py-1">
                  nutrition
                </span>
                <span className="rounded-full border border-zinc-800 bg-black px-3 py-1">
                  progress
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/90" />
                <span className="h-3 w-3 rounded-full bg-amber-300/90" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
              </div>
              <span className="font-mono text-sm text-zinc-400">
                &gt;_ fitcoach.agent
              </span>
            </div>
            {isRunning ? (
              <div className="flex items-center gap-2">
                <PulsatingButton
                  aria-label="Live status"
                  pulseColor="#22c55e"
                  duration="1.5s"
                  className="pointer-events-none h-2 w-2 rounded-full bg-emerald-500 p-0 text-transparent shadow-none"
                >
                  .
                </PulsatingButton>
                <span className="font-mono text-xs text-zinc-400">
                  {currentStage}
                </span>
              </div>
            ) : isTerminalFocused ? (
              <div className="flex items-center gap-2">
                <PulsatingButton
                  aria-label="Live status"
                  pulseColor="#22c55e"
                  duration="1.5s"
                  className="pointer-events-none h-2 w-2 rounded-full bg-emerald-500 p-0 text-transparent shadow-none"
                >
                  .
                </PulsatingButton>
                <span className="font-mono text-xs text-zinc-400">active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  aria-label="Idle status"
                  className="h-2 w-2 rounded-full bg-zinc-500"
                />
                <span className="font-mono text-xs text-zinc-400">idle</span>
              </div>
            )}
          </div>

          <div
            ref={outputRef}
            className="min-h-[440px] max-h-[62vh] overflow-y-auto bg-black px-5 py-5 font-mono text-sm leading-7"
          >
            {entries.map((entry) => (
              <div key={entry.id} className="mb-3 last:mb-0">
                {entry.kind === "assistant" ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                      fitcoach
                    </p>
                    <p className="whitespace-pre-wrap text-zinc-100">
                      {entry.text || "..."}
                    </p>
                  </div>
                ) : entry.kind === "user" ? (
                  <p className="whitespace-pre-wrap text-cyan-300">
                    {entry.text}
                  </p>
                ) : entry.kind === "error" ? (
                  <p className="whitespace-pre-wrap text-rose-300">
                    {entry.text}
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap text-zinc-500">
                    {entry.text}
                  </p>
                )}
              </div>
            ))}
            {isRunning && currentStage === "thinking" ? (
              <div className="mb-3">
                <p className="text-zinc-500">fitcoach is thinking ...</p>
              </div>
            ) : null}
          </div>

          <div className="border-t border-zinc-800 bg-black px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setCommand(prompt);
                  }}
                  className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <span className="pt-2 font-mono text-cyan-300">&gt;</span>
              <div className="relative flex-1">
                <textarea
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  onFocus={() => setIsTerminalFocused(true)}
                  onBlur={() => setIsTerminalFocused(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitCommand();
                    }
                  }}
                  placeholder="ask fitcoach anything..."
                  className="min-h-24 w-full resize-none bg-transparent pr-12 font-mono text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600"
                />
                {!isTerminalFocused && !command && (
                  <span className="pointer-events-none absolute left-0 top-2 font-mono text-zinc-400 animate-[blink_1.1s_steps(1,end)_infinite]">
                    |
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void submitCommand()}
                disabled={isRunning}
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRunning ? "…" : "→"}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-xs text-zinc-500">
              <span>enter to send · shift + enter for newline</span>
              <span>{command.length} / 500</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
