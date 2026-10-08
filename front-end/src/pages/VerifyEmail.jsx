import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("error"); setMessage("This verification link is missing its token."); return; }
    verifyEmail(token)
      .then((result) => { setState("success"); setMessage(result.message); })
      .catch((error) => { setState("error"); setMessage(error.message); });
  }, [params]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-semibold">{state === "success" ? "Email verified" : state === "loading" ? "Verifying email..." : "Verification failed"}</h1>
        <p className="mt-3 text-sm text-gray-600">{message || "Please wait while we verify your email address."}</p>
        {state !== "loading" && <Link to="/login" className="mt-6 inline-flex rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">Go to Sign In</Link>}
      </div>
    </div>
  );
}
