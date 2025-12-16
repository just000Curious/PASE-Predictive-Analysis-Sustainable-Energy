import { Activity, Zap, Battery, Wind } from 'lucide-react';
import { SimulationDataPoint } from '@/pages/Index';

interface DataFeedProps {
  data: SimulationDataPoint | null;
}

const DataFeed = ({ data }: DataFeedProps) => {
  const feedItems = data ? [
    {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      icon: Wind,
      text: `Wind generation at ${data.simulated_supply_mw.toFixed(1)} MW`,
      color: 'supply',
      isNew: true,
    },
    {
      time: new Date(Date.now() - 15000).toLocaleTimeString('en-US', { hour12: false }),
      icon: Battery,
      text: `Battery SOC ${data.battery_percent > 80 ? 'optimal' : 'charging'} at ${data.battery_percent.toFixed(0)}%`,
      color: 'battery',
      isNew: false,
    },
    {
      time: new Date(Date.now() - 30000).toLocaleTimeString('en-US', { hour12: false }),
      icon: Zap,
      text: `Grid ${data.to_grid_mw > 0 ? 'exporting' : data.from_grid_mw > 0 ? 'importing' : 'balanced'}`,
      color: data.to_grid_mw > 0 ? 'success' : data.from_grid_mw > 0 ? 'destructive' : 'muted-foreground',
      isNew: false,
    },
    {
      time: new Date(Date.now() - 45000).toLocaleTimeString('en-US', { hour12: false }),
      icon: Activity,
      text: `System status: ${data.status}`,
      color: data.net_balance_mw >= 0 ? 'success' : 'warning',
      isNew: false,
    },
  ] : [];

  return (
    <div className="card-elevated p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Real-time Data Feed</h4>
        <span className="ml-auto w-2 h-2 bg-success rounded-full animate-pulse" />
      </div>
      
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {feedItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Run simulation to see live data
          </p>
        ) : (
          feedItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                  item.isNew ? 'bg-primary/5' : ''
                }`}
              >
                <Icon className={`w-4 h-4 text-${item.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
                {item.isNew && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                    NEW
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DataFeed;
