// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Env = {
  DB: D1Database;
  WORKER_ENV: "production" | "development";
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};
