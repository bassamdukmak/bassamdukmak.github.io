import type { Metadata } from "next";
import Image from "next/image";
import PartnerRail from "../components/partner-rail";
import PathwayAssessment from "../components/pathway-assessment";
import { SiteFooter, SiteHeader, TrackingConsent } from "../components/site-chrome";
import { approvedPartnerLogos } from "../content/site-content";

export const metadata: Metadata = {
  title: { absolute: "Phoenix Football Network | Football. Degree. Pathway." },
  description: "Train and compete in a real club environment, with football-only and degree pathways across the Phoenix Football Network.",
  alternates: { canonical: "/pathway" },
};

const environments = [
  {
    place: "Dubai, UAE",
    club: "Phoenix United FC",
    title: "Compete in Dubai.",
    copy: "A UAE FA-licensed competitive environment at the home of Phoenix.",
    lines: ["UAE FA registration", "UAE Third Division", "Competitive match programme", "Performance and recruitment exposure"],
    image: "/images/dubai-hub.jpg",
    cta: "Explore Dubai",
  },
  {
    place: "Silves, Algarve",
    club: "Silves FC",
    title: "Enter the European game.",
    copy: "Live and compete inside a Portuguese football club with more than a century of history.",
    lines: ["Portuguese FA registration", "A.F. Algarve 1ª Divisão", "Official league and cup football", "Residential football environment"],
    image: "/media/silves-stadium.webp",
    cta: "Explore Silves",
  },
  {
    place: "Manchester, UK",
    club: "Radcliffe FC",
    title: "Enter the English game.",
    copy: "A new Phoenix Football Network environment in Manchester.",
    lines: ["English football environment", "Manchester, UK", "Part of the Phoenix Football Network", "Opening January 2027"],
    image: "/images/manchester-hub.jpg",
    cta: "Register interest",
  },
];

const programme = [
  { number: "01", title: "Train", lead: "Work on the player.", copy: "Structured football training, technical development and coaching designed around the demands of the game." },
  { number: "02", title: "Compete", lead: "Earn your place.", copy: "Official registration and competitive match opportunities inside the football environment you join." },
  { number: "03", title: "Perform", lead: "Understand your game. Improve it.", copy: "Strength and conditioning, tactical analysis, filmed matches and individual development reviews." },
  { number: "04", title: "Live", lead: "Focus on football.", copy: "Accommodation, transport, recovery, welfare and day-to-day support designed to take unnecessary distractions away from the player." },
  { number: "05", title: "Study", lead: "Build while you compete.", copy: "For Football + Degree players, academic study is structured around the football week." },
];

const outcomes = [
  { number: "01", title: "Professional football", lead: "Keep chasing the game.", copy: "Compete, develop and earn opportunities to progress through Phoenix environments, partner clubs and the wider professional game. Nothing is guaranteed. Opportunities are earned.", images: [{ src: "/media/pathway-player-signing.webp", alt: "Phoenix United player signing with the club" }, { src: "/media/pathway-graduate-footballer.webp", alt: "Graduate in a cap and gown balancing a football" }] },
  { number: "02", title: "US scholarship", lead: "Play. Study. Compete.", copy: "Access the American college pathway through Phoenix's recruitment network and continue competing while working towards your education.", image: "/media/founders-media-day.jpeg" },
  { number: "03", title: "A career in sport", lead: "Stay in the game.", copy: "Build towards opportunities across coaching, performance, scouting, recruitment, football operations and sports business.", image: "/media/phoenix-leadership-duo.webp" },
  { number: "04", title: "Internships and employment", lead: "Build experience beyond the pitch.", copy: "Gain practical experience through internships, work experience and employment connections across the Phoenix community and wider partner network.", image: "/media/manchester-partnership.webp" },
  { number: "05", title: "Personal development", lead: "Build the person. Not just the player.", copy: "Build discipline, independence, resilience, confidence, leadership, relationships and direction. The player matters. The person matters more.", image: "/media/instagram-latest/training-touch.webp" },
];

