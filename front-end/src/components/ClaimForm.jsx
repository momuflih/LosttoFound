import React, { useState } from "react";
import { HelpCircle, Send } from "lucide-react";
import { createClaim } from "../services/api";

export default function ClaimForm({ item, onSubmitted, onCancel }) {
  const [answers, setAnswers] = useState(item.verificationQuestions.map((q) => ({ question: q.question, answer: "" })));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateAnswer = (index, value) => {
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, answer: value } : a)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (answers.some((a) => !a.answer.trim())) {
      setError("Please answer every question.");
      return;
    }

    setBusy(true);
    try {
      const claim = await createClaim(item.id, answers.map((a) => ({ question: a.question, answer: a.answer.trim() })));
      onSubmitted(claim);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
        <HelpCircle size={14} className="mt-0.5 shrink-0" />
        Answer these to help {item.reporterName} confirm this is really yours. They'll review your
        answers before accepting.
      </div>

      <div className="space-y-3">
        {answers.map((a, index) => (
          <div key={index}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{a.question}</label>
            <input
              type="text"
              value={a.answer}
              onChange={(e) => updateAnswer(index, e.target.value.slice(0, 300))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          <Send size={14} /> {busy ? "Submitting..." : "Submit claim"}
        </button>
      </div>
    </form>
  );
}
