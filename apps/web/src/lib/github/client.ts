import { OAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export function githubAuthProvider(): OAuthConfig<any> {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error("GitHub OAuth environment variables are not set");
  }

  return GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  });
}
