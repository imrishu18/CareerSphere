import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { dark } from "@clerk/themes";
import AuthStorageCleanup from "@/components/auth-storage-cleanup";

export const metadata = {
  metadataBase: new URL("https://careersphere.ai"),
  title: "CareerSphere - AI-Powered Career Readiness Platform",
  description:
    "CareerSphere helps students and professionals become career-ready with AI resume tools, interview preparation, industry insights, and career guidance.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "CareerSphere - AI-Powered Career Readiness Platform",
    description:
      "Build ATS-ready resumes, match jobs, generate cover letters, and prepare for interviews with an AI-powered career readiness platform.",
    url: "https://careersphere.ai",
    siteName: "CareerSphere",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "CareerSphere Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className="bg-gradient-to-b from-gray-950 via-slate-950 to-black text-foreground antialiased"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <AuthStorageCleanup />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <footer className="relative border-t border-white/10 bg-background/80 py-8 backdrop-blur-xl">
              <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-center text-sm text-muted-foreground md:flex-row md:text-left">
                <div>
                  <p className="font-semibold tracking-[0.18em] text-foreground">
                    CAREERSPHERE
                  </p>
                  <p className="mt-1 text-xs">
                    AI-powered career readiness for resumes, interviews, and job preparation.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  CareerSphere. All rights reserved.
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400" />
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
