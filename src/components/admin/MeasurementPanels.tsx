
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface MeasurementPanelsProps {
  data: any | null;
  roiImageUrl?: string | null;
  status?: string;
  updatedAt?: string | null;
  onDownloadJson?: () => void;
  onRerun?: () => void;
  running?: boolean;
}

const MeasurementPanels: React.FC<MeasurementPanelsProps> = ({
  data,
  roiImageUrl,
  status,
  updatedAt,
  onDownloadJson,
  onRerun,
  running
}) => {
  const area = data?.area || {};
  const linear = data?.linear || {};
  const features = data?.features || {};
  const pitch = data?.pitch || {};
  const derived = data?.derived || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onDownloadJson} disabled={!data}>
          Download JSON
        </Button>
        <Button size="sm" onClick={onRerun} disabled={running}>
          {running ? "Re-running..." : "Re-run Analysis"}
        </Button>
        {status && (
          <span className="text-xs text-muted-foreground">
            Status: {status}{updatedAt ? ` • Updated: ${new Date(updatedAt).toLocaleString()}` : ""}
          </span>
        )}
      </div>

      {roiImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ROI Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={roiImageUrl} alt="ROI" className="w-full rounded-md border" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Area</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Total Squares: {area.total_squares ?? 0}</div>
            <div>Total Sq Ft: {area.total_sq_ft ?? 0}</div>
            <div>Waste %: {area.waste_factor_percent ?? 0}</div>
            {Array.isArray(area.area_by_plane) && area.area_by_plane.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">By Plane</div>
                <ul className="list-disc list-inside">
                  {area.area_by_plane.map((p: any, i: number) => (
                    <li key={i}>{p.plane_id || `Plane ${i+1}`}: {p.sq_ft ?? 0} sq ft</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Linear</CardTitle></CardHeader>
          <CardContent className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Eave Edge: {linear.eave_edge_lf ?? 0} lf</div>
            <div>Rake Edge: {linear.rake_edge_lf ?? 0} lf</div>
            <div>Drip Eave: {linear.drip_edge_eave_lf ?? 0} lf</div>
            <div>Drip Rake: {linear.drip_edge_rake_lf ?? 0} lf</div>
            <div>Ridges: {linear.ridges_lf ?? 0} lf</div>
            <div>Hips: {linear.hips_lf ?? 0} lf</div>
            <div>Valleys: {linear.valleys_lf ?? 0} lf</div>
            <div>Pitch Break: {linear.pitch_break_lf ?? 0} lf</div>
            <div>Step Flashing: {linear.step_flashing_lf ?? 0} lf</div>
            <div>Wall Flashing: {linear.wall_flashing_lf ?? 0} lf</div>
            <div>Side Wall: {linear.side_wall_lf ?? 0} lf</div>
            <div>Head Wall: {linear.head_wall_lf ?? 0} lf</div>
            <div>Return Walls: {linear.return_walls_lf ?? 0} lf</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Features</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="font-medium">Vents</div>
            {Array.isArray(features.vents) ? (
              <ul className="list-disc list-inside">
                {features.vents.map((v: any, i: number) => (
                  <li key={i}>{v.type}: {v.count}</li>
                ))}
              </ul>
            ) : <div>—</div>}

            <div className="font-medium mt-2">Chimneys</div>
            {Array.isArray(features.chimneys) ? (
              <ul className="list-disc list-inside">
                {features.chimneys.map((c: any, i: number) => (
                  <li key={i}>count {c.count}, {c.width_ft}x{c.length_ft} ft</li>
                ))}
              </ul>
            ) : <div>—</div>}

            <div className="font-medium mt-2">Skylights</div>
            {Array.isArray(features.skylights) ? (
              <ul className="list-disc list-inside">
                {features.skylights.map((s: any, i: number) => (
                  <li key={i}>count {s.count}, {s.width_ft}x{s.length_ft} ft</li>
                ))}
              </ul>
            ) : <div>—</div>}

            <div className="font-medium mt-2">Other</div>
            <div>Dormers: {Array.isArray(features.dormers) ? features.dormers?.[0]?.count ?? 0 : 0}</div>
            <div>Satellite dishes: {Array.isArray(features.satellite_dishes) ? features.satellite_dishes?.[0]?.count ?? 0 : 0}</div>
            <div>HVAC units: {Array.isArray(features.hvac_units) ? features.hvac_units?.[0]?.count ?? 0 : 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Pitch & Derived</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Primary: {pitch.primary || "—"}</div>
            <div>Average: {pitch.average || "—"}</div>
            {Array.isArray(pitch.by_plane) && pitch.by_plane.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">By Plane</div>
                <ul className="list-disc list-inside">
                  {pitch.by_plane.map((p: any, i: number) => (
                    <li key={i}>{p.plane_id || `Plane ${i+1}`}: {p.pitch}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2">Planes: {derived.total_planes ?? 0}</div>
            <div>Perimeter: {derived.total_perimeter_lf ?? 0} lf</div>
            <div>Complexity: {derived.complexity || "—"}</div>
            <div>Estimated waste: {derived.estimated_waste_percent ?? 0}%</div>
            <div>Confidence: {derived.confidence ?? 0}</div>
            {data?.method && (
              <div className="mt-2">
                <div className="font-medium">AI Method: {data.method}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeasurementPanels;
