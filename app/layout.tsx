import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './motion.css';
import './interface.css';
const dmSans = localFont({ src: '../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', weight: '100 1000', display: 'swap', variable: '--font-ui' });
export const metadata: Metadata = { title: 'Forma — A little more flow.', description: 'An interactive salon booking and management demo. Make room for your best work.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={dmSans.variable}><body>{children}</body></html>; }
