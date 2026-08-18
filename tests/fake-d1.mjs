const LEAD_COLUMNS = [
  "id",
  "idempotency_key",
  "lead_type",
  "applicant_role",
  "guardian_name",
  "full_name",
  "email",
  "phone",
  "country",
  "date_of_birth",
  "nationality",
  "player_age",
  "preferred_route",
  "preferred_hub",
  "accommodation_preference",
  "position",
  "current_club",
  "playing_level",
  "highlight_url",
  "education_level",
  "intended_study",
  "preferred_intake",
  "readiness_timeline",
  "budget_readiness",
  "family_support",
  "referral_name",
  "collection_interest",
  "goal",
  "organization",
  "partner_interest",
  "message",
  "contact_preference",
  "consent",
  "source_url",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "language",
  "timezone",
  "form_variant",
  "crm_status",
  "crm_response",
  "crm_attempts",
  "crm_last_attempt_at",
  "created_at",
  "updated_at",
];

const TEXT_DEFAULT_COLUMNS = LEAD_COLUMNS.filter(
  (column) =>
    !["id", "player_age", "consent", "crm_attempts"].includes(column),
);

function normalized(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

function identifiers(list) {
  return list
    .split(",")
    .map((item) => [...item.matchAll(/"([^"]+)"/g)].at(-1)?.[1])
    .filter(Boolean);
}

function selectedColumns(sql) {
  const match = normalized(sql).match(/^select (.+?) from "leads"/i);
  return match ? identifiers(match[1]) : [];
}

function insertedColumnsAndValues(sql) {
  const match = normalized(sql).match(
    /^insert into "leads" \((.+?)\) values \((.+?)\)(?: returning|$)/i,
  );
  if (!match) return null;
  return {
    columns: identifiers(match[1]),
    values: match[2].split(",").map((value) => value.trim()),
  };
}

class FakeD1Statement {
  constructor(database, sql, params = []) {
    this.database = database;
    this.sql = sql;
    this.params = params;
  }

  bind(...params) {
    return new FakeD1Statement(this.database, this.sql, params);
  }

  async all() {
    if (/^pragma table_info\(leads\)/i.test(normalized(this.sql))) {
      return {
        results: LEAD_COLUMNS.map((name, cid) => ({ cid, name })),
        success: true,
      };
    }
    return {
      results: (await this.raw()).map((row) =>
        Object.fromEntries(
          selectedColumns(this.sql).map((column, index) => [column, row[index]]),
        ),
      ),
      success: true,
    };
  }

  async raw() {
    const sql = normalized(this.sql);

    if (/^select .+ from "leads"/i.test(sql)) {
      let rows = [...this.database.leads];
      if (sql.includes('"leads"."idempotency_key" = ?')) {
        rows = rows.filter((row) => row.idempotency_key === this.params[0]);
      } else if (sql.includes('"leads"."crm_status" = ?')) {
        if (this.database.failQueuedSelect) {
          throw new Error("Simulated queue read failure");
        }
        rows = rows.filter((row) => row.crm_status === this.params[0]);
      }
      if (/order by "leads"."created_at"/i.test(sql)) {
        rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
      }
      if (/ limit \?$/i.test(sql)) {
        rows = rows.slice(0, Number(this.params.at(-1)));
      }
      const columns = selectedColumns(sql);
      return rows.map((row) => columns.map((column) => row[column]));
    }

    const insert = insertedColumnsAndValues(sql);
    if (insert) {
      const now = new Date().toISOString();
      const row = Object.fromEntries(TEXT_DEFAULT_COLUMNS.map((key) => [key, ""]));
      Object.assign(row, {
        id: this.database.nextLeadId++,
        player_age: null,
        consent: 0,
        crm_attempts: 0,
        crm_status: "queued",
        language: "en",
        created_at: now,
        updated_at: now,
      });

      let parameterIndex = 0;
      insert.columns.forEach((column, index) => {
        const expression = insert.values[index];
        if (expression === "?") {
          row[column] = this.params[parameterIndex++];
        } else if (/^null$/i.test(expression)) {
          if (column !== "id") row[column] = null;
        } else if (/^current_timestamp$/i.test(expression)) {
          row[column] = now;
        }
      });

      if (
        this.database.leads.some(
          (lead) => lead.idempotency_key === row.idempotency_key,
        )
      ) {
        throw new Error("UNIQUE constraint failed: leads.idempotency_key");
      }
      this.database.leads.push(row);
      this.database.events.push({ type: "insert", id: row.id });

      const returningMatch = sql.match(/ returning (.+)$/i);
      const returning = returningMatch ? identifiers(returningMatch[1]) : [];
      return [returning.map((column) => row[column])];
    }

    return [];
  }

  async run() {
    const sql = normalized(this.sql);
    const match = sql.match(/^update "leads" set (.+?) where "leads"."id" = \?$/i);
    if (!match) return { success: true, meta: { changes: 0 } };

    const columns = identifiers(match[1]);
    const id = this.params.at(-1);
    const row = this.database.leads.find((lead) => lead.id === id);
    if (!row) return { success: true, meta: { changes: 0 } };

    columns.forEach((column, index) => {
      row[column] = this.params[index];
    });
    this.database.events.push({
      type: "update",
      id,
      crmStatus: row.crm_status,
    });
    return { success: true, meta: { changes: 1 } };
  }

  async first() {
    if (/^insert into lead_rate_limits /i.test(normalized(this.sql))) {
      const [bucketKey, expiresAt] = this.params;
      const current = this.database.rateLimits.get(bucketKey);
      const count = (current?.count ?? 0) + 1;
      this.database.rateLimits.set(bucketKey, { count, expiresAt });
      return { count };
    }
    const result = await this.all();
    return result.results[0] ?? null;
  }
}

export class FakeD1 {
  constructor() {
    this.leads = [];
    this.events = [];
    this.nextLeadId = 1;
    this.failQueuedSelect = false;
    this.rateLimits = new Map();
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.run()));
  }
}
