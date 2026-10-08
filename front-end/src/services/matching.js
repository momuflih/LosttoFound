// Text-based compatibility matching between a "lost" report and a "found" report.
//
// Since users are intentionally NOT allowed to upload photos (for safety), the
// only reliable signal that two reports describe the same item is how closely
// their descriptions (plus item type / location) line up. This is a simple,
// dependency-free scorer that runs entirely client-side against mock data for
// now. It's written so the real backend can later replace it with something
// smarter (e.g. embeddings) without changing the calling code below.

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "with", "of", "in", "on", "at", "near",
  "to", "it", "its", "was", "is", "has", "had", "have", "found", "lost",
  "my", "i", "me", "this", "that", "some", "small", "little", "near", "by",
]);

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Scores how compatible a lost item report is with a found item report.
 * Returns an integer percentage (0-100).
 */
export function compatibilityScore(itemA, itemB) {
  const tokensA = tokenize(`${itemA.name} ${itemA.description}`);
  const tokensB = tokenize(`${itemB.name} ${itemB.description}`);

  const descriptionScore = jaccardSimilarity(tokensA, tokensB); // 0-1

  const sameType =
    itemA.itemType && itemB.itemType && itemA.itemType.toLowerCase() === itemB.itemType.toLowerCase();

  const sameArea =
    itemA.location &&
    itemB.location &&
    itemA.location.split(",")[0].trim().toLowerCase() === itemB.location.split(",")[0].trim().toLowerCase();

  // Weighted blend: the description overlap carries the most weight since
  // that's the only detail we can trust without photos.
  let score = descriptionScore * 0.7;
  if (sameType) score += 0.2;
  if (sameArea) score += 0.1;

  return Math.round(Math.min(score, 1) * 100);
}

/**
 * Given one report, finds and ranks the most compatible reports of the
 * opposite kind ("lost" <-> "found") from a candidate list.
 */
export function findMatches(item, candidates, { threshold = 25, limit = 5 } = {}) {
  const oppositeKind = item.itemKind === "lost" ? "found" : "lost";

  return candidates
    .filter((candidate) => candidate.itemKind === oppositeKind && candidate.id !== item.id)
    .map((candidate) => ({ item: candidate, score: compatibilityScore(item, candidate) }))
    .filter((match) => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
