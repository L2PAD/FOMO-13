import React, { useRef, useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GraphData, NodeObject, LinkObject } from "react-force-graph-2d";
import ExporingImg from "../../../../assets/images/exploring.png";

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface Node extends NodeObject {
  id: string;
  label: string;
  type: "main" | "exchange" | "token" | "lock";
  entityType?: string;
  entityId?: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  metadata?: Record<string, any>;
  color?: string;
  size?: number;
  fx?: number;
  fy?: number;
}

interface Link extends LinkObject {
  source: string;
  target: string;
  index?: number;
  total?: number;
  multiplier?: number;
  value: number;
  connectionIndex?: number;
  relation?: string;
  relationType?: string;
  roundStage?: string;
  date?: string;
  fundsRaised?: number;
  metadata?: Record<string, any>;
}

interface ForceGraphProps {
  width: number;
  height: number;
  selectedEntity?: any;
  selectedTab?: "ecosystem" | "influence" | "on-chain";
  filters?: {
    persons: boolean;
    funds: boolean;
    projects: boolean;
    exchanges?: boolean;
    tokens?: boolean;
    assets?: boolean;
  };
  onChainFilters?: {
    centralizedExchanges: boolean;
    depositAddresses: boolean;
    individualsAndFunds: boolean;
    decentralizedExchanges: boolean;
    lending: boolean;
    misc: boolean;
    uncategorized: boolean;
    all: boolean;
  };
  flowDirection?: "all" | "in" | "out" | "self";
  influenceFilter?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  externalGraphData?: GraphData;
  isLoading?: boolean;
  onHopLevelChange?: (hopLevel: number) => void;
  onExternalNodeSelect?: (node: any) => void;
  children?: React.ReactNode;
}

const NODE_STYLE_BY_ENTITY: Record<
  string,
  { fill: string; stroke: string; shadow: string }
> = {
  project: { fill: "#16352F", stroke: "#4ADE80", shadow: "#22C55E" },
  fund: { fill: "#332616", stroke: "#F59E0B", shadow: "#F97316" },
  person: { fill: "#17313B", stroke: "#38BDF8", shadow: "#0EA5E9" },
  investor: { fill: "#2D2F37", stroke: "#94A3B8", shadow: "#64748B" },
  funding_round: { fill: "#2A2340", stroke: "#A78BFA", shadow: "#8B5CF6" },
  exchange: { fill: "#3A1F24", stroke: "#FB7185", shadow: "#F43F5E" },
  token: { fill: "#1E2F46", stroke: "#60A5FA", shadow: "#3B82F6" },
  asset: { fill: "#2D2F37", stroke: "#94A3B8", shadow: "#64748B" },
};

const RELATION_COLORS: Record<string, string> = {
  invested_in: "#2ECC71",
  led_round: "#22C55E",
  lead_invested_in: "#22C55E",
  has_funding_round: "#A78BFA",
  coinvested_with: "#3498DB",
  founded: "#F39C12",
  founded_by: "#F39C12",
  partnered_with: "#9B59B6",
  advisor: "#E67E22",
  advisor_to: "#E67E22",
  has_token: "#9B59B6",
  traded_on: "#E74C3C",
  works_at: "#1ABC9C",
  portfolio: "#2ECC71",
};

