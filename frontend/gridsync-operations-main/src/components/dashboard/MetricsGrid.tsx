import { TrendingUp, TrendingDown, Battery, Wind, Activity, Zap } from 'lucide-react';
import { SimulationDataPoint } from '@/pages/Index';

interface MetricsGridProps {
  data: SimulationDataPoint;
}

const MetricsGrid = ({ data }: MetricsGridProps) => {
  const isBalanced = Math.abs(data.net_balance_mw) < 5;
  const batteryStatus = data.battery_percent > 80 ? 'high' : data.battery_percent > 30 ? 'medium' : 'low';

  const metrics = [
    {
      label: 'WIND GENERATION',
      value: data.simulated_supply_mw.toFixed(1),
      unit: 'MW',
      icon: Wind,
      color: 'supply',
      trend: '+2.3%',
      trendUp: true,
      subLabel: 'Capacity Factor',
      subValue: '42%',
    },
    {
      label: 'CITY LOAD',
      value: data.simulated_demand_mw.toFixed(1),
      unit: 'MW',
      icon: TrendingDown,
      color: 'demand',
      trend: '-1.2%',
      trendUp: false,
      subLabel: 'Peak Today',
      subValue: `${(data.simulated_demand_mw * 1.15).toFixed(1)} MW`,
    },
    {
      label: 'BATTERY SOC',
      value: data.battery_percent.toFixed(0),
      unit: '%',
      icon: Battery,
      color: 'battery',
      trend: data.to_battery_mw > 0 ? `+${data.to_battery_mw.toFixed(1)} MW` : `-${data.from_battery_mw.toFixed(1)} MW`,
      trendUp: data.to_battery_mw > 0,
      subLabel: 'Charge Rate',
      subValue: `${(data.to_battery_mw - data.from_battery_mw).toFixed(1)} MW`,
    },
    {
      label: 'NET BALANCE',
      value: `${data.net_balance_mw > 0 ? '+' : ''}${data.net_balance_mw.toFixed(1)}`,
      unit: 'MW',
      icon: Activity,
      color: isBalanced ? 'success' : data.net_balance_mw > 0 ? 'supply' : 'warning',
      trend: data.status,
      trendUp: data.net_balance_mw >= 0,
      subLabel: 'Grid Flow',
      subValue: data.to_grid_mw > 0 ? `Export ${data.to_grid_mw.toFixed(1)} MW` : data.from_grid_mw > 0 ? `Import ${data.from_grid_mw.toFixed(1)} MW` : 'Balanced',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.label} className="metric-panel group transition-all duration-200 hover:scale-[1.02]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${metric.color}/10`}>
                <Icon className={`w-4 h-4 text-${metric.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${metric.trendUp ? 'text-success' : 'text-destructive'}`}>
                {metric.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{metric.trend}</span>
              </div>
            </div>

            {/* Label */}
            <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-1">
              {metric.label}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className={`text-3xl font-mono font-bold text-${metric.color} tabular-nums`}>
                {metric.value}
              </span>
              <span className="text-sm text-muted-foreground font-medium">{metric.unit}</span>
            </div>

            {/* Progress bar for battery */}
            {metric.label === 'BATTERY SOC' && (
              <div className="mb-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      batteryStatus === 'high' ? 'bg-success' : 
                      batteryStatus === 'medium' ? 'bg-battery' : 'bg-warning'
                    }`}
                    style={{ width: `${data.battery_percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sub info */}
            <div className="flex items-center justify-between text-xs border-t border-border pt-3">
              <span className="text-muted-foreground">{metric.subLabel}</span>
              <span className="font-mono font-medium text-foreground">{metric.subValue}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsGrid;
