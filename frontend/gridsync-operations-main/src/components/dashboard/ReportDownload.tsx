import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimulationDataPoint, Alert, Summary } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportDownloadProps {
  simulationData: SimulationDataPoint[];
  alerts: Alert[];
  summary: Summary | null;
}

const ReportDownload = ({ simulationData, alerts, summary }: ReportDownloadProps) => {
  const { toast } = useToast();

  const downloadCSV = () => {
    if (simulationData.length === 0) {
      toast({
        title: "No Data",
        description: "Run a simulation first to generate data",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Hour', 'DateTime', 'Supply (MW)', 'Demand (MW)', 'Net Balance (MW)',
      'Battery %', 'To Battery (MW)', 'From Battery (MW)',
      'Grid Export (MW)', 'Grid Import (MW)', 'Wind Speed (m/s)', 'Status'
    ];

    const rows = simulationData.map(d => [
      d.hour,
      d.datetime,
      d.simulated_supply_mw.toFixed(2),
      d.simulated_demand_mw.toFixed(2),
      d.net_balance_mw.toFixed(2),
      d.battery_percent.toFixed(1),
      d.to_battery_mw.toFixed(2),
      d.from_battery_mw.toFixed(2),
      d.to_grid_mw.toFixed(2),
      d.from_grid_mw.toFixed(2),
      d.wind_speed.toFixed(1),
      d.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pase-simulation-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Downloaded",
      description: `${simulationData.length} data points exported`,
    });
  };

  const downloadPDF = () => {
    if (simulationData.length === 0) {
      toast({
        title: "No Data",
        description: "Run a simulation first to generate data",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(20, 24, 28);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PASE Console Report', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // Summary section
    if (summary) {
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Operational Summary', 14, 48);

      autoTable(doc, {
        startY: 52,
        head: [['Metric', 'Value']],
        body: [
          ['Surplus Hours', String(summary.operational.surplus_hours)],
          ['Deficit Hours', String(summary.operational.deficit_hours)],
          ['Balanced Hours', String(summary.operational.balanced_hours)],
          ['Total Generation', `${summary.operational.total_generation_mwh.toFixed(1)} MWh`],
          ['Total Consumption', `${summary.operational.total_consumption_mwh.toFixed(1)} MWh`],
          ['Grid Export', `${summary.operational.total_grid_export_mwh.toFixed(1)} MWh`],
          ['Grid Import', `${summary.operational.total_grid_import_mwh.toFixed(1)} MWh`],
          ['Capacity Factor', summary.operational.capacity_factor],
          ['Renewable Penetration', summary.operational.renewable_penetration],
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });
    }

    // Hourly Data section
    const currentY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Hourly Simulation Data', 14, currentY + 15);

    autoTable(doc, {
      startY: currentY + 20,
      head: [['Hour', 'Supply', 'Demand', 'Net', 'Battery %', 'Wind', 'Status']],
      body: simulationData.map(d => [
        d.hour,
        `${d.simulated_supply_mw.toFixed(1)} MW`,
        `${d.simulated_demand_mw.toFixed(1)} MW`,
        `${d.net_balance_mw.toFixed(1)} MW`,
        `${d.battery_percent.toFixed(0)}%`,
        `${d.wind_speed.toFixed(1)} m/s`,
        d.status,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Alerts section
    if (alerts.length > 0) {
      const alertY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;
      
      if (alertY > 250) doc.addPage();
      const startY = alertY > 250 ? 20 : alertY + 15;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Alerts', 14, startY);

      autoTable(doc, {
        startY: startY + 5,
        head: [['Level', 'Message', 'Timestamp']],
        body: alerts.map(a => [
          a.level.toUpperCase(),
          a.message,
          new Date(a.timestamp).toLocaleString(),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 8 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Page ${i} of ${pageCount} | PASE Console`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`pase-report-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF Downloaded",
      description: "Full report with summary and hourly data",
    });
  };

  const hasData = simulationData.length > 0;

  return (
    <div className="card-elevated p-2.5 h-full flex items-center gap-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Export</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={downloadCSV}
        disabled={!hasData}
        className="h-7 px-2 gap-1.5 text-xs"
      >
        <Download className="w-3 h-3" />
        CSV
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={downloadPDF}
        disabled={!hasData}
        className="h-7 px-2 gap-1.5 text-xs"
      >
        <FileText className="w-3 h-3" />
        PDF
      </Button>
    </div>
  );
};

export default ReportDownload;
