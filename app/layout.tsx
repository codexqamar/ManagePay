import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { Providers } from "./providers"
import ClientLayout from "./client-layout"
import "./globals.css"

export const metadata: Metadata = {
  title: "ExpensePay",
  description: "A expense management software with invoice generator",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <Script id="clean-extension-attributes" strategy="beforeInteractive">
          {`
            (() => {
              const clean = (element) => {
                for (const attribute of Array.from(element.attributes || [])) {
                  if (
                    attribute.name.startsWith("bis_") ||
                    attribute.name.startsWith("__processed_") ||
                    attribute.name === "cz-shortcut-listen"
                  ) {
                    element.removeAttribute(attribute.name);
                  }
                }
              };

              clean(document.documentElement);
              if (document.body) clean(document.body);
              document.querySelectorAll("*").forEach(clean);
            })();
          `}
        </Script>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
