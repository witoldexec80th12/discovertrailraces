"use client";

import { useState } from "react";

declare global {
  interface Window {
    $crisp: unknown[][];
    CRISP_WEBSITE_ID: string;
  }
}

export default function CrispContactForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [race, setRace] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !contact) return;

    const fullMessage = `FORM SUBMISSION:\nName: ${name}\nContact: ${contact}\nRace: ${race}\nFeedback: ${message}`;

    if (typeof window !== "undefined" && window.$crisp) {
      window.$crisp.push(["set", "user:nickname", [name]]);
      if (contact.includes("@")) {
        window.$crisp.push(["set", "user:email", [contact]]);
      }
      window.$crisp.push(["do", "message:send", ["text", fullMessage]]);
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-neutral-800">Thanks! Danny received your message.</p>
        <p className="mt-1 text-sm text-neutral-500">He'll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Email or WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or WhatsApp number"
            required
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Race you ran (optional)
        </label>
        <input
          type="text"
          value={race}
          onChange={(e) => setRace(e.target.value)}
          placeholder="e.g. UTMB 2024"
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Anything you'd like to share..."
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-neutral-700 transition-colors"
      >
        Send to Danny
      </button>
    </form>
  );
}
