import { Thermometer, Wind, Droplets, CloudSun } from 'lucide-react';
import { SimulationDataPoint } from '@/pages/Index';

interface WeatherForecastProps {
  data: SimulationDataPoint | null;
}

const WeatherForecast = ({ data }: WeatherForecastProps) => {
  const metrics = [
    {
      label: 'Temp',
      value: `${data?.temperature?.toFixed(1) || '22.0'}°C`,
      icon: Thermometer,
      color: 'text-orange-500',
    },
    {
      label: 'Wind',
      value: `${data?.wind_speed?.toFixed(1) || '12.5'} m/s`,
      icon: Wind,
      color: 'text-blue-500',
    },
    {
      label: 'Humidity',
      value: `${data?.humidity?.toFixed(0) || '65'}%`,
      icon: Droplets,
      color: 'text-cyan-500',
    },
    {
      label: 'Condition',
      value: data ? 'Clear' : 'N/A',
      icon: CloudSun,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="card-elevated p-2.5 h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="flex items-center gap-2 justify-center py-1">
              <div className={`p-1.5 rounded-lg bg-muted/50 ${metric.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-foreground leading-tight">
                  {metric.value}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                  {metric.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherForecast;
