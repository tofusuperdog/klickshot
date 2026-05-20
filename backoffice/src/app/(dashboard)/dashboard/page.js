import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import VersionManager from './VersionManager';
import DashboardGraph from './DashboardGraph';
import ContactMessagesPanel from './ContactMessagesPanel';


export const revalidate = 0; // opt out of static rendering

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
          <div className="flex-1 min-h-0 bg-[#131024] border border-[#2d2252] rounded p-4 flex flex-col justify-between shadow-md transition-all hover:border-[#3b2a75]">
            <div className="text-gray-400 font-light text-[13px] tracking-wide">ซีรีส์ที่เผยแพร่แล้ว</div>
            <div className="text-white text-3xl font-semibold text-right leading-[1]">{publishedSeriesCount}</div>
          </div>

          {/* Card 2 */}
          <div className="flex-1 min-h-0 bg-[#131024] border border-[#2d2252] rounded p-4 flex flex-col justify-between shadow-md transition-all hover:border-[#3b2a75]">
            <div className="text-gray-400 font-light text-[13px] tracking-wide">ตอนที่เผยแพร่แล้ว</div>
            <div className="text-white text-3xl font-semibold text-right leading-[1]">{publishedEpisodesCount}</div>
          </div>

          {/* Card 3 */}
          <div className="flex-1 min-h-0 bg-[#131024] border border-[#2d2252] rounded p-4 flex flex-col justify-between shadow-md transition-all hover:border-[#3b2a75]">
            <div className="text-gray-400 font-light text-[13px] tracking-wide">ซีรีส์ที่ยังไม่เผยแพร่</div>
            <div className="text-white text-3xl font-semibold text-right leading-[1]">{readySeriesCount}</div>
          </div>

          {/* Card 4 - Red */}
          <div className="flex-1 min-h-0 bg-[#2c1010] border border-[#531c1c] rounded p-4 flex flex-col justify-between shadow-md transition-all hover:border-[#7c2d2d]">
            <div className="text-gray-400 font-light text-[13px] tracking-wide">ซีรีส์ที่ยังไม่พร้อม</div>
            <div className="text-white text-3xl font-semibold text-right leading-[1]">{notReadySeriesCount}</div>
          </div>
          
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
        <div className="bg-[#131024] border border-[#2d2252] rounded shadow-md h-full min-h-0 flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar pt-0">
            <VersionManager />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
