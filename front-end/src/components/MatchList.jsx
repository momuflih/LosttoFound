import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

function matchScoreClass(score) {
  if (score >= 70) return "bg-brand-600 text-white";
  if (score >= 45) return "bg-brand-100 text-brand-700";
  return "bg-gray-100 text-gray-600";
}

export default function MatchList({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        No close description matches yet. We'll keep checking as new reports come in.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map(({ item, score }) => (
        <li key={item.id}>
          <Link
            to={`/items/${item.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:border-brand-300"
          >
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{item.name}</p>
              <p className="truncate text-sm text-gray-500">{item.description}</p>
              <p className="mt-1 text-xs text-gray-400">{item.location}</p>
            </div>
            <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${matchScoreClass(score)}`}>
              <Sparkles size={12} /> {score}% match
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
