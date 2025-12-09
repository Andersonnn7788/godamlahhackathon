import { Header } from '@/components/ui/Header';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 SmartSign • Developed for NexG Godamlah Hackathon
            </p>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400">
                Terms of Service
              </a>
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}


