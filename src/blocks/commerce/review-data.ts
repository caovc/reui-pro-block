import { demoAvatar } from "@/lib/demo-artwork";

export interface OwnerReview {
  id: string;
  author: string;
  avatar: string;
  role: string;
  date: string;
  daysAgo: number;
  finish: string;
  rating: number;
  title: string;
  paragraphs: string[];
  quote: string;
  topics: string[];
  helpful: number;
}

/** Original fictional feedback and original demoAvatar illustrations; no upstream preview media or review prose. */
export const ownerReviews: OwnerReview[] = [
  {
    id: "mira",
    author: "Mira Okonkwo",
    avatar: demoAvatar("review-mira"),
    role: "Creative director",
    date: "4 days ago",
    daysAgo: 4,
    finish: "Onyx · LDAC",
    rating: 5,
    title: "A quieter place to get the first draft finished.",
    paragraphs: [
      "I spend most mornings editing in a shared workspace, so I wanted a pair that made it easier to settle into a long session. These keep the room in the background without making voices or instruments feel distant. The controls are easy to find when I need to take a quick call.",
      "After a month of regular use, the fit is still comfortable and the case has earned a permanent place in my work bag. I appreciate that the parts I touch every day feel considered. A small improvement to an ordinary routine adds up quickly.",
    ],
    quote: "An easy way to find a quieter place for the first draft, even when the studio is full.",
    topics: ["Sound Quality", "Noise Cancel", "Comfort"],
    helpful: 248,
  },
  {
    id: "theo",
    author: "Theo Larsen",
    avatar: demoAvatar("review-theo"),
    role: "Product designer",
    date: "1 week ago",
    daysAgo: 7,
    finish: "Cloud · LDAC",
    rating: 5,
    title: "Useful controls that feel familiar by the second day.",
    paragraphs: [
      "My working day moves between a desktop, a tablet and a phone. Pairing was straightforward, and I rarely need to open the settings once the day has started. Music sounds balanced at a sensible listening level, which matters more to me than a dramatic first impression.",
      "The little details make these useful: a clear battery reading, a case that opens easily and controls I can use without looking. They feel like something designed to accompany work rather than interrupt it. I would choose the same finish again.",
    ],
    quote:
      "Pairing is straightforward and the useful controls quickly become part of the working day.",
    topics: ["Companion App", "Sound Quality", "Build Quality"],
    helpful: 192,
  },
  {
    id: "leon",
    author: "Leon Vargas",
    avatar: demoAvatar("review-leon"),
    role: "Research lead",
    date: "2 weeks ago",
    daysAgo: 14,
    finish: "Sage · aptX HD",
    rating: 4,
    title: "A dependable companion for a full week of field notes.",
    paragraphs: [
      "I bought these for travel between research sessions and have used them for notes, interviews and music on the way home. The battery indicator has been reassuringly predictable. I tend to charge at the end of the week instead of looking for a cable halfway through a busy afternoon.",
      "I would prefer a longer supplied charging cable, but that is a small issue beside the everyday usefulness. The cups fold neatly, and the finish has handled being moved between two different bags. The practical details are the reason I keep reaching for them.",
    ],
    quote:
      "The predictable battery and a practical folding case have made these my regular travel pair.",
    topics: ["Battery", "Build Quality", "Noise Cancel"],
    helpful: 156,
  },
  {
    id: "jules",
    author: "Jules Akinyemi",
    avatar: demoAvatar("review-jules"),
    role: "Independent producer",
    date: "3 weeks ago",
    daysAgo: 21,
    finish: "Onyx · LDAC",
    rating: 5,
    title: "Comfortable enough to finish the listening session.",
    paragraphs: [
      "Long listening sessions used to end with me taking frequent breaks to adjust my headphones. This pair has a gentler fit and enough room around the ears that I can concentrate on the recording. I still take normal breaks, but comfort no longer decides when a session has to finish.",
      "The sound gives vocals and small acoustic instruments enough space to be useful when I compare drafts. The construction feels light without being flimsy. For an everyday wireless pair, the balance of comfort and clear playback has been a good fit for my desk.",
    ],
    quote:
      "A gentler fit and clear playback make these an easy choice for a long listening session.",
    topics: ["Comfort", "Sound Quality"],
    helpful: 134,
  },
  {
    id: "ines",
    author: "Ines Carbone",
    avatar: demoAvatar("review-ines"),
    role: "Audio engineer",
    date: "1 month ago",
    daysAgo: 30,
    finish: "Cloud · aptX HD",
    rating: 4,
    title: "Small maintenance details make a lasting impression.",
    paragraphs: [
      "I like being able to maintain the things I use every day. The replaceable pads were one of the reasons I chose this model, and a quick clean between trips has kept everything looking tidy. The hinges and case closure feel reassuring after several months of daily packing.",
      "Support answered my question about replacement parts clearly. That matters when a product is expected to stay in use for more than one season. I would like more color options for spare pads, but the basic parts are available and easy to understand.",
    ],
    quote:
      "Replaceable pads and clear information about spare parts make the purchase feel considered.",
    topics: ["Build Quality", "Comfort"],
    helpful: 98,
  },
  {
    id: "priya",
    author: "Priya Anand",
    avatar: demoAvatar("review-priya"),
    role: "Composer",
    date: "1 month ago",
    daysAgo: 32,
    finish: "Onyx · LDAC",
    rating: 5,
    title: "An even balance that works across my reference playlist.",
    paragraphs: [
      "My reference playlist moves from a small ensemble to layered electronic recordings. This pair stays composed through the change, with a clear center and bass that does not crowd out the quieter parts. I can listen at a moderate volume and still follow the arrangement.",
      "The companion settings are simple enough that I can save a preference and leave it alone. For daily writing, reviewing demos and a little music on the train, the combination has been reliable. I appreciate a product that lets the work stay in front.",
    ],
    quote:
      "A clear center and an even balance keep the quieter details present in a busy arrangement.",
    topics: ["Sound Quality", "Companion App", "Battery"],
    helpful: 87,
  },
];

export const reviewTopics = [
  { label: "All reviews", percent: 100 },
  { label: "Sound Quality", percent: 94 },
  { label: "Noise Cancel", percent: 91 },
  { label: "Comfort", percent: 89 },
  { label: "Battery", percent: 86 },
  { label: "Build Quality", percent: 82 },
  { label: "Companion App", percent: 78 },
];