const faqs = [
  ["Can I join without studying for a degree?", "Yes. The Pro Football Pathway is designed for players who want to focus entirely on football. The Football + Degree pathway combines the same football ambition with university study."],
  ["Can I choose Dubai, Silves or Manchester?", "Yes. You can apply for your preferred environment or ask Phoenix to recommend one. Availability and the final recommendation depend on your profile, ambitions and programme fit."],
  ["Is playing time guaranteed?", "No. You are paying for the environment and programme, not minutes on the pitch. Selection and playing time are earned through performance, attitude and the decisions of the coaching staff."],
  ["Does Phoenix guarantee a professional contract?", "No. Phoenix provides the environment, development, competition, exposure and network. What comes from that still has to be earned."],
  ["Who is the programme for?", "The current Phoenix Football Network programme is designed for serious players aged 18–25 who want to continue competing while building more than one route for their future."],
];

export default function PathwayPage() {
  return <div className="final-site pathway-page pathway-v2"><SiteHeader activePage="pathway" /><main id="main-content">
    <section className="pathway-hero" aria-labelledby="pathway-hero-title"><div className="pathway-hero-copy"><p className="final-kicker">Phoenix Football Network</p><h1 id="pathway-hero-title">Football.<br />Degree.<br />Pathway.</h1><p className="pathway-hero-lede">Train with purpose. Play with direction.</p><p className="pathway-v2-intro">Train and compete in a real club environment. Choose the football-only route or combine the game with a university degree. Wherever you enter the network, the objective is the same: develop as a player and leave with more than one way forward.</p><div className="final-actions"><a className="button button-primary" href="#assessment">Request a Player Evaluation</a><a className="button button-secondary" href="/contact">Speak to the Team</a></div></div><figure className="pathway-hero-media"><Image src="/media/pathway-ball-hero.jpg" alt="Footballer balancing a ball during training" fill priority unoptimized sizes="(max-width: 820px) 100vw, 58vw" /></figure></section>

    <section className="credibility-rail" aria-label="Phoenix network"><PartnerRail partners={approvedPartnerLogos} /></section>

    <section className="pathway-model-v2" aria-labelledby="model-title"><div className="pathway-chapter-heading"><p className="final-kicker">01 / The model</p><h2 id="model-title">Football.<br />Degree.<br />Pathway.</h2></div><div className="model-v2-list"><article><span>01</span><h3>Football</h3><strong>Take the game seriously.</strong><p>Train, compete and earn your place inside a real football environment.</p></article><article><span>02</span><h3>Degree</h3><strong>Build while you play.</strong><p>Work towards an accredited university degree without stepping away from football.</p></article><article><span>03</span><h3>Pathway</h3><strong>Create options.</strong><p>Use the Phoenix network to build routes in football, education and life beyond playing.</p></article><div className="model-v2-visuals"><figure className="model-v2-signing"><Image src="/media/pathway-player-signing.webp" alt="Phoenix United player signing with the club" fill unoptimized sizes="(max-width: 900px) 88vw, 34vw" /></figure><figure className="model-v2-graduate"><Image src="/media/pathway-graduate-footballer.webp" alt="Graduate in a cap and gown balancing a football" fill unoptimized sizes="(max-width: 900px) 62vw, 22vw" /></figure></div></div></section>

    <section id="routes" className="network-environments pathway-network-v2" aria-labelledby="env-title"><div className="environment-heading"><div><p className="final-kicker">02 / The network</p><h2 id="env-title">Three clubs.<br />One network.</h2></div><p><strong>Choose your environment. Choose your pathway.</strong><br />Three different football environments. One connected network. There is no fixed sequence. Enter where the opportunity and environment fit you, then build from there.</p></div><div className="environment-list">{environments.map((entry) => <article key={entry.club}><figure><Image src={entry.image} alt={`${entry.club} environment`} fill unoptimized sizes="(max-width: 820px) 100vw, 33vw" /></figure><p>{entry.place}</p><h3>{entry.club}</h3><h4>{entry.title}</h4><p>{entry.copy}</p><ul>{entry.lines.map((line) => <li key={line}>{line}</li>)}</ul><a className="text-link" href="/network#football-programmes">{entry.cta} <span aria-hidden="true">→</span></a></article>)}</div><aside className="manchester-connection">The relationship goes beyond a programme partnership. Members of the Radcliffe FC ownership group are also investors in Phoenix United, creating a direct football connection between Manchester and Dubai.</aside></section>

    <section className="two-ways pathway-two-v2" aria-labelledby="ways-title"><div className="pathway-chapter-heading"><p className="final-kicker">Two ways to join</p><h2 id="ways-title">Three environments.<br />Two pathways.<br />One network.</h2></div><div className="pathway-two-options"><article><span>01</span><h3>Football + Degree</h3><strong>Play seriously. Graduate alongside it.</strong><p>Combine the football programme with an accredited university degree built around the demands of the football week.</p></article><article><span>02</span><h3>Pro Football Pathway</h3><strong>Football first.</strong><p>A football-only route for players whose priority is to push their game as far as they can.</p></article></div></section>

    <section className="inside-v2" aria-labelledby="inside-title"><div className="inside-v2-heading"><p className="final-kicker">03 / Inside the programme</p><h2 id="inside-title">Built around the game.</h2><p>Football is the foundation. Everything around it is there to support your development on the pitch and what you build beyond it.</p></div><div className="inside-v2-grid">{programme.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><strong>{item.lead}</strong><p>{item.copy}</p></article>)}</div><figure><Image src="/media/dubai-training-pitches.webp" alt="Phoenix football training pitches in Dubai" fill unoptimized sizes="100vw" /></figure><p className="inside-v2-locations">Dubai <i /> Silves <i /> Manchester <small>Programme delivery and facilities vary by environment.</small></p></section>

    <section className="outcomes-v2" aria-labelledby="outcomes-title"><div className="outcomes-v2-heading"><p className="final-kicker">04 / The outcomes</p><h2 id="outcomes-title">More than one way forward.</h2><p>Success does not look the same for every player. Phoenix is built so the years you invest in the game can create options rather than leave your future dependent on one result.</p></div><div className="outcomes-v2-grid">{outcomes.map((item) => <article key={item.number}><figure className={"images" in item ? "outcome-image-stack" : undefined}>{"images" in item ? item.images.map((image, index) => <span className={index === 0 ? "outcome-stack-signing" : "outcome-stack-graduate"} key={image.src}><Image src={image.src} alt={image.alt} fill unoptimized sizes="(max-width: 800px) 72vw, 16vw" /></span>) : <Image src={item.image} alt="" fill unoptimized sizes="(max-width: 800px) 100vw, 20vw" />}</figure><span>{item.number}</span><h3>{item.title}</h3><strong>{item.lead}</strong><p>{item.copy}</p></article>)}</div><p className="outcomes-statement">The goal is not one outcome.<br /><strong>The goal is to leave with options.</strong></p></section>

    <section id="assessment" className="assessment-section assessment-v2"><div className="assessment-context"><p className="final-kicker">05 / Your next step</p><h2>Earn your place.</h2><p>Every application begins with an evaluation. We review your football background, ambitions and preferred environment, then decide whether there is a fit and what the right next step should be.</p><ol><li><span>01</span><strong>Apply</strong><small>Tell us who you are and where you are in your football journey.</small></li><li><span>02</span><strong>Evaluation</strong><small>Our team reviews your playing background, footage and ambitions.</small></li><li><span>03</span><strong>Recommendation</strong><small>If there is a fit, we recommend the environment and pathway that makes the most sense for you.</small></li></ol></div><PathwayAssessment mode="player" /></section>

    <section className="faq-v2" aria-labelledby="faq-title"><div><p className="final-kicker">06 / FAQ</p><h2 id="faq-title">Before you apply.</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>

    <section className="pathway-end-v2"><p className="final-kicker">The person before the player.</p><h2>Football can shape who you become.<br />Your future should never depend on one outcome.</h2><strong>Football. Degree. Pathway.</strong><a className="button button-primary" href="#assessment">Request a Player Evaluation</a></section>
  </main><SiteFooter /><TrackingConsent /></div>;
}
