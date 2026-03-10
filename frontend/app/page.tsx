"use client";

import axios, { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/chat";
const promptSuggestions = [
  "plan a 4-day fat loss workout",
  "how much protein should i eat daily?",
  "log weight 72.4",
  "show my progress",
  "build a beginner muscle gain plan",
];

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

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getRequestErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; response?: string }>;
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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(244,114,33,0.14),_transparent_22%),radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.14),_transparent_20%),linear-gradient(180deg,_#050816_0%,_#090d18_48%,_#0d1324_100%)] px-4 py-8 text-zinc-100 md:px-8">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[1.6rem] border border-cyan-400/15 bg-zinc-950/85 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-4 py-3">
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
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRunning ? "animate-pulse bg-emerald-400" : "bg-zinc-600"
                }`}
              />
              <span>{isRunning ? currentStage : isTerminalFocused ? "active" : "idle"}</span>
            </div>
          </div>

          <div
            ref={outputRef}
            className="min-h-[440px] max-h-[62vh] overflow-y-auto bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_30%),linear-gradient(90deg,_rgba(6,182,212,0.05),_transparent_30%)] px-5 py-5 font-mono text-sm leading-7"
          >
            {entries.map((entry) => (
              <div key={entry.id} className="mb-3 last:mb-0">
                {entry.kind === "assistant" ? (
                  <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/4 px-4 py-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-cyan-300/85">
                      fitcoach
                    </p>
                    <p className="whitespace-pre-wrap text-zinc-100">{entry.text || "..."}</p>
                  </div>
                ) : entry.kind === "user" ? (
                  <p className="whitespace-pre-wrap text-cyan-300">{entry.text}</p>
                ) : entry.kind === "error" ? (
                  <p className="whitespace-pre-wrap text-rose-300">{entry.text}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-zinc-500">{entry.text}</p>
                )}
              </div>
            ))}
            {isRunning && currentStage === "thinking" ? (
              <div className="mb-3">
                <p className="text-zinc-500">fitcoach is thinking ...</p>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/8 bg-zinc-950 px-4 py-4">
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
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 font-mono text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"
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

        <aside className="flex flex-col gap-6">
          <div className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
              Coach Console
            </p>
            <h1 className="mt-3 max-w-md text-4xl font-semibold tracking-tight text-white">
              A terminal-like fitness coach with agent-style responses.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-400">
              Ask for training plans, nutrition guidance, or progress reviews. The interface keeps the interaction tight, command-driven, and closer to an actual agent session.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-zinc-950/75 p-5 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-500">
              Quick Commands
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setCommand(prompt);
                    void submitCommand(prompt);
                  }}
                  className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-left font-mono text-sm text-zinc-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/8 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(244,114,33,0.12),_rgba(244,114,33,0.02))] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200">
              Agent Behavior
            </p>
            <div className="mt-4 space-y-3 font-mono text-sm leading-6 text-zinc-200">
              <p>1. Reads your prompt like an instruction, not a form field.</p>
              <p>2. Shows system activity before returning the final answer.</p>
              <p>3. Prints output as a transcript instead of a single response box.</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
