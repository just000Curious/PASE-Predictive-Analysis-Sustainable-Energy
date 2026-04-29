import { useState, useEffect, useRef } from 'react';
import { Github, Linkedin, ArrowRight, Server, Database, CloudRain } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import OperationalModes from '@/components/dashboard/OperationalModes';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import EnergyCharts from '@/components/dashboard/EnergyCharts';
import EnergyFlowSchematic from '@/components/dashboard/EnergyFlowSchematic';
import ReportDownload from '@/components/dashboard/ReportDownload';
import SystemHealth from '@/components/dashboard/SystemHealth';
import WeatherForecast from '@/components/dashboard/WeatherForecast';
import DataFeed from '@/components/dashboard/DataFeed';
import { useToast } from '@/hooks/use-toast';

export interface SimulationDataPoint {
  hour: number;
  datetime: string;
  simulated_supply_mw: number;
  simulated_demand_mw: number;
  net_balance_mw: number;
  battery_charge_mwh: number;
  battery_percent: number;
  to_battery_mw: number;
  from_battery_mw: number;
  to_grid_mw: number;
  from_grid_mw: number;
  status: string;
  wind_speed: number;
  wind_direction: number;
  temperature: number;
  humidity: number;
}

export interface Alert {
  level: string;
  message: string;
  timestamp: string;
  details?: string;
}

export interface MaintenanceWindow {
  start_time: string;
  end_time: string;
  score: number;
  lost_generation_mwh: number;
  avg_wind_speed: number;
  avg_demand: number;
}

export interface Summary {
  operational: {
    surplus_hours: number;
    deficit_hours: number;
    balanced_hours: number;
    total_generation_mwh: number;
    total_consumption_mwh: number;
    total_grid_export_mwh: number;
    total_grid_import_mwh: number;
    max_supply_achieved: number;
    capacity_factor: string;
    renewable_penetration: string;
  };
  battery?: {
    min_charge: number;
    max_charge: number;
    final_charge: number;
    cycles_completed: number;
    efficiency: string;
  };
  financial?: {
    estimated_revenue_usd: number;
    grid_export_value_usd: number;
    grid_import_cost_usd: number;
    net_revenue_usd: number;
  };
  alerts?: {
    total_alerts: number;
    critical_alerts: number;
    warning_alerts: number;
    info_alerts: number;
  };
}

