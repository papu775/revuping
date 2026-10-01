import './global.css';
export const metadata = {
  title: 'RevuPing — Good experiences deserve to be heard.',
  description:
    'A thoughtful way to collect feedback, request reviews, and keep every customer conversation moving. Interactive frontend demo.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
