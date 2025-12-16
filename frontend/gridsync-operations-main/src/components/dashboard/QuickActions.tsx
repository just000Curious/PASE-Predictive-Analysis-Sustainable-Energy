import { Zap, BarChart3, Download, AlertTriangle, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onRunSimulation: () => void;
  isRunning: boolean;
  alertCount: number;
}

const QuickActions = ({ onRunSimulation, isRunning, alertCount }: QuickActionsProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button 
        onClick={onRunSimulation} 
        disabled={isRunning}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {isRunning ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Zap className="w-4 h-4 mr-2" />
        )}
        {isRunning ? 'Running...' : 'Run Simulation'}
      </Button>
      
      <Button variant="outline" className="font-medium">
        <BarChart3 className="w-4 h-4 mr-2" />
        Analysis
      </Button>
      
      <Button variant="outline" className="font-medium">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      
      <Button variant="outline" className="font-medium relative">
        <AlertTriangle className="w-4 h-4 mr-2" />
        Alerts
        {alertCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
            {alertCount}
          </span>
        )}
      </Button>
      
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default QuickActions;
