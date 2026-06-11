import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Launch, fetchLaunches } from './launchSlice';
import { Rocket } from 'lucide-react';

const LaunchList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.launches);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    dispatch(fetchLaunches());
  }, [dispatch]);


  const filterCriteria = { type: filterType, timestamp: Date.now() };

  const filteredMissions = useMemo(() => {
    console.time('filterMissions');
    const start = performance.now();
    while (performance.now() - start < 100) { }

    const result = items.filter(l => {
      if (filterCriteria.type === 'all') return true;
      return l.success === (filterCriteria.type === 'success');
    });
    console.timeEnd('filterMissions');
    return result;
  }, [items, filterCriteria]);

  const selectedLaunch = items.find((l: Launch) => l.id === selectedId);

  return (
    <div className="p-6 bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Rocket className="text-orange-500" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">SpaceX Launch Portal</h2>
        </div>
        <div className="flex gap-2">
          {['all', 'success', 'failed'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${filterType === t ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3">
        <span className="font-bold">Error:</span> {error}
      </div>}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading && <div className="p-12 text-center text-orange-400 font-mono animate-pulse">INITIATING DATA UPLINK...</div>}
          {filteredMissions.map((launch) => (
            <div
              key={launch.id}
              onClick={() => setSelectedId(launch.id)}
              className={`group p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedId === launch.id
                ? 'border-orange-500 bg-orange-50 shadow-lg'
                : 'border-slate-100 bg-white hover:border-orange-200 shadow-sm'
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors uppercase text-sm tracking-tight">{launch.name}</div>
                <div className="text-[10px] font-black text-slate-300">#{launch.flight_number}</div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-[10px] font-bold text-slate-400">{new Date(launch.date_utc).getFullYear()}</div>
                <div className={`w-2 h-2 rounded-full ${launch.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm min-h-[500px]">
          {selectedLaunch ? (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  {selectedLaunch.links.patch.small && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <img src={selectedLaunch.links.patch.small} alt="Mission Patch" className="w-24 h-24 drop-shadow-md" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{selectedLaunch.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${selectedLaunch.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {selectedLaunch.success ? 'MISSION SUCCESS' : 'MISSION FAILED'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs font-bold text-slate-400">FLIGHT #{selectedLaunch.flight_number}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="prose prose-slate max-w-none">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Mission Debrief</h4>
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    {selectedLaunch.details || "Classified mission details. No public debrief available for this launch sequence."}
                  </p>

                  {selectedLaunch.failures && selectedLaunch.failures.length > 0 && (
                    <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100">
                      <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 text-center">Failure Analysis</h5>
                      {selectedLaunch.failures.map((f, i) => (
                        <div key={i} className="text-red-700 text-sm italic font-medium">
                          "T+{f.time}s: {f.reason}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Core Inventory</h4>
                    <div className="space-y-2">
                      {selectedLaunch.cores.map((c, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                          <div>
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Core: {c.core || 'TBD'}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Flight {c.flight}</div>
                          </div>
                          <div className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${c.landing_success ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                            {c.landing_type || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payload Logistics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedLaunch.payloads.map(p => (
                        <div key={p} className="bg-white p-2 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 text-center uppercase truncate">
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4 flex-wrap">
                {selectedLaunch.links.webcast && (
                  <a
                    href={selectedLaunch.links.webcast}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center bg-slate-900 hover:bg-orange-600 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl"
                  >
                    WATCH WEBCAST
                  </a>
                )}
                {selectedLaunch.links.wikipedia && (
                  <a
                    href={selectedLaunch.links.wikipedia}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center bg-white border-2 border-slate-100 hover:border-orange-200 text-slate-600 font-black text-[10px] tracking-widest px-6 py-3 rounded-full transition-all"
                  >
                    WIKIPEDIA
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 transition-all">
              <Rocket size={64} className="mb-4 opacity-10" />
              <div className="text-xs font-black tracking-[0.2em] uppercase opacity-40">Awaiting Sector Selection</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchList;
