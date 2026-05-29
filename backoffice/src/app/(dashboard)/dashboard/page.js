import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import VersionManager from './VersionManager';
import DashboardGraph from './DashboardGraph';
import ContactMessagesPanel from './ContactMessagesPanel';


export const revalidate = 0; // opt out of static rendering

function StatIcon({ type }) {
  const icons = {
    published: (
      <>
        <rect x="5" y="6" width="14" height="12" rx="2.5" />
        <path d="m10 10 4 2-4 2v-4Z" />
      </>
    ),
    episodes: (
      <>
        <rect x="5" y="5" width="14" height="14" rx="2.5" />
        <path d="M8 9h8M8 12h8M8 15h5" />
      </>
    ),
    draft: (
      <>
        <path d="M7 5h7l3 3v11H7V5Z" />
        <path d="M14 5v4h4M9 13h6M9 16h4" />
      </>
    ),
    warning: (
      <>
        <path d="M12 5 20 19H4L12 5Z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
  };

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {icons[type]}
    </svg>
  );
}

function StatCard({ label, value, tone, icon }) {
  const tones = {
    indigo: {
      card: 'bg-[linear-gradient(135deg,#1c2452,#151a3e)] border-[#4653a3]/60 hover:border-[#6C72FF]/70',
      icon: 'border-[#4e6cff]/50 bg-[#2446a6]/35 text-[#76a0ff] shadow-[0_0_24px_rgba(92,133,241,0.22)]',
      label: 'text-[#bfc8ff]',
    },
    blue: {
      card: 'bg-[linear-gradient(135deg,#17294e,#151d3f)] border-[#3f75b8]/50 hover:border-[#60a5fa]/70',
      icon: 'border-[#3b82f6]/45 bg-[#1f5fa8]/30 text-[#7cc7ff] shadow-[0_0_24px_rgba(96,165,250,0.2)]',
      label: 'text-[#b9dcff]',
    },
    teal: {
      card: 'bg-[linear-gradient(135deg,#17384a,#141d3d)] border-[#3b9ea4]/45 hover:border-[#2dd4bf]/70',
      icon: 'border-[#2dd4bf]/45 bg-[#167f7f]/28 text-[#7fffee] shadow-[0_0_24px_rgba(45,212,191,0.2)]',
      label: 'text-[#b7fff4]',
    },
    pink: {
      card: 'bg-[linear-gradient(135deg,#3b1b36,#1b183d)] border-[#a64676]/50 hover:border-[#f472b6]/70',
      icon: 'border-[#f472b6]/45 bg-[#9d2d67]/30 text-[#ff9fd0] shadow-[0_0_24px_rgba(244,114,182,0.22)]',
      label: 'text-[#ffc1df]',
    },
  };
  const selectedTone = tones[tone];

  return (
    <div className={`flex-1 min-h-0 rounded border p-4 shadow-[0_14px_34px_rgba(20,27,73,0.24)] transition-all ${selectedTone.card}`}>
      <div className="flex h-full items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${selectedTone.icon}`}>
          <StatIcon type={icon} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[13px] font-light leading-5 tracking-wide ${selectedTone.label}`}>{label}</div>
          <div className="mt-1 text-[24px] font-semibold leading-none text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  // Fetch real data to compute statistics
  const { data: seriesData } = await supabase.from('series').select('id, status, total_episodes');
  const { data: epData } = await supabase.rpc('public_episode_counts');

  const episodeCounts = {};
  if (epData) {
    epData.forEach(item => {
      episodeCounts[item.series_id] = item.count || 0;
    });
  }

  let publishedSeriesCount = 0;
  let publishedEpisodesCount = 0;
  let readySeriesCount = 0;       
  let notReadySeriesCount = 0;    

  if (seriesData) {
    seriesData.forEach(s => {
      const readyEpisodes = episodeCounts[s.id] || 0;
      const missingEpisodes = Math.max(0, (s.total_episodes || 0) - readyEpisodes);
      
      if (s.status === 'published') {
        publishedSeriesCount++;
        publishedEpisodesCount += readyEpisodes;
      } else {
        if (missingEpisodes <= 0) {
          readySeriesCount++;
        } else {
          notReadySeriesCount++;
        }
      }
    });
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-9 h-9">
            <Image src="/dashboard.svg" alt="Dashboard" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl text-gray-300 font-semibold tracking-wide">ภาพรวม</h1>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 flex flex-col gap-6">
      {/* Dashboard Content: Stats + Graph */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Statistics Vertical Stack (Left Side) */}
        <div className="flex flex-col gap-4 w-full lg:w-[220px] shrink-0 min-h-0">
          
          {/* Card 1 */}
          <StatCard label="ซีรีส์ที่เผยแพร่แล้ว" value={publishedSeriesCount} tone="indigo" icon="published" />

          {/* Card 2 */}
          <StatCard label="ตอนที่เผยแพร่แล้ว" value={publishedEpisodesCount} tone="blue" icon="episodes" />

          {/* Card 3 */}
          <StatCard label="ซีรีส์ที่ยังไม่เผยแพร่" value={readySeriesCount} tone="teal" icon="draft" />

          {/* Card 4 - Red */}
          <StatCard label="ซีรีส์ที่ยังไม่พร้อม" value={notReadySeriesCount} tone="pink" icon="warning" />
          
        </div>

        {/* Graph Section (Right Side) */}
        <div className="flex-1 min-w-0 min-h-0">
          <DashboardGraph />
        </div>

      </div>

      {/* Bottom Section Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left: Suggestion System */}
        <ContactMessagesPanel />

        {/* Right: Version Management Section */}
        <div className="bg-[#151a3f]/95 border border-[#34407a] rounded shadow-[0_18px_40px_rgba(10,14,42,0.24)] h-full min-h-0 flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar pt-0 bg-[#151a3f]/95">
            <VersionManager />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