function trimGraphLabel(label: any, maxLength = 16) {
  const value = String(label || "Unknown");
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function getNodeEntityStyle(node: any) {
  const key = String(node?.entityType || node?.type || "asset");
  return NODE_STYLE_BY_ENTITY[key] || NODE_STYLE_BY_ENTITY.asset;
}

function getRelationColor(relation: any) {
  return RELATION_COLORS[String(relation || "").toLowerCase()] || "#6C7480";
}

function rgbaFromHex(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function linkTouchesEntity(link: any, entityType: string) {
  return (
    link?.source?.entityType === entityType ||
    link?.target?.entityType === entityType
  );
}

function getGraphLinkDistance(link: any) {
  const relation = String(link?.relation || "").toLowerCase();

  if (relation === "has_funding_round") return 58;
  if (relation === "led_round" || relation === "invested_in") {
    return linkTouchesEntity(link, "funding_round") ? 72 : 105;
  }
  if (relation === "coinvested_with") return 135;
  if (linkTouchesEntity(link, "funding_round")) return 78;
  if (linkTouchesEntity(link, "investor")) return 125;
  return 98;
}

function formatExternalLinkTooltip(link: Link) {
  const relation = link.relation || link.relationType || "relation";
  const amount = Number(link.fundsRaised || link.value || 0);
  if (amount > 1) {
    return `${relation} - $${amount.toLocaleString()}`;
  }
  return relation;
}

const ForceGraph: React.FC<ForceGraphProps> = ({
  width,
  height,
  selectedEntity,
  selectedTab,
  filters,
  onChainFilters,
  flowDirection,
  influenceFilter,
  dateRange,
  externalGraphData,
  isLoading = false,
  onHopLevelChange,
  onExternalNodeSelect,
  children,
}) => {
  const forceRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [lockIcon, setLockIcon] = useState<HTMLImageElement | null>(null);
  const [cryptoIcons, setCryptoIcons] = useState<{
    [key: string]: HTMLImageElement;
  }>({});
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [, setParentNode] = useState<Node | null>(null);
  const [currentMainNode, setCurrentMainNode] = useState<Node | null>(null);
  const [hopLevel, setHopLevel] = useState<number>(1);
  const [navigationHistory, setNavigationHistory] = useState<Node[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fsSize, setFsSize] = useState<{ w: number; h: number }>(() => ({
    // avoid window access during SSR
    w: typeof window !== "undefined" ? window.innerWidth : width,
    h: typeof window !== "undefined" ? window.innerHeight : height,
  }));

  const toggleFullscreen = async () => {
    // Use browser Fullscreen API if available, fallback to CSS-based fullscreen
    const el = containerRef.current;
    if (!el || typeof document === "undefined") {
      setIsFullscreen((s) => !s);
      return;
    }

    const isNowFullscreen =
      document.fullscreenElement === el ||
      // vendor-prefixed fallbacks
      // @ts-ignore
      (document as any).webkitFullscreenElement === el ||
      // @ts-ignore
      (document as any).mozFullScreenElement === el ||
      // @ts-ignore
      (document as any).msFullscreenElement === el;

    try {
      if (!isNowFullscreen) {
        // request fullscreen on the container;
        // handle vendor-prefixed variants for older browsers
        // @ts-ignore
        if (el.requestFullscreen) await el.requestFullscreen();
        // @ts-ignore
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        // @ts-ignore
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        // @ts-ignore
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
        // we'll rely on the event to update isFullscreen state below
      } else if (document.exitFullscreen) {
        // exit fullscreen
        // @ts-ignore
        await document.exitFullscreen();
        // @ts-ignore
      } else if ((document as any).webkitExitFullscreen) {
        // @ts-ignore
        await (document as any).webkitExitFullscreen();
        // @ts-ignore
      } else if ((document as any).mozCancelFullScreen) {
        // @ts-ignore
        await (document as any).mozCancelFullScreen();
        // @ts-ignore
      } else if ((document as any).msExitFullscreen) {
        // @ts-ignore
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      // If something goes wrong, fallback to our local css-driven fullscreen
      setIsFullscreen((s) => !s);
    }
  };

  useEffect(() => {
    // Keep component state in sync with browser fullscreen changes
    const onFsChange = () => {
      const el = containerRef.current;
      if (!el || typeof document === "undefined") return;

      const isNowFullscreen =
        document.fullscreenElement === el ||
        // vendor prefixed checks
        // @ts-ignore
        (document as any).webkitFullscreenElement === el ||
        // @ts-ignore
        (document as any).mozFullScreenElement === el ||
        // @ts-ignore
        (document as any).msFullscreenElement === el;

      setIsFullscreen(Boolean(isNowFullscreen));
    };

    // Standard event
    document.addEventListener("fullscreenchange", onFsChange);
    // vendor-prefixed events for older browsers
    // @ts-ignore
    document.addEventListener("webkitfullscreenchange", onFsChange);
    // @ts-ignore
    document.addEventListener("mozfullscreenchange", onFsChange);
    // @ts-ignore
    document.addEventListener("MSFullscreenChange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("mozfullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  useEffect(() => {
    // Keep the fullscreen canvas sized correctly
    if (!isFullscreen) return undefined;

    const update = () =>
      setFsSize({ w: window.innerWidth, h: window.innerHeight });

    // sync initially
    update();

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, [isFullscreen]);

  useEffect(() => {
    // Create lock icon image from SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      setLockIcon(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    const loadCryptoIcon = (name: string, ticker: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `${window.location.origin}/static/crypto-icons/${ticker.toLowerCase()}.svg`;
      img.onload = () => {
        setCryptoIcons((prev) => ({ ...prev, [name]: img }));
      };
      img.style.width = "100%";
      img.style.height = "100%";
      img.onerror = () => {
        // Fallback - try without version
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "anonymous";
        fallbackImg.src = `${window.location.origin}/static/crypto-icons/${ticker.toLowerCase()}.svg`;
        fallbackImg.onload = () => {
          setCryptoIcons((prev) => ({ ...prev, [name]: fallbackImg }));
        };
      };
    };

    // Load icons for main exchanges and tokens
    loadCryptoIcon("Binance", "binance");
    loadCryptoIcon("Gate.io", "gate");
    loadCryptoIcon("Bitcoin", "btc");
    loadCryptoIcon("Coinbase", "coinbase");
    loadCryptoIcon("Ethereum", "eth");
    loadCryptoIcon("BNB", "bnb");
    loadCryptoIcon("Solana", "sol");
  }, []);

  useEffect(() => {
    if (!externalGraphData) return;

    setGraphData(externalGraphData);
    const mainNode = externalGraphData.nodes.find(
      (node: any) => node.type === "main"
    ) as Node | undefined;

    setParentNode(null);
    setCurrentMainNode(mainNode || null);
    setHopLevel(1);
    setNavigationHistory(mainNode ? [mainNode] : []);
    onHopLevelChange?.(1);
  }, [externalGraphData, onHopLevelChange]);

  useEffect(() => {
    if (externalGraphData) return;

    // If no entity selected, show empty state
    if (!selectedEntity) {
      setGraphData({ nodes: [], links: [] });
      setParentNode(null);
      setCurrentMainNode(null);
      setHopLevel(1);
      return;
    }

    // Map search entity to graph node
    const entityNodeMap: Record<
      string,
      { id: string; label: string; type: Node["type"] }
    > = {
      Binance: { id: "Binance", label: "Binance", type: "exchange" },
      Coinbase: { id: "Coinbase", label: "Coinbase", type: "exchange" },
      "Gate.io": { id: "Gate.io", label: "Gate.io", type: "exchange" },
      Bitcoin: { id: "Bitcoin", label: "Bitcoin", type: "token" },
      Ethereum: { id: "Ethereum", label: "Ethereum", type: "token" },
      BNB: { id: "BNB", label: "BNB", type: "token" },
      Solana: { id: "Solana", label: "Solana", type: "token" },
      "Wallet 0x1234...": {
        id: "Wallet_0x1234",
        label: "0x1234...",
        type: "token",
      },
      "Wallet 0x5678...": {
        id: "Wallet_0x5678",
        label: "0x5678...",
        type: "token",
      },
      "Wallet 0x9abc...": {
        id: "Wallet_0x9abc",
        label: "0x9abc...",
        type: "token",
      },
      "Wallet 0xdef0...": {
        id: "Wallet_0xdef0",
        label: "0xdef0...",
        type: "token",
      },
    };

    const selectedNode = entityNodeMap[selectedEntity.name];
    if (!selectedNode) {
      setGraphData({ nodes: [], links: [] });
      return;
    }

    // Generate main node
    const mainNode: Node = {
      id: selectedNode.id,
      label: selectedNode.label,
      type: selectedNode.type,
      size: 5,
    };

    const nodes: Node[] = [mainNode];

    // Store current main node and reset hop level
    setCurrentMainNode(mainNode);
    setHopLevel(1);
    setNavigationHistory([mainNode]);
    onHopLevelChange?.(1);

    // Generate satellite addresses for selected entity
    const generateAddresses = (
      prefix: string,
      count: number,
      targetId: string
    ) => {
      const addresses: Node[] = [];
      for (let i = 0; i < count; i += 1) {
        addresses.push({
          id: `${targetId}_${prefix}${i}`,
          label: `${prefix.slice(0, 5)}...`,
          type: "lock",
          size: 5,
        });
      }
      return addresses;
    };

    // Calculate node count based on filters
    let nodeCount = 120;
    if (selectedTab === "ecosystem" && filters) {
      const activeFilters = Object.values(filters).filter(Boolean).length;
      if (activeFilters < 3) {
        nodeCount = Math.floor(120 * (activeFilters / 3));
      }
    } else if (selectedTab === "on-chain" && onChainFilters) {
      const activeFilters =
        Object.values(onChainFilters).filter(Boolean).length;
      if (activeFilters < 8) {
        nodeCount = Math.max(30, Math.floor(120 * (activeFilters / 8)));
      }
    }

    // Add satellite addresses only for selected entity
    const childAddresses = generateAddresses(
      selectedNode.label.substring(0, 7),
      nodeCount,
      selectedNode.id
    );

    // Spread child addresses further from the main node
    const spreadRadius = 180 + Math.max(0, childAddresses.length + 500) * 1.2; // base radius + more for more nodes
    const angleStep = (2 * Math.PI) / childAddresses.length;
    childAddresses.forEach((node, idx) => {
      // Place in a circle around the main node
      node.x = nodes[0].x || 0 + Math.cos(idx * angleStep) * spreadRadius;
      node.y = nodes[0].y || 0 + Math.sin(idx * angleStep) * spreadRadius;
    });

    const allNodes = [...nodes, ...childAddresses];

    // Generate links only between selected node and its children
    const links: Link[] = [];

    const addLink = (
      source: string,
      target: string,
      multiplier: number = 1
    ) => {
      for (let i = 0; i < multiplier; i += 1) {
        links.push({ source, target, value: Math.random() * 200 - 100 });
      }
    };

    // Connect child addresses only to selected node with more connections
    childAddresses.forEach((addr, idx) => {
      // More varied connection counts - some nodes have many connections
      let mult = 1;
      if (idx < 10) {
        mult = Math.floor(Math.random() * 18) + 3; // 3-10 connections
      } else if (idx < 30) {
        mult = Math.floor(Math.random() * 9) + 2; // 2-6 connections
      } else if (idx < 60) {
        mult = Math.floor(Math.random() * 4) + 1; // 1-3 connections
      }
      addLink(selectedNode.id, addr.id, mult);
    });

    // Process links to track multiple connections between same nodes
    const linkMap = new Map<string, number>();
    const processedLinks = links.map((link) => {
      const key = [link.source, link.target].sort().join("-");
      const count = linkMap.get(key) || 0;
      linkMap.set(key, count + 1);
      return { ...link, connectionIndex: count };
    });

    // Add total count to each link
    const finalLinks = processedLinks.map((link) => {
      const key = [link.source, link.target].sort().join("-");
      return { ...link, total: linkMap.get(key) };
    });

    setGraphData({ nodes: allNodes, links: finalLinks });
  }, [
    selectedEntity,
    selectedTab,
    filters,
    onChainFilters,
    flowDirection,
    influenceFilter,
    dateRange,
    externalGraphData,
    onHopLevelChange,
  ]);

  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = node.size || 5;

      ctx.save();

      if (externalGraphData) {
        const style = getNodeEntityStyle(node);
        const x = node.x || 0;
        const y = node.y || 0;
        const isMain = node.type === "main";
        const labelFontSize = Math.max(2.8, Math.min(8, 9 / globalScale));

        ctx.shadowColor = style.shadow;
        ctx.shadowBlur = isMain ? 18 : 8;
        ctx.fillStyle = style.fill;
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = isMain ? 1.4 : 0.7;

        if (node.entityType === "funding_round") {
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y);
          ctx.lineTo(x, y + size);
          ctx.lineTo(x - size, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(248, 250, 252, 0.82)";
        ctx.font = `${labelFontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(trimGraphLabel(node.label || node.name), x, y + size + 3);

        if (node.fx !== undefined && node.fy !== undefined && lockIcon) {
          const lockSize = size * 0.65;
          ctx.drawImage(
            lockIcon,
            x - size * 0.7 - lockSize / 2,
            y - size * 0.7 - lockSize / 2,
            lockSize,
            lockSize
          );
        }

        ctx.restore();
        return;
      }

      // Draw icon for colored nodes (main, exchange, token)
      if (node.type !== "lock") {
        // Set shadow based on node type
        if (node.type === "main") {
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 20;
        } else if (node.type === "exchange") {
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = 15;
        } else if (node.type === "token") {
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 15;
        } else if (node.id === "Bitcoin") {
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 15;
        }
        // Try to use crypto icon from API
        const cryptoIcon = cryptoIcons[node.id];

        if (String(node.id).startsWith("Wallet")) {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.fillStyle = "#2D2F37";
          ctx.fill();
          // Draw text inside wallet nodes
          ctx.fillStyle = "#fff";
          ctx.font = `2px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, node.x!, node.y!);
        } else if (cryptoIcon) {
          const isWithoutScale =
            selectedEntity?.name === "Binance" ||
            selectedEntity?.name === "Coinbase" ||
            selectedEntity?.name === "Gate.io";
          const iconSize = size * (isWithoutScale ? 3 : 2);
          ctx.drawImage(
            cryptoIcon,
            node.x! - size * (isWithoutScale ? 2.25 : 1),
            node.y! - size * (isWithoutScale ? 1.5 : 1),
            iconSize * (isWithoutScale ? 1.5 : 1),
            iconSize
          );
        } else {
          // Fallback to gray circle with text
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.fillStyle = "#2D2F37";
          ctx.fill();
          // Draw text inside nodes
          ctx.fillStyle = "#fff";
          ctx.font = `2px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, node.x!, node.y!);
        }

        ctx.shadowBlur = 0;
      } else {
        // Draw node circle for lock nodes
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
        ctx.fillStyle = "#2D2F37"; // Gray for addresses
        ctx.fill();

        // Draw text inside gray lock nodes
        ctx.fillStyle = "#fff";
        ctx.font = `2px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, node.x!, node.y!);
      }

      // Draw lock icon in top-left corner if node has been dragged (fx/fy are set)
      if (node.fx !== undefined && node.fy !== undefined && lockIcon) {
        const lockSize = size * 0.7;
        const lockX = node.x! - size * 0.7;
        const lockY = node.y! - size * 0.7;

        ctx.drawImage(
          lockIcon,
          lockX - lockSize / 2,
          lockY - lockSize / 2,
          lockSize,
          lockSize
        );
      }

      ctx.restore();
    },
    [externalGraphData, lockIcon, cryptoIcons, selectedEntity]
  );

  const drawLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const start = link.source;
      const end = link.target;

      if (typeof start !== "object" || typeof end !== "object") return;

      ctx.save();
      ctx.beginPath();

      // Check if this is a multiple link
      const isMultiple = link.total && link.total > 1;

      if (!isMultiple || link.connectionIndex === 0) {
        // Draw straight line for single links or first link
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      } else {
        // Draw curved line for additional links with increasing curve
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        // Calculate curve offset based on connection index with alternating small angles
        // Each additional link gets incrementally larger curve, alternating sides
        const side = link.connectionIndex % 2 === 1 ? 1 : -1;
        const curveMultiplier = Math.ceil(link.connectionIndex / 2); // 1, 1, 2, 2, 3, 3, ...
        const curveOffset = side * curveMultiplier; // 5, -5, 10, -10, 15, -15, ...

        // Calculate control point perpendicular to the line
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const normalX = -dy / distance;
        const normalY = dx / distance;

        const controlX = midX + normalX * curveOffset;
        const controlY = midY + normalY * curveOffset;

        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
      }

      if (externalGraphData) {
        const relationColor = getRelationColor(link.relation);
        const relation = String(link.relation || "").toLowerCase();
        const opacity = relation === "coinvested_with" ? 0.42 : 0.5;

        ctx.strokeStyle = rgbaFromHex(relationColor, opacity);
        ctx.lineWidth =
          relation === "has_funding_round" || relation === "coinvested_with"
            ? 0.45
            : 0.6;
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Calculate opacity based on value (0.1 to 1.0)
      const absValue = Math.abs(link.value || 0);
      const values = graphData.links
        .map((l: any) => Math.abs(l.value || 0))
        .filter((v) => !Number.isNaN(v) && v !== 0);
      const minValue = values.length > 0 ? Math.min(...values) : 1;
      const maxValue = values.length > 0 ? Math.max(...values) : 1;
      let opacity = 0.5;

      if (
        values.length > 0 &&
        !Number.isNaN(absValue) &&
        maxValue !== minValue
      ) {
        opacity = 0.1 + ((absValue - minValue) / (maxValue - minValue)) * 0.4;
      }

      opacity = Math.max(0.1, Math.min(1.0, opacity));

      // Set color based on value
      if (link.value < 0) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`; // Red for negative values
      } else {
        ctx.strokeStyle = `rgba(90, 169, 113, ${opacity})`; // Green for positive values
      }
      ctx.lineWidth = 0.1;

      ctx.stroke();
      ctx.restore();
    },
    [externalGraphData, graphData.links]
  );

  const handleNodeDrag = useCallback((node: any) => {
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);

  const handleNodeDragEnd = useCallback((node: any) => {
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);

  const handleEngineStop = useCallback(() => {
    if (forceRef.current?.d3Force) {
      forceRef.current
        .d3Force("charge")
        ?.strength(externalGraphData ? -85 : -300);
      forceRef.current
        .d3Force("link")
        ?.distance(externalGraphData ? getGraphLinkDistance : 100);
      forceRef.current
        .d3Force("center")
        ?.strength(externalGraphData ? 1.05 : 0.4);
    }
  }, [externalGraphData]);

  const handleNodeClick = useCallback(
    (node: any) => {
      if (externalGraphData) {
        onExternalNodeSelect?.(node);
        return;
      }

      // Handle clicking on parent node to go back
      if (
        (node.type === "exchange" || node.type === "token") &&
        navigationHistory.length > 1
      ) {
        // Find the clicked node in navigation history
        const clickedIndex = navigationHistory.findIndex(
          (histNode) => histNode.id === node.id
        );

        if (clickedIndex !== -1) {
          // Navigate back to this node
          const targetNode = navigationHistory[clickedIndex];
          const newHistory = navigationHistory.slice(0, clickedIndex + 1);
          const newHopLevel = newHistory.length;

          setNavigationHistory(newHistory);
          setHopLevel(newHopLevel);
          setCurrentMainNode(targetNode);
          // onHopLevelChange?.(newHopLevel);

          // Set parent node (previous in history)
          if (clickedIndex > 0) {
            setParentNode(newHistory[clickedIndex - 1]);
          } else {
            setParentNode(null);
          }

          // Generate graph for this node
          const newMainNode: Node = {
            ...targetNode,
            type: "main",
            size: 5,
          };

          const nodes: Node[] = [newMainNode];

          // Add parent node if exists
          if (clickedIndex > 0) {
            const parentNodeInGraph: Node = {
              ...newHistory[clickedIndex - 1],
              type:
                newHistory[clickedIndex - 1].type === "main"
                  ? "exchange"
                  : newHistory[clickedIndex - 1].type,
              size: 5,
            };
            nodes.push(parentNodeInGraph);
          }

          // Calculate node count based on filters
          let nodeCount = 120;
          if (selectedTab === "ecosystem" && filters) {
            const activeFilters = Object.values(filters).filter(Boolean).length;
            if (activeFilters < 3) {
              nodeCount = Math.floor(120 * (activeFilters / 3));
            }
          } else if (selectedTab === "on-chain" && onChainFilters) {
            const activeFilters =
              Object.values(onChainFilters).filter(Boolean).length;
            if (activeFilters < 8) {
              nodeCount = Math.max(30, Math.floor(120 * (activeFilters / 8)));
            }
          }

          // Generate child nodes if not at max hop level
          let childAddresses: Node[] = [];
          const shouldGenerateChildren = newHopLevel < 3;

          if (shouldGenerateChildren) {
            const generateAddresses = (
              prefix: string,
              count: number,
              targetId: string
            ) => {
              const addresses: Node[] = [];
              for (let i = 0; i < count; i += 1) {
                addresses.push({
                  id: `${targetId}_back_${prefix}${i}`,
                  label: `${prefix.slice(0, 5)}...`,
                  type: "lock",
                  size: clickedIndex === 0 ? 5 : 4,
                });
              }
              return addresses;
            };

            const count = clickedIndex === 0 ? nodeCount : 30;
            childAddresses = generateAddresses(
              targetNode.label.substring(0, 5),
              count,
              targetNode.id
            );
          }

          // Position nodes
          const totalNodes = shouldGenerateChildren
            ? childAddresses.length + (clickedIndex > 0 ? 1 : 0)
            : clickedIndex > 0
              ? 1
              : 0;
          const spreadRadius =
            clickedIndex === 0
              ? 180 + Math.max(0, childAddresses.length + 500) * 1.2
              : 200;
          const angleStep = (2 * Math.PI) / (totalNodes + 1);

          if (clickedIndex > 0) {
            nodes[1].x = Math.cos(0) * spreadRadius;
            nodes[1].y = Math.sin(0) * spreadRadius;
          }

          if (shouldGenerateChildren) {
            childAddresses.forEach((childNode, idx) => {
              const startIdx = clickedIndex > 0 ? 1 : 0;
              childNode.x =
                Math.cos((idx + startIdx) * angleStep) * spreadRadius;
              childNode.y =
                Math.sin((idx + startIdx) * angleStep) * spreadRadius;
            });
          }

          const allNodes = [...nodes, ...childAddresses];

          // Generate links
          const links: Link[] = [];

          const addLink = (
            source: string,
            target: string,
            multiplier: number = 1
          ) => {
            for (let i = 0; i < multiplier; i += 1) {
              links.push({ source, target, value: Math.random() * 200 - 100 });
            }
          };

          // Connect to parent node if exists
          if (clickedIndex > 0) {
            addLink(
              newMainNode.id,
              nodes[1].id,
              Math.floor(Math.random() * 5) + 3
            );
          }

          // Connect child nodes
          if (shouldGenerateChildren) {
            childAddresses.forEach((addr, idx) => {
              let mult = 1;
              if (clickedIndex === 0) {
                // Back to root - more connections
                if (idx < 10) {
                  mult = Math.floor(Math.random() * 18) + 3;
                } else if (idx < 30) {
                  mult = Math.floor(Math.random() * 9) + 2;
                } else if (idx < 60) {
                  mult = Math.floor(Math.random() * 4) + 1;
                }
              } else if (idx < 5) {
                // Back to intermediate - fewer connections
                mult = Math.floor(Math.random() * 4) + 2;
              } else if (idx < 15) {
                mult = Math.floor(Math.random() * 3) + 1;
              }
              addLink(newMainNode.id, addr.id, mult);
            });
          }

          // Process links
          const linkMap = new Map<string, number>();
          const processedLinks = links.map((link) => {
            const key = [link.source, link.target].sort().join("-");
            const count = linkMap.get(key) || 0;
            linkMap.set(key, count + 1);
            return { ...link, connectionIndex: count };
          });

          const finalLinks = processedLinks.map((link) => {
            const key = [link.source, link.target].sort().join("-");
            return { ...link, total: linkMap.get(key) };
          });

          setGraphData({ nodes: allNodes, links: finalLinks });
          return;
        }
      }

      // Only allow clicking on child nodes (lock type) to go forward
      if (node.type === "lock" && currentMainNode) {
        // Increment hop level
        const newHopLevel = hopLevel + 1;
        setHopLevel(newHopLevel);
        // onHopLevelChange?.(newHopLevel);

        // Store the current main node as parent
        setParentNode(currentMainNode);

        // Generate new graph with clicked node as main
        const newMainNode: Node = {
          id: node.id,
          label: node.label,
          type: "main",
          size: 5,
        };

        // Add to navigation history
        setNavigationHistory([...navigationHistory, newMainNode]);

        // Add parent node to the graph
        const parentNodeInGraph: Node = {
          ...currentMainNode,
          type:
            currentMainNode.type === "main" ? "exchange" : currentMainNode.type,
          size: 5,
        };

        const nodes: Node[] = [newMainNode, parentNodeInGraph];

        // Determine if we should generate child nodes based on hop level
        // Max 3 hops: 1 (initial) -> 2 (first click) -> 3 (second click, no children)
        const shouldGenerateChildren = newHopLevel < 3;

        let childAddresses: Node[] = [];

        if (shouldGenerateChildren) {
          // Generate fewer child addresses (30 instead of 120)
          const generateAddresses = (
            prefix: string,
            count: number,
            targetId: string
          ) => {
            const addresses: Node[] = [];
            for (let i = 0; i < count; i += 1) {
              addresses.push({
                id: `${targetId}_child_${prefix}${i}`,
                label: `${prefix.slice(0, 5)}...`,
                type: "lock",
                size: 4,
              });
            }
            return addresses;
          };

          childAddresses = generateAddresses(
            node.label.substring(0, 5),
            30,
            node.id
          );
        }

        // Position nodes in a circle
        const totalNodes = shouldGenerateChildren
          ? childAddresses.length + 1
          : 1;
        const spreadRadius = 200;
        const angleStep = (2 * Math.PI) / (totalNodes + 1);

        // Position parent node
        parentNodeInGraph.x = Math.cos(0) * spreadRadius;
        parentNodeInGraph.y = Math.sin(0) * spreadRadius;

        // Position child nodes if they exist
        if (shouldGenerateChildren) {
          childAddresses.forEach((childNode, idx) => {
            childNode.x = Math.cos((idx + 1) * angleStep) * spreadRadius;
            childNode.y = Math.sin((idx + 1) * angleStep) * spreadRadius;
          });
        }

        const allNodes = [...nodes, ...childAddresses];

        // Generate links
        const links: Link[] = [];

        const addLink = (
          source: string,
          target: string,
          multiplier: number = 1
        ) => {
          for (let i = 0; i < multiplier; i += 1) {
            links.push({ source, target, value: Math.random() * 200 - 100 });
          }
        };

        // Connect to parent node with multiple links
        addLink(
          newMainNode.id,
          parentNodeInGraph.id,
          Math.floor(Math.random() * 5) + 3
        );

        // Connect child addresses to new main node with fewer connections
        if (shouldGenerateChildren) {
          childAddresses.forEach((addr, idx) => {
            let mult = 1;
            if (idx < 5) {
              mult = Math.floor(Math.random() * 4) + 2; // 2-5 connections
            } else if (idx < 15) {
              mult = Math.floor(Math.random() * 3) + 1; // 1-3 connections
            }
            addLink(newMainNode.id, addr.id, mult);
          });
        }

        // Process links to track multiple connections
        const linkMap = new Map<string, number>();
        const processedLinks = links.map((link) => {
          const key = [link.source, link.target].sort().join("-");
          const count = linkMap.get(key) || 0;
          linkMap.set(key, count + 1);
          return { ...link, connectionIndex: count };
        });

        // Add total count to each link
        const finalLinks = processedLinks.map((link) => {
          const key = [link.source, link.target].sort().join("-");
          return { ...link, total: linkMap.get(key) };
        });

        setCurrentMainNode(newMainNode);
        setGraphData({ nodes: allNodes, links: finalLinks });
      }
    },
    [
      currentMainNode,
      hopLevel,
      navigationHistory,
      selectedTab,
      filters,
      onChainFilters,
      externalGraphData,
      onExternalNodeSelect,
    ]
  );

  // Empty state component
  if (!selectedEntity) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: "#0a0e1a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <img
          src={ExporingImg.src}
          alt="Exploring Graph"
          style={{ width: "250px", height: "250px" }}
        />
        <div
          style={{
            fontSize: "16px",
            color: "rgba(248, 250, 252, 0.5)",
            textAlign: "center",
            maxWidth: "80%",
            display: "inline-block",
          }}
        >
          Start exploring the network <br />
          Use the search bar to select an entity and generate the graph
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: "#0a0e1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(248, 250, 252, 0.65)",
          fontSize: "16px",
        }}
      >
        Loading ecosystem graph...
      </div>
    );
  }

  if (externalGraphData && externalGraphData.nodes.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: "#0a0e1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(248, 250, 252, 0.65)",
          fontSize: "16px",
          textAlign: "center",
        }}
      >
        No ecosystem links found for this entity
      </div>
    );
  }

  // compute widths safely (avoid reading window during SSR)
  const effectiveHeight = isFullscreen ? fsSize.h : height;

  return (
    <div
      ref={containerRef}
      style={{
        position: isFullscreen ? "fixed" : "relative",
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "100%",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        backgroundColor: isFullscreen ? "#0a0e1a" : "transparent",
      }}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 12,
          height: "40px",
          backgroundColor: "#101827",
          border: "1px solid #273449",
          borderRadius: "8px",
          padding: "0 12px",
          color: "#f8fafc",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "var(--font-weight-medium)",
          transition: "all 0.2s ease",
          backdropFilter: "blur(10px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#172033";
          e.currentTarget.style.borderColor = "#334155";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#101827";
          e.currentTarget.style.borderColor = "#273449";
        }}
      >
        {isFullscreen ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
            <span>Exit Full Screen</span>
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            <span>Full Screen</span>
          </>
        )}
      </button>
      {children}
      <ForceGraph2D
        ref={forceRef}
        graphData={graphData}
        width={containerRef.current?.clientWidth || width}
        height={effectiveHeight}
        backgroundColor="#0a0e1a"
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        nodeLabel={(node: any) => node.label}
        nodeRelSize={6}
        nodePointerAreaPaint={(
          node: any,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          const size = node.size || 5;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkWidth={1}
        linkDirectionalParticles={0}
        cooldownTicks={100}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
        onEngineStop={handleEngineStop}
        onNodeHover={(node) => {
          document.body.style.cursor = node ? "pointer" : "default";
        }}
        onNodeClick={handleNodeClick}
        onLinkHover={(link) => {
          setHoveredLink(link as Link);
        }}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
        warmupTicks={50}
        d3VelocityDecay={0.3}
      />
      {hoveredLink && (
        <div
          style={{
            position: "fixed",
            left: mousePos.x + 10,
            top: mousePos.y + 10,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {externalGraphData
            ? formatExternalLinkTooltip(hoveredLink)
            : `${hoveredLink.value.toFixed(2)}$`}
        </div>
      )}
    </div>
  );
};

export default ForceGraph;
