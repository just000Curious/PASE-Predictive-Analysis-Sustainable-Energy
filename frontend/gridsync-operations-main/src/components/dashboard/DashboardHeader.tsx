import { useState, useEffect } from 'react';
import { Zap, Clock, Sun, Moon, RefreshCw, Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Alert {
  level: string;
  message: string;
  timestamp: string;
}

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  alerts?: Alert[];
}

const DashboardHeader = ({ onRefresh, isRefreshing, alerts = [] }: DashboardHeaderProps) => {
  const [utcTime, setUtcTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUTC = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  const warningAlerts = alerts.filter(a => a.level === 'warning');
  const infoAlerts = alerts.filter(a => a.level === 'info' || !['critical', 'warning'].includes(a.level));

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left - Logo & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">PASE CONSOLE</h1>
                <p className="text-[10px] text-muted-foreground font-medium">Grid Intelligence v2.1</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs font-medium">
                OPERATIONAL
              </Badge>
            </div>
          </div>

          {/* Center - Clock */}
          <div className="hidden lg:flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs font-medium text-foreground tabular-nums">
                {formatUTC(utcTime)}
              </span>
            </div>
          </div>

          {/* Right - Controls */}
          <div className="flex items-center gap-2">
            {/* ML Accuracy - Inline */}
            <div className="hidden xl:flex items-center gap-3 text-xs mr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Supply</span>
                <span className="font-mono font-semibold text-success">95.9%</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Demand</span>
                <span className="font-mono font-semibold text-battery">84.5%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Notification Sheet */}
              <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                    <Bell className="w-4 h-4" />
                    {alerts.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center px-1">
                        {alerts.length > 9 ? '9+' : alerts.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[380px] bg-card">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      System Notifications
                    </SheetTitle>
                    <SheetDescription>
                      {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No active notifications</p>
                      </div>
                    ) : (
                      <>
                        {criticalAlerts.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" />
                              Critical ({criticalAlerts.length})
                            </h4>
                            {criticalAlerts.map((alert, idx) => (
                              <div key={`critical-${idx}`} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <div className="flex items-start gap-2">
                                  {getAlertIcon(alert.level)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">{alert.message}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {new Date(alert.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {warningAlerts.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-warning uppercase tracking-wide flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              Warnings ({warningAlerts.length})
                            </h4>
                            {warningAlerts.map((alert, idx) => (
                              <div key={`warning-${idx}`} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                                <div className="flex items-start gap-2">
                                  {getAlertIcon(alert.level)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">{alert.message}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {new Date(alert.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {infoAlerts.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                              <Info className="w-3 h-3" />
                              Info ({infoAlerts.length})
                            </h4>
                            {infoAlerts.map((alert, idx) => (
                              <div key={`info-${idx}`} className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-start gap-2">
                                  {getAlertIcon(alert.level)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">{alert.message}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {new Date(alert.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
