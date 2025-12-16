import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Play, AlertTriangle, CalendarIcon, Search } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface OperationalModesProps {
  mode: 'LIVE' | 'MANUAL' | 'CUSTOM';
  setMode: (mode: 'LIVE' | 'MANUAL' | 'CUSTOM') => void;
  turbineCount: number;
  setTurbineCount: (value: number) => void;
  turbineAvailability: number;
  setTurbineAvailability: (value: number) => void;
  batteryCapacity: number;
  setBatteryCapacity: (value: number) => void;
  faults: {
    turbineFailure: boolean;
    multipleTurbineFailure: boolean;
    gridIssue: boolean;
    batteryFault: boolean;
  };
  setFaults: (faults: any) => void;
  onRunSimulation: () => void;
  isRunning: boolean;
  dateRange?: DateRange;
  setDateRange?: (range: DateRange) => void;
}

const OperationalModes = ({
  mode,
  setMode,
  turbineCount,
  setTurbineCount,
  turbineAvailability,
  setTurbineAvailability,
  batteryCapacity,
  setBatteryCapacity,
  faults,
  setFaults,
  onRunSimulation,
  isRunning,
  dateRange = { from: undefined, to: undefined },
  setDateRange,
}: OperationalModesProps) => {
  
  const handleDateRangeChange = (range: DateRange) => {
    if (setDateRange) {
      setDateRange(range);
    }
  };

  const setPreset = (preset: 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    let range: DateRange;
    
    switch (preset) {
      case 'last7':
        range = { from: subDays(today, 7), to: today };
        break;
      case 'last30':
        range = { from: subDays(today, 30), to: today };
        break;
      case 'thisMonth':
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
    }
    
    handleDateRangeChange(range);
  };

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
        <TabsTrigger value="LIVE" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          LIVE
        </TabsTrigger>
        <TabsTrigger value="MANUAL" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          MANUAL
        </TabsTrigger>
        <TabsTrigger value="CUSTOM" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          CUSTOM
        </TabsTrigger>
      </TabsList>

      <TabsContent value="LIVE" className="mt-1">
        <Card className="p-2 bg-card border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              Real-time monitoring active. Data refreshes every 5 seconds.
            </p>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="MANUAL" className="space-y-3 mt-1">
        <Card className="p-4 bg-card border-border space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-foreground text-xs">Turbine Count: {turbineCount}</Label>
              <Slider
                value={[turbineCount]}
                onValueChange={(v) => setTurbineCount(v[0])}
                min={10}
                max={100}
                step={1}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-foreground text-xs">
                Turbine Availability: {(turbineAvailability * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[turbineAvailability * 100]}
                onValueChange={(v) => setTurbineAvailability(v[0] / 100)}
                min={50}
                max={100}
                step={1}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-foreground text-xs">Battery Capacity: {batteryCapacity} MWh</Label>
              <Slider
                value={[batteryCapacity]}
                onValueChange={(v) => setBatteryCapacity(v[0])}
                min={100}
                max={500}
                step={10}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <Label className="text-foreground font-semibold text-xs">FAULT INJECTION</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="turbine-fault"
                  checked={faults.turbineFailure}
                  onCheckedChange={(checked) =>
                    setFaults({ ...faults, turbineFailure: checked as boolean })
                  }
                />
                <label htmlFor="turbine-fault" className="text-[11px] text-foreground cursor-pointer">
                  Single Turbine Fail
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multi-turbine-fault"
                  checked={faults.multipleTurbineFailure}
                  onCheckedChange={(checked) =>
                    setFaults({ ...faults, multipleTurbineFailure: checked as boolean })
                  }
                />
                <label htmlFor="multi-turbine-fault" className="text-[11px] text-foreground cursor-pointer">
                  Multi Turbine Fail
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="grid-fault"
                  checked={faults.gridIssue}
                  onCheckedChange={(checked) =>
                    setFaults({ ...faults, gridIssue: checked as boolean })
                  }
                />
                <label htmlFor="grid-fault" className="text-[11px] text-foreground cursor-pointer">
                  Grid Issue
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="battery-fault"
                  checked={faults.batteryFault}
                  onCheckedChange={(checked) =>
                    setFaults({ ...faults, batteryFault: checked as boolean })
                  }
                />
                <label htmlFor="battery-fault" className="text-[11px] text-foreground cursor-pointer">
                  Battery Fault
                </label>
              </div>
            </div>
          </div>

          <Button
            onClick={onRunSimulation}
            disabled={isRunning}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9"
          >
            <Play className="w-3.5 h-3.5 mr-2" />
            {isRunning ? 'Running...' : 'RUN SIMULATION'}
          </Button>
          
          <p className="text-[10px] text-muted-foreground text-center">
            Press Space to run simulation
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="CUSTOM" className="space-y-3 mt-1">
        <Card className="p-4 bg-card border-border space-y-4">
          <div>
            <Label className="text-foreground font-semibold text-sm">Date Range Selection</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Select a time period for historical data analysis
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal h-9",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => handleDateRangeChange({ ...dateRange, from: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* End Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal h-9",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => handleDateRangeChange({ ...dateRange, to: date })}
                  disabled={(date) => dateRange.from ? date < dateRange.from : false}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setPreset('last7')}
            >
              Last 7 days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setPreset('last30')}
            >
              Last 30 days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setPreset('thisMonth')}
            >
              This month
            </Button>
          </div>

          {/* Load Data Button */}
          <Button 
            className="w-full h-9" 
            disabled={!dateRange.from || !dateRange.to}
            onClick={onRunSimulation}
          >
            <Search className="w-3.5 h-3.5 mr-2" />
            Load Historical Data
          </Button>

          {dateRange.from && dateRange.to && (
            <p className="text-[10px] text-muted-foreground text-center">
              Selected: {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
            </p>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OperationalModes;
