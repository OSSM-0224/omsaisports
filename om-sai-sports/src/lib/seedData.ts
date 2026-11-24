import type {
  ClientItem,
  DesignCategory,
  FactItem,
  JerseyDesign,
  ProcessStep,
  SiteSettings,
} from "../types/index";

export const DESIGN_CATEGORIES: ("All" | DesignCategory)[] = [
  "All",
  "School",
  "College",
  "Club",
  "Cricket",
  "Football",
  "Kabaddi",
  "Running",
  "Custom",
];

export const HERO_DEFAULT_POSTER =
  "/src/assets/images/hero_silk_poster_1795103995085.jpg";

export const SEED_SITE_SETTINGS: SiteSettings = {
  id: "default",
  heroVideoUrl: "",
  heroMobileVideoUrl: "",
  heroPosterUrl: HERO_DEFAULT_POSTER,
  heroUseVideo: false,
};

export const FOUNDER_IMAGE =
  "/src/assets/images/founder_yashwant_mhatre_1795098247715.jpg";

export const SEED_DESIGNS: JerseyDesign[] = [
  {
    id: "oss-0123",
    designId: "OSS-0123",
    title: "Ember Strike Match Kit",
    category: "Cricket",
    madeFor: "St Xavier's",
    seasonYear: "2026",
    accentColor: "#FF5A00",
    description:
      "Sharp burnt-orange and obsidian geometric sublimation on 160 GSM breathable dot-knit micro-mesh, crafted for tournament day heat.",
    imageUrl: "/src/assets/images/jersey_cricket_ember_1795098246855.jpg",
    backImageUrl:
      "/src/assets/images/jersey_cricket_ember_back_1795099378913.jpg",
    colors: ["#FF5A00", "#0E0E0E", "#FAF6F0"],
    fabric: "160 GSM Dot-Knit Dry-Fit",
    createdAt: "2026-11-16T09:00:00.000Z",
    isNew: true,
    featured: true,
  },
  {
    id: "oss-0122",
    designId: "OSS-0122",
    title: "Royal Stripe Academy Kit",
    category: "School",
    madeFor: "Ryan International",
    seasonYear: "2026",
    accentColor: "#1D4ED8",
    description:
      "Classic royal blue and marigold vertical stripes with rib-knit V-collar and reinforced shoulder seams for inter-school league fixtures.",
    imageUrl: "/src/assets/images/jersey_football_royal_1795098248189.jpg",
    backImageUrl:
      "/src/assets/images/jersey_football_royal_back_1795099378467.jpg",
    colors: ["#1D4ED8", "#F59E0B", "#FFFFFF"],
    fabric: "150 GSM Honeycomb Mesh",
    createdAt: "2026-11-14T11:30:00.000Z",
    isNew: true,
    featured: true,
  },
  {
    id: "oss-0121",
    designId: "OSS-0121",
    title: "Crimson Mat Sleeveless",
    category: "Kabaddi",
    madeFor: "Uran Education",
    seasonYear: "2026",
    accentColor: "#DC2626",
    description:
      "High-tension four-way stretch kabaddi singlet with double-stitched armholes and non-fade crimson & saffron chevron sublimation.",
    imageUrl: "/src/assets/images/jersey_kabaddi_crimson_1795098247222.jpg",
    colors: ["#DC2626", "#18181B", "#F97316", "#FAF6F0"],
    fabric: "190 GSM Lycra-Poly Stretch",
    createdAt: "2026-11-11T14:15:00.000Z",
    isNew: true,
    featured: true,
  },
  {
    id: "oss-0120",
    designId: "OSS-0120",
    title: "Sage Pace Running Singlet",
    category: "Running",
    madeFor: "Hiranandani",
    seasonYear: "2026",
    accentColor: "#4D7C5F",
    description:
      "Featherweight perforated singlet with contrast coral flatlock binding crafted for Navi Mumbai 10K & half-marathon clubs.",
    imageUrl: "/src/assets/images/jersey_marathon_sage_1795098246700.jpg",
    colors: ["#4D7C5F", "#FF5A00", "#FAF6F0"],
    fabric: "125 GSM Micro-Aero Mesh",
    createdAt: "2026-11-08T08:45:00.000Z",
    isNew: true,
    featured: false,
  },
  {
    id: "oss-0119",
    designId: "OSS-0119",
    title: "Heritage Maroon Crest Polo",
    category: "College",
    madeFor: "Pillai College",
    seasonYear: "2025–26",
    accentColor: "#9F2B47",
    description:
      "Tailored campus cricket polo with woven striped collar, three-button placket, and crisp crest embroidery for college sports councils.",
    imageUrl: "/src/assets/images/jersey_college_maroon_1795098247106.jpg",
    colors: ["#9F2B47", "#FAF6F0", "#1E293B"],
    fabric: "200 GSM Piqué Cotton-Poly",
    createdAt: "2026-11-04T16:20:00.000Z",
    isNew: false,
    featured: true,
  },
  {
    id: "oss-0118",
    designId: "OSS-0118",
    title: "Emerald Diagonal Club Kit",
    category: "Club",
    madeFor: "Don Bosco",
    seasonYear: "2026",
    accentColor: "#059669",
    description:
      "Full club football match shirt featuring a bold ivory diagonal sash, breathable side gussets, and crisp crest sublimation.",
    imageUrl: "/src/assets/images/jersey_club_emerald_1795098248333.jpg",
    colors: ["#059669", "#FAF6F0", "#0E0E0E"],
    fabric: "155 GSM Jacquard Dry-Fit",
    createdAt: "2026-10-29T10:00:00.000Z",
    isNew: false,
    featured: false,
  },
  {
    id: "oss-0117",
    designId: "OSS-0117",
    title: "House Raglan Navy & Tangerine",
    category: "School",
    madeFor: "NHPS",
    seasonYear: "2026",
    accentColor: "#FF5A00",
    description:
      "Durable everyday school sports house tee with vivid tangerine raglan sleeves and soft-hand collar ribbing that holds shape wash after wash.",
    imageUrl: "/src/assets/images/jersey_school_navy_1795098247544.jpg",
    colors: ["#FF5A00", "#1E3A8A", "#FFFFFF"],
    fabric: "170 GSM Interlock Dry-Fit",
    createdAt: "2026-10-23T13:10:00.000Z",
    isNew: false,
    featured: false,
  },
  {
    id: "oss-0116",
    designId: "OSS-0116",
    title: "Contour Line Obsidian Pro",
    category: "Custom",
    madeFor: "Reliance",
    seasonYear: "2026",
    accentColor: "#FF5A00",
    description:
      "Matte black tournament jersey layered with subtle topographic contour lines and high-visibility orange sleeves for floodlight leagues.",
    imageUrl: "/src/assets/images/jersey_tournament_obsidian_1795098247187.jpg",
    colors: ["#FF5A00", "#0E0E0E", "#D4D4D8"],
    fabric: "160 GSM Micro-Pore Sublimation",
    createdAt: "2026-10-18T15:05:00.000Z",
    isNew: false,
    featured: true,
  },
  {
    id: "oss-0115",
    designId: "OSS-0115",
    title: "Ivory & Terracotta Pavilion Polo",
    category: "Cricket",
    madeFor: "Saraswati College",
    seasonYear: "2025",
    accentColor: "#EA580C",
    description:
      "Traditional white pavilion-ready cricket jersey accented with terracotta raglan shoulders, side vents, and crisp contrast piping.",
    imageUrl: "/src/assets/images/jersey_cricket_ivory_1795098247311.jpg",
    colors: ["#EA580C", "#FAF6F0", "#0E0E0E"],
    fabric: "175 GSM Spun-Poly Cricket Knit",
    createdAt: "2026-10-12T09:30:00.000Z",
    isNew: false,
    featured: false,
  },
  {
    id: "oss-0114",
    designId: "OSS-0114",
    title: "Ochre Prism Striker Shirt",
    category: "Football",
    madeFor: "St Augustine",
    seasonYear: "2025",
    accentColor: "#EAB308",
    description:
      "Dynamic ochre yellow and jet-black geometric prism sublimation with tailored athletic fit for district football academies.",
    imageUrl: "/src/assets/images/jersey_football_ochre_1795098247266.jpg",
    colors: ["#EAB308", "#0E0E0E", "#FFFFFF"],
    fabric: "150 GSM Quick-Dry Mesh",
    createdAt: "2026-10-05T12:00:00.000Z",
    isNew: false,
    featured: false,
  },
  {
    id: "oss-0113",
    designId: "OSS-0113",
    title: "Cobalt Chevron Mat Jersey",
    category: "Kabaddi",
    madeFor: "MNR",
    seasonYear: "2025",
    accentColor: "#2563EB",
    description:
      "Vibrant cobalt blue and orange shoulder-chevron kabaddi jersey with bar-tacked collar seams crafted to resist heavy grip pulls.",
    imageUrl: "/src/assets/images/jersey_kabaddi_cobalt_1795098246992.jpg",
    colors: ["#2563EB", "#FF5A00", "#FAF6F0"],
    fabric: "195 GSM Heavy-Duty Stretch Knit",
    createdAt: "2026-09-28T17:40:00.000Z",
    isNew: false,
    featured: false,
  },
  {
    id: "oss-0112",
    designId: "OSS-0112",
    title: "Slate Horizon Finisher Tee",
    category: "Running",
    madeFor: "Apeejay",
    seasonYear: "2025",
    accentColor: "#64748B",
    description:
      "Charcoal slate marathon finisher tee with coral flatlock hems and ultra-soft neck tape for zero chafing over 21K and 42K runs.",
    imageUrl: "/src/assets/images/jersey_running_slate_1795098246709.jpg",
    colors: ["#64748B", "#FF5A00", "#FAF6F0"],
    fabric: "130 GSM Feather-Weave Dry-Fit",
    createdAt: "2026-09-19T07:50:00.000Z",
    isNew: false,
    featured: false,
  },
];

