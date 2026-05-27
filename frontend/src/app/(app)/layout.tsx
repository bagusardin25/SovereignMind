import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

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
        <main className="flex-1 overflow-y-auto bg-[#0f141b] bg-grid-pattern pb-16 md:pb-0">
          {/* Removed decorative orbs per user request */}

          <div className="relative z-10 p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
