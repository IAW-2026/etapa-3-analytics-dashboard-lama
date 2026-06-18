"use client";

import { FormEvent, useMemo, useState } from "react";

import type { TimeRangeId } from "@/lib/types";

import { Icon } from "./ui";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type AnalyticsChatProps = {
  timeRangeId: TimeRangeId;
};

const suggestedQuestions = [
  "Que dia conviene impulsar ventas?",
  "Que producto esta rindiendo mejor?",
  "Que frena la conversion?",
  "Que campania sugeris para este periodo?"
];

const initialMessage =
  "Preguntame sobre ventas, pagos, ordenes, productos, usuarios, envios, fuentes o tendencias del sistema. Si te vas de tema, te voy a marcar el limite.";

function createMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text
  };
}

export function AnalyticsChat({ timeRangeId }: AnalyticsChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-initial",
      role: "assistant",
      text: initialMessage
    }
  ]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => question.trim().length > 0 && !isLoading, [isLoading, question]);

  async function askAnalytics(questionText: string) {
    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    setQuestion("");
    setIsLoading(true);
    setMessages((currentMessages) => [...currentMessages, createMessage("user", trimmedQuestion)]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          range: timeRangeId
        })
      });

      const data = (await response.json()) as { answer?: string; error?: string };
      const answer = response.ok
        ? data.answer ?? "No pude generar una respuesta con los datos actuales."
        : data.error ?? "No pude consultar el asistente de analytics.";

      setMessages((currentMessages) => [...currentMessages, createMessage("assistant", answer)]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", "No pude conectar con el asistente ahora. Probemos de nuevo en un momento.")
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAnalytics(question);
  }

  return (
    <section className="chat-panel">
      <div className="chat-heading">
        <div>
          <p className="eyebrow">Copiloto IA</p>
          <h2>
            <Icon name="sparkles" />
            Chat del dashboard
          </h2>
          <span>Responde solo sobre metricas, fuentes e insights de LAMA</span>
        </div>
        <b>Scope cerrado</b>
      </div>

      <div className="chat-window" aria-live="polite">
        {messages.map((message) => (
          <article className={`chat-message ${message.role}`} key={message.id}>
            <span>{message.role === "user" ? "Vos" : "Analytics IA"}</span>
            <p>{message.text}</p>
          </article>
        ))}
        {isLoading ? (
          <article className="chat-message assistant loading">
            <span>Analytics IA</span>
            <p>Analizando el snapshot del periodo...</p>
          </article>
        ) : null}
      </div>

      <div className="chat-suggestions" aria-label="Preguntas sugeridas">
        {suggestedQuestions.map((suggestion) => (
          <button disabled={isLoading} key={suggestion} onClick={() => void askAnalytics(suggestion)} type="button">
            {suggestion}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          aria-label="Pregunta para el chat de analytics"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ej: que dia y horario conviene promocionar?"
          value={question}
        />
        <button disabled={!canSubmit} type="submit">
          Preguntar
        </button>
      </form>
    </section>
  );
}
