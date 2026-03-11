"use client";

import axios, { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";

import { PulsatingButton } from "@/components/pulsating-button";
import ShinyText from "@/components/ShinyText";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/chat";
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
    text: "Connected to FitCoach.",
  },
  {
    id: "boot-2",
    kind: "assistant",
    text: "Tell me your goal, ask about nutrition, or log progress with `log weight 72.4`.",
  },
];

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const formatAssistantText = (text: string) =>
  text
    .replace(/([.!?])\s+(?=[A-Z])/g, "$1\n\n")
    .replace(/(\d+\.)\s/g, "\n$1 ")
    .replace(/-\s/g, "\n- ")
    .trim();

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
      return `Backend request failed: ${axiosError.response.status} ${detail}`;
    }
    if (axiosError.request) {
      return `Backend request failed: no response from ${apiUrl}`;
    }
    return `Backend request failed: ${axiosError.message}`;
  }

  return "Backend request failed. Check NEXT_PUBLIC_API_URL and the FastAPI server.";
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
    const formattedResponse = formatAssistantText(responseText);
    appendEntry({
      id: assistantId,
      kind: "assistant",
      text: "",
    });

    const chunks = formattedResponse.split(/(\s+)/);
    let rendered = "";

    for (const chunk of chunks) {
      rendered += chunk;
      updateEntry(assistantId, rendered);
      await wait(chunk.trim() ? 42 : 14);
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
      text: nextCommand,
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
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0f] px-4 py-6 text-zinc-100">
      <section className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#111216] shadow-[0_24px_90px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/5 bg-[#17181d] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex bg-neutral-300 h-12 w-12 items-center justify-center rounded-full border border-white/6 bg-[#23242b] text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  🧑🏻
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">FitCoach</p>
                  <p className="text-xs text-zinc-400">
                    workouts · nutrition · progress
                  </p>
                </div>
              </div>
              {isRunning ? (
                <div className="flex items-center gap-2">
                  <PulsatingButton
                    aria-label="Live status"
                    pulseColor="#3b82f6"
                    duration="1.5s"
                    className="pointer-events-none h-2.5 w-2.5 rounded-full bg-sky-500 p-0 text-transparent shadow-none"
                  >
                    .
                  </PulsatingButton>
                  <span className="text-xs text-zinc-400">{currentStage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    aria-label="Idle status"
                    className={`h-2.5 w-2.5 rounded-full ${
                      isTerminalFocused ? "bg-emerald-500" : "bg-zinc-600"
                    }`}
                  />
                  <span className="text-xs text-zinc-400">
                    {isTerminalFocused ? "active" : "idle"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            ref={outputRef}
            className="min-h-[400px] max-h-[54vh] overflow-y-auto bg-[#111216] px-4 py-4"
          >
            <div className="mb-4 flex justify-center">
              <div className="rounded-full border border-white/5 bg-[#1b1c22] px-3 py-1 text-[11px] text-zinc-500">
                Today
              </div>
            </div>

            <div className="space-y-2.5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={
                    entry.kind === "user"
                      ? "flex justify-end"
                      : entry.kind === "system"
                        ? "flex justify-center"
                        : "flex justify-start"
                  }
                >
                  {entry.kind === "assistant" ? (
                    <div className="max-w-[85%] rounded-[1.35rem] rounded-bl-md border border-white/5 bg-[#26272e] px-4 py-2.5 text-[15px] leading-6 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      {entry.text || "..."}
                    </div>
                  ) : entry.kind === "user" ? (
                    <div className="max-w-[80%] rounded-[1.35rem] rounded-br-md bg-[#0a84ff] px-4 py-2.5 text-[15px] leading-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      {entry.text}
                    </div>
                  ) : entry.kind === "error" ? (
                    <div className="max-w-[85%] rounded-[1.35rem] rounded-bl-md border border-rose-400/10 bg-[#472027] px-4 py-2.5 text-[15px] leading-6 text-rose-100">
                      {entry.text}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-zinc-500">
                      {entry.text}
                    </div>
                  )}
                </div>
              ))}

              {isRunning && currentStage === "thinking" ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.35rem] rounded-bl-md border border-white/5 bg-[#26272e] px-4 py-2.5 text-zinc-400">
                    <ShinyText
                      text="FitCoach is thinking..."
                      speed={4}
                      delay={0}
                      color="#9a9a9a"
                      shineColor="#ffffff"
                      spread={120}
                      direction="left"
                      yoyo={false}
                      pauseOnHover={false}
                      disabled={false}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/5 bg-[#17181d] px-4 py-3.5">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setCommand(prompt)}
                  className="rounded-full border border-white/5 bg-[#23242b] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-[#2d2f37]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div
              className={`flex items-end gap-3 rounded-[1.6rem] border px-3 py-2.5 transition ${
                isTerminalFocused
                  ? "border-sky-500/45 bg-[#1d1e25]"
                  : "border-white/6 bg-[#1d1e25]"
              }`}
            >
              <div className="flex-1">
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
                  placeholder="Message FitCoach"
                  className="min-h-10 w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-6 text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <button
                type="button"
                onClick={() => void submitCommand()}
                disabled={isRunning}
                className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full bg-[#0a84ff] text-lg text-white transition hover:bg-[#3797ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
