import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SimulationDataPoint } from '@/pages/Index';

interface EnergyChartsProps {
  data: SimulationDataPoint[];
}

const EnergyCharts = ({ data }: EnergyChartsProps) => {
  const [fullscreenChart, setFullscreenChart] = useState<'supply' | 'battery' | null>(null);

  const toggleFullscreen = useCallback(() => {
    setFullscreenChart(prev => {
      if (prev) return null;
      return 'supply'; // Default to supply chart
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  const chartData = data.map((d) => ({
    hour: d.hour,
    supply: d.simulated_supply_mw,
    demand: d.simulated_demand_mw,
    battery: d.battery_percent,
  }));

  const SupplyDemandChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--grid-line))" />
        <XAxis
          dataKey="hour"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="supply"
          stroke="hsl(var(--supply))"
          strokeWidth={2}
          dot={false}
          name="Supply"
        />
        <Line
          type="monotone"
          dataKey="demand"
          stroke="hsl(var(--demand))"
          strokeWidth={2}
          dot={false}
          name="Demand"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const BatteryChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--grid-line))" />
        <XAxis
          dataKey="hour"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {/* Reference lines at 20% and 80% */}
        <Line
          type="monotone"
          dataKey={() => 20}
          stroke="hsl(var(--destructive))"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          name="Low (20%)"
        />
        <Line
          type="monotone"
          dataKey={() => 80}
          stroke="hsl(var(--warning))"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          name="High (80%)"
        />
        <Line
          type="monotone"
          dataKey="battery"
          stroke="hsl(var(--battery))"
          strokeWidth={2}
          dot={false}
          name="Battery SOC"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (fullscreenChart) {
    return (
      <div className="fixed inset-0 z-50 bg-background p-6">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">
              {fullscreenChart === 'supply' ? 'Supply vs Demand' : 'Battery State of Charge'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreenChart(null)}
              className="border-border"
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Exit Fullscreen (F)
            </Button>
          </div>
          <div className="flex-1">
            {fullscreenChart === 'supply' ? <SupplyDemandChart /> : <BatteryChart />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Supply vs Demand</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreenChart('supply')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="h-64">
          <SupplyDemandChart />
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Battery State of Charge</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreenChart('battery')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="h-64">
          <BatteryChart />
        </div>
      </Card>
    </div>
  );
};

export default EnergyCharts;
