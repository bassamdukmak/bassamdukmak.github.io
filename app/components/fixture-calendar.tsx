/* eslint-disable @next/next/no-img-element */

import {
  fixtureOpponentTeams,
  phoenixFixtureTeam,
  phoenixLeagueFixtures,
  type FixtureTeamIdentity,
  type PhoenixFixture,
} from "../content/league-fixtures";
import styles from "./fixture-calendar.module.css";

type FixtureCalendarProps = Readonly<{
  fixtures?: readonly PhoenixFixture[];
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}>;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const smashiUrl = "https://smashi.tv/";

function formatDate(date: PhoenixFixture["date"]) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function TeamBadge({ team }: Readonly<{ team: FixtureTeamIdentity }>) {
  return (
    <div className={styles.team}>
      <span className={styles.crest}>
        {team.crest ? <img src={team.crest} alt={`${team.name} crest`} loading="lazy" /> : null}
      </span>
      <strong>{team.name}</strong>
    </div>
  );
}

export default function FixtureCalendar({
  fixtures = phoenixLeagueFixtures,
  id = "fixtures",
  eyebrow = "Match calendar",
  title = "2026/27 League Fixtures",
  description = "Third Division League · First Group",
}: FixtureCalendarProps) {
  const headingId = `${id}-title`;
  const hintId = `${id}-scroll-hint`;

  if (fixtures.length === 0) return null;

  return (
    <section id={id} className={styles.section} aria-labelledby={headingId}>
      <header className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 id={headingId}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.identity}>
          <img src="/brand/phoenix-crest.svg" width={62} height={70} alt="" aria-hidden="true" />
          <p><strong>Phoenix United FC</strong><span>{fixtures.length} fixtures · Two rounds</span></p>
        </div>
      </header>

      <p id={hintId} className={styles.hint}>Scroll horizontally to view the full season.</p>
      <div className={styles.viewport} role="region" aria-label="Phoenix United league fixtures" aria-describedby={hintId} tabIndex={0}>
        <ol className={styles.track}>
          {fixtures.map((fixture, index) => {
            const opponent = fixtureOpponentTeams[fixture.opponent] ?? { name: fixture.opponent };
            const homeTeam = fixture.location === "home" ? phoenixFixtureTeam : opponent;
            const awayTeam = fixture.location === "home" ? opponent : phoenixFixtureTeam;

            return (
              <li className={styles.card} key={fixture.matchCode}>
                <div className={styles.cardTopline}>
                  <span className={styles.matchNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span>Round {fixture.round} · Week {fixture.week}</span>
                </div>
                <time className={styles.date} dateTime={`${fixture.date}T${fixture.time}`}>{formatDate(fixture.date)}</time>
                <div className={styles.matchup} aria-label={`${homeTeam.name} versus ${awayTeam.name}`}>
                  <TeamBadge team={homeTeam} />
                  <span className={styles.versus}>VS</span>
                  <TeamBadge team={awayTeam} />
                </div>
                <dl className={styles.details}>
                  <div><dt>Kick-off</dt><dd>{fixture.time}</dd></div>
                  <div><dt>Venue</dt><dd>{fixture.venue}</dd></div>
                </dl>
                <a className={styles.streamLink} href={fixture.streamUrl ?? smashiUrl} target="_blank" rel="noreferrer">Watch on Smashi TV <span aria-hidden="true">↗</span></a>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
