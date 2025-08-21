import AzureADProvider from "next-auth/providers/azure-ad";
import { OAuthConfig } from "next-auth";

export function azureADAuthProvider(): OAuthConfig<any> {
  if (
    !process.env.AZURE_AD_CLIENT_ID ||
    !process.env.AZURE_AD_CLIENT_SECRET ||
    !process.env.AZURE_AD_TENANT_ID
  ) {
    throw new Error("Azure AD OAuth environment variables are not set");
  }

  return AzureADProvider({
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    tenantId: process.env.AZURE_AD_TENANT_ID,
  });
}
