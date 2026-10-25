import React, { useState } from 'react';
import { useDashboardStore, type WidgetConfig } from '../../store/dashboardStore';
import { Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { KPIWidget } from './KPIWidget';
import { ChartWidget } from './ChartWidget';
import { WidgetWrapper } from './WidgetWrapper';

export function BuilderPanel() {
  const { customWidgets, addCustomWidget, removeCustomWidget, resetCustomWidgets } = useDashboardStore();

  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetType, setWidgetType] = useState<'kpi' | 'bar' | 'line' | 'pie'>('kpi');
  const [widgetWidth, setWidgetWidth] = useState<1 | 2>(1);

  // Mock records for customized widget plotting
  const mockCustomData = [
    { name: 'Label A', value: 400 },
    { name: 'Label B', value: 300 },
    { name: 'Label C', value: 200 },
    { name: 'Label D', value: 500 },
  ];

  const handleAddWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetTitle.trim()) return;

    const newWidget: WidgetConfig = {
      id: `custom-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      metricKey: 'customData',
      w: widgetWidth,
    };

    addCustomWidget(newWidget);
    setWidgetTitle('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Builder Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#E1E6E1] p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xs">
        <form onSubmit={handleAddWidget} className="flex-1 flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#5F6962] font-bold uppercase tracking-wider mb-1">Widget Title</span>
            <input aria-label="Widget Title" 
              type="text" 
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              placeholder="e.g. Conversion Funnel"
              className="bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg px-3 py-1.5 text-xs text-[#202020] placeholder-[#849389] outline-none focus:border-[#039A01] w-56"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#5F6962] font-bold uppercase tracking-wider mb-1">Chart Type</span>
            <select 
              aria-label="Widget Type" value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as any)}
              className="bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg px-2.5 py-1.5 text-xs text-[#202020] outline-none focus:border-[#039A01]"
            >
              <option value="kpi">KPI Summary Metric Card</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Donut Chart</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#5F6962] font-bold uppercase tracking-wider mb-1">Grid Column Span</span>
            <select 
              aria-label="Widget Width" value={widgetWidth}
              onChange={(e) => setWidgetWidth(Number(e.target.value) as any)}
              className="bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg px-2.5 py-1.5 text-xs text-[#202020] outline-none focus:border-[#039A01]"
            >
              <option value={1}>1 Column Width (Normal)</option>
              <option value={2}>2 Columns Width (Wide)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="flex items-center gap-1 px-4 py-1.5 bg-[#039A01] hover:bg-[#028001] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>
        </form>

        <button 
          onClick={resetCustomWidgets}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl text-xs font-bold text-[#5F6962] hover:text-[#202020] transition-all self-end lg:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Grid</span>
        </button>
      </div>

      {/* 2. Drag & Drop Configured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {customWidgets.map((w) => {
          const colSpanStyle = w.w === 2 ? 'md:col-span-2' : 'md:col-span-1';

          return (
            <div key={w.id} className={`${colSpanStyle} relative group`}>
              {/* Trash Hover overlay trigger */}
              <button 
                onClick={() => removeCustomWidget(w.id)}
                className="absolute top-4 right-4 z-20 p-1.5 bg-[#FDF2F2] hover:bg-[#B91C1C] border border-[#F8C8C8] text-[#B91C1C] hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove widget"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {w.type === 'kpi' ? (
                <KPIWidget 
                  label={w.title} 
                  value="42,500" 
                  change="+12.4%" 
                  isPositive={true} 
                />
              ) : (
                <WidgetWrapper title={w.title} dataForExport={mockCustomData}>
                  <ChartWidget type={w.type as any} data={mockCustomData} />
                </WidgetWrapper>
              )}
            </div>
          );
        })}
      </div>
      {customWidgets.length === 0 && (
        <div className="text-center py-20 bg-[#FFFFFF] border border-[#E1E6E1] border-dashed rounded-2xl text-[#5F6962] text-xs">
          Your dashboard canvas is empty. Use the form above to add customized analytical widgets.
        </div>
      )}
    </div>
  );
}
