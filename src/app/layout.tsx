import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster" // <-- Import Toaster

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          // Remove font variables if they were causing issues
          // fontInter.variable,
          // fontSpaceGrotesk.variable
        )}
      >
        {children}
        <Toaster /> {/* <-- Add Toaster here */}
      </body>
    </html>
  );
}

