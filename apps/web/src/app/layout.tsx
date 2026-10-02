import './global.css';
import './template.css';
import { ThemeProvider } from '../components/theme';
import { ToastProvider } from '../components/ui/toaster';
import { DemoWorkspace } from '../components/demo-workspace';
import { TemplateMotion } from '../components/template-motion';
export const metadata = {
  title: 'RevuPing — Review requests, feedback & replies',
  description:
    'A thoughtful way to collect feedback, request reviews, and keep every customer conversation moving. Interactive frontend demo.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <DemoWorkspace>
              <TemplateMotion>{children}</TemplateMotion>
            </DemoWorkspace>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
