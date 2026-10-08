import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, PackageSearch, ArrowRight } from "lucide-react";
import hero from "../assets/hero-illustration.svg";
import blob from "../assets/abstract-blob.svg";
import ItemCard from "../components/ItemCard";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination";
import HandoverDivider from "../components/HandoverDivider";
import FaqSection from "../components/FaqSection";
import ContactFooter from "../components/ContactFooter";
import { getItems } from "../services/api";
import { getStoredLocation } from "../utils/geo";

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [activeFeed, setActiveFeed] = useState("lost"); // lost | found
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [userCoords, setUserCoords] = useState(() => getStoredLocation());

  useEffect(() => {
    const onLocationChanged = (event) => {
      setUserCoords(event.detail || null);
      setPage(1);
    };
    window.addEventListener("ltf:locationChanged", onLocationChanged);
    return () => window.removeEventListener("ltf:locationChanged", onLocationChanged);
  }, []);

  useEffect(() => {
    const locationOptions = userCoords ? { nearCoords: userCoords, maxDistanceKm: 15 } : {};
    Promise.all([getItems({ itemKind: "lost", limit: 20, ...locationOptions }), getItems({ itemKind: "found", limit: 20, ...locationOptions })])
      .then(([lost, found]) => {
        setLostItems(lost);
        setFoundItems(found);
      })
      .finally(() => setLoading(false));
  }, [userCoords]);

  const feedItems = activeFeed === "lost" ? lostItems : foundItems;
  const totalPages = Math.max(1, Math.ceil(feedItems.length / ITEMS_PER_PAGE));
  const pageItems = feedItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const switchFeed = (feed) => {
    if (feed === activeFeed) return;
    setActiveFeed(feed);
    setPage(1);
  };

  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-brand-700 to-brand-800 px-4 pb-24 pt-14 text-white sm:px-8">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <img src={hero} alt="" className="pointer-events-none absolute bottom-0 left-0 w-full opacity-50" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">A safer community for lost and found items.</h1>
          <p className="mt-3 text-white/80">Report. Search. Reunite.</p>
        </div>
      </section>

      <section className="relative mx-auto -mt-12 max-w-4xl px-4 sm:px-8">
        <img src={blob} alt="" className="pointer-events-none absolute -right-24 -top-10 w-72 opacity-[0.06]" />
        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <Link
            to="/report/lost"
            className="group rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-premium ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(15,46,32,0.3)]"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md">
              <Search size={24} />
            </div>
            <p className="text-lg font-semibold text-gray-900">Lost an item?</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Create a post describing the item you lost.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-transform group-hover:translate-x-0.5">
              Get started <ArrowRight size={14} />
            </span>
          </Link>

          <Link
            to="/report/found"
            className="group rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-premium ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(15,46,32,0.3)]"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md">
              <PackageSearch size={24} />
            </div>
            <p className="text-lg font-semibold text-gray-900">Found an item?</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Help return it to its owner by reporting the item you found.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-transform group-hover:translate-x-0.5">
              Get started <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => switchFeed("lost")}
              className={`text-lg font-semibold transition-colors ${
                activeFeed === "lost" ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Recent Lost Items
            </button>
            <button
              onClick={() => switchFeed("found")}
              className={`text-lg font-semibold transition-colors ${
                activeFeed === "found" ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Recent Found Items
            </button>
          </div>
          <Link
            to={activeFeed === "lost" ? "/lost-items" : "/found-items"}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <Loader label="Loading recent items..." />
        ) : pageItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No {activeFeed} items reported yet.</p>
        ) : (
          <>
            <div key={`${activeFeed}-${page}`} className="grid animate-fade-in grid-cols-2 gap-4">
              {pageItems.map((item) => (
                <ItemCard key={item.id} item={item} layout="column" />
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </section>

      <HandoverDivider />
      <FaqSection />
      <ContactFooter />
    </div>
  );
}
