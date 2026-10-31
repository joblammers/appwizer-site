import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

/** Clerk alleen binnen /admin; de publieke site laadt Clerk niet. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#DF7D3C" } }}>
      {children}
    </ClerkProvider>
  );
}
