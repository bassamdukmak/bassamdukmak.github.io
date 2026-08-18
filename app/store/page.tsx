import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { KitInterest } from "../components/kit-interest";
import { ProductViewer } from "../components/product-viewer";
import {
  SiteFooter,
  SiteHeader,
  TrackingConsent,
} from "../components/site-chrome";
import type { KitFeature } from "../content/kit-media";
import styles from "./store.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "Phoenix Home Kit | Limited First Release",
  },
  description:
    "Request the limited first release of the black and gold Phoenix United home kit.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    type: "website",
    url: "/store",
    siteName: "Phoenix United FC",
    title: "Phoenix Home Kit | Limited First Release",
    description:
      "The black and gold Phoenix United home kit: shirt only or full kit with shorts.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Phoenix United FC: club identity built from Dubai.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Phoenix Home Kit | Limited First Release",
    description:
      "Request the black and gold Phoenix United home kit.",
    images: ["/og.png"],
  },
};

const HOME_KIT: KitFeature = {
  id: "black-home-kit",
  number: "01",
  category: "Matchday",
  title: "Black Home Kit",
  description:
    "Phoenix black, gold patterning and the full club crest for the first limited release.",
  status: "Preview",
  editorialImage: null,
  views: [
    {
      id: "front",
      label: "Front",
      image: {
        src: "/kits/matchday-black-front.webp",
        alt: "Front render of the black and gold Phoenix United home shirt",
      },
    },
    {
      id: "back",
      label: "Back",
      image: {
        src: "/kits/matchday-black-back.webp",
        alt: "Back render of the black and gold Phoenix United home shirt",
      },
    },
    {
      id: "shorts",
      label: "Shorts",
      image: {
        src: "/kits/matchday-black-shorts.webp",
        alt: "Front and back render of the black Phoenix United home shorts",
      },
    },
  ],
};

const PRICES = [
  {
    label: "Shirt only",
    aed: "AED 150",
    gbp: "£30",
    detail: "Black home shirt with Phoenix crest and gold detailing.",
  },
  {
    label: "Full kit with shorts",
    aed: "AED 200",
    gbp: "£40",
    detail: "Black home shirt with the matching black shorts.",
  },
] as const;

export default function StorePage() {
  return (
    <div className={`final-site ${styles.store}`}>
      <SiteHeader activePage="store" />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="store-title">
          <div className={styles.heroCopy}>
            <div className={styles.heroMark}>
              <Image
                src="/brand/phoenix-flame.svg"
                width={54}
                height={67}
                alt=""
                aria-hidden="true"
                unoptimized
              />
              <p>Limited first release · Black home kit</p>
            </div>
            <h1 id="store-title">
              Wear the <span>rise.</span>
            </h1>
            <p className={styles.heroIntro}>
              The first Phoenix United home kit is available by request in two
              options: shirt only, or the full kit with shorts.
            </p>
            <div className={styles.heroActions}>
              <a href="#request-order">Request an order</a>
              <a href="#home-kit-prices">View prices</a>
            </div>
            <p className={styles.previewNote}>
              This is an order request, not an online payment checkout.
            </p>
          </div>
          <div className={styles.heroProduct}>
            <ProductViewer feature={HOME_KIT} />
          </div>
        </section>

        <section
          className={styles.pricingSection}
          id="home-kit-prices"
          aria-labelledby="home-kit-prices-title"
        >
          <header className={styles.pricingIntro}>
            <p>Black home kit · 26/27</p>
            <h2 id="home-kit-prices-title">Choose your kit.</h2>
            <p>
              Phoenix confirms availability, payment and delivery after
              receiving your request.
            </p>
          </header>
          <div className={styles.priceCards}>
            {PRICES.map((price) => (
              <article className={styles.priceCard} key={price.label}>
                <h3>{price.label}</h3>
                <p>{price.detail}</p>
                <div className={styles.price}>
                  <strong>{price.aed}</strong>
                  <span>{price.gbp}</span>
                </div>
                <a href="#request-order">Request this kit</a>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.interestSection}
          id="request-order"
          aria-labelledby="order-request-title"
        >
          <div className={styles.interestHeading}>
            <p>Order request</p>
            <h2 id="order-request-title">Request the home kit.</h2>
            <p>
              Tell Phoenix which option, size and quantity you need. The team
              will then confirm availability, payment and delivery directly.
            </p>
            <Image
              src="/brand/phoenix-united-wordmark.svg"
              width={330}
              height={100}
              alt="Phoenix United"
              unoptimized
            />
          </div>
          <KitInterest />
        </section>

        <section className={styles.storeClose} aria-labelledby="store-close-title">
          <Image
            src="/brand/phoenix-crest.svg"
            width={88}
            height={126}
            alt="Phoenix United FC crest"
            unoptimized
          />
          <div>
            <p>Football · Fashion · Community</p>
            <h2 id="store-close-title">The badge travels.</h2>
          </div>
          <Link href="/">Explore the Club</Link>
        </section>
      </main>
      <SiteFooter />
      <TrackingConsent />
    </div>
  );
}
