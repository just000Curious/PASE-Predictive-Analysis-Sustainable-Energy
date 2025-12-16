import { SimulationDataPoint } from '@/pages/Index';
import { AlertTriangle } from 'lucide-react';

interface EnergyFlowSchematicProps {
  data: SimulationDataPoint;
}

const EnergyFlowSchematic = ({ data }: EnergyFlowSchematicProps) => {
  const batteryFillPercent = data.battery_percent;
  const isExporting = data.to_grid_mw > 0;
  const isImporting = data.from_grid_mw > 0;
  const isSurplus = data.net_balance_mw >= 0;
  
  // Calculate system imbalance
  const expectedBalance = data.simulated_supply_mw - data.simulated_demand_mw;
  const actualBalance = data.net_balance_mw;
  const imbalance = Math.abs(expectedBalance - actualBalance);
  const hasImbalance = imbalance > 5;

  return (
    <div className="schematic-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Energy Flow Schematic</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time power distribution</p>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
          isSurplus 
            ? 'bg-success/10 text-success border border-success/20' 
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isSurplus ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
          {isSurplus ? 'SURPLUS' : 'DEFICIT'}: {Math.abs(data.net_balance_mw).toFixed(1)} MW
        </div>
      </div>
      
      <svg viewBox="0 0 800 280" className="w-full h-auto" style={{ minHeight: '240px' }}>
        <defs>
          {/* Professional Gradients */}
          <linearGradient id="windGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--supply))" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="hsl(var(--supply))" stopOpacity="0.05"/>
          </linearGradient>
          <linearGradient id="batteryGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--battery))" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="hsl(var(--battery))" stopOpacity="0.6"/>
          </linearGradient>
          <linearGradient id="cityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--demand))" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="hsl(var(--demand))" stopOpacity="0.05"/>
          </linearGradient>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--grid-export))" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="hsl(var(--grid-export))" stopOpacity="0.05"/>
          </linearGradient>
          
          {/* Tower gradient for 3D effect */}
          <linearGradient id="towerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B7280" stopOpacity="0.9"/>
            <stop offset="50%" stopColor="#9CA3AF" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#6B7280" stopOpacity="0.9"/>
          </linearGradient>

          {/* Glow filters */}
          <filter id="glowSupply" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor="hsl(var(--supply))" floodOpacity="0.3"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glowBattery" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor="hsl(var(--battery))" floodOpacity="0.3"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glowDemand" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor="hsl(var(--demand))" floodOpacity="0.3"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Arrow markers */}
          <marker id="arrowSupply" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="hsl(var(--supply))"/>
          </marker>
          <marker id="arrowBattery" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="hsl(var(--battery))"/>
          </marker>
          <marker id="arrowExport" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="hsl(var(--grid-export))"/>
          </marker>
          <marker id="arrowImport" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="hsl(var(--destructive))"/>
          </marker>
        </defs>

        {/* ====== WIND FARM ====== */}
        <g className="wind-farm">
          {/* Background panel */}
          <rect x="30" y="40" width="140" height="130" rx="12" 
            fill="url(#windGradient)" stroke="hsl(var(--supply))" strokeWidth="2"/>
          
          {/* Wind Turbine - Professional 3D-like design */}
          <g transform="translate(70, 55)">
            {/* Tower with 3D effect */}
            <polygon points="25,40 35,40 32,95 28,95" fill="url(#towerGradient)"/>
            {/* Nacelle */}
            <ellipse cx="30" cy="40" rx="12" ry="6" fill="#4B5563"/>
            {/* Hub */}
            <circle cx="30" cy="40" r="5" fill="#374151"/>
            {/* Rotating Blades */}
            <g style={{ transformOrigin: '30px 40px', animation: 'gentleRotate 4s linear infinite' }}>
              <path d="M30,40 L30,15 Q32,12 30,10 Q28,12 30,15" fill="hsl(var(--supply))" opacity="0.9"/>
              <path d="M30,40 L52,55 Q55,55 54,58 Q52,57 52,55" fill="hsl(var(--supply))" opacity="0.9"/>
              <path d="M30,40 L8,55 Q5,55 6,58 Q8,57 8,55" fill="hsl(var(--supply))" opacity="0.9"/>
            </g>
            {/* Hub center */}
            <circle cx="30" cy="40" r="3" fill="#1F2937"/>
          </g>

          {/* Data display panel */}
          <rect x="45" y="140" width="110" height="24" rx="4" fill="hsl(var(--background))" 
            stroke="hsl(var(--border))" strokeWidth="1"/>
          <text x="100" y="156" textAnchor="middle" className="fill-supply text-sm font-mono font-bold">
            {data.simulated_supply_mw.toFixed(1)} MW
          </text>
          
          <text x="100" y="180" textAnchor="middle" className="fill-foreground text-xs font-semibold">
            WIND FARM
          </text>
        </g>

        {/* ====== FLOW: WIND → BATTERY ====== */}
        <g className="flow-wind-to-battery">
          <path d="M170,105 L250,105" fill="none" 
            stroke={data.to_battery_mw > 0 ? "hsl(var(--supply))" : "hsl(var(--border))"}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={data.to_battery_mw > 0 ? "12 6" : "0"}
            markerEnd={data.to_battery_mw > 0 ? "url(#arrowSupply)" : ""}
            style={data.to_battery_mw > 0 ? { animation: 'flowRight 1s linear infinite' } : {}}
          />
          
          {/* Flow particles */}
          {data.to_battery_mw > 0 && (
            <>
              <circle r="6" fill="hsl(var(--supply))" filter="url(#glowSupply)">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M170,105 L250,105"/>
              </circle>
              <circle r="4" fill="hsl(var(--supply))" opacity="0.7">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M170,105 L250,105" begin="0.5s"/>
              </circle>
            </>
          )}
          
          {/* Flow value label */}
          <rect x="185" y="82" width="55" height="20" rx="4" fill="hsl(var(--card))" 
            stroke="hsl(var(--border))" strokeWidth="1"/>
          <text x="212" y="96" textAnchor="middle" className="fill-supply text-[10px] font-mono font-semibold">
            +{data.to_battery_mw.toFixed(1)} MW
          </text>
        </g>

        {/* ====== BATTERY STORAGE ====== */}
        <g className="battery-storage">
          {/* Background panel */}
          <rect x="250" y="40" width="140" height="130" rx="12" 
            fill="hsl(var(--card))" stroke="hsl(var(--battery))" strokeWidth="2"/>
          
          {/* Battery rack outline */}
          <rect x="280" y="55" width="80" height="70" rx="6" 
            fill="hsl(var(--background))" stroke="hsl(var(--battery))" strokeWidth="2"/>
          
          {/* Battery terminal */}
          <rect x="305" y="48" width="30" height="8" rx="2" fill="hsl(var(--battery))"/>
          
          {/* Battery fill level */}
          <clipPath id="batteryClip">
            <rect x="284" y="59" width="72" height="62" rx="4"/>
          </clipPath>
          <rect 
            x="284" 
            y={59 + (62 * (1 - batteryFillPercent / 100))} 
            width="72" 
            height={62 * batteryFillPercent / 100} 
            fill="url(#batteryGradient)"
            clipPath="url(#batteryClip)"
          >
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
          </rect>
          
          {/* Battery percentage text */}
          <text x="320" y="95" textAnchor="middle" className="fill-foreground text-lg font-mono font-bold">
            {data.battery_percent.toFixed(0)}%
          </text>

          {/* Data display panel */}
          <rect x="265" y="140" width="110" height="24" rx="4" fill="hsl(var(--battery))" />
          <text x="320" y="156" textAnchor="middle" className="fill-white text-xs font-mono font-semibold">
            {data.to_battery_mw > 0 ? '+' : '-'}{Math.abs(data.to_battery_mw - data.from_battery_mw).toFixed(1)} MW
          </text>
          
          <text x="320" y="180" textAnchor="middle" className="fill-foreground text-xs font-semibold">
            ENERGY STORAGE
          </text>
        </g>

        {/* ====== FLOW: BATTERY → CITY ====== */}
        <g className="flow-battery-to-city">
          <path d="M390,105 L470,105" fill="none" 
            stroke={data.from_battery_mw > 0 ? "hsl(var(--battery))" : "hsl(var(--border))"}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={data.from_battery_mw > 0 ? "12 6" : "0"}
            markerEnd={data.from_battery_mw > 0 ? "url(#arrowBattery)" : ""}
            style={data.from_battery_mw > 0 ? { animation: 'flowRight 1s linear infinite' } : {}}
          />
          
          {data.from_battery_mw > 0 && (
            <>
              <circle r="6" fill="hsl(var(--battery))" filter="url(#glowBattery)">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M390,105 L470,105"/>
              </circle>
              <circle r="4" fill="hsl(var(--battery))" opacity="0.7">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M390,105 L470,105" begin="0.5s"/>
              </circle>
            </>
          )}
          
          <rect x="405" y="82" width="55" height="20" rx="4" fill="hsl(var(--card))" 
            stroke="hsl(var(--border))" strokeWidth="1"/>
          <text x="432" y="96" textAnchor="middle" className="fill-battery text-[10px] font-mono font-semibold">
            {data.from_battery_mw.toFixed(1)} MW
          </text>
        </g>

        {/* ====== CITY LOAD ====== */}
        <g className="city-load">
          {/* Background panel */}
          <rect x="470" y="40" width="140" height="130" rx="12" 
            fill="url(#cityGradient)" stroke="hsl(var(--demand))" strokeWidth="2"/>
          
          {/* City skyline */}
          <g transform="translate(495, 50)">
            {/* Buildings */}
            <rect x="0" y="45" width="18" height="50" fill="hsl(var(--demand))" opacity="0.7" rx="1"/>
            <rect x="22" y="30" width="22" height="65" fill="hsl(var(--demand))" opacity="0.85" rx="1"/>
            <rect x="48" y="40" width="16" height="55" fill="hsl(var(--demand))" opacity="0.6" rx="1"/>
            <rect x="68" y="20" width="20" height="75" fill="hsl(var(--demand))" opacity="0.9" rx="1"/>
            
            {/* Windows - glowing effect */}
            <g className="windows">
              <rect x="4" y="55" width="4" height="4" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="10" y="55" width="4" height="4" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="4" y="65" width="4" height="4" fill="hsl(var(--warning))" opacity="0.8"/>
              <rect x="10" y="75" width="4" height="4" fill="hsl(var(--background))" opacity="0.9"/>
              
              <rect x="27" y="40" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="35" y="40" width="5" height="5" fill="hsl(var(--warning))" opacity="0.8"/>
              <rect x="27" y="52" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="35" y="52" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="27" y="64" width="5" height="5" fill="hsl(var(--warning))" opacity="0.8"/>
              <rect x="35" y="76" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              
              <rect x="72" y="30" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="80" y="30" width="5" height="5" fill="hsl(var(--warning))" opacity="0.8"/>
              <rect x="72" y="45" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="80" y="45" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
              <rect x="72" y="60" width="5" height="5" fill="hsl(var(--warning))" opacity="0.8"/>
              <rect x="80" y="75" width="5" height="5" fill="hsl(var(--background))" opacity="0.9"/>
            </g>
          </g>

          {/* Data display panel */}
          <rect x="485" y="140" width="110" height="24" rx="4" fill="hsl(var(--background))" 
            stroke="hsl(var(--border))" strokeWidth="1"/>
          <text x="540" y="156" textAnchor="middle" className="fill-demand text-sm font-mono font-bold">
            {data.simulated_demand_mw.toFixed(1)} MW
          </text>
          
          <text x="540" y="180" textAnchor="middle" className="fill-foreground text-xs font-semibold">
            CITY LOAD
          </text>
        </g>

        {/* ====== GRID CONNECTION ====== */}
        <g className="grid-connection">
          {/* Background panel */}
          <rect x="630" y="40" width="140" height="130" rx="12" 
            fill="url(#gridGradient)" stroke="hsl(var(--grid-export))" strokeWidth="2"/>
          
          {/* Power tower / Substation icon */}
          <g transform="translate(670, 55)">
            {/* Transformer */}
            <circle cx="30" cy="45" r="22" fill="hsl(var(--card))" stroke="hsl(var(--grid-export))" strokeWidth="2"/>
            <circle cx="30" cy="45" r="14" fill="none" stroke="hsl(var(--grid-export))" strokeWidth="1.5"/>
            <circle cx="30" cy="45" r="6" fill="hsl(var(--grid-export))" opacity="0.5"/>
            
            {/* Power lines */}
            <line x1="30" y1="23" x2="30" y2="8" stroke="hsl(var(--grid-export))" strokeWidth="3"/>
            <line x1="20" y1="8" x2="40" y2="8" stroke="hsl(var(--grid-export))" strokeWidth="2"/>
            <line x1="15" y1="5" x2="45" y2="5" stroke="hsl(var(--grid-export))" strokeWidth="1.5"/>
            
            {/* Lightning bolt in center */}
            <path d="M30,38 L27,45 L32,45 L30,52" stroke="hsl(var(--warning))" strokeWidth="2" fill="none"/>
          </g>

          {/* Data display panel */}
          <rect x="645" y="140" width="110" height="24" rx="4" 
            fill={isExporting ? "hsl(var(--grid-export))" : isImporting ? "hsl(var(--destructive))" : "hsl(var(--muted))"} />
          <text x="700" y="156" textAnchor="middle" className="fill-white text-xs font-mono font-semibold">
            {isExporting ? `↑ ${data.to_grid_mw.toFixed(1)} MW` : isImporting ? `↓ ${data.from_grid_mw.toFixed(1)} MW` : '— 0 MW'}
          </text>
          
          <text x="700" y="180" textAnchor="middle" className="fill-foreground text-xs font-semibold">
            GRID {isExporting ? 'EXPORT' : isImporting ? 'IMPORT' : 'STANDBY'}
          </text>
        </g>

        {/* ====== FLOW: TO/FROM GRID ====== */}
        <g className="flow-grid">
          <path d="M610,105 L630,105" fill="none" 
            stroke={isExporting ? "hsl(var(--grid-export))" : isImporting ? "hsl(var(--destructive))" : "hsl(var(--border))"}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={isExporting || isImporting ? "12 6" : "0"}
            markerEnd={isExporting ? "url(#arrowExport)" : isImporting ? "url(#arrowImport)" : ""}
            style={isExporting || isImporting ? { animation: isExporting ? 'flowRight 1s linear infinite' : 'flowRight 1s linear infinite reverse' } : {}}
          />
        </g>

        {/* ====== DIRECT FLOW: WIND → CITY ====== */}
        <g className="flow-direct">
          <path d="M100,170 Q100,220 320,220 Q540,220 540,170" fill="none" 
            stroke="hsl(var(--supply))" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="8 4" opacity="0.4"
            style={{ animation: 'flowRight 2s linear infinite' }}
          />
          <text x="320" y="238" textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium">
            Direct Supply Path
          </text>
        </g>
      </svg>

      {/* System Imbalance Warning */}
      {hasImbalance && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-warning">System Imbalance Detected</div>
            <div className="text-xs text-muted-foreground mt-1">
              {imbalance.toFixed(1)} MW unaccounted • Possible measurement calibration needed
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-supply" /> Wind Generation
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-battery" /> Battery Flow
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-demand" /> City Demand
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(var(--grid-export))' }} /> Grid Export
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-destructive" /> Grid Import
        </span>
      </div>
    </div>
  );
};

export default EnergyFlowSchematic;
