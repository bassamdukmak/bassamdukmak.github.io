import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FixtureCalendar from "./components/fixture-calendar";
import PartnerRail from "./components/partner-rail";
import { SiteFooter, SiteHeader, TrackingConsent } from "./components/site-chrome";
import { approvedPartnerLogos } from "./content/site-content";

export const metadata: Metadata = {
  title: { absolute: "Phoenix United FC | Football Club in Dubai" },
  description: "Phoenix United FC is a UAE FA licensed football club in Dubai, built to rise.",
  alternates: { canonical: "/" },
};

const backers = [
  "Forshaw Group",
  "Marcus McCabe",
  "Chantelle Thompson",
] as const;

const footballLeaders = [
  ["Jamie Ward", "Manager", "/media/jamie-ward-signing.webp"],
  ["Matt Lowton", "Assistant Manager", "/media/matt-lowton-signing.webp"],
] as const;

export default function ClubPage() {
  return <div className="final-site club-page">
    <SiteHeader activePage="club" />
    <main id="main-content">
      <section className="club-hero club-hero-editorial" aria-labelledby="club-hero-title">
        <figure className="club-hero-media"><Image src="/media/phoenix-number-10-hero-v2.webp" alt="Phoenix player in a floodlit stadium" fill priority unoptimized sizes="100vw" /></figure>
        <div className="club-hero-copy">
          <Image className="hero-arabic-slogan" src="/brand/arabic-slogan-transparent.png" width={420} height={284} alt="Strive to Rise in Arabic" unoptimized />
          <h1 id="club-hero-title">Built to rise.</h1>
          <p className="club-hero-lede">The person before the player. Developing footballers, building futures and creating pathways beyond the pitch.</p>
          <div className="final-actions"><Link className="button button-primary" href="/pathway#assessment">Start Your Pathway</Link><a className="button button-secondary" href="#fixtures">View Fixtures</a></div>
        </div>
        <p className="club-license-rail"><span>UAE FA Licensed</span><strong>Dubai, UAE</strong></p>
      </section>

      <section id="partners" className="credibility-rail" aria-label="Phoenix partners"><PartnerRail partners={approvedPartnerLogos} /></section>
      <section id="culture" className="club-manifesto" aria-labelledby="manifesto-title">
        <figure><Image src="/images/instagram-team.jpg" alt="Phoenix players together in a real football environment" fill unoptimized sizes="(max-width: 820px) 100vw, 52vw" /></figure>
        <div>
          <p className="final-kicker">01 / More than the 90 minutes</p>
          <h2 id="manifesto-title">More than the 90 minutes.</h2>
          <div className="manifesto-copy"><article><span>Who we are</span><p>Phoenix United is the competitive heart of a wider ecosystem built around football, education and pathways.</p></article><article><span>Why Phoenix</span><p>The person comes before the player. A player&apos;s future should never depend on one outcome.</p></article></div>
          <p className="manifesto-belief">The pitch builds character.<br />Education builds futures.<br />Phoenix unites them.</p>
        </div>
      </section>

      <section className="story-editorial" aria-labelledby="story-title">
        <figure className="story-photo-composition"><Image className="story-founders-photo" src="/media/founders-kit-launch.webp" alt="Amer and Bader Al Akkad wearing the Phoenix United kits" fill unoptimized sizes="(max-width: 820px) 100vw, 52vw" /><span className="story-archive-photo"><Image src="/media/bader-stockport.webp" alt="Bader Al Akkad playing for Stockport" width={1100} height={1371} unoptimized /><small>Bader Al Akkad · Stockport</small></span></figure>
        <div><p className="final-kicker">02 / Our story</p><h2 id="story-title">Built from experience.<br />Built for what comes next.</h2>
          <p><strong>Phoenix began with two brothers, Amer and Bader Al Akkad, and a shared understanding of how quickly football can change.</strong></p>
          <p>Bader grew up inside the English football pyramid, progressing through the game with the ambition of becoming a professional footballer. Then a serious illness changed the course of his life.</p>
          <p>After his illness, his body was never the same and the football career he had spent years building came to an end. That experience stayed with both brothers.</p>
          <p>It shaped a simple belief. Talent matters, but a player&apos;s future cannot depend on football alone. Phoenix was built to give players the environment to pursue the game seriously while building something beyond it at the same time.</p>
          <p className="story-closing">Syrian roots.<br />Shaped in Manchester.<br />Built in Dubai.</p>
        </div>
      </section>

      <section className="backers-section" aria-labelledby="backers-title"><div><p className="final-kicker">03 / The backers</p><h2 id="backers-title">People who believed in the vision.</h2><p>Phoenix is backed by people who share the ambition to build something that goes beyond the traditional football club.</p></div><div className="backers-visual"><figure><Image src="/media/phoenix-backers-group.webp" alt="Phoenix and Radcliffe leadership together" fill unoptimized sizes="(max-width: 900px) 100vw, 62vw" /></figure><div className="backer-list">{backers.map((name) => <article key={name}><h3>{name}</h3></article>)}</div></div></section>

      <section className="manchester-roots" aria-labelledby="manchester-title">
        <div className="manchester-roots-layout">
          <div className="manchester-roots-copy"><p className="final-kicker">04 / Manchester roots</p><h2 id="manchester-title">Manchester roots.<br />A network built for football.</h2><p>Phoenix&apos;s connection to Manchester extends beyond its founders. Through the Radcliffe FC ownership group, Phoenix is connected to an established English football environment and a wider network of people with experience across the professional game.</p></div>
          <div className="manchester-roots-proof"><figure className="roots-partnership-photo"><Image src="/media/manchester-partnership.webp" alt="Phoenix and Radcliffe representatives marking the partnership" fill unoptimized sizes="(max-width: 900px) 100vw, 44vw" /></figure><div className="crest-connection"><Image src="/brand/phoenix-crest-full.webp" width={180} height={180} alt="Phoenix United crest" unoptimized /><span>Dubai ↔ Manchester</span><Image src="/partners/radcliffe.svg" width={132} height={132} alt="Radcliffe FC crest" unoptimized /></div></div>
        </div>
        <div className="roots-points"><article><h3>Player development</h3><p>Different football environments create different opportunities for players to develop, compete and be assessed.</p></article><article><h3>Football network</h3><p>Shared relationships across recruitment, scouting, coaching and the professional game.</p></article><article><h3>Multi club</h3><p>Knowledge, resources and football experience can move across the wider network rather than each club operating in isolation.</p></article></div>
        <div className="leadership-editorial">
          {footballLeaders.map(([name, role, image], index) => <figure className={`leader-portrait leader-portrait-${index + 1}`} key={name}><div className="leader-image"><Image src={image} alt={`${name} signing with Phoenix United`} fill unoptimized sizes="(max-width: 900px) 100vw, 31vw" /></div><figcaption><strong>{name}</strong><span>{role}</span></figcaption></figure>)}
          <div className="leadership-stat"><p>Led by experience</p><strong>900+</strong><h3>Senior club appearances</h3><span>Experience from the highest levels of English football, now helping shape the football environment at Phoenix United.</span><figure className="leadership-group-photo"><Image src="/media/phoenix-leadership-group.webp" alt="Four members of the Phoenix football leadership team together" fill unoptimized sizes="(max-width: 900px) 100vw, 28rem" /></figure></div>
        </div>
      </section>

      <section id="press" className="press-section" aria-labelledby="press-title"><div className="press-heading"><p className="final-kicker">Press & announcements</p><h2 id="press-title">The Manchester connection, announced.</h2><p>Radcliffe FC announced its ownership group&apos;s strategic investment in Phoenix United, connecting Manchester football experience with the club&apos;s growth in Dubai.</p></div><div className="press-articles"><article className="press-article"><span>Radcliffe FC · Club News · 03 August 2026</span><h3>Radcliffe FC Ownership Group Invests in Phoenix United</h3><a className="text-link" href="https://radcliffefc.com/radcliffe-fc-ownership-group-invests-in-phoenix-united/" target="_blank" rel="noreferrer">Read the announcement <span aria-hidden="true">↗</span></a></article><article className="press-article"><span>BBC News</span><h3>Ex-Stockport player bounces back from cancer to set up Dubai club</h3><p>Bader Al-Akkad&apos;s long journey took in the war in Syria and a career-ending cancer diagnosis.</p><a className="text-link" href="https://www.bbc.co.uk/news/articles/ce34wnvql9vo" target="_blank" rel="noreferrer">Read BBC coverage <span aria-hidden="true">↗</span></a></article></div></section>

      <FixtureCalendar />

      <section className="club-close" aria-labelledby="club-close-title"><div className="club-close-copy"><p className="final-kicker">Phoenix Football Network</p><h2 id="club-close-title">Ready to rise with Phoenix?</h2><p>One network. Three hubs. Multiple entry points.</p><div className="final-actions"><Link className="button button-primary" href="/pathway#assessment">Start Your Pathway</Link><Link className="button button-secondary" href="/network">Explore the Network</Link></div></div><aside className="club-close-board network-hub" aria-label="Phoenix Football Network locations"><p className="network-hub-title">One network. Three clubs.</p><svg className="network-hub-lines" viewBox="0 0 600 390" aria-hidden="true"><path d="M300 78 112 292h376L300 78Z" /><circle cx="300" cy="225" r="48" /><circle cx="300" cy="225" r="62" /></svg><div className="network-hub-center"><Image src="/brand/phoenix-football-network-mark.webp" width={110} height={110} alt="Phoenix Football Network mark" unoptimized /></div><div className="network-hub-node network-hub-dubai"><Image src="/brand/phoenix-crest-full.webp" width={110} height={110} alt="Phoenix United FC crest" unoptimized /><span>Dubai, UAE</span><strong>Phoenix United FC</strong></div><div className="network-hub-node network-hub-manchester"><Image src="/partners/radcliffe.svg" width={110} height={110} alt="Radcliffe FC crest" unoptimized /><span>Manchester, UK</span><strong>Radcliffe FC</strong></div><div className="network-hub-node network-hub-silves"><Image src="/partners/silves-crest.webp" width={110} height={110} alt="Silves FC crest" unoptimized /><span>Silves, Algarve</span><strong>Silves FC</strong></div><p className="network-hub-footer">Multiple entry points</p></aside></section>
    </main><SiteFooter /><TrackingConsent />
  </div>;
}
