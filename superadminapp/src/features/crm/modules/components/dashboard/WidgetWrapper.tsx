import React, { useState } from 'react';
import { Maximize2, Download, Table, X } from 'lucide-react';

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  dataForExport?: any[];
}

export function WidgetWrapper({ title, children, dataForExport }: WidgetWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const exportToCSV = () => {
    if (!dataForExport || dataForExport.length === 0) {
      alert("No data available to export");
      return;
    }
    const headers = Object.keys(dataForExport[0]).join(',');
    const rows = dataForExport.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-[#FFFFFF] border border-[#E1E6E1] rounded-2xl p-5 flex flex-col h-[320px] transition-all hover:border-[#C8E6CA] shadow-xs relative group">
        {/* Header Tools */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-bold text-[#202020] tracking-wide">{title}</h3>
          <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
            <button 
              onClick={() => setShowDrillDown(true)} 
              title="Drill-down details"
              aria-label="Drill-down details"
              className="p-2 hover:bg-[#F5F7F5] rounded-lg text-[#5F6962] hover:text-[#202020]"
            >
              <Table className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button 
              onClick={exportToCSV} 
              title="Export CSV"
              aria-label="Export widget data to CSV"
              className="p-2 hover:bg-[#F5F7F5] rounded-lg text-[#5F6962] hover:text-[#202020]"
            >
              <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button 
              onClick={() => setIsFullscreen(true)} 
              title="Maximize"
              aria-label="Maximize widget"
              className="p-2 hover:bg-[#F5F7F5] rounded-lg text-[#5F6962] hover:text-[#202020]"
            >
              <Maximize2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-[220px] w-full relative text-[#202020]">
          {children}
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
          <div className="w-full h-full bg-[#FFFFFF] border border-[#E1E6E1] rounded-3xl p-5 md:p-6 flex flex-col relative max-w-6xl max-h-[85vh] text-[#202020] shadow-2xl">
            <button 
              onClick={() => setIsFullscreen(false)}
              aria-label="Close expanded view"
              className="absolute top-5 right-5 p-2 bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl text-[#5F6962] hover:text-[#202020]"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-[#202020] mb-6 pr-12">{title} (Expanded)</h2>
            <div className="flex-1 min-h-0">
              {children}
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Drawer Sheet */}
      {showDrillDown && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[#FFFFFF] border-l border-[#E1E6E1] h-full p-5 md:p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-[#202020]">
            <div className="flex items-center justify-between border-b border-[#E1E6E1] pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#202020]">{title} - Detailed Records</h3>
                <p className="text-xs text-[#5F6962] mt-1">Granular breakdown of records linked to this KPI</p>
              </div>
              <button 
                onClick={() => setShowDrillDown(false)}
                aria-label="Close drill-down details"
                className="p-2 bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl text-[#5F6962] hover:text-[#202020]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {dataForExport && dataForExport.length > 0 ? (
                <div className="border border-[#E1E6E1] rounded-xl overflow-hidden shadow-2xs">
                  <table aria-label="Widget drill-down details table" className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F5F7F5] border-b border-[#E1E6E1] text-[#5F6962] font-bold uppercase tracking-wider">
                        {Object.keys(dataForExport[0]).map(key => (
                          <th scope="col" key={key} className="p-3 font-semibold">{key.replace(/([A-Z])/g, ' $1')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E6E1]">
                      {dataForExport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FAF9] transition-colors text-[#202020]">
                          {Object.values(row).map((val: any, cellIdx) => (
                            <td key={cellIdx} className="p-3 font-medium truncate max-w-[180px]">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-[#5F6962] text-xs">No details records loaded for this widget.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
