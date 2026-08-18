export type PhoenixPerson = {
  group: "Founders" | "Leadership" | "Partner leadership";
  name: string;
  role: string;
  copy: string;
};

export type LearningPerson = {
  name: string;
  role: string;
  copy: string;
};

export type PartnerLogo = {
  name: string;
  category:
    | "Club"
    | "University"
    | "Sponsor"
    | "Commercial"
    | "Technology"
    | "Media"
    | "Community"
    | "Pathway";
  logo: string;
  href?: string;
  status: "draft" | "approved" | "published";
};

export const leadershipPeople: PhoenixPerson[] = [
  {
    group: "Founders",
    name: "Amer Al Akkad",
    role: "Co-Founder & CEO",
    copy: "Leads the club vision, partnerships, commercial strategy and international growth.",
  },
  {
    group: "Founders",
    name: "Bader Al Akkad",
    role: "Co-Founder & Sporting Director",
    copy: "Shapes the sporting vision around the structure and standards players need beyond one opportunity.",
  },
  {
    group: "Leadership",
    name: "Chantelle Thompson",
    role: "Director & Investor",
    copy: "Supports the values, purpose and long-term direction behind the club.",
  },
  {
    group: "Leadership",
    name: "Forshaw Group",
    role: "Strategic relationship · Manchester",
    copy: "A strategic Manchester relationship within the wider Phoenix build.",
  },
  {
    group: "Partner leadership",
    name: "Marcus McCabe",
    role: "Radcliffe FC Owner & Director",
    copy: "Part of the Radcliffe leadership connected to the Manchester relationship.",
  },
  {
    group: "Partner leadership",
    name: "Billy Quarmby",
    role: "Radcliffe FC Chairman",
    copy: "Part of the Radcliffe leadership connected to the Manchester relationship.",
  },
];

export const learningPeople: LearningPerson[] = [
  {
    name: "Jamie Ward",
    role: "Club Manager",
    copy: "Leads the first-team environment and the standards around training, preparation and competition.",
  },
  {
    name: "Matt Lowton",
    role: "Assistant Manager",
    copy: "Supports the daily technical programme, match preparation and player development.",
  },
  {
    name: "Ruben Rodrigues",
    role: "Head of Recruitment · PFN",
    copy: "Leads player identification, pathway assessment and recruitment conversations.",
  },
  {
    name: "Danny Simpson",
    role: "Brand Ambassador · PFN",
    copy: "Brings Premier League-winning and Manchester United experience to the wider programme story.",
  },
];

export const approvedPartnerLogos: PartnerLogo[] = [
  {
    name: "UAE FA",
    category: "Licensing association",
    logo: "/partners/uae-fa.svg",
    href: "https://www.uaefa.ae/",
    status: "published",
  },
  {
    name: "Radcliffe FC",
    category: "Club",
    logo: "/partners/radcliffe.svg",
    href: "https://radcliffefc.com/",
    status: "published",
  },
  {
    name: "Silves FC",
    category: "Club",
    logo: "/partners/silves.png",
    href: "https://www.silvesfc.pt/pt/",
    status: "published",
  },
  {
    name: "Wimbledon Wealth",
    category: "Commercial",
    logo: "/partners/wimbledon-wealth-white.png",
    href: "https://wimbledonwealth.com/",
    status: "published",
  },
  {
    name: "Cheat Daze",
    category: "Sponsor",
    logo: "/partners/cheat-daze-transparent.png",
    href: "https://cheatdazedesserts.com/",
    status: "published",
  },
  {
    name: "Farellys",
    category: "Commercial",
    logo: "/partners/farellys-transparent.png",
    href: "https://farrellysworld.co.uk/",
    status: "published",
  },
  {
    name: "Arise Edge",
    category: "Technology",
    logo: "/partners/arise-edge.svg",
    status: "published",
  },
  {
    name: "SPSA · Assess. Train. Succeed.",
    category: "Pathway",
    logo: "/partners/spsa-white.png",
    href: "https://spsa-center.com/",
    status: "published",
  },
];
