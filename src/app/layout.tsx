import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

import { Provider } from "./provider";
import Header from "@/components/header/Header";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const RobotoSans = Roboto({
  variable: "--font-Roboto-sans",
  subsets: ["latin"],
});

const RobotoMono = Roboto_Mono({
  variable: "--font-Roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Media Catalogue",
  description:
    "A personal catalogue for all the different media that I consume e.g movies, tv shows, animes etc",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body
        className={`${RobotoSans.variable} ${RobotoMono.variable} h-full font-[family-name:var(--font-Roboto-sans)] antialiased`}
      >
        <Provider session={session}>
            <Header />
            {children}
        </Provider>
      </body>
    </html>
  );
}
