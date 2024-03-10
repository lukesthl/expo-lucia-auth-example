import type { Lucia, Session, User } from "lucia";

import type { DatabaseUserAttributes, initializeLucia } from "./auth/lucia-auth";
import type { Database } from "./database/db";
import type { Env } from "./env";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Variables = {
  db: Database;
  user: (User & DatabaseUserAttributes) | null;
  session: Session | null;
  lucia: Lucia<DatabaseUserAttributes>;
};

export interface AppContext {
  Bindings: Env;
  Variables: Variables;
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
