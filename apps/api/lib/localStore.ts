import { randomUUID } from 'crypto';

// Lets the app run fully free/offline: with no SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY set,
// scenes/targets/games are kept in memory for the life of the dev server process instead
// of Supabase's Postgres. Data resets whenever the process restarts.
export function isLocalStorageMode(): boolean {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

type Row = Record<string, any> & { id: string };

const tables = new Map<string, Map<string, Row>>();

function tableMap(name: string): Map<string, Row> {
  if (!tables.has(name)) {
    tables.set(name, new Map());
  }
  return tables.get(name)!;
}

/**
 * Minimal stand-in for the handful of chained supabase-js query-builder calls db.ts
 * actually uses (select/insert/update, eq, order, limit, single/maybeSingle, the
 * `{count:'exact', head:true}` pattern). Not a general PostgREST reimplementation.
 */
class LocalQueryBuilder implements PromiseLike<{ data: any; error: null; count?: number }> {
  private mode: 'select' | 'insert' | 'update' = 'select';
  private payload: Record<string, unknown> = {};
  private filters: [string, unknown][] = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitN?: number;
  private wantCount = false;
  private singleMode: 'single' | 'maybeSingle' | null = null;

  constructor(private tableName: string) {}

  select(_columns?: string, opts?: { count?: string; head?: boolean }) {
    if (this.mode === 'select' && opts?.count) {
      this.wantCount = true;
    }
    return this;
  }

  insert(row: Record<string, unknown>) {
    this.mode = 'insert';
    this.payload = row;
    return this;
  }

  update(row: Record<string, unknown>) {
    this.mode = 'update';
    this.payload = row;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  private matching(): Row[] {
    let rows = Array.from(tableMap(this.tableName).values()).filter((row) =>
      this.filters.every(([key, value]) => row[key] === value)
    );
    if (this.orderCol) {
      const col = this.orderCol;
      rows = [...rows].sort((a, b) => (this.orderAsc ? a[col] - b[col] : b[col] - a[col]));
    }
    if (this.limitN != null) {
      rows = rows.slice(0, this.limitN);
    }
    return rows;
  }

  private execute(): { data: any; error: null; count?: number } {
    if (this.mode === 'insert') {
      const row: Row = { id: randomUUID(), ...this.payload };
      tableMap(this.tableName).set(row.id, row);
      return { data: this.singleMode ? row : [row], error: null };
    }

    if (this.mode === 'update') {
      const rows = this.matching();
      const updated = rows.map((row) => {
        const merged = { ...row, ...this.payload };
        tableMap(this.tableName).set(row.id, merged);
        return merged;
      });
      return { data: this.singleMode ? updated[0] ?? null : updated, error: null };
    }

    const rows = this.matching();
    if (this.wantCount) {
      return { data: null, error: null, count: rows.length };
    }
    if (this.singleMode) {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  then<TResult1, TResult2 = never>(
    onFulfilled?: (value: { data: any; error: null; count?: number }) => TResult1 | PromiseLike<TResult1>,
    onRejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onFulfilled, onRejected);
  }
}

export function localTable(name: string): LocalQueryBuilder {
  return new LocalQueryBuilder(name);
}
