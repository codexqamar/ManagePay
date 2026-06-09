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
              const extensionAttributeNames = new Set([
                "cz-shortcut-listen",
                "data-gr-ext-installed",
                "data-new-gr-c-s-check-loaded"
              ]);

              const clean = (element) => {
                for (const attribute of Array.from(element.attributes || [])) {
                  if (
                    attribute.name.startsWith("bis_") ||
                    attribute.name.startsWith("__processed_") ||
                    extensionAttributeNames.has(attribute.name)
                  ) {
                    element.removeAttribute(attribute.name);
                  }
                }
              };

              const cleanTree = (root = document) => {
                clean(document.documentElement);
                if (document.body) clean(document.body);

                if ("querySelectorAll" in root) {
                  root.querySelectorAll("*").forEach(clean);
                }
              };

              cleanTree();

              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  if (mutation.type === "attributes") {
                    clean(mutation.target);
                  }

                  for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      clean(node);
                      cleanTree(node);
                    }
                  }
                }
              });

              observer.observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true
              });

              window.addEventListener("load", () => {
                cleanTree();
                window.setTimeout(() => observer.disconnect(), 3000);
              });
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
