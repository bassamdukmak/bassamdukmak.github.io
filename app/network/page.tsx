import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PartnerRail from "../components/partner-rail";
import PathwayAssessment from "../components/pathway-assessment";
import { SiteFooter, SiteHeader, TrackingConsent } from "../components/site-chrome";
import { approvedPartnerLogos } from "../content/site-content";

export const metadata: Metadata = {
  title: { absolute: "Phoenix Football Network | Programmes and Partnerships" },
  description: "Football programmes, camps, education and partnerships across the Phoenix Football Network.",
  alternates: { canonical: "/network" },
};

const areas = [
  { id: "football-programmes", title: "Football programmes", lead: "Structured football environments built around training, competition and player development.", copy: "Phoenix programmes can be delivered through Dubai, Manchester, Silves and future network locations.", image: "/media/network-football-programmes.webp", position: "center 30%" },
  { id: "camps-showcases", title: "Camps & showcases", lead: "Short-term football experiences built around coaching, assessment, exposure and opportunity.", copy: "These can be delivered independently or together with clubs, academies and other partners.", image: "/media/network-camps-showcases.webp", position: "center 70%" },
  { id: "tournaments-events", title: "Tournaments & events", lead: "Football events, youth tournaments and partner activations built around the audience, location and purpose.", copy: "This area will showcase approved previous and upcoming events as new material becomes available.", image: "/media/network-tournaments-events.webp", position: "center" },
  { id: "education-programmes", title: "Education programmes", lead: "Learning experiences that extend development beyond the pitch.", copy: "Degree pathways, professional and vocational education, workshops, school programmes, and life after football development.", image: "/media/network-education-study.webp", position: "center 45%" },
] as const;

const partners = [
  ["Clubs & academies", "Player development, recruitment, international programmes, camps, tours and football collaboration."],
  ["Universities & schools", "Student athlete programmes, school partnerships, sports development and integrated football and education opportunities."],
  ["Education providers", "Degree pathways, online education, vocational programmes, professional qualifications, masterclasses and life after football opportunities."],
  ["Technology", "Scouting, recruitment, performance, data and technology that can improve football infrastructure across the network."],
  ["Commercial & sponsorship", "Brands looking to create meaningful partnerships around football, education, community, events and Phoenix culture."],
  ["Agents & recruitment partners", "Player identification, recruitment and opportunities across international football markets."],
  ["Events, camps & tours", "Organisations looking to create football camps, showcases, tournaments, tours or bespoke international experiences with Phoenix."],
] as const;

export default function NetworkPage() {
  return <div className="final-site network-page"><SiteHeader activePage="network" /><main id="main-content">
    <section className="network-hero" aria-labelledby="network-title"><figure><Image src="/media/silves-team-huddle.webp" alt="Silves FC players gathering in a team huddle" fill priority unoptimized sizes="100vw" /></figure><div><p className="final-kicker">Phoenix Football Network</p><h1 id="network-title">One network.<br />Endless possibilities.</h1><p>The Phoenix network comes to life through football programmes, education, camps, showcases, tournaments and experiences across our international environments.</p><Link className="button button-primary" href="#partnership-enquiry">Start a partnership conversation</Link></div></section>
    <section className="credibility-rail" aria-label="Phoenix network partners"><PartnerRail partners={approvedPartnerLogos} /></section>
    <section id="programmes" className="network-motion" aria-labelledby="motion-title"><div className="network-motion-intro"><p className="final-kicker">04 / Network in motion</p><h2 id="motion-title">One network. Endless possibilities.</h2><p>The Phoenix network comes to life through football programmes, education, camps, showcases, tournaments and experiences across our international environments.</p><p className="network-intro">Some are built for players. Others are created with clubs, schools, universities, brands and organisations looking to build something with Phoenix.</p><Link className="text-link" href="#partnership-enquiry">Explore programmes & events <span aria-hidden="true">→</span></Link></div><div className="network-areas">{areas.map((area) => <article id={area.id} key={area.title}><figure><Image src={area.image} alt={`${area.title} within the Phoenix network`} fill unoptimized sizes="(max-width: 800px) 100vw, 25vw" style={"position" in area ? { objectPosition: area.position } : undefined} /></figure><div><h3>{area.title}</h3><p><strong>{area.lead}</strong></p><p>{area.copy}</p><Link className="text-link" href="#partnership-enquiry">Discuss this programme <span aria-hidden="true">→</span></Link></div></article>)}</div></section>
    <section className="build-with" aria-labelledby="build-title"><p className="final-kicker">05 / Partnerships</p><h2 id="build-title">The right people make the network stronger.</h2><p className="network-belief">The person before the player.</p><p>Our belief that the pitch builds character and education builds futures carries into every partnership. We want to work with people and organisations that share that belief and can bring something meaningful to the environments we are building.</p><div className="partner-categories">{partners.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section id="partnership-enquiry" className="assessment-section assessment-v2 network-partnership-assessment"><div className="assessment-context"><p className="final-kicker">06 / Partnership enquiry</p><h2>Build with Phoenix.</h2><p>Tell us who you represent, what you want to explore and what a useful first conversation should cover.</p><ol><li><span>01</span><strong>Introduce</strong><small>Share your organisation and partnership area.</small></li><li><span>02</span><strong>Review</strong><small>Phoenix reviews the opportunity and the potential fit.</small></li><li><span>03</span><strong>Connect</strong><small>The right person follows up about a useful next conversation.</small></li></ol></div><PathwayAssessment mode="partner" /></section>
    <section className="network-close" aria-labelledby="network-close-title"><figure><Image src="/media/network-silves-aerial.webp" alt="Aerial view of the Silves football ground and surrounding town" fill unoptimized sizes="(max-width: 800px) 100vw, 45vw" style={{ objectPosition: "center 58%" }} /></figure><div><p className="final-kicker">07 / Next step</p><h2 id="network-close-title">Bring your idea into the network.</h2><p>From a single event or education programme to a long-term football, technology or commercial partnership, we are open to working with people and organisations that share the ambition behind Phoenix.</p><div className="final-actions"><Link className="button button-primary" href="#partnership-enquiry">Start a partnership conversation</Link><Link className="button button-secondary" href="#partnership-enquiry">Build a programme or event</Link></div><p className="network-small">Football · Education · Camps · Showcases · Schools · Clubs · Technology · Sponsorship · Events</p><p className="network-small">Partnerships · Employment · General enquiries: <Link href="/contact">contact Phoenix</Link>.</p></div></section>
  </main><SiteFooter /><TrackingConsent /></div>;
}
