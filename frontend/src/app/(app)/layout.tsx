import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 md:ml-[240px] flex flex-col overflow-hidden transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#0f141b] bg-grid-pattern">
          {/* Decorative orbs */}
          <div className="fixed top-20 right-20 w-96 h-96 rounded-full bg-[var(--color-agent-ceo)]/20 blur-[120px] animate-float pointer-events-none mix-blend-screen" />
          <div className="fixed bottom-20 left-80 w-80 h-80 rounded-full bg-[var(--color-agent-cfo)]/20 blur-[100px] animate-float-delayed pointer-events-none mix-blend-screen" />

          <div className="relative z-10 p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
