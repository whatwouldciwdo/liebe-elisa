import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ausify Your Algo | Search. Listen. Defy. #Ausify',
  description:
    'Your destination for searching and discovering Australian music. Find new Aussie artists, bands, and homegrown talent from Melbourne, Sydney, Brisbane and beyond. Ausify your algo.',
  keywords: [
    'Australian music',
    'Ausmusic',
    'Ausify',
    'Aussie artists',
    'Indie music',
    'Music algorithm',
  ],
  authors: [{ name: 'Ausify Team' }],
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        <link
          rel="preload"
          href="/fonts/InstrumentSerif-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/InstrumentSerif-Italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/MerchantCopyRegisteredItalic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/MerchantCopyDoublesize.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen w-screen overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}
