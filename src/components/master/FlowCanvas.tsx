import { useState, useRef } from "react";
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
  onDropBlock?: (icon: string, title: string, categoryId: string, x: number, y: number) => void;
  onMoveBlock?: (id: string, x: number, y: number) => void;
  onMoveEnd?: () => void;
  onConnect?: (from: string, to: string) => void;
  onDisconnect?: (from: string, to: string) => void;
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
  "flow-vendas": "hsl(142,71%,45%)",
  "flow-recuperacao": "hsl(38,92%,50%)",
};

export default function FlowCanvas({ blocks, connections, selectedId, highlightId, onSelect, zoom, pan, onPanChange, onDropBlock, onMoveBlock, onMoveEnd, onConnect, onDisconnect }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);
  const [dragBlockOffset, setDragBlockOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ from: string; x: number; y: number } | null>(null);

  // ── PAN ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    setPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // ── BLOCK DRAG ──
  const handleBlockMouseDown = (e: React.MouseEvent, block: CanvasBlock) => {
    e.stopPropagation();
    if (onMoveBlock) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragBlockId(block.id);
      setDragBlockOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handlePortMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const parent = canvasRef.current?.getBoundingClientRect();
    if (!parent) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const bx = block.x + 120;
    const by = block.y + 90;
    const sx = parent.left + pan.x + bx * zoom;
    const sy = parent.top + pan.y + by * zoom;
    setConnecting({ from: blockId, x: sx, y: sy });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (connecting) {
      setConnecting(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      return;
    }
    if (dragBlockId && onMoveBlock) {
      const parent = canvasRef.current?.getBoundingClientRect();
      if (!parent) return;
      const x = (e.clientX - parent.left - pan.x - dragBlockOffset.x) / zoom;
      const y = (e.clientY - parent.top - pan.y - dragBlockOffset.y) / zoom;
      onMoveBlock(dragBlockId, Math.round(x), Math.round(y));
      return;
    }
    if (!panning) return;
    onPanChange({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (connecting) {
      const target = (e.target as HTMLElement).closest("[data-block-port-top]");
      if (target) {
        const toId = target.getAttribute("data-block-id");
        if (toId && toId !== connecting.from && onConnect) {
          onConnect(connecting.from, toId);
        }
      }
      setConnecting(null);
      return;
    }
    if (dragBlockId && onMoveEnd) onMoveEnd();
    setPanning(false);
    setDragBlockId(null);
  };

  // ── DROP FROM SIDEBAR ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/flow-block");
    if (!raw || !onDropBlock) return;
    try {
      const { icon, title, categoryId } = JSON.parse(raw);
      const parent = canvasRef.current?.getBoundingClientRect();
      if (!parent) return;
      const x = Math.round((e.clientX - parent.left - pan.x - 120) / zoom);
      const y = Math.round((e.clientY - parent.top - pan.y - 20) / zoom);
      onDropBlock(icon, title, categoryId, Math.max(0, x), Math.max(0, y));
    } catch { /* ignore */ }
  };

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
        cursor: dragBlockId ? "grabbing" : panning ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }} className="absolute inset-0">
        {/* SVG Connections */}
        <svg className="absolute inset-0" style={{ width: 2000, height: 2000 }}>
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
              <g key={i} style={{ cursor: 'pointer' }}>
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
                <path
                  d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="12"
                  onClick={() => onDisconnect?.(conn.from, conn.to)}
                />
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

        {/* Temp connecting line */}
        {connecting && (() => {
          const fromBlock = blocks.find(b => b.id === connecting.from);
          if (!fromBlock) return null;
          const parent = canvasRef.current?.getBoundingClientRect();
          if (!parent) return null;
          const fx = fromBlock.x + 120;
          const fy = fromBlock.y + 90;
          const sx = fx;
          const sy = fy;
          const ex = (connecting.x - parent.left - pan.x) / zoom;
          const ey = (connecting.y - parent.top - pan.y) / zoom;
          return (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: 2000, height: 2000 }}>
              <path
                d={`M ${sx} ${sy} C ${sx} ${sy + Math.abs(ey - sy) * 0.4}, ${ex} ${ey - Math.abs(ey - sy) * 0.4}, ${ex} ${ey}`}
                fill="none"
                stroke="hsl(18,100%,58%)"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeOpacity="0.8"
              />
            </svg>
          );
        })()}

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
              className="absolute w-[240px] bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl cursor-grab hover:border-[hsl(0,0%,27%)] transition-colors overflow-hidden"
              style={{ left: block.x, top: block.y, zIndex: dragBlockId === block.id ? 50 : 1 }}
              onClick={(e) => { e.stopPropagation(); onSelect(block); }}
              onMouseDown={(e) => handleBlockMouseDown(e, block)}
            >
              {/* Header */}
              <div className="h-1.5" style={{ background: hColor }} />
              {/* Input port (top) */}
              <div
                data-block-port-top
                data-block-id={block.id}
                className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] rounded-full border-2 border-[hsl(0,0%,17%)] transition-all duration-150 hover:scale-150 cursor-crosshair"
                style={{ background: hColor, zIndex: 10 }}
                title="Conectar entrada"
              />
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
              {/* Output port (bottom) */}
              <div
                data-block-id={block.id}
                onMouseDown={(e) => handlePortMouseDown(e, block.id)}
                className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] rounded-full border-2 border-[hsl(0,0%,17%)] transition-all duration-150 hover:scale-150 cursor-crosshair"
                style={{ background: hColor, zIndex: 10 }}
                title="Arrastar para conectar"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Connection hint */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[10px] text-muted-foreground bg-[hsl(0,0%,7%)]/80 border border-[hsl(0,0%,17%)] rounded-lg px-3 py-1.5">
        <span>🟢 Arraste o ponto inferior para conectar blocos</span>
        <span className="w-px h-3 bg-[hsl(0,0%,17%)]" />
        <span>🔴 Clique na seta para removê-la</span>
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
