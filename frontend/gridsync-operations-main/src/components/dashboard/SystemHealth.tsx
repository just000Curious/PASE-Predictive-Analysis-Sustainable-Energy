import { Activity, Shield, Cpu, Wifi } from 'lucide-react';

interface SystemHealthProps {
  gridStability: number;
  batteryHealth: number;
  networkStatus: number;
  mlConfidence: number;
}

const SystemHealth = ({
  gridStability = 98,
  batteryHealth = 95,
  networkStatus = 100,
  mlConfidence = 92
}: Partial<SystemHealthProps>) => {
  const metrics = [
    {
      label: 'Grid Stability',
      value: gridStability,
      icon: Activity,
      color: gridStability > 90 ? 'success' : gridStability > 70 ? 'warning' : 'destructive'
    },
    {
      label: 'Battery Health',
      value: batteryHealth,
      icon: Shield,
      color: batteryHealth > 90 ? 'success' : batteryHealth > 70 ? 'warning' : 'destructive'
    },
    {
      label: 'Network',
      value: networkStatus,
      icon: Wifi,
      color: networkStatus > 90 ? 'success' : networkStatus > 70 ? 'warning' : 'destructive'
    },
    {
      label: 'ML Confidence',
      value: mlConfidence,
      icon: Cpu,
      color: mlConfidence > 90 ? 'success' : mlConfidence > 70 ? 'warning' : 'destructive'
    },
  ];

  return (
    <div className="card-elevated p-2.5 h-full flex items-center gap-3">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Health</h4>
      <div className="flex items-center gap-3 flex-1">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="flex items-center gap-1.5 flex-1 min-w-0">
              <Icon className={`w-3 h-3 text-${metric.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] text-muted-foreground truncate">{metric.label}</span>
                  <span className={`text-[9px] font-mono font-semibold text-${metric.color}`}>
                    {metric.value}%
                  </span>
                </div>
                <div className="h-0.5 bg-muted rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full bg-${metric.color} transition-all duration-500`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemHealth;