export const SEED_CLIENTS: ClientItem[] = [
  { id: "c1", name: "MNR", since: "2006" },
  { id: "c2", name: "NHPS", since: "2008" },
  { id: "c3", name: "St Augustine", since: "2009" },
  { id: "c4", name: "St Xavier's", since: "2004" },
  { id: "c5", name: "Ryan International", since: "2011" },
  { id: "c6", name: "Vishwajyot", since: "2012" },
  { id: "c7", name: "Apeejay", since: "2010" },
  { id: "c8", name: "Uran Education", since: "2003" },
  { id: "c9", name: "Don Bosco", since: "2007" },
  { id: "c10", name: "Reliance", since: "2014" },
  { id: "c11", name: "Hiranandani", since: "2015" },
  { id: "c12", name: "CCHS", since: "2005" },
  { id: "c13", name: "Sterling", since: "2013" },
  { id: "c14", name: "BVPT", since: "2016" },
  { id: "c15", name: "Saraswati College", since: "2012" },
  { id: "c16", name: "SNG International School", since: "2017" },
  { id: "c17", name: "Pillai College", since: "2009" },
  { id: "c18", name: "Cambridge", since: "2018" },
  { id: "c19", name: "Indo Scot", since: "2019" },
  { id: "c20", name: "St Mary Convent", since: "2005" },
  { id: "c21", name: "Higher School Alibaug", since: "2002" },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Design",
    caption:
      "We sketch team colours, crests, collars, and squad numbers until the kit feels unmistakably yours.",
    imageUrl: "/src/assets/images/jersey_tournament_obsidian_1795098247187.jpg",
    imageAlt:
      "Custom sublimated black and orange jersey layout prepared during design proofing",
  },
  {
    step: "02",
    title: "Sublimation printing",
    caption:
      "Deep-dye heat transfer locks crisp colours straight into the fabric fibres—never peeling, never fading.",
    imageUrl: "/src/assets/images/process_sublimation_press_1795098247132.jpg",
    imageAlt:
      "Large format sublimation heat press transferring orange and black graphics onto jersey fabric",
  },
  {
    step: "03",
    title: "Stitching",
    caption:
      "Every panel is cut and joined on flatlock and overlock machines by tailors who know how athletes move.",
    imageUrl: "/src/assets/images/process_stitching_craft_1795098247783.jpg",
    imageAlt:
      "Artisan hands stitching orange and black breathable athletic mesh on an industrial sewing machine",
  },
  {
    step: "04",
    title: "Quality check & delivery",
    caption:
      "Each jersey is checked by hand for seam strength, squad number accuracy, and neat folded dispatch.",
    imageUrl: "/src/assets/images/jersey_school_navy_1795098247544.jpg",
    imageAlt:
      "Finished navy and orange school sports jersey folded and inspected before team delivery",
  },
];

export const SEED_FACTS: FactItem[] = [
  {
    id: "f1",
    number: "2000",
    label: "Year we started",
    detail:
      "One sewing machine, one cutting table, and a belief that local teams deserved pro-grade kits.",
  },
  {
    id: "f2",
    number: "21+",
    label: "Schools & clubs on our wall",
    detail:
      "From Panvel and Navi Mumbai campuses to Alibaug grounds—reordering season after season.",
  },
  {
    id: "f3",
    number: "100%",
    label: "Checked by hand",
    detail:
      "Every collar, number alignment, and flatlock seam passes a final bench inspection before packing.",
  },
  {
    id: "f4",
    number: "18",
    label: "Breathable fabric weights",
    detail:
      "From 125 GSM marathon singlets to 195 GSM reinforced kabaddi stretch knits.",
  },
  {
    id: "f5",
    number: "0%",
    label: "Print peel guarantee",
    detail:
      "Full dye-sublimation fuses ink into the yarn itself so crests stay sharp after fifty washes.",
  },
  {
    id: "f6",
    number: "10+",
    label: "No upper limit on squads",
    detail:
      "Whether it is an 11-player tournament side or 1,200 house jerseys for Annual Sports Day.",
  },
];
