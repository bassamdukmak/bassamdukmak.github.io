export type KitImage = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export type KitView = {
  id: string;
  label: string;
  image: KitImage;
};

export type KitFeature = {
  id: string;
  number: string;
  category: "Matchday" | "Training" | "Coaches" | "Premium Limited";
  title: string;
  description: string;
  status: "Preview";
  editorialImage: KitImage | null;
  views: readonly KitView[];
};

export const storeCollections = [
  {
    number: "01",
    title: "Matchday",
    marker: "Full crest",
    description: "Official match shirts and complete kit combinations.",
  },
  {
    number: "02",
    title: "Training",
    marker: "Flame + wordmark",
    description: "Daily workwear for players and the technical environment.",
  },
  {
    number: "03",
    title: "Fan & Supporter",
    marker: "Flame emblem",
    description: "Everyday pieces designed to carry Phoenix beyond matchday.",
  },
  {
    number: "04",
    title: "Premium Limited",
    marker: "Editorial release",
    description: "Small seasonal drops and special Phoenix expressions.",
  },
  {
    number: "05",
    title: "Partner Collection",
    marker: "Future release",
    description: "A future platform for approved club and brand collaborations.",
  },
] as const;

/**
 * Product renders remain the controlled detail views. Once the real photoshoot
 * arrives, add its approved crop to `editorialImage`; Store layouts will use it
 * as the lead image without changing any component markup.
 */
export const kitFeatures: readonly KitFeature[] = [
  {
    id: "black-matchday",
    number: "01",
    category: "Matchday",
    title: "Black / Gold Kit",
    description:
      "A dark matchday expression with Phoenix gold, the full crest and a patterned number treatment.",
    status: "Preview",
    editorialImage: null,
    views: [
      {
        id: "front",
        label: "Front",
        image: {
          src: "/kits/matchday-black-front.webp",
          alt: "Front render of the black and gold Phoenix match shirt",
        },
      },
      {
        id: "back",
        label: "Back",
        image: {
          src: "/kits/matchday-black-back.webp",
          alt: "Back render of the black and gold Phoenix match shirt with number ten",
        },
      },
      {
        id: "shorts",
        label: "Shorts",
        image: {
          src: "/kits/matchday-black-shorts.webp",
          alt: "Front and back render of the black Phoenix match shorts",
        },
      },
    ],
  },
  {
    id: "sand-matchday",
    number: "02",
    category: "Matchday",
    title: "Sand Kit",
    description:
      "A sand and cream matchday direction that carries the club palette into a lighter kit expression.",
    status: "Preview",
    editorialImage: null,
    views: [
      {
        id: "front",
        label: "Front",
        image: {
          src: "/kits/matchday-sand-front.webp",
          alt: "Front render of the sand Phoenix match shirt",
        },
      },
      {
        id: "back",
        label: "Back",
        image: {
          src: "/kits/matchday-sand-back.webp",
          alt: "Back render of the sand Phoenix match shirt with number ten",
        },
      },
      {
        id: "shorts",
        label: "Shorts",
        image: {
          src: "/kits/matchday-sand-shorts.webp",
          alt: "Front and back render of the sand Phoenix match shorts",
        },
      },
    ],
  },
  {
    id: "midnight-kit",
    number: "03",
    category: "Premium Limited",
    title: "Midnight Kit",
    description:
      "Tonal Phoenix patterning on midnight blue, framed with a restrained gold collar and sleeve finish.",
    status: "Preview",
    editorialImage: null,
    views: [
      {
        id: "front",
        label: "Front",
        image: {
          src: "/kits/matchday-midnight-front.webp",
          alt: "Front render of the midnight Phoenix shirt with tonal flame pattern",
        },
      },
      {
        id: "back",
        label: "Back",
        image: {
          src: "/kits/matchday-midnight-back.webp",
          alt: "Back render of the midnight Phoenix shirt with Phoenix United wordmark",
        },
      },
      {
        id: "shorts",
        label: "Shorts",
        image: {
          src: "/kits/matchday-midnight-shorts.webp",
          alt: "Front and back render of the midnight Phoenix shorts",
        },
      },
    ],
  },
  {
    id: "training-white",
    number: "04",
    category: "Training",
    title: "White Training Kit",
    description:
      "A clean training layer with black patterned sleeves, paired with the white short option.",
    status: "Preview",
    editorialImage: null,
    views: [
      {
        id: "shirt",
        label: "Shirt",
        image: {
          src: "/kits/training-top-white-front.webp",
          alt: "Front render of the white Phoenix training shirt with black sleeves",
        },
      },
      {
        id: "shorts",
        label: "Shorts",
        image: {
          src: "/kits/matchday-white-shorts.webp",
          alt: "Front and back render of the white Phoenix shorts",
        },
      },
    ],
  },
  {
    id: "coaches-polos",
    number: "05",
    category: "Coaches",
    title: "Coaches’ Wear",
    description:
      "Sharp off-pitch polos for the technical environment in light and midnight colourways.",
    status: "Preview",
    editorialImage: null,
    views: [
      {
        id: "white",
        label: "White",
        image: {
          src: "/kits/coaches-polo-white.webp",
          alt: "Front render of the white and gold Phoenix coaches polo",
        },
      },
      {
        id: "midnight",
        label: "Midnight",
        image: {
          src: "/kits/coaches-polo-midnight.webp",
          alt: "Front render of the midnight and gold Phoenix coaches polo",
        },
      },
    ],
  },
];
