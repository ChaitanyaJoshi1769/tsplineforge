'use client';

import { useState } from 'react';
import { useAdvancedEditorStore } from '@/hooks/useAdvancedEditorStore';
import { Ruler, Trash2 } from 'lucide-react';

export function MeasurementTool() {
  const advancedStore = useAdvancedEditorStore();
  const [measureMode, setMeasureMode] = useState<'distance' | 'angle' | null>(null);
  const [measurements, setMeasurements] = useState<{ distance: number; time: number }[]>([]);

  const handleStartMeasurement = () => {
    if (!measureMode) {
      setMeasureMode('distance');
      advancedStore.setActiveTool('measure');
    } else {
      setMeasureMode(null);
      advancedStore.setActiveTool(null);
    }
  };

  const handleClearMeasurements = () => {
    setMeasurements([]);
    advancedStore.setMeasurementData(null);
  };

  const totalDistance = measurements.reduce((sum, m) => sum + m.distance, 0);

  return (
    <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Ruler className="w-4 h-4" />
        Measurement
      </h4>

      <div className="space-y-2">
        <button
          onClick={handleStartMeasurement}
          className={`w-full px-3 py-2 rounded text-xs font-medium transition-all ${
            measureMode
              ? 'bg-accent text-white border border-accent'
              : 'bg-primary/20 border border-primary/30 hover:bg-primary/30'
          }`}
        >
          {measureMode ? 'Measuring... (ESC to stop)' : 'Start Measurement'}
        </button>

        {measurements.length > 0 && (
          <div className="space-y-2">
            <div className="bg-background rounded p-2 text-xs space-y-1">
              {measurements.map((m, i) => (
                <div key={i} className="flex justify-between text-muted">
                  <span>Measurement {i + 1}:</span>
                  <span className="text-foreground font-medium">{m.distance.toFixed(3)} units</span>
                </div>
              ))}
              <div className="border-t border-border pt-1 mt-1 flex justify-between font-medium">
                <span>Total:</span>
                <span className="text-primary">{totalDistance.toFixed(3)} units</span>
              </div>
            </div>

            <button
              onClick={handleClearMeasurements}
              className="w-full px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-xs font-medium hover:bg-red-500/30 text-red-500/70 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="bg-background rounded p-3 space-y-2">
        <div className="text-xs text-muted">
          <p>💡 <strong>How to measure:</strong></p>
          <ol className="list-decimal list-inside text-xs text-muted/80 mt-1 space-y-0.5">
            <li>Click "Start Measurement"</li>
            <li>Click two points in the viewport</li>
            <li>Distance is calculated and displayed</li>
            <li>Press ESC or click button to stop</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
