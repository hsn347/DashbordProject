import { Users, UserCheck, Activity, ShieldAlert, FileText, Image, Folder, Search, Bell, MessageSquareText, Sun, Moon } from "lucide-react";
import { useStats } from "../hooks/useStats";
import { useAuthProfile } from "../hooks/useAuthProfile";

const Home = () => {
  const { data: stats, isLoading } = useStats();
  const { data: profile, isLoading: isLoadingProfile } = useAuthProfile();

  const cards = [
    { label: "إجمالي المستخدمين", value: stats?.users || 0, icon: Users, color: "text-accent-primary", bg: "bg-accent-primary/10" },
    { label: "المستخدمين النشطين", value: stats?.activeUsers || 0, icon: UserCheck, color: "text-accent-secondary", bg: "bg-accent-secondary/10" },
    { label: "معدل الحماية", value: "98.2%", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "التنبيهات الأمنية", value: "12", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "التقارير المولدة", value: stats?.products || 0, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "الصور الممسوحة", value: "1,204", icon: Image, color: "text-indigo-500", bg: "bg-indigo-indigo/10" },
    { label: "المجلدات", value: "66%", icon: Folder, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  // Initialize theme based on document class


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="font-bold text-text-primary text-3xl">
          Welcome! {isLoadingProfile ? "..." : (profile?.full_name || "User")}
        </h1>
        <p className="mt-1 text-text-muted">Security is a process, not a product.</p>
      </div>

      {/* 1. Risk / Stats Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-text-primary text-lg">Current Risk</h3>
          <button className="bg-bg-surface px-3 py-1.5 border border-border-subtle hover:border-accent-primary rounded-lg text-text-secondary text-xs transition-colors">Daily</button>
        </div>

        <div className="gap-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
          {cards.map((card, index) => (
            <div key={index} className="group bg-bg-surface p-5 border border-border-subtle hover:border-accent-primary/30 rounded-4xl transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-full ${card.bg} ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <div className="text-text-muted">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="mb-1 font-bold text-text-primary text-2xl">
                  {isLoading ? "..." : card.value || "0"}
                </h3>
                <p className="font-medium text-text-muted text-xs">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="relative flex flex-col lg:col-span-2 bg-bg-surface p-8 border border-border-subtle rounded-4xl h-80 overflow-hidden">
          <div className="z-10 flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary text-lg">Threat Summary</h3>
            <button className="bg-bg-surface hover:bg-bg-surface-hover px-3 py-1.5 border border-border-subtle rounded-lg text-text-secondary text-xs transition-colors">Yearly</button>
          </div>

          {/* Mock Chart Line */}
          <div className="z-10 flex flex-1 justify-between items-end gap-1 px-2 pb-2">
            {[40, 60, 45, 70, 50, 60, 80, 55, 65, 50, 75, 60].map((h, i) => (
              <div key={i} className="group relative bg-linear-to-t rounded-t-sm w-full from-accent-primary/20 to-accent-primary/5" style={{ height: `${h}%` }}>
                <div className="top-0 right-0 left-0 absolute opacity-0 group-hover:opacity-100 h-1 transition-opacity bg-accent-primary/50"></div>
              </div>
            ))}
          </div>

          {/* Background decoration */}
          <div className="top-0 left-0 absolute to-bg-main/50 bg-linear-to-b from-transparent w-full h-full pointer-events-none"></div>
        </div>

        {/* Side Stats */}
        <div className="relative flex flex-col justify-between bg-bg-surface p-8 border border-border-subtle rounded-4xl overflow-hidden text-text-primary">
          <div className="z-10 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Risk Score</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
            </div>

            <div className="relative flex justify-center items-center my-4">
              {/* Gauge Placeholder */}
              <div className="flex justify-center items-center border-12 border-bg-main border-t-accent-secondary border-r-accent-primary rounded-full w-32 h-32">
                <div className="text-center">
                  <span className="block font-bold text-text-primary text-2xl">741</span>
                  <span className="bg-orange-400/10 px-2 py-0.5 rounded-full text-orange-400 text-xs">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom List (Threat Details) */}
      <div className="bg-bg-surface p-8 border border-border-subtle rounded-4xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-text-primary text-lg">Threat Details</h3>
          <button className="bg-bg-surface hover:bg-bg-surface-hover px-3 py-1.5 border border-border-subtle rounded-lg text-text-secondary text-xs transition-colors">Daily</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-border-subtle border-b text-text-muted text-xs">
                <th className="pb-4 pl-2 font-medium">Date</th>
                <th className="pb-4 font-medium">Device ID</th>
                <th className="pb-4 font-medium">Virus Name</th>
                <th className="pb-4 font-medium">File Path</th>
                <th className="pb-4 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3].map((_, i) => (
                <tr key={i} className="group hover:bg-bg-surface-hover transition-colors">
                  <td className="py-4 pl-2 text-text-secondary">12-05-2024</td>
                  <td className="py-4 font-medium text-text-primary">crazyfish228</td>
                  <td className="py-4 text-rose-400">Code Red</td>
                  <td className="py-4 max-w-[150px] text-text-muted truncate">C:/Users/opendoc/file</td>
                  <td className="py-4 text-text-secondary">Jpeg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Home;