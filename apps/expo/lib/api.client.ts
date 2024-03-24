import type { AppType } from "api/src/index";
import { hc } from "hono/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

class ApiClientSingleton {
  public client = hc<AppType>(API_URL);

  public addSessionToken = (sessionToken: string) => {
    this.client = hc<AppType>(API_URL, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      fetch: async (input: RequestInfo | URL, requestInit?: RequestInit<CfProperties<unknown>> | undefined) => {
        const now = new Date();
        console.log("[Request]", String(input).replace(API_URL, ""));
        const response = await fetch(input, requestInit);
        console.log("[Response]", response.status, response.statusText, `${new Date().getTime() - now.getTime()}ms`);
        return response;
      },
    });
  };
}

export const Api = new ApiClientSingleton();
