import { GlobalProvider } from "@/context/GlobalProvider";
import "./globals.css"; // Make sure you pasted your old index.css content here!

export const metadata = {
  title: "MovieMania",
  description: "Stream your favorite movies and anime",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#000000] text-[#e5e5e5] font-poppins antialiased">
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}