export interface SimulationResponse {
  simulation_data: SimulationDataPoint[];
  alerts: Alert[];
  maintenance_windows: MaintenanceWindow[];
  summary: Summary;
  processing_time?: number;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Index = () => {
  const [mode, setMode] = useState<'LIVE' | 'MANUAL' | 'CUSTOM'>('MANUAL'); // Start with MANUAL
  const [showHelp, setShowHelp] = useState(false);
  const [turbineCount, setTurbineCount] = useState(50);
  const [turbineAvailability, setTurbineAvailability] = useState(0.95);
  const [batteryCapacity, setBatteryCapacity] = useState(300);
  const [faults, setFaults] = useState({
    turbineFailure: false,
    multipleTurbineFailure: false,
    gridIssue: false,
    batteryFault: false,
  });
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [liveUpdateCount, setLiveUpdateCount] = useState(0);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const { toast } = useToast();

  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Your FastAPI backend URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

  const runSimulation = async (isLiveUpdate: boolean = false) => {
    if (isRunning && !isLiveUpdate) return; // Don't run if already running (except for live updates)

    if (!isLiveUpdate) {
      setIsRunning(true);
    }

    try {
      const requestBody = {
        use_live_data: mode === 'LIVE',
        turbine_count: turbineCount,
        turbine_availability: faults.multipleTurbineFailure ? 0.25 : faults.turbineFailure ? 0.5 : turbineAvailability,
        battery_capacity_mwh: faults.batteryFault ? batteryCapacity * 0.5 : batteryCapacity,
        initial_battery_mwh: batteryCapacity / 2,
        // REQUIRED FIELDS for demand model
        community_demand_percent: 0.01,
        community_base_load_mw: 75.0,
        battery_max_charge_mw: 50.0,
        battery_max_discharge_mw: 100.0,
        low_wind_threshold: 3.0,
        high_wind_threshold: 25.0,
        battery_low_threshold: 0.2,
        battery_high_threshold: 0.8,
        // Optional date range for CUSTOM mode
        ...(mode === 'CUSTOM' && dateRange.from && dateRange.to && {
          date_range: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
          }
        })
      };

      const response = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data: SimulationResponse = await response.json();

      // Handle the response
      if (data.simulation_data && data.simulation_data.length > 0) {
        if (mode === 'LIVE' && simulationData.length > 0) {
          // For LIVE mode, append only the latest data point
          const newDataPoint = data.simulation_data[data.simulation_data.length - 1];
          if (newDataPoint) {
            setSimulationData(prev => {
              const newData = [...prev.slice(-23), newDataPoint]; // Keep last 23 + new = 24 points
              return newData;
            });
          }

          // Update alerts
          if (data.alerts && data.alerts.length > 0) {
            setAlerts(prev => [...data.alerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
          }

          // Update count for UI
          setLiveUpdateCount(prev => prev + 1);
        } else {
          // For MANUAL/CUSTOM, replace all data
          setSimulationData(data.simulation_data);
          setAlerts(data.alerts || []);
          setMaintenanceWindows(data.maintenance_windows || []);
          setSummary(data.summary || null);
        }
      }

      if (!isLiveUpdate) {
        toast({
          title: "Simulation Complete",
          description: `${data.simulation_data?.length || 0} hours simulated`,
        });
      }

    } catch (error) {
      console.error('Simulation failed:', error);

      if (!isLiveUpdate) {
        toast({
          title: "Simulation Error",
          description: error instanceof Error ? error.message : "Using mock data",
          variant: "destructive",
        });

        // Generate realistic mock data with proper demand model
        const mockSimulationData: SimulationDataPoint[] = Array.from({ length: 24 }, (_, hour) => {
          const hourOfDay = hour;
          // Realistic demand pattern based on time of day
          let demand = 70; // Base demand
          if (hourOfDay >= 7 && hourOfDay <= 9) demand = 95; // Morning peak
          else if (hourOfDay >= 12 && hourOfDay <= 14) demand = 85; // Midday
          else if (hourOfDay >= 17 && hourOfDay <= 20) demand = 110; // Evening peak
          else if (hourOfDay >= 22 || hourOfDay <= 5) demand = 60; // Night

          // Wind supply based on time (more wind during day)
          const supply = 50 + (Math.sin(hourOfDay * Math.PI / 12) * 20) + Math.random() * 15;

          const netBalance = supply - demand;
          const batteryLevel = 30 + (Math.sin(hourOfDay * Math.PI / 12) * 20) + Math.random() * 10;

          return {
            hour: hourOfDay,
            datetime: new Date(Date.now() + hour * 3600000).toISOString(),
            simulated_supply_mw: Math.max(0, supply),
            simulated_demand_mw: Math.max(0, demand + Math.random() * 10),
            net_balance_mw: netBalance,
            battery_charge_mwh: batteryLevel * 3, // Convert % to MWh (300 MWh capacity)
            battery_percent: Math.max(10, Math.min(95, batteryLevel)),
            to_battery_mw: netBalance > 0 ? Math.min(netBalance, 20) : 0,
            from_battery_mw: netBalance < 0 ? Math.min(Math.abs(netBalance), 25) : 0,
            to_grid_mw: netBalance > 0 ? Math.max(0, netBalance - 5) : 0,
            from_grid_mw: netBalance < 0 ? Math.max(0, Math.abs(netBalance) - 5) : 0,
            status: netBalance > 5 ? 'Surplus' : netBalance < -5 ? 'Deficit' : 'Balanced',
            wind_speed: 5 + Math.sin(hourOfDay * Math.PI / 12) * 5 + Math.random() * 3,
            wind_direction: 180 + Math.sin(hourOfDay * Math.PI / 6) * 60 + Math.random() * 30,
          };
        });

        setSimulationData(mockSimulationData);
        setAlerts([
          {
            level: 'warning',
            message: '⚠️ Using simulated data - Backend connection issue',
            timestamp: new Date().toISOString(),
          }
        ]);

        setSummary({
          operational: {
            surplus_hours: 8,
            deficit_hours: 10,
            balanced_hours: 6,
            total_generation_mwh: 1250.5,
            total_consumption_mwh: 1450.2,
            total_grid_export_mwh: 85.8,
            total_grid_import_mwh: 95.3,
            max_supply_achieved: 92.5,
            capacity_factor: '38.2%',
            renewable_penetration: '72.5%',
          }
        });
      }
    } finally {
      if (!isLiveUpdate) {
        setIsRunning(false);
      }
    }
  };

  // Handle LIVE mode updates without page refresh
  useEffect(() => {
    // Clear any existing interval
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }

    if (mode === 'LIVE') {
      // Run first simulation immediately
      runSimulation(true);

      // Then set up interval for updates (every 10 seconds, not 5)
      liveIntervalRef.current = setInterval(() => {
        runSimulation(true);
      }, 10000); // 10 seconds

      toast({
        title: "LIVE Mode Activated",
        description: "Real-time updates every 10 seconds",
      });
    } else {
      toast({
        title: `${mode} Mode Activated`,
        description: "Click RUN SIMULATION to execute",
      });
    }

    // Cleanup on unmount or mode change
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]); // Only re-run when mode changes

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' && mode === 'MANUAL') {
        e.preventDefault();
        runSimulation();
      }
      if (e.code === 'Digit1') {
        e.preventDefault();
        setMode('LIVE');
      }
      if (e.code === 'Digit2') {
        e.preventDefault();
        setMode('MANUAL');
      }
      if (e.code === 'Digit3') {
        e.preventDefault();
        setMode('CUSTOM');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, simulationData]);

  // Auto-run simulation on first load so recruiters see data immediately
  useEffect(() => {
    if (!hasInitialLoad) {
      setHasInitialLoad(true);
      runSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestData = simulationData.length > 0 ? simulationData[simulationData.length - 1] : null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <DashboardHeader
        onRefresh={() => runSimulation()}
        isRefreshing={isRunning}
        alerts={alerts}
      />

      <main className="container mx-auto px-4 py-3 space-y-3">

        {/* === CINEMATIC HERO BANNER === */}
        <div className="hero-gradient rounded-2xl border border-border/40 overflow-hidden animate-entrance animate-entrance-1">
          <div className="px-6 py-8 md:py-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="live-dot w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-[11px] font-semibold text-success tracking-wider uppercase">System Online • ML Models Active</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight mb-3">
              <span className="gradient-text">PASE</span> — Predictive Analytics{' '}
              <br className="hidden sm:block" />
              for Sustainable Energy
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              ML-powered wind energy forecasting that predicts supply, demand, and optimal grid actions in real-time using live weather data.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="tech-badge">🐍 Python</span>
              <span className="tech-badge">⚡ FastAPI</span>
              <span className="tech-badge tech-badge-accent">⚛️ React</span>
              <span className="tech-badge tech-badge-accent">📊 Recharts</span>
              <span className="tech-badge">🧠 Scikit-Learn</span>
              <span className="tech-badge">🌤️ Live Weather API</span>
            </div>
          </div>
        </div>
        {/* === ARCHITECTURE & KEY STATS STRIP === */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 animate-entrance animate-entrance-2 mb-6 mt-3">
          {/* Architecture Pipeline */}
          <div className="md:col-span-7 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 overflow-hidden shadow-sm">
            <div className="flex flex-col items-center gap-1.5 px-2 z-10">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <CloudRain className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-xs font-bold tracking-wide text-foreground">Live Weather</span>
            </div>
            
            <div className="hidden sm:flex flex-1 items-center justify-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-muted-foreground/30"></div>
              </div>
              <div className="bg-card px-2 relative z-10 animate-pulse text-muted-foreground/60">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 px-2 z-10">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Server className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs font-bold tracking-wide text-foreground">FastAPI ML Engine</span>
            </div>
            
            <div className="hidden sm:flex flex-1 items-center justify-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-muted-foreground/30"></div>
              </div>
              <div className="bg-card px-2 relative z-10 animate-pulse text-muted-foreground/60" style={{ animationDelay: '500ms' }}>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 px-2 z-10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold tracking-wide text-foreground">React Dashboard</span>
            </div>
          </div>

          {/* Key Stats */}
          <div className="md:col-span-5 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 flex items-center justify-around divide-x divide-border/50">
            <div className="px-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Model Accuracy</div>
              <div className="text-sm font-bold text-success font-mono">95.9%</div>
            </div>
            <div className="px-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Forecast Window</div>
              <div className="text-sm font-bold text-foreground font-mono">24 HR</div>
            </div>
            <div className="px-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Simulated Assets</div>
              <div className="text-sm font-bold text-accent font-mono">50+</div>
            </div>
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${mode === 'LIVE' ? 'bg-success animate-pulse' :
              mode === 'MANUAL' ? 'bg-warning' : 'bg-primary'
              }`} />
            <span className="text-sm font-semibold">
              {mode} MODE {mode === 'LIVE' && `• Updates: ${liveUpdateCount}`}
            </span>
          </div>
          {mode === 'LIVE' && (
            <div className="text-xs text-muted-foreground">
              Real-time updates active • Next in 10s
            </div>
          )}
        </div>

        {/* Control Panel Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-card/40 p-3 rounded-xl border border-border/50 mb-6 animate-entrance animate-entrance-2">
          {/* 1. Mode Selector */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <OperationalModes
              mode={mode}
              setMode={setMode}
              turbineCount={turbineCount}
              setTurbineCount={setTurbineCount}
              turbineAvailability={turbineAvailability}
              setTurbineAvailability={setTurbineAvailability}
              batteryCapacity={batteryCapacity}
              setBatteryCapacity={setBatteryCapacity}
              faults={faults}
              setFaults={setFaults}
              onRunSimulation={() => runSimulation()}
              isRunning={isRunning}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          {/* 2. System Health */}
          <div className="flex-1 min-w-0">
            <SystemHealth
              gridStability={latestData ? (Math.abs(latestData.net_balance_mw) < 10 ? 95 : 75) : 95}
              batteryHealth={latestData ? latestData.battery_percent : 88}
              networkStatus={100}
              mlConfidence={92}
            />
          </div>

          {/* 3. Weather Forecast (NEW) */}
          <div className="w-full lg:w-[220px] flex-shrink-0">
            <WeatherForecast data={latestData} />
          </div>

          {/* 4. Export Section */}
          <div className="w-full lg:w-auto flex-shrink-0">
            <ReportDownload
              simulationData={simulationData}
              alerts={alerts}
              summary={summary}
            />
          </div>
        </div>

        {latestData ? (
          <>
            {/* Metrics Grid */}
            <div className="animate-entrance animate-entrance-3">
              <MetricsGrid data={latestData} />
            </div>

            {/* === COMBINED: NET GRID BALANCE + AI RECOMMENDATION === */}
            {(() => {
              const balance = latestData.net_balance_mw;
              const isSurplus = balance >= 0;
              return (
                <div className={`rounded-xl border p-6 animate-entrance animate-entrance-4 ${isSurplus ? 'bg-green-950/30 border-green-700/40' : 'bg-red-950/30 border-red-700/40'
                  }`}>
                  {/* Balance */}
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Net Grid Balance</span>
                    <div className={`text-4xl font-bold font-mono mt-1 ${isSurplus ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {isSurplus ? '⚡' : '⚠️'} {isSurplus ? '+' : ''}{balance.toFixed(1)} MW
                      <span className={`ml-3 text-lg font-semibold ${isSurplus ? 'text-green-500' : 'text-red-500'
                        }`}>
                        ({isSurplus ? 'Surplus' : 'Deficit'})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      Generation: <span className="text-green-400 font-mono font-semibold">{latestData.simulated_supply_mw.toFixed(1)} MW</span>
                      &nbsp;—&nbsp;
                      Demand: <span className="text-red-400 font-mono font-semibold">{latestData.simulated_demand_mw.toFixed(1)} MW</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/40 my-4" />

                  {/* AI Recommendation */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🤖 Recommended Action</span>
                    <div className="text-base font-semibold text-foreground mt-1.5 leading-relaxed">
                      {isSurplus
                        ? 'Export excess energy to the grid or store in battery for later use.'
                        : 'Draw from battery reserves or import energy from the grid to meet demand.'
                      }
                    </div>
                  </div>

                  {/* Model Accuracy */}
                  <div className="mt-4 pt-3 border-t border-border/30 text-[11px] text-muted-foreground/70">
                    Model Accuracy: ~92% (Generation) &nbsp;·&nbsp; ~89% (Demand)
                  </div>
                </div>
              );
            })()}

            {/* Energy Flow Schematic */}
            <div className="animate-entrance animate-entrance-5">
              <EnergyFlowSchematic data={latestData} />
            </div>

            {/* Charts & Data Feed Row */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 animate-entrance animate-entrance-6">
              <div className="xl:col-span-3">
                <EnergyCharts data={simulationData} />
              </div>
              <div className="xl:col-span-1">
                <DataFeed data={latestData} />
              </div>
            </div>

            {/* Bottom Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 animate-entrance animate-entrance-7">
              {/* Alerts Panel */}
              <div className="card-elevated p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${alerts.some(a => a.level === 'critical') ? 'bg-destructive animate-pulse' :
                    alerts.some(a => a.level === 'warning') ? 'bg-warning' : 'bg-success'
                    }`} />
                  Active Alerts ({alerts.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-3">No active alerts</p>
                  ) : (
                    alerts.slice(0, 5).map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-xs border ${alert.level === 'critical'
                          ? 'bg-destructive/5 border-destructive/20 text-destructive'
                          : alert.level === 'warning'
                            ? 'bg-warning/5 border-warning/20 text-warning'
                            : 'bg-muted/50 border-border text-muted-foreground'
                          }`}
                      >
                        <div className="font-medium text-[11px]">{alert.message}</div>
                        <div className="text-[9px] opacity-70 mt-0.5">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance Windows */}
              <div className="card-elevated p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2">Maintenance Windows</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {maintenanceWindows.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-3">No scheduled maintenance</p>
                  ) : (
                    maintenanceWindows.map((window, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-primary">WINDOW #{idx + 1}</span>
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            SCORE: {(window.score || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-foreground">
                          {window.start_time ? new Date(window.start_time).toLocaleTimeString() : 'N/A'} - {window.end_time ? new Date(window.end_time).toLocaleTimeString() : 'N/A'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Lost: {(window.lost_generation_mwh || 0).toFixed(1)} MWh | Wind: {(window.avg_wind_speed || 0).toFixed(1)} m/s
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary KPIs */}
              {summary && summary.operational && (
                <div className="card-elevated p-3">
                  <h3 className="text-xs font-semibold text-foreground mb-2">Operational Summary</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Surplus Hours</span>
                      <span className="font-mono text-[11px] font-semibold text-success">
                        {(summary.operational.surplus_hours || 0)}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Deficit Hours</span>
                      <span className="font-mono text-[11px] font-semibold text-destructive">
                        {(summary.operational.deficit_hours || 0)}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Balanced Hours</span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">
                        {(summary.operational.balanced_hours || 0)}h
                      </span>
                    </div>
                    <div className="border-t border-border my-1.5" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Total Generation</span>
                      <span className="font-mono text-[11px] font-semibold text-supply">
                        {(summary.operational.total_generation_mwh || 0).toFixed(1)} MWh
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Total Consumption</span>
                      <span className="font-mono text-[11px] font-semibold text-demand">
                        {(summary.operational.total_consumption_mwh || 0).toFixed(1)} MWh
                      </span>
                    </div>
                    <div className="border-t border-border my-1.5" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Capacity Factor</span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">
                        {summary.operational.capacity_factor || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Renewable %</span>
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        {summary.operational.renewable_penetration || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-entrance animate-entrance-3">
            <div className="text-center py-6">
              <div className="inline-block p-4 bg-muted/50 rounded-full mb-4 animate-pulse">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Initializing Simulation Engine...</h3>
              <p className="text-muted-foreground text-sm">Loading ML models and fetching live weather data</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="skeleton-pulse h-36 rounded-xl" />
              ))}
            </div>
            <div className="skeleton-pulse h-32 rounded-xl" />
            <div className="skeleton-pulse h-64 rounded-xl" />
          </div>
        )}
      </main>

      {/* === PROFESSIONAL FOOTER === */}
      <footer className="py-10 border-t border-border/30 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-5">
            {/* Name & Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-foreground">Abhishek Bhosale</span>
              <div className="h-4 w-px bg-border" />
              <a href="https://github.com/just000Curious" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/in/abhishek-sambhaji-bhosale/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            {/* Tagline */}
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Full-stack energy analytics platform — ML forecasting, real-time simulation, and intelligent grid management.
            </p>

            {/* Tech Stack */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Python', 'FastAPI', 'React', 'TypeScript', 'Scikit-Learn', 'Recharts'].map(tech => (
                <span key={tech} className="text-[10px] font-medium text-muted-foreground/70 px-2 py-0.5 rounded-md bg-muted/50 border border-border/30">
                  {tech}
                </span>
              ))}
            </div>

            {/* Divider & Copyright */}
            <div className="w-16 h-px bg-border/40" />
            <div className="text-[10px] text-muted-foreground/50">
              © {new Date().getFullYear()} PASE Console. Designed & Engineered by Abhishek Bhosale.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;