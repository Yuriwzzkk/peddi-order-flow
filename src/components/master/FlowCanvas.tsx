import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { type CanvasBlock, type Connection, blockCategories } from "./flowData";

interface Props {
  blocks: CanvasBlock[];
  connections: Connection[];
  selectedId: string | null;
  highlightId: string | null;
  onSelect: (block: CanvasBlock) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (p: { x: number; y: number }) => void;
}

const headerColors: Record<string, string> = {
  "client-triggers": "hsl(18,100%,58%)",
  "order-triggers": "hsl(18,100%,58%)",
  "menu-triggers": "hsl(18,100%,58%)",
  "time-triggers": "hsl(38,92%,50%)",
  "conditions": "hsl(217,91%,60%)",
  "action-messages": "hsl(160,84%,39%)",
  "action-automation": "hsl(258,90%,66%)",
  "action-sales": "hsl(330,81%,60%)",
  "action-operational": "hsl(174,58%,39%)",
  "integrations": "hsl(220,9%,46%)",
};

export default function FlowCanvas({ blocks, connections, selectedId, highlightId, onSelect, zoom, pan, onPanChange }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    onPanChange({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const getBlockCenter = (block: CanvasBlock) => ({
    x: block.x + 120,
    yTop: block.y,
    yBottom: block.y + 90,
  });

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative overflow-hidden"
      style={{
        background: "hsl(0,0%,5%)",
        backgroundImage: "radial-gradient(circle, hsl(0 0% 100% / 0.03) 1px, transparent 1px)",
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }} className="absolute inset-0">
        {/* SVG Connections */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: 2000, height: 2000 }}>
          {connections.map((conn, i) => {
            const fromBlock = blocks.find(b => b.id === conn.from);
            const toBlock = blocks.find(b => b.id === conn.to);
            if (!fromBlock || !toBlock) return null;
            const from = getBlockCenter(fromBlock);
            const to = getBlockCenter(toBlock);
            const x1 = from.x, y1 = from.yBottom;
            const x2 = to.x, y2 = to.yTop;
            const cy1 = y1 + Math.abs(y2 - y1) * 0.4;
            const cy2 = y2 - Math.abs(y2 - y1) * 0.4;
            const isYes = conn.label === "Sim";
            const isNo = conn.label === "Não";
            const color = isYes ? "hsl(142,71%,45%)" : isNo ? "hsl(0,84%,60%)" : "hsl(18,100%,58%)";

            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeOpacity="0.6"
                />
                <path
                  d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                >
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                </path>
                {/* Arrow */}
                <polygon
                  points={`${x2},${y2} ${x2 - 5},${y2 - 8} ${x2 + 5},${y2 - 8}`}
                  fill={color}
                  fillOpacity="0.6"
                />
                {conn.label && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} fill={color} fontSize="11" textAnchor="middle" fontWeight="600">{conn.label}</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Blocks */}
        {blocks.map(block => {
          const hColor = headerColors[block.categoryId] || "hsl(18,100%,58%)";
          const isSelected = selectedId === block.id;
          const isHighlighted = highlightId === block.id;

          return (
            <motion.div
              key={block.id}
              data-block
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: isHighlighted ? 1.03 : 1,
                boxShadow: isHighlighted
                  ? `0 0 24px hsl(18 100% 58% / 0.5)`
                  : isSelected
                  ? `0 0 0 2px hsl(18 100% 58%), 0 4px 24px rgba(0,0,0,0.4)`
                  : "0 4px 24px rgba(0,0,0,0.4)",
              }}
              className="absolute w-[240px] bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl cursor-pointer hover:border-[hsl(0,0%,27%)] transition-colors overflow-hidden"
              style={{ left: block.x, top: block.y }}
              onClick={() => onSelect(block)}
            >
              {/* Header */}
              <div className="h-1.5" style={{ background: hColor }} />
              {/* Input connector */}
              <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-[hsl(0,0%,30%)] border-2 border-[hsl(0,0%,17%)]" />
              {/* Body */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{block.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{block.title}</span>
                </div>
                <div className="bg-[hsl(0,0%,7%)] rounded-md p-2 text-[11px] text-muted-foreground line-clamp-2">
                  {block.message}
                </div>
              </div>
              {/* Output connector */}
              <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full border-2 border-[hsl(0,0%,17%)]"
                style={{ background: hColor }} />
            </motion.div>
          );
        })}
      </div>

      {/* Minimap */}
      <div className="absolute bottom-3 right-3 w-[140px] h-[100px] bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,17%)] rounded-lg overflow-hidden opacity-70">
        <svg className="w-full h-full">
          {blocks.map(b => (
            <rect key={b.id} x={b.x / 14} y={b.y / 14} width={17} height={6}
              fill={headerColors[b.categoryId] || "hsl(18,100%,58%)"} rx={1} opacity={0.8} />
          ))}
        </svg>
      </div>
    </div>
  );
}
