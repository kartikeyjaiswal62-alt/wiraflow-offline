"use client";

import { useRef, useState, useCallback } from "react";
import styles from "./WiringGraph.module.css"; // Reuse graph styles

export function ERDiagram({ schemaPlan }: { schemaPlan: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest(`.${styles.node}`)) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setZoom((z) => Math.min(Math.max(z * delta, 0.3), 3));
  }, []);

  const readStr = (val: any, fallback = "") => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
    return fallback;
  };

  const NODE_W = 220;

  const nodes = schemaPlan.tables.map((t: any, i: number) => {
    const colHeight = t.columns.length * 20;
    const height = 40 + colHeight;
    return {
      id: t.key,
      name: readStr(t.name),
      columns: t.columns,
      x: 100 + (i % 3) * 280,
      y: 100 + Math.floor(i / 3) * 300,
      width: NODE_W,
      height,
    };
  });

  const edges: any[] = [];
  for (const t of schemaPlan.tables) {
    for (let ci = 0; ci < t.columns.length; ci++) {
      const c = t.columns[ci];
      if (c.references) {
          const targetNode = nodes.find((n: any) => n.name === readStr(c.references.table));
          const sourceNode = nodes.find((n: any) => n.id === t.key);
          if (targetNode && sourceNode) {
            const sy = sourceNode.y + 45 + ci * 20 - 4; // approximate center of column row
            const isTargetRight = targetNode.x > sourceNode.x;
            
            const sx = isTargetRight ? sourceNode.x + sourceNode.width : sourceNode.x;
            const tx = isTargetRight ? targetNode.x : targetNode.x + targetNode.width;
            
            let ty = targetNode.y + 16; // fallback to header
            const targetColIdx = targetNode.columns.findIndex((tc: any) => readStr(tc.name) === readStr(c.references.column));
          if (targetColIdx !== -1) {
            ty = targetNode.y + 45 + targetColIdx * 20 - 4;
          }

            edges.push({
              id: `${readStr(t.name)}-${readStr(c.name)}-to-${readStr(c.references.table)}`,
              sx, sy, tx, ty,
              label: readStr(c.references.column), // the reference name
            });
        }
      }
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "var(--bg-surface)" }}>
      <svg
        ref={svgRef}
        style={{ width: "100%", height: "100%", cursor: dragRef.current ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="er-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill="var(--border-color)" />
          </pattern>
          <marker id="er-arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted)" opacity="0.5" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#er-grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map((edge) => {
            const { sx, sy, tx, ty } = edge;
            // Bezier curve layout
            const isRightToLeft = tx < sx;
            const controlOffset = Math.max(Math.abs(tx - sx) / 2, 40);
            const controlPointX1 = sx + (isRightToLeft ? -controlOffset : controlOffset);
            const controlPointY1 = sy;
            const controlPointX2 = tx + (isRightToLeft ? controlOffset : -controlOffset);
            const controlPointY2 = ty;
            const pathData = `M ${sx} ${sy} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${tx} ${ty}`;

            return (
              <g key={edge.id}>
                <path d={pathData} fill="none" stroke="var(--accent-cyber)" strokeWidth="1.5" opacity="0.6" markerEnd="url(#er-arrowhead)" />
                <path d={pathData} fill="none" stroke="transparent" strokeWidth="10" />
                
                {/* Edge Label */}
                <rect x={(sx + tx) / 2 - 20} y={(sy + ty) / 2 - 12} width={40} height={16} fill="var(--bg-main)" rx={4} opacity="0.8" />
                <text x={(sx + tx) / 2} y={(sy + ty) / 2} fill="var(--text-muted)" fontSize={9} textAnchor="middle" fontWeight="600">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {nodes.map((node: any) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className={styles.node}>
              <filter id={`shadow-${node.id}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#000000" floodOpacity="0.4"/>
              </filter>
              <rect width={node.width} height={node.height} fill="var(--bg-surface-elevated)" stroke="var(--glass-border)" strokeWidth="1" rx={8} filter={`url(#shadow-${node.id})`} />
              
              <path d={`M 0 8 Q 0 0 8 0 L ${node.width - 8} 0 Q ${node.width} 0 ${node.width} 8 L ${node.width} 32 L 0 32 Z`} fill="var(--glass-bg)" />
              <rect width={node.width} height={32} fill="var(--accent-cyber)" opacity="0.1" rx={8} style={{ clipPath: `inset(0px 0px ${node.height - 32}px 0px)` }} />
              
              <text x={16} y={21} fill="var(--text-primary)" fontSize={13} fontWeight={600}>
                {node.name}
              </text>

              {node.columns.map((c: any, ci: number) => (
                <g key={c.key}>
                  <text x={16} y={45 + ci * 20} fill={c.isPrimaryKey ? "#FACC15" : c.references ? "#A855F7" : "var(--text-muted)"} fontSize={10}>
                    {c.isPrimaryKey ? "🔑" : (c.references ? "🔗" : "🔸")} 
                  </text>
                  <text x={34} y={45 + ci * 20} fill="var(--text-secondary)" fontSize={11}>
                    {readStr(c.name)}
                  </text>
                  <text x={node.width - 16} y={45 + ci * 20} fill="#22D3EE" fontSize={10} textAnchor="end" opacity="0.8">
                    {readStr(c.type)}
                  </text>
                </g>
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
