import React from "react";
import { Link } from "react-router-dom";
import { Mail, Home as HomeIcon, ArrowUp, HelpCircle } from "lucide-react";
import logo from "../assets/logo.svg";

const LINKEDIN_URL = "https://www.linkedin.com/in/mohamed-muflih-5a499a282";
const CONTACT_EMAIL = "abmuflihmohd@gmail.com";

export default function ContactFooter() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToFaq = () => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer id="contact" className="bg-slate-900 px-4 py-14 text-slate-300 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2">
          <img src={logo} alt="" className="h-6 w-6" />
          <span className="text-lg font-semibold text-white">LosttoFound</span>
        </div>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          LosttoFound is a community platform for reporting and recovering lost belongings. We match lost
          and found reports by description rather than photos, so people can reconnect with what they've
          lost without compromising anyone's privacy.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-10">
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Contact &amp; Follow</p>
          <div className="space-y-2.5 text-sm">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <Mail size={16} /> {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <LinkedinIcon /> Connect on LinkedIn
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-white">Quick links</p>
          <div className="space-y-2.5 text-sm">
            <Link to="/" className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white">
              <HomeIcon size={16} /> Home
            </Link>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <ArrowUp size={16} /> Back to top
            </button>
            <button
              onClick={scrollToFaq}
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <HelpCircle size={16} /> FAQ
            </button>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} LosttoFound. All rights reserved.
      </p>
    </footer>
  );
}

function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
