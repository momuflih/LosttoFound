import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is this platform trustable?",
    a: "We built LosttoFound around verification, not anonymity. Anyone posting a lost or found report must first verify their mobile number, and every profile shows an Honor Level built from past successful returns and community feedback. We also don't allow photo uploads on reports — matches are made from written descriptions, which cuts down on people posting items they don't actually have.",
  },
  {
    q: "I got scammed, what should I do?",
    a: "Stop replying to that user right away and don't send any money or personal/financial details — LosttoFound never requires a payment to release an item. Report the conversation and the user's profile so our team can review it, and if money or personal information was already shared, also file a report with your local police. Reach out to us at abmuflihmohd@gmail.com with the details and we'll follow up.",
  },
  {
    q: "What should I not do?",
    a: "Don't pay a \"finder's fee\" or any money upfront to get your item back. Don't share sensitive details like OTPs, bank info, or home address in chat. Don't meet in an isolated or unfamiliar location — pick a public, well-lit place, ideally during the day. And don't upload photos of items when reporting; descriptions are what keep the matching process fair and safe for everyone.",
  },
  {
    q: "How do I find my lost item?",
    a: "Post a lost item report with as detailed a description as you can — color, brand, distinguishing marks, and where/when you lost it. We'll automatically compare it against found item reports and show you a ranked list of possible matches on your item's page. You can also browse the Found Items list yourself and use the search bar to look for specific keywords.",
  },
];

export default function FaqSection() {
  const [openIndexes, setOpenIndexes] = useState([0]);

  const toggle = (index) => {
    setOpenIndexes((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  return (
    <section id="faq" className="bg-gradient-to-b from-brand-700 to-brand-800 px-4 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <HelpCircle size={20} />
        </div>
        <h2 className="text-center text-2xl font-semibold tracking-tight">Frequently Asked Questions</h2>
        <p className="mt-2 text-center text-sm text-white/70">Quick answers about staying safe on LosttoFound.</p>

        <div className="mt-8 space-y-3">
          {FAQS.map((item, index) => {
            const open = openIndexes.includes(index);
            return (
              <div key={item.q} className="overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                <button
                  onClick={() => toggle(index)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-white/80">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
