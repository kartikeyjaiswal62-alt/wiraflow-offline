"use client";

/**
 * MobilePreview — The IDE Canvas
 *
 * Simulates a mobile device frame and maps semantic Flutter widgets into HTML DOM equivalents.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import styles from "./WidgetTree.module.css";

import { globalTheme } from "../../data/mock-project";

interface WidgetData {
  key: string;
  parentKey?: string;
  label: string;
  flutterWidgetType: string;
  semanticRole: string;
  interactive: boolean;
  action?: { operation: string; targetEntityKey?: string; targetPageKey?: string };
  dataBindings: { sourceEntityKey: string; field: string; displayAs: string }[];
  properties?: any;
}

interface PageData {
  key: string;
  label: string;
  pageType: string;
  widgetKeys: string[];
}

interface WidgetTreeProps {
  pages: PageData[];
  widgets: WidgetData[];
  selectedWidgetKey: string | null;
  selectedWidgetKeys?: string[];
  onSelectWidget: (key: string) => void;
  onTriggerAction?: (widgetKey: string) => void;
  onFieldChange?: (widgetKey: string, value: string) => void;
  currentPageKey: string;
  initialFrameMode?: "device" | "fill";
  initialDeviceSkin?: "bezel" | "clean";
  defaultFrameMode?: "device" | "fill";
  defaultDeviceSkin?: "bezel" | "clean";
  showControls?: boolean;
  embedded?: boolean;
  renderMode?: "preview" | "content";
  palette?: Record<string, string>;
  fonts?: { heading?: string; body?: string };
  themeMode?: "light" | "dark";
  testData?: Record<string, any[]>;
}

function getLucideIconName(materialName: string): string {
  if (!materialName) return "Circle";
  
  // Comprehensive Material Design → Lucide icon mapping
  const customMap: Record<string, string> = {
    // Navigation & arrows
    arrow_forward: "ArrowRight",
    arrow_back: "ArrowLeft",
    arrow_upward: "ArrowUp",
    arrow_downward: "ArrowDown",
    arrow_drop_down: "ChevronDown",
    arrow_drop_up: "ChevronUp",
    chevron_left: "ChevronLeft",
    chevron_right: "ChevronRight",
    expand_more: "ChevronDown",
    expand_less: "ChevronUp",
    navigate_next: "ChevronRight",
    navigate_before: "ChevronLeft",
    menu: "Menu",
    more_vert: "MoreVertical",
    more_horiz: "MoreHorizontal",
    close: "X",
    done: "Check",
    check: "Check",
    check_circle: "CheckCircle",
    cancel: "XCircle",

    // Communication
    email: "Mail",
    mail: "Mail",
    message: "MessageSquare",
    chat: "MessageCircle",
    chat_bubble: "MessageCircle",
    send: "Send",
    call: "Phone",
    phone: "Phone",
    videocam: "Video",
    
    // User & people
    person: "User",
    people: "Users",
    group: "Users",
    account_circle: "UserCircle",
    face: "Smile",
    person_add: "UserPlus",
    person_remove: "UserMinus",
    
    // Auth & security
    lock: "Lock",
    lock_outline: "Lock",
    lock_open: "Unlock",
    visibility: "Eye",
    visibility_off: "EyeOff",
    key: "Key",
    vpn_key: "Key",
    fingerprint: "Fingerprint",
    shield: "Shield",
    security: "ShieldCheck",
    
    // Content & editing
    add: "Plus",
    remove: "Minus",
    edit: "Pencil",
    create: "PenLine",
    delete: "Trash2",
    content_copy: "Copy",
    content_paste: "Clipboard",
    save: "Save",
    share: "Share2",
    upload: "Upload",
    download: "Download",
    attach_file: "Paperclip",
    link: "Link",
    
    // Media
    mic: "Mic",
    mic_none: "Mic",
    mic_off: "MicOff",
    volume_up: "Volume2",
    volume_down: "Volume1",
    volume_off: "VolumeX",
    volume_mute: "VolumeX",
    play_arrow: "Play",
    pause: "Pause",
    stop: "Square",
    skip_next: "SkipForward",
    skip_previous: "SkipBack",
    replay: "RotateCcw",
    camera: "Camera",
    camera_alt: "Camera",
    photo: "Image",
    image: "Image",
    photo_library: "Images",
    music_note: "Music",
    movie: "Film",
    
    // Social & feedback
    favorite: "Heart",
    favorite_border: "Heart",
    thumb_up: "ThumbsUp",
    thumb_down: "ThumbsDown",
    star: "Star",
    star_border: "Star",
    grade: "Star",
    bookmark: "Bookmark",
    bookmark_border: "Bookmark",
    
    // Notifications & alerts
    notifications: "Bell",
    notifications_none: "Bell",
    notifications_active: "BellRing",
    notifications_off: "BellOff",
    alarm: "AlarmClock",
    error: "AlertCircle",
    warning: "AlertTriangle",
    info: "Info",
    help: "HelpCircle",
    
    // Navigation & places
    home: "Home",
    dashboard: "LayoutDashboard",
    explore: "Compass",
    search: "Search",
    map: "Map",
    place: "MapPin",
    location_on: "MapPin",
    my_location: "Navigation",
    directions: "Route",
    navigation: "Navigation",
    near_me: "Navigation",
    
    // Shopping & commerce
    shopping_cart: "ShoppingCart",
    shopping_bag: "ShoppingBag",
    store: "Store",
    payment: "CreditCard",
    credit_card: "CreditCard",
    receipt: "Receipt",
    local_offer: "Tag",
    sell: "Tag",
    
    // Settings & tools
    settings: "Settings",
    tune: "SlidersHorizontal",
    build: "Wrench",
    code: "Code",
    terminal: "Terminal",
    bug_report: "Bug",
    filter_list: "Filter",
    sort: "ArrowUpDown",
    
    // Files & storage
    folder: "Folder",
    folder_open: "FolderOpen",
    file_copy: "Files",
    description: "FileText",
    article: "FileText",
    cloud: "Cloud",
    cloud_upload: "CloudUpload",
    cloud_download: "CloudDownload",
    storage: "HardDrive",
    
    // Time & scheduling
    schedule: "Clock",
    access_time: "Clock",
    timer: "Timer",
    event: "Calendar",
    calendar_today: "Calendar",
    date_range: "CalendarRange",
    history: "History",
    update: "RefreshCw",
    
    // Layout & display
    list: "List",
    view_list: "List",
    grid_view: "Grid3x3",
    apps: "Grid3x3",
    table_chart: "Table",
    pie_chart: "PieChart",
    bar_chart: "BarChart3",
    trending_up: "TrendingUp",
    trending_down: "TrendingDown",
    analytics: "BarChart3",
    insights: "Lightbulb",
    
    // Connectivity & devices
    wifi: "Wifi",
    wifi_off: "WifiOff",
    bluetooth: "Bluetooth",
    cast: "Cast",
    desktop_windows: "Monitor",
    phone_android: "Smartphone",
    tablet: "Tablet",
    watch: "Watch",
    headset: "Headphones",
    speaker: "Speaker",
    
    // Nature & science
    psychology: "Brain",
    science: "FlaskConical",
    light_mode: "Sun",
    dark_mode: "Moon",
    water_drop: "Droplet",
    eco: "Leaf",
    park: "Trees",
    pets: "PawPrint",
    
    // Actions & status
    bolt: "Zap",
    flash_on: "Zap",
    power: "Power",
    refresh: "RefreshCw",
    sync: "RefreshCw",
    autorenew: "RotateCw",
    cached: "RotateCw",
    logout: "LogOut",
    login: "LogIn",
    exit_to_app: "ExternalLink",
    open_in_new: "ExternalLink",
    launch: "ExternalLink",
    fullscreen: "Maximize",
    fullscreen_exit: "Minimize",
    zoom_in: "ZoomIn",
    zoom_out: "ZoomOut",
    crop: "Crop",
    rotate_left: "RotateCcw",
    rotate_right: "RotateCw",

    // Misc
    language: "Globe",
    public: "Globe",
    travel_explore: "Globe",
    emoji_emotions: "Smile",
    mood: "Smile",
    sentiment_satisfied: "Smile",
    sentiment_dissatisfied: "Frown",
    celebration: "PartyPopper",
    local_fire_department: "Flame",
    whatshot: "Flame",
    verified: "BadgeCheck",
    workspace_premium: "Crown",
    military_tech: "Award",
    emoji_events: "Trophy",
    task_alt: "CircleCheckBig",
    assignment: "ClipboardList",
    inventory: "Package",
    local_shipping: "Truck",
    flight: "Plane",
    hotel: "BedDouble",
    restaurant: "UtensilsCrossed",
    local_cafe: "Coffee",
    fitness_center: "Dumbbell",
    sports: "Trophy",
    pool: "Waves",
    spa: "Sparkles",
    palette: "Palette",
    brush: "Paintbrush",
    format_paint: "PaintBucket",
    text_fields: "Type",
    format_bold: "Bold",
    format_italic: "Italic",
    format_underline: "Underline",
    format_list_bulleted: "List",
    format_list_numbered: "ListOrdered",
    format_quote: "Quote",
    text_format: "Type",
    title: "Heading",
    radio_button_checked: "CircleDot",
    radio_button_unchecked: "Circle",
    check_box: "CheckSquare",
    check_box_outline_blank: "Square",
    toggle_on: "ToggleRight",
    toggle_off: "ToggleLeft",
    add_circle: "PlusCircle",
    remove_circle: "MinusCircle",
    help_outline: "HelpCircle",
    info_outline: "Info",
    error_outline: "AlertCircle",
    warning_amber: "AlertTriangle",
    report: "Flag",
    flag: "Flag",
    outlined_flag: "Flag",
    thumb_up_alt: "ThumbsUp",
    thumb_down_alt: "ThumbsDown",
    record_voice_over: "AudioLines",
    hearing: "Ear",
    visibility_outlined: "Eye",
  };

  // Strip suffixes like _rounded, _outlined, _filled, _sharp
  let name = materialName.replace(/_(rounded|outlined|filled|sharp)$/i, "");
  
  // Direct match
  if (customMap[name]) return customMap[name];
  
  // Try lowercase match
  const lower = name.toLowerCase();
  if (customMap[lower]) return customMap[lower];

  // Convert snake_case to PascalCase for Lucide lookup
  const pascal = name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  
  // Check if this PascalCase name exists in Lucide
  if ((LucideIcons as any)[pascal]) return pascal;
  
  // Fuzzy: try common variations
  const fuzzyAttempts = [
    pascal,
    pascal + "Icon",
    pascal.replace(/Outlined$/, ""),
    pascal.replace(/Filled$/, ""),
  ];
  
  for (const attempt of fuzzyAttempts) {
    if ((LucideIcons as any)[attempt]) return attempt;
  }

  // Last resort: search Lucide exports for a partial match
  const searchTerm = lower.replace(/_/g, "");
  const match = Object.keys(LucideIcons).find(k => 
    typeof (LucideIcons as any)[k] === "function" && 
    k.toLowerCase() === searchTerm
  );
  if (match) return match;

  return pascal; // Return PascalCase even if not found — may resolve at render
}


export function WidgetTree({
  pages,
  widgets,
  selectedWidgetKey,
  selectedWidgetKeys,
  onSelectWidget,
  onTriggerAction,
  onFieldChange,
  currentPageKey,
  initialFrameMode,
  initialDeviceSkin,
  defaultFrameMode,
  defaultDeviceSkin,
  showControls = true,
  embedded = false,
  renderMode = "preview",
  palette,
  fonts,
  themeMode = "dark",
  testData = {},
}: WidgetTreeProps) {
  const isContentMode = renderMode === "content";
  const DEVICE_PRESETS = useMemo(
    () => [
      { id: "iphone-se", label: "iPhone SE", w: 375, h: 667 },
      { id: "iphone-13-mini", label: "iPhone 13 mini", w: 375, h: 812 },
      { id: "iphone-14", label: "iPhone 14", w: 390, h: 844 },
      { id: "iphone-15-pro", label: "iPhone 15 Pro", w: 393, h: 852 },
      { id: "iphone-14-pro-max", label: "iPhone 14 Pro Max", w: 430, h: 932 },
      // Mock sizing for next-gen preview (not a guaranteed spec).
      { id: "iphone-16-pro-max", label: "iPhone 16 Pro Max (Mock)", w: 440, h: 956 },
    ],
    []
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [frameMode, setFrameMode] = useState<"device" | "fill">(() => {
    if (defaultFrameMode) return defaultFrameMode;
    if (initialFrameMode) return initialFrameMode;
    try {
      const v = localStorage.getItem("wiraflow.preview.frameMode");
      return v === "fill" ? "fill" : "device";
    } catch {
      return "device";
    }
  });
  const frameLocked = !!defaultFrameMode;
  const effectiveFrameMode: "device" | "fill" = defaultFrameMode || frameMode;

  const [deviceSkin, setDeviceSkin] = useState<"bezel" | "clean">(() => {
    if (defaultDeviceSkin) return defaultDeviceSkin;
    if (initialDeviceSkin) return initialDeviceSkin;
    try {
      const v = localStorage.getItem("wiraflow.preview.deviceSkin");
      return v === "bezel" ? "bezel" : "clean";
    } catch {
      return "clean";
    }
  });
  const [glassShine, setGlassShine] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("wiraflow.preview.glassShine");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  const skinLocked = !!defaultDeviceSkin;
  const effectiveDeviceSkin: "bezel" | "clean" = defaultDeviceSkin || deviceSkin;
  const [zoomMode, setZoomMode] = useState<"fit" | "custom">("fit");
  const [fitZoom, setFitZoom] = useState(1);
  const [customZoom, setCustomZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [spacePan, setSpacePan] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [controlsPosition, setControlsPosition] = useState<"top" | "side">(() => {
    try {
      const v = localStorage.getItem("wiraflow.preview.controlsPosition");
      return v === "side" ? "side" : "top";
    } catch {
      return "top";
    }
  });
  const panDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  }>({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const [deviceId, setDeviceId] = useState<string>(() => {
    try {
      return localStorage.getItem("wiraflow.preview.device") || "iphone-16-pro-max";
    } catch {
      return "iphone-16-pro-max";
    }
  });

  const zoom = zoomMode === "fit" ? fitZoom : customZoom;
  const device = DEVICE_PRESETS.find((d) => d.id === deviceId) || DEVICE_PRESETS[2];
	  const BASE_W = device.w;
	  const BASE_H = device.h;
	  const isIphone16ProMax = device.id === "iphone-16-pro-max";
  const showDynamicIsland = isIphone16ProMax;

  const [hoverInfo, setHoverInfo] = useState<{
    key: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const hoverRafRef = useRef<number>(0);
  const hoverLatestRef = useRef<{ next: any } | null>(null);

  const getWidgetHoverLabel = (w: any, props: any) => {
    const type = String(w?.flutterWidgetType || "Widget");
    const semantic =
      typeof props?.semanticLabel === "string" && props.semanticLabel.trim()
        ? props.semanticLabel.trim()
        : null;
    const label =
      typeof props?.label === "string" && props.label.trim() ? props.label.trim() : null;
    const text =
      typeof props?.text === "string" && props.text.trim() ? props.text.trim() : null;
    const secondary = semantic || label || text;
    return secondary ? `${type} • ${secondary}` : type;
  };

  const scheduleHoverUpdate = (next: { key: string; label: string; x: number; y: number } | null) => {
    hoverLatestRef.current = { next };
    if (hoverRafRef.current) return;
    hoverRafRef.current = window.requestAnimationFrame(() => {
      hoverRafRef.current = 0;
      const n = hoverLatestRef.current?.next ?? null;
      setHoverInfo(n);
    });
  };

  useEffect(() => {
    return () => {
      if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
      hoverRafRef.current = 0;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId: number;

    const compute = () => {
      // Use requestAnimationFrame and a small timeout to let Flexbox settle
      window.requestAnimationFrame(() => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          const rect = el.getBoundingClientRect();
          const margin = 100; // breathing room for controls + padding
          
          // Only compute if we have actual dimensions to avoid extreme scaling
          if (rect.width < 10 || rect.height < 10) return;

          const availW = Math.max(1, rect.width - margin);
          const availH = Math.max(1, rect.height - margin);
          const fitMax = 1.35;
          const s = Math.min(fitMax, availW / BASE_W, availH / BASE_H);
          setFitZoom(Number.isFinite(s) ? Math.max(0.25, Math.min(fitMax, s)) : 1);
        }, 50); // 50ms is usually enough for the first layout paint to finish
      });
    };

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    compute(); // call immediately to prevent initial 100% zoom flash
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      clearTimeout(timeoutId);
    };
  }, [BASE_W, BASE_H]);

  useEffect(() => {
    try {
      localStorage.setItem("wiraflow.preview.device", deviceId);
    } catch {
      // ignore
    }
  }, [deviceId]);

  useEffect(() => {
    try {
      localStorage.setItem("wiraflow.preview.glassShine", glassShine ? "1" : "0");
    } catch {
      // ignore
    }
  }, [glassShine]);

  useEffect(() => {
    if (defaultFrameMode) return;
    try {
      localStorage.setItem("wiraflow.preview.frameMode", frameMode);
    } catch {
      // ignore
    }
  }, [frameMode, defaultFrameMode]);

  useEffect(() => {
    if (defaultDeviceSkin) return;
    try {
      localStorage.setItem("wiraflow.preview.deviceSkin", deviceSkin);
    } catch {
      // ignore
    }
  }, [deviceSkin, defaultDeviceSkin]);

  // Spacebar pan: hold Space + drag to pan the whole canvas (Figma-like).
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as any;
      const tag = String(t?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
      e.preventDefault();
      setSpacePan(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      setSpacePan(false);
      setIsPanning(false);
      panDragRef.current.active = false;
    };
    window.addEventListener("keydown", onDown, { passive: false } as any);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown as any);
      window.removeEventListener("keyup", onUp as any);
    };
  }, []);

  // Keep device centered when zoom/device changes (avoid "clipping" defaults).
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [zoomMode, fitZoom, customZoom, deviceId, effectiveFrameMode, effectiveDeviceSkin]);

  const currentPage = useMemo(
    () => pages.find((p) => p.key === currentPageKey) || null,
    [pages, currentPageKey]
  );

  const pageWidgets = useMemo(() => {
    if (!currentPage) return [];
    const keys = new Set(currentPage.widgetKeys || []);
    return widgets.filter((w) => keys.has(w.key));
  }, [widgets, currentPage]);
  const widgetByKey = useMemo(() => {
    const map = new Map<string, WidgetData>();
    widgets.forEach((w) => map.set(w.key, w));
    return map;
  }, [widgets]);

  // Map into a tree
  const buildTree = (list: WidgetData[]) => {
    const map = new Map<string, any>();
    const roots: any[] = [];
    list.forEach((w) => map.set(w.key, { widget: w, children: [] }));
    list.forEach((w) => {
      const node = map.get(w.key);
      if (w.parentKey && map.has(w.parentKey)) {
        map.get(w.parentKey).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const tree = useMemo(() => buildTree(pageWidgets), [pageWidgets]);

  if (!currentPage) return null;

  // Deep clone a node and bind row data to Text/Image widgets
  const bindMockDataToNode = (node: any, rowData: any, rowIndex: number): any => {
    // Clone widget
    const newWidget = { ...node.widget, key: `${node.widget.key}-row${rowIndex}` };
    const newProps = { ...(newWidget.properties || {}) };
    
    // Bind Text
    if (newWidget.flutterWidgetType === "Text" && newProps.data) {
      // Simple heuristic for binding mock data to texts based on size/weight
      const isHeading = newProps.style?.textStyle?.fontWeight === "bold" || (newProps.style?.textStyle?.fontSize?.value > 14);
      const textKeys = isHeading ? ["title", "name", "price"] : ["description", "subtitle", "status", "time", "category"];
      const matchKey = textKeys.find(k => rowData[k]) || Object.keys(rowData)[0];
      if (matchKey && rowData[matchKey]) {
        newProps.data = { stringVal: { value: String(rowData[matchKey]) } };
      }
    }
    
    // Bind Image
    if (newWidget.flutterWidgetType === "Image" || newWidget.flutterWidgetType === "CircleAvatar") {
      const imgKeys = ["image", "url", "avatar", "photo", "icon"];
      const matchKey = imgKeys.find(k => rowData[k]) || null;
      if (matchKey && rowData[matchKey] && String(rowData[matchKey]).startsWith("http")) {
        if (newProps.src) newProps.src = { stringVal: { value: String(rowData[matchKey]) } };
        if (newProps.backgroundImage) newProps.backgroundImage = { stringVal: { value: String(rowData[matchKey]) } };
      } else {
        // Fallback random image
        if (newProps.src) newProps.src = { stringVal: { value: `https://picsum.photos/seed/${newWidget.key}/200/200` } };
        if (newProps.backgroundImage) newProps.backgroundImage = { stringVal: { value: `https://picsum.photos/seed/${newWidget.key}/200/200` } };
      }
    }
    
    newWidget.properties = newProps;
    
    // Clone children recursively
    const newChildren = (node.children || []).map((child: any) => bindMockDataToNode(child, rowData, rowIndex));
    
    return { widget: newWidget, children: newChildren };
  };

	  const renderComponent = (node: any) => {
	    const w: WidgetData = node.widget;
	    const isSelected =
	      selectedWidgetKey === w.key ||
	      (Array.isArray(selectedWidgetKeys) && selectedWidgetKeys.includes(w.key));
	    const clickHandler = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onTriggerAction) {
        // In test mode, only trigger for interactive widgets
        const isInteractive = w.interactive || 
          w.semanticRole === "submit_form" || 
          w.semanticRole === "action_trigger" ||
          w.semanticRole === "navigation" ||
          w.flutterWidgetType === "Button" ||
          w.flutterWidgetType === "SocialButton" ||
          w.flutterWidgetType === "IconButton" ||
          w.flutterWidgetType === "FloatingActionButton" ||
          w.flutterWidgetType === "BottomNavigationBar";
        if (isInteractive) onTriggerAction(w.key);
      } else {
        onSelectWidget(w.key);
      }
    };

	    const outlineStyle = `${styles.widgetNode} ${isSelected ? styles.selectedNode : ""}`.trim();
	    const props = w.properties || {};

	    const hoverMove = (e: React.MouseEvent) => {
	      e.stopPropagation();
	      if (!containerRef.current) return;
	      if ((w as any)?.flutterWidgetType === "Scaffold" || String((w as any)?.key || "") === "root") return;
	      const rect = containerRef.current.getBoundingClientRect();
	      scheduleHoverUpdate({
	        key: String(w.key),
	        label: getWidgetHoverLabel(w as any, props),
	        x: e.clientX - rect.left + 12,
	        y: e.clientY - rect.top + 14,
	      });
	    };

	    const hoverLeave = (e?: React.MouseEvent) => {
	      e?.stopPropagation();
	      scheduleHoverUpdate(null);
	    };

  // Dynamic Style Builder helpers
    const camelToSnake: Record<string, string> = {
      textPrimary: "primary_text",
      textSecondary: "secondary_text",
      textMuted: "hint",
      onPrimary: "on_primary",
      onSecondary: "on_secondary",
      surfaceElevated: "surface",
    };
    const snakeToCamel: Record<string, string> = {
      primary_text: "textPrimary",
      secondary_text: "textSecondary",
      hint: "textMuted",
      on_primary: "onPrimary",
      on_secondary: "onSecondary",
      surface: "surfaceElevated",
    };
    const resolveColor = (input: any): string | undefined => {
      if (!input) return undefined;

      const token =
        typeof input === "string"
          ? input
          : typeof input === "object"
            ? (typeof input.color === "string" ? input.color : input.color?.color)
            : undefined;

      if (!token) return undefined;
      if (token.startsWith("#")) return token;

      // Prefer project palette tokens if provided (enables theme swapping).
      if (palette && typeof palette === "object") {
        const direct = (palette as any)[token];
        if (typeof direct === "string" && direct.startsWith("#")) return direct;
        
        const camelFromSnake = snakeToCamel[token];
        if (camelFromSnake) {
          const v = (palette as any)[camelFromSnake];
          if (typeof v === "string" && v.startsWith("#")) return v;
        }
      }

      const themeSet = themeMode === "light" ? globalTheme.colors.light : globalTheme.colors.dark;
      const theme = themeSet as any;
      return theme[token] || (camelToSnake[token] ? theme[camelToSnake[token]] : undefined);
    };

    const readString = (v: any): string | undefined => {
      if (typeof v === "string") return v;
      const wrapped = v?.stringVal?.value;
      return typeof wrapped === "string" ? wrapped : undefined;
    };

    const parseHex = (hex: string): { r: number; g: number; b: number } | null => {
      const s = String(hex || "").trim();
      if (!s.startsWith("#")) return null;
      const h = s.length === 7 ? s.slice(1) : s.length === 9 ? s.slice(1, 7) : "";
      if (h.length !== 6) return null;
      const n = Number.parseInt(h, 16);
      if (!Number.isFinite(n)) return null;
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };

    const relLuminance = (hex: string): number | null => {
      const rgb = parseHex(hex);
      if (!rgb) return null;
      const toLin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const r = toLin(rgb.r);
      const g = toLin(rgb.g);
      const b = toLin(rgb.b);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const contrastRatio = (fgHex: string, bgHex: string): number | null => {
      const L1 = relLuminance(fgHex);
      const L2 = relLuminance(bgHex);
      if (L1 == null || L2 == null) return null;
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    };

    const findAncestorBg = (start: WidgetData): string | undefined => {
      let cur: WidgetData | undefined = start;
      for (let i = 0; i < 8; i++) {
        const pk = cur?.parentKey;
        if (!pk) break;
        const parent = widgetByKey.get(pk);
        if (!parent) break;
        const pProps = parent.properties || {};
        const bg = resolveColor(pProps.bg);
        if (typeof bg === "string" && bg.startsWith("#")) return bg;
        cur = parent;
      }
      return undefined;
    };

    const getLucideIconComp = (rawName: string | undefined) => {
      const safe = typeof rawName === "string" ? rawName : "";
      const iconName = getLucideIconName(safe);
      return (LucideIcons as any)[iconName] || LucideIcons.Circle;
    };

    const readNumber = (val: any, fallback: number = 0): number => {
      if (typeof val === "number") return val;
      if (val && typeof val === "object" && val.numberVal && typeof val.numberVal.value === "number") {
        return val.numberVal.value;
      }
      return fallback;
    };

    const getPadding = () => {
      if (!props.padding?.edgeInsets) return undefined;
      const { top, right, bottom, left, token } = props.padding.edgeInsets;
      if (token && (globalTheme.spacing as any)[token]) {
        return `${(globalTheme.spacing as any)[token]}px`;
      }
      return `${top || 0}px ${right || 0}px ${bottom || 0}px ${left || 0}px`;
    };

    const getSpacing = () => {
       if (!props.spacing?.stringVal?.value) return "0px";
       const token = props.spacing.stringVal.value;
       return (globalTheme.spacing as any)[token] ? `${(globalTheme.spacing as any)[token]}px` : token;
    };

    const flexMap: any = { start: "flex-start", center: "center", end: "flex-end", space_between: "space-between" };

    const style: React.CSSProperties = {
       padding: getPadding(),
       gap: getSpacing(),
    };

    if (props.bg?.color) {
       style.backgroundColor = resolveColor(props.bg);
    }
    
    if (props.width?.px) style.width = props.width.px.isInfinity ? "100%" : `${props.width.px.value}px`;
    if (props.height?.px) style.height = props.height.px.isInfinity ? "100%" : `${props.height.px.value}px`;

    if (props.height?.stringVal?.value) {
       const tk = props.height.stringVal.value;
       style.height = (globalTheme.spacing as any)[tk] ? `${(globalTheme.spacing as any)[tk]}px` : tk;
    }
    if (props.width?.stringVal?.value) {
       const tk = props.width.stringVal.value;
       style.width = (globalTheme.spacing as any)[tk] ? `${(globalTheme.spacing as any)[tk]}px` : tk;
    }
    if (props.radius?.radius) {
       const r = props.radius.radius;
       style.borderRadius = `${r.topLeft || 0}px ${r.topRight || 0}px ${r.bottomRight || 0}px ${r.bottomLeft || 0}px`;
    }

    if (props.border?.border) {
       style.border = `${props.border.border.width}px solid ${resolveColor(props.border.border.color) || "#333"}`;
    }

    if (props.shadow?.stringVal?.value) {
       const shadowToken = props.shadow.stringVal.value;
       const shadowMap: any = { "sm": "0 1px 2px rgba(0,0,0,0.1)", "md": "0 4px 12px rgba(0,0,0,0.1)", "lg": "0 10px 15px rgba(0,0,0,0.1)" };
       style.boxShadow = shadowMap[shadowToken] || shadowToken;
    }

    if (props.clip?.boolVal?.value) {
       style.overflow = "hidden";
    }

    if (props.opacity?.numberVal) {
       style.opacity = readNumber(props.opacity, 1);
    }

    if (props.transform_rotate?.numberVal) {
       style.transform = `rotate(${readNumber(props.transform_rotate, 0)}deg)`;
    }

    if (w.flutterWidgetType === "Column") {
       style.display = "flex";
       style.flexDirection = "column";
       if (!props.width?.px && !props.width?.stringVal?.value) style.width = "100%";
       if (props.cross_align?.align?.named) style.alignItems = flexMap[props.cross_align.align.named] || "stretch";
       if (props.main_align?.align?.named) style.justifyContent = flexMap[props.main_align.align.named] || "flex-start";
       if (props.scroll?.boolVal?.value) style.overflowY = isContentMode ? "visible" : "auto";
    }

    if (w.flutterWidgetType === "Row") {
       style.display = "flex";
       style.flexDirection = "row";
       if (!props.width?.px && !props.width?.stringVal?.value) style.width = "100%";
       if (props.cross_align?.align?.named) style.alignItems = flexMap[props.cross_align.align.named] || "center";
       if (props.align?.align?.named) style.justifyContent = flexMap[props.align.align.named] || "flex-start";
       if (props.scroll?.boolVal?.value) {
         style.overflowX = isContentMode ? "visible" : "auto";
         style.flexWrap = isContentMode ? "wrap" : "nowrap";
       }
    }

    if (w.flutterWidgetType === "Stack") {
      style.position = "relative";
      if (!style.width) style.width = "100%";
      if (!style.height) style.height = "100%";
      if (props.fit?.stringVal?.value === "expand") {
         style.display = "block";
      }
    }

    if (w.flutterWidgetType === "Container") {
      style.display = "flex";
      style.flexDirection = "column";
      style.boxSizing = "border-box";
      if (!props.width?.px && !props.width?.stringVal?.value) style.width = "100%";
      if (props.align_child?.align?.named) {
         style.alignItems = flexMap[props.align_child.align.named];
         style.justifyContent = flexMap[props.align_child.align.named];
      }
      
      if (props.gradient?.gradient) {
         const stops = props.gradient.gradient.stops;
         if (stops && stops.length >= 2) {
             const c1 = resolveColor(stops[0]);
             const c2 = resolveColor(stops[1]);
             style.background = props.gradient.gradient.type === "GRADIENT_TYPE_RADIAL" 
                  ? `radial-gradient(circle at center, ${c1} 0%, ${c2} 100%)`
                  : `linear-gradient(to right, ${c1}, ${c2})`;
         }
      }
    }

    const renderTrigger = () => (
      isSelected && onTriggerAction && w.action && (
        <div 
          className={styles.triggerOverlay}
           onClick={(e) => {
              e.stopPropagation();
              onTriggerAction(w.key);
           }}
        >
           <LucideIcons.Zap size={12} /> Run Action
        </div>
      )
    );

    switch (w.flutterWidgetType) {
	      case "Scaffold":
	        return (
	          <div
	            key={w.key}
	            className={outlineStyle}
            style={{
              flex: isContentMode ? undefined : 1,
              display: "flex",
              flexDirection: "column",
              width: "100%",
              minHeight: isContentMode ? undefined : "100%",
              backgroundColor: resolveColor(props.bg?.color) || "#000",
	            }}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
	            <div className={styles.safeArea}>{node.children.map(renderComponent)}</div>
	          </div>
	        );
      case "ListView": {
        // A pragmatic mapping: a vertically scrolling column list.
        // In content mode (export/canvas) we avoid nested scrollbars.
        const listGap = style.gap ?? "0px";
        const axis = props.scrollDirection?.stringVal?.value || "vertical";
        const isHorizontal = axis === "horizontal";
        
        let renderedChildren;
        if (testData && testData[w.key] && testData[w.key].length > 0 && node.children.length > 0) {
          renderedChildren = testData[w.key].map((row, idx) => {
            const templateNode = node.children[0];
            const boundNode = bindMockDataToNode(templateNode, row, idx);
            return renderComponent(boundNode);
          });
        } else {
          renderedChildren = node.children.map(renderComponent);
        }

        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              width: "100%",
              gap: listGap,
              overflowX: isContentMode ? "visible" : isHorizontal ? "auto" : "hidden",
              overflowY: isContentMode ? "visible" : isHorizontal ? "hidden" : "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {renderedChildren}
          </div>
        );
      }
      case "AppBar":
      case "SliverAppBar":
      case "TopAppBar": {
        const barBg = resolveColor(props.bg?.color) || resolveColor("surface") || "rgba(20,20,22,0.92)";
        const barFg = resolveColor(props.fg?.color) || resolveColor("textPrimary") || "#F5F5F7";
        const barH = props.height?.px?.value ? `${props.height.px.value}px` : "56px";
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              height: barH,
              minHeight: barH,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: style.padding ?? "12px 14px",
              background: barBg,
              color: barFg,
              borderBottom: `1px solid ${resolveColor("divider") || "rgba(255,255,255,0.08)"}`,
              position: props.pinned?.boolVal?.value ? "sticky" : undefined,
              top: props.pinned?.boolVal?.value ? 0 : undefined,
              zIndex: props.pinned?.boolVal?.value ? 10 : undefined,
              backdropFilter: "saturate(1.4) blur(10px)",
              WebkitBackdropFilter: "saturate(1.4) blur(10px)",
              boxSizing: "border-box",
            }}
          >
            {node.children.map(renderComponent)}
          </div>
        );
      }
      case "TabBar":
      case "Tabs": {
        const tabBg = resolveColor(props.bg?.color) || "transparent";
        const tabBorder = resolveColor("divider") || "rgba(255,255,255,0.10)";
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: style.gap ?? "10px",
              padding: style.padding ?? "10px 12px",
              background: tabBg,
              borderBottom: `1px solid ${tabBorder}`,
              overflowX: isContentMode ? "visible" : "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {node.children.map(renderComponent)}
          </div>
        );
      }
      case "BottomNavigationBar":
      case "BottomNav":
      case "BottomNavigation": {
        const navBg = resolveColor(props.bg?.color) || resolveColor("surfaceElevated") || "rgba(22,22,26,0.92)";
        const navBorder = resolveColor("divider") || "rgba(255,255,255,0.10)";
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              padding: style.padding ?? "10px 14px",
              background: navBg,
              borderTop: `1px solid ${navBorder}`,
              position: props.docked?.boolVal?.value ? "sticky" : undefined,
              bottom: props.docked?.boolVal?.value ? 0 : undefined,
              zIndex: props.docked?.boolVal?.value ? 10 : undefined,
              backdropFilter: "saturate(1.4) blur(10px)",
              WebkitBackdropFilter: "saturate(1.4) blur(10px)",
              boxSizing: "border-box",
            }}
          >
            {node.children.map(renderComponent)}
          </div>
        );
      }
      case "Badge": {
        const content = readString(props.content) ?? readString(props.label) ?? readString(props.text) ?? "";
        const bg = resolveColor(props.bg?.color) || resolveColor("primary") || "#8B5CF6";
        const fg = resolveColor(props.fg?.color) || resolveColor("onPrimary") || "#0B0B0E";
        const hasChild = node.children.length > 0;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{ ...style, position: "relative", display: "inline-flex", alignSelf: "flex-start" }}
          >
            {hasChild ? node.children.map(renderComponent) : null}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                transform: "translate(45%, -45%)",
                minWidth: 18,
                height: 18,
                padding: "0 6px",
                borderRadius: 9999,
                background: bg,
                color: fg,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                border: `1px solid ${resolveColor("divider") || "rgba(255,255,255,0.10)"}`,
                boxShadow: "0 8px 18px rgba(0,0,0,0.28)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {content}
            </div>
          </div>
        );
      }
      case "Column":
      case "Row":
      case "Container":
      case "Card":
      case "Center":
        if (w.flutterWidgetType === "Center") {
           style.display = "flex";
           style.width = "100%";
           style.height = "100%";
           style.alignItems = "center";
           style.justifyContent = "center";
        }
        return (
	          <div
	            key={w.key}
	            style={style}
	            className={outlineStyle}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
	            {node.children.map(renderComponent)}
	          </div>
	        );
      case "Expanded":
        return (
	          <div
	            key={w.key}
	            style={{ flex: 1, display: "flex", flexDirection: "column" }}
	            className={outlineStyle}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
	             {node.children.map(renderComponent)}
	          </div>
	        )
      case "Spacer":
        return (
          <div
            key={w.key}
            style={{ flex: 1, minHeight: 10, minWidth: 10 }}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
          />
        );
      case "Stack":
         return (
	           <div
	             key={w.key}
	             style={style}
	             className={outlineStyle}
	             onClick={clickHandler}
	             onMouseMove={hoverMove}
	             onMouseLeave={hoverLeave}
	           >
	             {node.children.map((child: any) => (
	                <div key={child.widget.key} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex"}}>
	                   {renderComponent(child)}
	                </div>
	             ))}
	           </div>
	         );
      case "ImageFiltered":
         if (props.blurSigma) {
            style.backdropFilter = `blur(${props.blurSigma}px)`;
            style.WebkitBackdropFilter = `blur(${props.blurSigma}px)`;
         }
	         return (
	           <div
	             key={w.key}
	             style={{ ...style, position: "absolute", inset: 0, zIndex: 1 }}
	             className={outlineStyle}
	             onClick={clickHandler}
	             onMouseMove={hoverMove}
	             onMouseLeave={hoverLeave}
	           >
	             {node.children.map(renderComponent)}
	           </div>
	         );
	      case "FlutterFlowTimer":
	         return (
	            <div
	              key={w.key}
	              className={outlineStyle}
	              style={{ ...style, fontSize: props.fontSize || 20, color: "#fff", fontWeight: "bold" }}
	              onClick={clickHandler}
	              onMouseMove={hoverMove}
	              onMouseLeave={hoverLeave}
	            >
	               {readString(props.text) ?? "00:00:00"}
	            </div>
	         );
	      case "TranscriptionBubble2Widget":
	         return (
	            <div
	              key={w.key}
	              className={outlineStyle}
	              style={{
	                ...style,
	                display: "flex",
	                gap: "12px",
	                width: "100%",
	                padding: "12px",
	                background: "#1a1a1a",
	                borderRadius: "12px",
	                border: "1px solid #333",
	              }}
	              onClick={clickHandler}
	              onMouseMove={hoverMove}
	              onMouseLeave={hoverLeave}
	            >
	               <div style={{ width: 32, height: 32, borderRadius: 16, background: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: "#fff" }}>
	                  {(() => {
                      const speaker = readString(props.speaker);
                      return speaker ? speaker.split(" ").map((n: string) => n[0]).join("") : "SC";
                    })()}
	               </div>
	               <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: "bold", color: "#A1A1A6" }}>{readString(props.speaker) ?? "Speaker"}</span>
                  <p style={{ fontSize: 14, color: "#F5F5F7", margin: 0, lineHeight: 1.5 }}>{readString(props.message) ?? ""}</p>
               </div>
            </div>
         );
      case "Sizedbox":
      case "SizedBox":
	         return (
	           <div
	             key={w.key}
	             style={style}
	             className={outlineStyle}
	             onClick={clickHandler}
	             onMouseMove={hoverMove}
	             onMouseLeave={hoverLeave}
	           />
	         );
      case "Divider":
         return <div key={w.key} style={{ height: 1, width: "100%", backgroundColor: resolveColor(props.color) || "#333" }} />;
      case "Text":
        const textStyleTokens = props.style?.textStyle?.styleName ? (globalTheme.text_styles as any)[props.style.textStyle.styleName] : null;
        const isMono = textStyleTokens?.font === "secondary";
        const textAlignNamed = props.text_align?.align?.named;
        const textAlign =
          textAlignNamed === "center"
            ? "center"
            : textAlignNamed === "end"
              ? "right"
              : "left";
        const lineHeight = props.line_height?.numberVal?.value;
        const parentType = w.parentKey ? widgetByKey.get(w.parentKey)?.flutterWidgetType : undefined;
        const isInRow = parentType === "Row";
        const ancestorBg = findAncestorBg(w);
        const fallbackText = resolveColor("textPrimary") || "#F5F5F7";
        const fallbackOn = resolveColor("onPrimary") || "#000000";
        const baseColor = resolveColor(props.color) || fallbackText;
        const autoColor = (() => {
          if (!ancestorBg) return baseColor;
          const candidates = [baseColor, fallbackText, fallbackOn].filter(
            (c) => typeof c === "string" && c.startsWith("#")
          ) as string[];
          let best = baseColor;
          let bestCr = contrastRatio(baseColor, ancestorBg) ?? 0;
          for (const c of candidates) {
            const cr = contrastRatio(c, ancestorBg);
            if (typeof cr === "number" && cr > bestCr) {
              bestCr = cr;
              best = c;
            }
          }
          // If everything is low contrast (rare), fall back to baseColor.
          return bestCr >= 3.2 ? best : baseColor;
        })();
	        return (
	          <div
	            key={w.key}
	            className={outlineStyle}
            style={{
              ...style,
              width: isInRow ? "auto" : "100%",
              flex: isInRow ? "0 0 auto" : undefined,
              textAlign,
	            }}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
	            <span style={{ 
               color: autoColor,
               fontWeight: props.font_weight?.numberVal?.value || textStyleTokens?.weight || 400,
               fontSize: textStyleTokens?.size || 14,
               lineHeight: typeof lineHeight === "number" ? lineHeight : undefined,
               fontFamily: (() => {
                 if (isMono) return '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
                 const styleName = props.style?.textStyle?.styleName as string | undefined;
                 const isHeading =
                   typeof styleName === "string" &&
                   (styleName.startsWith("headline") || styleName.startsWith("title"));
                 const family = isHeading ? fonts?.heading : fonts?.body;
                 return family
                   ? `"${family}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`
                   : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
               })(),
               letterSpacing: isMono ? "0.02em" : "normal"
            }}>{String(Object.keys(props).length === 0 ? (w.label ?? "") : (readString(props.content) ?? readString(props.label) ?? w.label ?? ""))}</span>
          </div>
        );
	      case "Chip":
        const chipText = readString(props.content) ?? readString(props.label) ?? String(w.label ?? "");
        const chipSelected = props.selected?.boolVal?.value || false;
        const chipVariant = props.variant?.stringVal?.value || "choice";
	        return (
	          <div
	            key={w.key}
	            className={outlineStyle}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	            style={{
	              ...style,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              borderRadius: 9999,
              border: chipSelected ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.10)",
              background: chipSelected ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.06)",
              color: chipSelected ? "#F5F5F7" : "#A1A1A6",
              fontSize: 12,
              fontWeight: chipVariant === "choice" ? 600 : 500,
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {chipText}
          </div>
        );
      case "Image":
        const legacyImageSourceUrl =
          props.source_desc?.imageSource?.value ||
          props.source_desc?.imageSource?.url ||
          props.source_desc?.imageSource?.stringVal?.value;
        const src =
          props.src?.stringVal?.value ||
          props.source?.stringVal?.value ||
          legacyImageSourceUrl ||
          "";
        const fit = props.fit?.stringVal?.value === "contain" ? "contain" : "cover";
        const banned = typeof src === "string" && src.includes("dreamflow.cloud");
        const effectiveSrc = banned ? "" : src;
        const hasImage = typeof effectiveSrc === "string" && effectiveSrc.trim().length > 0;
        const imageHeight = props.height?.px?.value ? `${props.height.px.value}px` : "180px";
	        return (
	          <div
	            key={w.key}
	            className={outlineStyle}
	            style={{ ...style, width: "100%", overflow: "hidden" }}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
            {hasImage ? (
              <img
                src={effectiveSrc}
                alt={props.alt?.stringVal?.value || String(w.label ?? "") || "image"}
                style={{
                  width: "100%",
                  height: imageHeight,
                  objectFit: fit as any,
                  borderRadius: props.radius?.radius ? "12px" : undefined,
                  display: "block",
                  border: "1px solid " + (resolveColor(props.border?.border?.color) || "transparent"),
                }}
              />
            ) : (
              <div
                style={{
                  height: imageHeight,
                  width: "100%",
                  borderRadius: props.radius?.radius ? "12px" : "16px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background:
                    "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.25), transparent 50%), rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: "#A1A1A6",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <LucideIcons.Image size={16} />
                <span>{props.source_desc?.stringVal?.value || "Image placeholder (no URL)"}</span>
              </div>
            )}
          </div>
        );
      case "Icon":
         const rawName = props.name?.icon?.name || "circle";
         const iconName = getLucideIconName(rawName);
         const IconComp = (LucideIcons as any)[iconName] || LucideIcons.Circle;
         const iconColor = resolveColor(props.color) || resolveColor("on_primary") || "#FFFFFF";
         
	         if (rawName === "google") {
	            const GoogleIcon = (LucideIcons as any).Chrome || LucideIcons.Circle;
	            return (
	               <div
	                 key={w.key}
	                 onClick={clickHandler}
	                 onMouseMove={hoverMove}
	                 onMouseLeave={hoverLeave}
	                 className={outlineStyle}
	                 style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
	               >
	                  <GoogleIcon size={props.size?.numberVal?.value || 24} color={iconColor} strokeWidth={2} />
	               </div>
	            );
	         }
	         if (rawName === "apple") {
	            const AppleIcon = (LucideIcons as any).Apple || LucideIcons.Circle;
	            return (
	               <div
	                 key={w.key}
	                 onClick={clickHandler}
	                 onMouseMove={hoverMove}
	                 onMouseLeave={hoverLeave}
	                 className={outlineStyle}
	                 style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
	               >
	                  <AppleIcon size={props.size?.numberVal?.value || 24} color={iconColor} strokeWidth={2} />
	               </div>
	            );
	         }

	         return (
	            <div
	              key={w.key}
	              onClick={clickHandler}
	              onMouseMove={hoverMove}
	              onMouseLeave={hoverLeave}
	              className={outlineStyle}
	              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
	            >
	               <IconComp size={props.size?.numberVal?.value || 24} color={iconColor} strokeWidth={2} />
	            </div>
	         );
      case "Progress":
        const progressVariant = props.variant?.stringVal?.value || "linear";
        const progressColor = resolveColor(props.color) || "var(--accent-primary)";
        if (progressVariant === "circular") {
          const s = props.size?.numberVal?.value || 28;
	          return (
	            <div
	              key={w.key}
	              className={outlineStyle}
	              onClick={clickHandler}
	              onMouseMove={hoverMove}
	              onMouseLeave={hoverLeave}
	              style={{ ...style, width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center" }}
	            >
              <div
                style={{
                  width: s,
                  height: s,
                  borderRadius: "50%",
                  border: `3px solid rgba(255,255,255,0.12)`,
                  borderTopColor: progressColor,
                  animation: "spin 0.9s linear infinite",
                }}
              />
            </div>
          );
        }
	        return (
	          <div
	            key={w.key}
	            className={outlineStyle}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	            style={{ ...style, width: "100%" }}
	          >
	            <div style={{ height: 8, width: "100%", background: "rgba(255,255,255,0.10)", borderRadius: 9999, overflow: "hidden" }}>
	              <div style={{ height: "100%", width: "62%", background: progressColor, borderRadius: 9999 }} />
	            </div>
	          </div>
	        );
      case "Chart":
        const chartTypeRaw = props.chart_type?.stringVal?.value || props.variant?.stringVal?.value || "bar";
        const chartType =
          String(chartTypeRaw).toLowerCase().includes("line")
            ? "line"
            : String(chartTypeRaw).toLowerCase().includes("pie")
              ? "pie"
              : "bar";
        const chartTitle = props.title?.stringVal?.value;
        const chartHeight = props.height?.px?.value || 160;
        const chartColor = resolveColor(props.color) || "var(--accent-cyber)";
        const rawChartData = props.data?.jsonVal?.value ?? props.data ?? [];
        const legacyNumbers = props.data?.stringVal?.value;
        const legacyLabels = props.labels?.stringVal?.value;
        const chartData: Array<{ label?: string; value?: number }> = Array.isArray(rawChartData)
          ? rawChartData
          : typeof legacyNumbers === "string"
            ? legacyNumbers
                .split(",")
                .map((s: string) => Number(String(s).trim()))
                .filter((n: number) => Number.isFinite(n))
                .map((n: number, i: number) => ({
                  label:
                    typeof legacyLabels === "string"
                      ? String(legacyLabels.split(",")[i] ?? "").trim() || undefined
                      : undefined,
                  value: n,
                }))
            : [];
        const values = chartData.map((d) => (typeof d?.value === "number" ? d.value : 0));
        const maxV = Math.max(1, ...values);
        const wBox = 320;
        const hChart = 120;
        const labelsFromLegacy = typeof legacyLabels === "string" ? legacyLabels.split(",").map((s) => String(s).trim()) : [];
        const labelsFromData = chartData.map((d) => (typeof d?.label === "string" ? d.label : ""));
        const labels = labelsFromLegacy.length ? labelsFromLegacy : labelsFromData;
        const hasLabels = labels.some((l) => l && l.trim().length > 0);
        const labelBand = hasLabels ? 24 : 0;
        const hBox = hChart + labelBand;
        const pad = 10;
        const showGrid = props.show_grid?.boolVal?.value ?? false;
        const barRadius = props.bar_radius?.numberVal?.value ?? 6;
        const barWidthPref = props.bar_width?.numberVal?.value;
        const slotW = chartData.length ? (wBox - pad * 2) / chartData.length : 0;
        const barW = slotW;
        const usableW =
          typeof barWidthPref === "number" && Number.isFinite(barWidthPref)
            ? Math.max(4, Math.min(barW * 0.9, barWidthPref))
            : barW * 0.7;
        const linePoints = values
          .map((v, i) => {
            const x = pad + (chartData.length === 1 ? 0 : (i * (wBox - pad * 2)) / (chartData.length - 1));
            const y = pad + (1 - v / maxV) * (hChart - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");

	        return (
	          <div
	            key={w.key}
	            className={outlineStyle}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	            style={{
	              ...style,
              width: "100%",
              padding: "14px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {chartTitle && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F5F5F7", marginBottom: 10 }}>
                {chartTitle}
              </div>
            )}
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${wBox} ${hBox}`} style={{ display: "block" }}>
              {showGrid && chartType !== "pie" && (
                <>
                  {[0.25, 0.5, 0.75].map((p, idx) => {
                    const y = pad + p * (hChart - pad * 2);
                    return (
                      <line
                        key={idx}
                        x1={pad}
                        x2={wBox - pad}
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={1}
                      />
                    );
                  })}
                </>
              )}
              {chartType === "line" ? (
                <>
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke={chartColor}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {values.map((v, i) => {
                    const x = pad + (chartData.length === 1 ? 0 : (i * (wBox - pad * 2)) / (chartData.length - 1));
                    const y = pad + (1 - v / maxV) * (hChart - pad * 2);
                    return <circle key={i} cx={x} cy={y} r={3.5} fill={chartColor} />;
                  })}
                </>
              ) : chartType === "pie" ? (
                (() => {
                  const total = Math.max(1, values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0));
                  const cx = wBox / 2;
                  const cy = (hChart / 2) + pad / 2;
                  const r = Math.min(wBox, hChart) * 0.32;
                  const strokeW = Math.max(10, r * 0.35);
                  const c = 2 * Math.PI * r;
                  let offset = 0;
                  return (
                    <>
                      <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} fill="none" />
                      {values.map((v, i) => {
                        const portion = (Number.isFinite(v) ? v : 0) / total;
                        const dash = portion * c;
                        const opacity = 0.95 - (i % 4) * 0.18;
                        const el = (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            stroke={chartColor}
                            strokeWidth={strokeW}
                            fill="none"
                            strokeLinecap="butt"
                            strokeDasharray={`${dash} ${c - dash}`}
                            strokeDashoffset={-offset}
                            opacity={Math.max(0.35, opacity)}
                            transform={`rotate(-90 ${cx} ${cy})`}
                          />
                        );
                        offset += dash;
                        return el;
                      })}
                    </>
                  );
                })()
              ) : (
                <>
                  {values.map((v, i) => {
                    const x = pad + i * barW + (barW - usableW) / 2;
                    const h = (v / maxV) * (hChart - pad * 2);
                    const y = hChart - pad - h;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width={usableW}
                        height={h}
                        rx={barRadius}
                        fill={chartColor}
                        opacity={0.9}
                      />
                    );
                  })}
                </>
              )}
              {hasLabels &&
                labels.slice(0, chartData.length).map((label, i) => {
                  const x = pad + i * barW + barW / 2;
                  return (
                    <text
                      key={i}
                      x={x}
                      y={hChart + 18}
                      textAnchor="middle"
                      fontSize={10}
                      fill="rgba(255,255,255,0.55)"
                    >
                      {String(label || "").slice(0, 4)}
                    </text>
                  );
                })}
            </svg>
          </div>
        );
      case "TextField":
        const rawIcon =
          props.icon?.stringVal?.value ||
          props.icon?.icon?.name ||
          props.icon?.icon?.icon?.name ||
          (props.is_password?.boolVal?.value ? "lock" : null);
        const prefixIconName = rawIcon ? getLucideIconName(rawIcon) : null;
        const PrefixIconComp = prefixIconName ? (LucideIcons as any)[prefixIconName] || LucideIcons.Circle : null;
        const isTestMode = !!onTriggerAction;
        
	        return (
	          <div
	            key={w.key}
	            style={{ ...style, display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}
	            className={outlineStyle}
	            onClick={isTestMode ? undefined : clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
            {props.label?.stringVal?.value && (
               <span style={{ fontSize: 12, fontWeight: 600, color: resolveColor("secondary_text") || "#A1A1A6" }}>{props.label.stringVal.value}</span>
            )}
            <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                {PrefixIconComp && (
                  <div style={{ position: "absolute", left: "16px", color: resolveColor("secondary_text") || "#A1A1A6", display: "flex", alignItems: "center" }}>
                     <PrefixIconComp size={18} strokeWidth={2} />
                  </div>
                )}
                <input 
                  type={props.is_password?.boolVal?.value ? "password" : "text"} 
                  placeholder={props.hint?.stringVal?.value || String(w.label ?? "")} 
                  className={styles.input} 
                  style={{ 
                     background: resolveColor("secondary") || resolveColor("surface") || "#111", 
                     border: "1px solid " + (resolveColor("divider") || "#333"), 
                     padding: PrefixIconComp ? "14px 16px 14px 44px" : "14px 16px", 
                     color: resolveColor("textPrimary") || "#FFF",
                     borderRadius: "12px",
                     width: "100%",
                     outline: "none",
                     fontSize: "14px",
                  }}
                  disabled={!isTestMode}
                  onChange={isTestMode ? (e) => {
                    if (onFieldChange) onFieldChange(w.key, e.target.value);
                  } : undefined}
                />
            </div>
          </div>
        );
      case "Button":
      case "SocialButton":
        const variant = props.variant?.stringVal?.value || "primary";
        const isGhost = variant === "ghost";
        const isOutlined = variant === "outlined";
        const isSocial = w.flutterWidgetType === "SocialButton";

        const bg =
          isSocial
            ? "#18181A"
            : (isGhost || isOutlined)
              ? "transparent"
              : (resolveColor(props.bg) || "#FFFFFF");

        const fg =
          isSocial
            ? "#FFFFFF"
            : (resolveColor(props.color) || (isGhost || isOutlined ? "#FFFFFF" : "#000000"));

        const effectiveFg = (() => {
          if (isSocial) return fg;
          if (bg === "transparent") return fg;
          if (typeof bg !== "string" || !bg.startsWith("#")) return fg;
          if (typeof fg !== "string" || !fg.startsWith("#")) return fg;
          const fallbackText = resolveColor("textPrimary") || "#F8FAFC";
          const fallbackOn = resolveColor("onPrimary") || "#000000";
          const candidates = [fg, fallbackText, fallbackOn, "#FFFFFF", "#000000"].filter(
            (c) => typeof c === "string" && c.startsWith("#")
          ) as string[];
          let best = fg;
          let bestCr = contrastRatio(fg, bg) ?? 0;
          for (const c of candidates) {
            const cr = contrastRatio(c, bg);
            if (typeof cr === "number" && cr > bestCr) {
              bestCr = cr;
              best = c;
            }
          }
          return bestCr >= 3.2 ? best : fg;
        })();

        const borderColor = resolveColor(props.border?.border?.color) || "#333333";

        const btnStyle: any = {
          ...style,
          width: props.full_width?.boolVal?.value ? "100%" : "auto",
          backgroundColor: bg,
          color: effectiveFg,
          padding: props.size?.stringVal?.value === "small" ? "8px 16px" : "16px",
          borderRadius: isSocial ? "8px" : "9999px",
          border: isSocial ? "1px solid #333333" : (isOutlined ? `1px solid ${borderColor}` : "none"),
          fontWeight: 600,
          cursor: "pointer",
          position: "relative" as "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        };

        const iconEndRaw = props.icon_end?.icon?.name || props.icon_end?.icon?.icon?.name;
        const iconEndName = iconEndRaw ? getLucideIconName(iconEndRaw) : null;
        const IconEndComp = iconEndName ? (LucideIcons as any)[iconEndName] || LucideIcons.ArrowRight : null;

	        return (
	          <button
	            key={w.key}
	            style={btnStyle}
	            className={outlineStyle}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
            {w.flutterWidgetType === "SocialButton" && (
                (() => {
                  const provider = String(props.icon?.stringVal?.value || props.provider?.stringVal?.value || "").toLowerCase();
                  const SocialIcon =
                    provider === "apple"
                      ? (LucideIcons as any).Apple
                      : provider === "github"
                        ? (LucideIcons as any).Github
                        : (LucideIcons as any).Chrome; // "google" fallback
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      {SocialIcon ? <SocialIcon size={16} strokeWidth={2} /> : <LucideIcons.Circle size={16} />}
                    </span>
                  );
                })()
            )}
            {readString(props.content) ?? readString(props.label) ?? String(w.label ?? "")}
            {IconEndComp && (
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <IconEndComp size={16} color={effectiveFg} strokeWidth={2} />
              </span>
            )}
            {renderTrigger()}
          </button>
        );
      case "IconButton":
        const ibRawName =
          props.name?.icon?.name ||
          props.icon?.stringVal?.value ||
          props.icon?.icon?.name ||
          props.icon?.name ||
          "";
        const IBIcon = getLucideIconComp(ibRawName);
        const iconPx = props.size?.numberVal?.value || 18;
        const ibColor = resolveColor(props.color) || "#E5E7EB";
        const btnPx = Math.max(36, Math.round((typeof iconPx === "number" ? iconPx : 18) * 2.6));
        const ibBg = resolveColor(props.bg) || "rgba(255,255,255,0.06)";
        const ibBorderColor =
          resolveColor(props.border?.border?.color) || "rgba(255,255,255,0.10)";
        const ibRadius = props.radius?.radius
          ? `${props.radius.radius.topLeft || 12}px`
          : "12px";
	        return (
	          <button
	            key={w.key}
	            className={`${styles.iconButton} ${outlineStyle}`}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	            aria-label={String(w.label ?? "") || (typeof ibRawName === "string" ? ibRawName : "icon button")}
	            title={String(w.label ?? "") || (typeof ibRawName === "string" ? ibRawName : "")}
            style={{
              ...style,
              width: btnPx,
              height: btnPx,
              flex: "0 0 auto",
              alignSelf: "center",
              background: ibBg,
              border: `1px solid ${ibBorderColor}`,
              borderRadius: ibRadius,
              padding: 0,
              lineHeight: 0,
            }}
          >
            <IBIcon size={iconPx} color={ibColor} strokeWidth={2} />
            {renderTrigger()}
          </button>
        )
      // ═══════════════════════════════════════════════════
      // NEW WIDGET RENDERERS
      // ═══════════════════════════════════════════════════
      case "SearchBar":
      case "SearchDelegate": {
        const searchHint = props.hint?.stringVal?.value || props.label?.stringVal?.value || "Search...";
        const searchBg = resolveColor("surface") || resolveColor("secondary") || "#1A1A1E";
        const searchBorder = resolveColor("divider") || "rgba(255,255,255,0.1)";
        const searchText = resolveColor("textPrimary") || "#F5F5F7";
        const searchMuted = resolveColor("secondary_text") || resolveColor("hint") || "#A1A1A6";
        const isSearchTest = !!onTriggerAction;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={isSearchTest ? undefined : clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{ ...style, width: "100%" }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 14,
              background: searchBg,
              border: `1px solid ${searchBorder}`,
              width: "100%",
            }}>
              <LucideIcons.Search size={18} color={searchMuted} strokeWidth={2} />
              <input
                type="text"
                placeholder={searchHint}
                disabled={!isSearchTest}
                onChange={isSearchTest ? (e) => {
                  if (onFieldChange) onFieldChange(w.key, e.target.value);
                } : undefined}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: searchText,
                  fontSize: 14,
                  fontWeight: 400,
                }}
              />
              {props.trailing_icon && (() => {
                const trailName = getLucideIconName(props.trailing_icon?.icon?.name || "mic");
                const TrailIcon = (LucideIcons as any)[trailName] || LucideIcons.Mic;
                return <TrailIcon size={18} color={searchMuted} strokeWidth={2} />;
              })()}
            </div>
          </div>
        );
      }
      case "Carousel": {
        const carouselH = props.height?.px?.value || 200;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: "100%",
              overflowX: isContentMode ? "visible" : "auto",
              display: "flex",
              flexDirection: "row",
              gap: style.gap ?? "12px",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "4px",
            }}
          >
            {node.children.length > 0 ? (
              node.children.map((child: any) => (
                <div
                  key={child.widget.key}
                  style={{
                    flex: "0 0 85%",
                    maxWidth: "85%",
                    minHeight: carouselH,
                    scrollSnapAlign: "start",
                  }}
                >
                  {renderComponent(child)}
                </div>
              ))
            ) : (
              // Placeholder carousel items
              [0, 1, 2].map((i) => (
                <div
                  key={`carousel-placeholder-${i}`}
                  style={{
                    flex: "0 0 85%",
                    maxWidth: "85%",
                    height: carouselH,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${resolveColor("surfaceElevated") || "#1A1A1A"}, ${resolveColor("surface") || "#121212"})`,
                    border: `1px solid ${resolveColor("divider") || "rgba(255,255,255,0.10)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: resolveColor("textMuted") || "#555",
                    fontSize: 12,
                    fontWeight: 600,
                    scrollSnapAlign: "start",
                  }}
                >
                  <LucideIcons.Image size={20} style={{ marginRight: 8 }} />
                  Slide {i + 1}
                </div>
              ))
            )}
          </div>
        );
      }
      case "Avatar":
      case "CircleAvatar": {
        const avatarSize = readNumber(props.size, 0) || (props.radius?.numberVal ? readNumber(props.radius) * 2 : 48);
        const avatarBg = resolveColor(props.bg) || resolveColor("primary") || "#8B5CF6";
        const avatarInitials = readString(props.initials) || "U";
        const avatarIconName = props.icon?.stringVal?.value;
        const AvatarIcon = avatarIconName ? getLucideIconComp(avatarIconName) : null;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: avatarSize,
              height: avatarSize,
              minWidth: avatarSize,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}dd)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: resolveColor("onPrimary") || "#fff",
              fontSize: avatarSize * 0.38,
              fontWeight: 700,
              letterSpacing: "0.02em",
              border: props.border?.border ? `${props.border.border.width}px solid ${resolveColor(props.border.border.color) || "rgba(255,255,255,0.15)"}` : "2px solid rgba(255,255,255,0.10)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              flex: "0 0 auto",
            }}
          >
            {AvatarIcon ? <AvatarIcon size={avatarSize * 0.45} strokeWidth={2} /> : avatarInitials}
            {node.children.map(renderComponent)}
          </div>
        );
      }
      case "Switch": {
        const switchLabel = readString(props.label);
        const switchOn = props.value?.boolVal?.value ?? false;
        const switchColor = resolveColor(props.color) || resolveColor("primary") || "#8B5CF6";
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: style.padding ?? "4px 0",
            }}
          >
            {switchLabel && (
              <span style={{ fontSize: 14, fontWeight: 500, color: resolveColor("textPrimary") || "#F5F5F7" }}>
                {switchLabel}
              </span>
            )}
            <div
              style={{
                width: 46,
                height: 26,
                borderRadius: 13,
                background: switchOn ? switchColor : "rgba(255,255,255,0.12)",
                position: "relative",
                transition: "background 0.2s",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: switchOn ? 23 : 3,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          </div>
        );
      }
      case "Slider": {
        const sliderLabel = readString(props.label);
        const sliderMin = props.min?.numberVal?.value ?? 0;
        const sliderMax = props.max?.numberVal?.value ?? 100;
        const sliderVal = props.value?.numberVal?.value ?? ((sliderMax - sliderMin) * 0.5 + sliderMin);
        const sliderColor = resolveColor(props.color) || resolveColor("primary") || "#8B5CF6";
        const sliderPct = Math.min(100, Math.max(0, ((sliderVal - sliderMin) / Math.max(1, sliderMax - sliderMin)) * 100));
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{ ...style, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}
          >
            {sliderLabel && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: resolveColor("textPrimary") || "#F5F5F7" }}>{sliderLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: resolveColor("textSecondary") || "#A1A1A6" }}>{Math.round(sliderVal)}</span>
              </div>
            )}
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.10)", position: "relative" }}>
              <div style={{ width: `${sliderPct}%`, height: "100%", borderRadius: 3, background: sliderColor }} />
              <div style={{
                position: "absolute",
                top: "50%",
                left: `${sliderPct}%`,
                transform: "translate(-50%, -50%)",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: sliderColor,
                border: "3px solid #fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
        );
      }
      case "RatingBar": {
        const ratingVal = props.value?.numberVal?.value ?? 4;
        const ratingMax = props.max?.numberVal?.value ?? 5;
        const ratingSize = props.size?.numberVal?.value ?? 20;
        const ratingColor = resolveColor(props.color) || "#FBBF24";
        const StarIcon = (LucideIcons as any).Star || LucideIcons.Circle;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{ ...style, display: "flex", gap: 3, alignItems: "center" }}
          >
            {Array.from({ length: ratingMax }, (_, i) => (
              <StarIcon
                key={i}
                size={ratingSize}
                fill={i < Math.floor(ratingVal) ? ratingColor : "transparent"}
                color={i < Math.floor(ratingVal) ? ratingColor : "rgba(255,255,255,0.20)"}
                strokeWidth={2}
              />
            ))}
          </div>
        );
      }
      case "GridView": {
        const gridCols = props.columns?.numberVal?.value ?? 2;
        const gridGap = style.gap ?? "12px";

        let renderedChildren;
        if (testData && testData[w.key] && testData[w.key].length > 0 && node.children.length > 0) {
          renderedChildren = testData[w.key].map((row, idx) => {
            const templateNode = node.children[0];
            const boundNode = bindMockDataToNode(templateNode, row, idx);
            return renderComponent(boundNode);
          });
        } else {
          renderedChildren = node.children.map(renderComponent);
        }

        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: gridGap,
              width: "100%",
            }}
          >
            {renderedChildren}
          </div>
        );
      }
      case "Wrap": {
        const wrapGap = style.gap ?? "8px";
        const runSpacing = props.run_spacing?.stringVal?.value;
        const runGap = runSpacing && (globalTheme.spacing as any)[runSpacing] ? `${(globalTheme.spacing as any)[runSpacing]}px` : wrapGap;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              display: "flex",
              flexWrap: "wrap",
              gap: wrapGap,
              rowGap: runGap,
              width: "100%",
            }}
          >
            {node.children.map(renderComponent)}
          </div>
        );
      }
      case "ListTile": {
        const ltTitle = readString(props.title) || String(w.label ?? "");
        const ltSubtitle = readString(props.subtitle);
        const ltLeadingIcon = props.leading_icon?.stringVal?.value;
        const ltTrailingIcon = props.trailing_icon?.stringVal?.value;
        const ltTrailingText = readString(props.trailing_text);
        const LTLeading = ltLeadingIcon ? getLucideIconComp(ltLeadingIcon) : null;
        const LTTrailing = ltTrailingIcon ? getLucideIconComp(ltTrailingIcon) : null;
        const ltBorder = props.border_bottom?.boolVal?.value !== false;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: style.padding ?? "14px 0",
              borderBottom: ltBorder ? `1px solid ${resolveColor("divider") || "rgba(255,255,255,0.08)"}` : "none",
            }}
          >
            {LTLeading && (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}>
                <LTLeading size={20} color={resolveColor("textSecondary") || "#A1A1A6"} strokeWidth={2} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: resolveColor("textPrimary") || "#F5F5F7", lineHeight: 1.4 }}>{ltTitle}</div>
              {ltSubtitle && (
                <div style={{ fontSize: 12, color: resolveColor("textSecondary") || "#A1A1A6", marginTop: 2, lineHeight: 1.3 }}>{ltSubtitle}</div>
              )}
            </div>
            {node.children.length > 0 && node.children.map(renderComponent)}
            {ltTrailingText && (
              <span style={{ fontSize: 12, fontWeight: 500, color: resolveColor("textMuted") || "#555", flex: "0 0 auto" }}>{ltTrailingText}</span>
            )}
            {LTTrailing && (
              <LTTrailing size={18} color={resolveColor("textMuted") || "#555"} strokeWidth={2} style={{ flex: "0 0 auto" }} />
            )}
            {!LTTrailing && !ltTrailingText && node.children.length === 0 && (
              <LucideIcons.ChevronRight size={18} color={resolveColor("textMuted") || "#555"} strokeWidth={2} style={{ flex: "0 0 auto" }} />
            )}
          </div>
        );
      }
      case "Dropdown": {
        const ddLabel = readString(props.label);
        const ddHint = readString(props.hint) || "Select...";
        const ddIconName = props.icon?.stringVal?.value;
        const DDIcon = ddIconName ? getLucideIconComp(ddIconName) : null;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{ ...style, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}
          >
            {ddLabel && (
              <span style={{ fontSize: 12, fontWeight: 600, color: resolveColor("textSecondary") || "#A1A1A6" }}>{ddLabel}</span>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              background: resolveColor("surface") || "#111",
              border: `1px solid ${resolveColor("divider") || "#333"}`,
              borderRadius: 12,
              width: "100%",
            }}>
              {DDIcon && <DDIcon size={18} color={resolveColor("textSecondary") || "#A1A1A6"} strokeWidth={2} />}
              <span style={{ flex: 1, fontSize: 14, color: resolveColor("textMuted") || "#555" }}>{ddHint}</span>
              <LucideIcons.ChevronDown size={18} color={resolveColor("textMuted") || "#555"} strokeWidth={2} />
            </div>
          </div>
        );
      }
      case "FAB": {
        const fabIconName = props.icon?.stringVal?.value || "add";
        const FabIcon = getLucideIconComp(fabIconName);
        const fabBg = resolveColor(props.bg) || resolveColor("primary") || "#8B5CF6";
        const fabSize = props.size?.numberVal?.value || 56;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: fabSize,
              height: fabSize,
              borderRadius: fabSize * 0.32,
              background: fabBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
              cursor: "pointer",
              alignSelf: "flex-end",
              flex: "0 0 auto",
            }}
          >
            <FabIcon size={fabSize * 0.43} color={resolveColor("onPrimary") || "#fff"} strokeWidth={2.5} />
            {renderTrigger()}
          </div>
        );
      }
      case "BottomSheet": {
        const bsBg = resolveColor(props.bg) || resolveColor("surfaceElevated") || "#1A1A1A";
        const bsH = props.height?.px?.value;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: "100%",
              minHeight: bsH || 200,
              background: bsBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: style.padding ?? "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderTop: `1px solid ${resolveColor("divider") || "rgba(255,255,255,0.08)"}`,
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.20)", marginBottom: 16, flex: "0 0 auto" }} />
            {node.children.map(renderComponent)}
          </div>
        );
      }
	      case "Lottie":
      case "Animation": {
        const lottieBg = resolveColor(props.bg) || "transparent";
        const lottieSize = props.size?.numberVal?.value || 120;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              width: lottieSize,
              height: lottieSize,
              background: lottieBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <LucideIcons.Sparkles 
              size={lottieSize * 0.5} 
              className={styles.lottiePulse} 
              color={resolveColor("primary") || "#8B5CF6"} 
            />
          </div>
        );
      }
      case "StatCard": {
        const statLabel = readString(props.label) || "Stat";
        const statValue = readString(props.value) || "0";
        const statTrend = props.trend?.numberVal?.value || 0;
        const statColor = resolveColor(props.color) || resolveColor("primary") || "#8B5CF6";
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{
              ...style,
              background: resolveColor("surfaceElevated") || "#1A1A1E",
              border: `1px solid ${resolveColor("divider") || "rgba(255,255,255,0.1)"}`,
              borderRadius: 20,
              padding: 20,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: resolveColor("textSecondary") || "#A1A1A6" }}>{statLabel}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: resolveColor("textPrimary") || "#F5F5F7" }}>{statValue}</div>
            {statTrend !== 0 && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 4, 
                fontSize: 12, 
                fontWeight: 600, 
                color: statTrend > 0 ? "#10B981" : "#EF4444" 
              }}>
                {statTrend > 0 ? <LucideIcons.TrendingUp size={14} /> : <LucideIcons.TrendingDown size={14} />}
                {Math.abs(statTrend)}%
              </div>
            )}
          </div>
        );
      }
      case "AvatarGroup": {
        const avatarSize = props.size?.numberVal?.value || 32;
        const maxAvatars = props.max?.numberVal?.value || 4;
        return (
          <div
            key={w.key}
            className={outlineStyle}
            onClick={clickHandler}
            onMouseMove={hoverMove}
            onMouseLeave={hoverLeave}
            style={{ ...style, display: "flex", alignItems: "center" }}
          >
            {Array.from({ length: maxAvatars }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${resolveColor("primary") || "#8B5CF6"}, ${resolveColor("secondary") || "#6366F1"})`,
                  border: `2px solid ${resolveColor("surface") || "#121212"}`,
                  marginLeft: i === 0 ? 0 : -avatarSize * 0.4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: avatarSize * 0.4,
                  fontWeight: 700,
                  zIndex: maxAvatars - i,
                  overflow: "hidden",
                }}
              >
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} 
                  alt="Avatar" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </div>
            ))}
          </div>
        );
      }
      case "Shimmer": {
        return (
          <div
            key={w.key}
            className={`${outlineStyle} ${styles.shimmerEffect}`}
            style={{
              ...style,
              background: "rgba(255,255,255,0.05)",
              borderRadius: props.radius?.numberVal?.value || 12,
              width: style.width || "100%",
              height: style.height || 20,
            }}
          />
        );
      }
	        return (
	          <div
	            key={w.key}
	            className={`${styles.box} ${outlineStyle}`}
	            onClick={clickHandler}
	            onMouseMove={hoverMove}
	            onMouseLeave={hoverLeave}
	          >
	             {String(w.label ?? "")}
	          </div>
	        );
    }
  };

  const ControlIcon = (LucideIcons as any).Minus ? (LucideIcons as any) : LucideIcons;
  const ZoomInIcon = (ControlIcon as any).ZoomIn || (ControlIcon as any).Plus;
  const ZoomOutIcon = (ControlIcon as any).ZoomOut || (ControlIcon as any).Minus;
	  const FitIcon = (ControlIcon as any).Scan || (ControlIcon as any).Focus;
	  const DeviceIcon = (ControlIcon as any).Smartphone || (ControlIcon as any).Phone;
	  const CanvasIcon = (ControlIcon as any).Square || (ControlIcon as any).Layout;
	  const ShineIcon = (ControlIcon as any).Sparkles || (ControlIcon as any).Stars;

  const setZoomClamped = (next: number) => {
    const clamped = Math.max(0.25, Math.min(2, next));
    setCustomZoom(clamped);
    setZoomMode("custom");
  };

	  const ScreenContent =
	    tree.length === 0 ? (
	      <div className={styles.emptyScreen}>No widgets in `{currentPage.label}` tree.</div>
	    ) : (
	      tree.map(renderComponent)
	    );

	  const frameRadiusPx = isIphone16ProMax ? 72 : 58;
	  // Inner "content inset" inside the screen. Keep this tight so UIs can fill the display
	  // like a real device (spacing should be authored by the generator, not forced by preview).
	  const screenPadPx = isIphone16ProMax ? 8 : 14;
	  const bezelPadPx =
	    effectiveFrameMode === "device" && effectiveDeviceSkin === "bezel"
	      ? isIphone16ProMax
	        ? 1
	        : 10
	      : 0;
	  const screenRadiusPx =
	    effectiveFrameMode === "device" && effectiveDeviceSkin === "bezel"
	      ? isIphone16ProMax
	        ? 58
	        : 48
	      : isIphone16ProMax
	        ? 62
	        : 44;

	  const islandTopPx = isIphone16ProMax ? 12 : 10;
	  const islandWPx = isIphone16ProMax ? 132 : 124;
	  const islandHPx = isIphone16ProMax ? 34 : 34;
	  const islandRadiusPx = isIphone16ProMax ? 20 : 18;
	  const islandCameraOffsetPx = isIphone16ProMax ? 50 : 44;
	  const islandGapPx = isIphone16ProMax ? 12 : 10;

	  // Safe-area should start just below the Dynamic Island (plus a small gap),
	  // accounting for the separate screen padding applied by `.safeArea`.
	  const safeTopPx = showDynamicIsland
	    ? Math.max(0, islandTopPx + islandHPx + islandGapPx - screenPadPx)
	    : isIphone16ProMax
	      ? effectiveDeviceSkin === "bezel"
	        ? 44
	        : 32
	      : effectiveDeviceSkin === "bezel"
	        ? 54
	        : 20;
	  const safeBottomPx = isIphone16ProMax && effectiveDeviceSkin === "bezel" ? 34 : 0;

	  const islandVars = showDynamicIsland
	    ? {
	        ["--island-top" as any]: `${islandTopPx}px`,
	        ["--island-w" as any]: `${islandWPx}px`,
	        ["--island-h" as any]: `${islandHPx}px`,
	        ["--island-radius" as any]: `${islandRadiusPx}px`,
	        ["--island-camera-offset" as any]: `${islandCameraOffsetPx}px`,
	      }
	    : null;

		  const Screen = (
		    <div className={styles.screen}>
		      {showDynamicIsland && (
		        <div className={styles.dynamicIsland} aria-hidden="true">
		          <div className={styles.dynamicIslandCamera} />
		        </div>
		      )}
		      <div className={styles.screenScroll}>{ScreenContent}</div>
		    </div>
		  );

		  const HoverLabel = (hoverInfo && !onTriggerAction) ? (
		    <div
		      className={styles.hoverLabel}
		      style={{
		        ["--x" as any]: `${hoverInfo.x}px`,
		        ["--y" as any]: `${hoverInfo.y}px`,
		      }}
		    >
		      {hoverInfo.label}
		      <span className={styles.hoverLabelKey}>{hoverInfo.key}</span>
		    </div>
		  ) : null;

		  if (renderMode === "content") {
		    return (
		      <div className={styles.fillSurface} ref={containerRef}>
		        {HoverLabel}
		        {ScreenContent}
	      </div>
	    );
	  }

	  return (
	    <div
	      className={`${styles.canvasContainer} ${embedded ? styles.embeddedContainer : ""} ${controlsPosition === "side" ? styles.canvasContainerSide : ""} ${onTriggerAction ? styles.interactive : ""}`}
	      ref={containerRef}
	    >
	      {HoverLabel}
		      {showControls && (
		      <div className={`${styles.viewportControls} ${controlsPosition === "side" ? styles.viewportControlsSide : ""}`}>
	        <div className={styles.controlsGroup}>
	          <select
	            className={styles.deviceSelect}
	            value={deviceId}
	            onChange={(e) => {
	              setDeviceId(e.target.value);
	              setZoomMode("fit");
	            }}
	            title="Device size"
	          >
	            {DEVICE_PRESETS.map((d) => (
	              <option key={d.id} value={d.id}>
	                {d.label}
	              </option>
	            ))}
	          </select>
	        </div>

	        <div className={styles.controlsDivider} aria-hidden="true" />

	        <div className={styles.controlsGroup}>
	          <button
	            className={`${styles.controlBtn} ${zoomMode === "fit" ? styles.controlBtnActive : ""}`}
	            title="Fit to window"
	            onClick={() => setZoomMode("fit")}
	          >
	            {FitIcon ? <FitIcon size={14} /> : "Fit"}
	          </button>
	          <button
	            className={`${styles.controlBtn} ${styles.controlTextBtn} ${zoomMode === "custom" && Math.abs(customZoom - 1) < 0.01 ? styles.controlBtnActive : ""}`}
	            title="Reset zoom (100%)"
	            onClick={() => {
	              setCustomZoom(1);
	              setZoomMode("custom");
	            }}
	          >
	            1:1
	          </button>
	          <button className={styles.controlBtn} title="Zoom out" onClick={() => setZoomClamped(zoom - 0.1)}>
	            {ZoomOutIcon ? <ZoomOutIcon size={14} /> : "-"}
	          </button>
	          <button className={styles.controlBtn} title="Zoom in" onClick={() => setZoomClamped(zoom + 0.1)}>
	            {ZoomInIcon ? <ZoomInIcon size={14} /> : "+"}
	          </button>
	          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
	        </div>

	        {!frameLocked && (
	          <>
	            <div className={styles.controlsDivider} aria-hidden="true" />
	            <div className={styles.controlsGroup}>
	              <button
	                className={`${styles.controlBtn} ${effectiveFrameMode === "device" ? styles.controlBtnActive : ""}`}
	                title="Device frame"
	                onClick={() => setFrameMode("device")}
	              >
	                {DeviceIcon ? <DeviceIcon size={14} /> : "Phone"}
	              </button>
	              <button
	                className={`${styles.controlBtn} ${effectiveFrameMode === "fill" ? styles.controlBtnActive : ""}`}
	                title="Fill canvas (no frame)"
	                onClick={() => setFrameMode("fill")}
	              >
	                {CanvasIcon ? <CanvasIcon size={14} /> : "□"}
	              </button>
	            </div>
	          </>
	        )}

	        {effectiveFrameMode === "device" && !skinLocked && (
	          <>
	            <div className={styles.controlsDivider} aria-hidden="true" />
	            <div className={styles.controlsGroup}>
	              <button
	                className={`${styles.controlBtn} ${styles.controlTextBtn} ${effectiveDeviceSkin === "clean" ? styles.controlBtnActive : ""}`}
	                title="Clean device (no bezel)"
	                onClick={() => setDeviceSkin("clean")}
	              >
	                Clean
	              </button>
	              <button
	                className={`${styles.controlBtn} ${styles.controlTextBtn} ${effectiveDeviceSkin === "bezel" ? styles.controlBtnActive : ""}`}
	                title="Bezel + notch"
	                onClick={() => setDeviceSkin("bezel")}
	              >
	                Bezel
	              </button>
	            </div>
	          </>
	        )}

	        {effectiveFrameMode === "device" && (
	          <>
	            <div className={styles.controlsDivider} aria-hidden="true" />
	            <div className={styles.controlsGroup}>
	              <button
	                className={`${styles.controlBtn} ${glassShine ? styles.controlBtnActive : ""}`}
	                title="Toggle glass shine"
	                onClick={() => setGlassShine((v) => !v)}
	              >
	                {ShineIcon ? <ShineIcon size={14} /> : "✦"}
	              </button>
	            </div>
	          </>
	        )}
	        <div className={styles.controlsDivider} aria-hidden="true" />
	        <div className={styles.controlsGroup}>
	          <button
	            className={styles.controlBtn}
	            title={controlsPosition === "top" ? "Move to side" : "Move to top"}
	            onClick={() => {
	              const next = controlsPosition === "top" ? "side" : "top";
	              setControlsPosition(next);
	              try { localStorage.setItem("wiraflow.preview.controlsPosition", next); } catch {}
	            }}
	          >
	            {controlsPosition === "top" ? <LucideIcons.LayoutPanelLeft size={14} /> : <LucideIcons.LayoutTemplate size={14} />}
	          </button>
	        </div>
	      </div>
	      )}

      <div className={styles.previewArea}>
        <div
          className={`${styles.panSurface} ${spacePan ? styles.panSurfaceGrab : ""} ${
            isPanning ? styles.panSurfaceGrabbing : ""
          }`}
          onPointerDown={(e) => {
            if (!spacePan) return;
            (e.currentTarget as any).setPointerCapture?.(e.pointerId);
            setIsPanning(true);
            panDragRef.current = {
              active: true,
              startX: e.clientX,
              startY: e.clientY,
              startPanX: pan.x,
              startPanY: pan.y,
            };
          }}
          onPointerMove={(e) => {
            if (!spacePan) return;
            if (!panDragRef.current.active) return;
            const dx = e.clientX - panDragRef.current.startX;
            const dy = e.clientY - panDragRef.current.startY;
            setPan({ x: panDragRef.current.startPanX + dx, y: panDragRef.current.startPanY + dy });
          }}
          onPointerUp={(e) => {
            if ((e.currentTarget as any).hasPointerCapture?.(e.pointerId)) {
              (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
            }
            panDragRef.current.active = false;
            setIsPanning(false);
          }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              setZoomClamped(zoom - e.deltaY * 0.01);
            } else {
              setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
            }
          }}
        >
          <div
            className={styles.panScene}
            style={{
              ["--pan-x" as any]: `${pan.x}px`,
              ["--pan-y" as any]: `${pan.y}px`,
            }}
          >
            {effectiveFrameMode === "device" ? (
              <div className={styles.previewStage} style={{ width: BASE_W * zoom, height: BASE_H * zoom }}>
                <div className={styles.previewScale} style={{ transform: `scale(${zoom})` }}>
                  <div
                    className={`${styles.deviceFrame} ${
                      effectiveDeviceSkin === "bezel" ? styles.deviceFrameBezel : styles.deviceFrameClean
                    }`}
                    style={{
                      ["--device-frame-w" as any]: `${BASE_W}px`,
                      ["--device-frame-h" as any]: `${BASE_H}px`,
                      ["--frame-radius" as any]: `${frameRadiusPx}px`,
                      ["--bezel-pad" as any]: `${bezelPadPx}px`,
                      ["--screen-radius" as any]: `${screenRadiusPx}px`,
                      ["--screen-pad" as any]: `${screenPadPx}px`,
                      ["--glass-shine" as any]: glassShine ? 1 : 0,
                      ...(islandVars || null),
                      ["--safe-top" as any]: `${safeTopPx}px`,
                      ["--safe-bottom" as any]: `${safeBottomPx}px`,
                    }}
                  >
                    {effectiveDeviceSkin === "bezel" && !isIphone16ProMax && (
                      <div className={styles.notch}>
                        <div className={styles.camera}></div>
                      </div>
                    )}
                    {Screen}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.previewStage} style={{ width: "max-content", height: "max-content" }}>
                {/* Use CSS zoom here so the scroll container accounts for scaled size (avoids clipped top/edges). */}
                <div className={styles.previewScale} style={{ zoom: zoom as any }}>
                  <div
                    className={styles.fillSurface}
                    style={{
                      ["--screen-pad" as any]: `${screenPadPx}px`,
                      ["--glass-shine" as any]: glassShine ? 1 : 0,
                      ...(islandVars || null),
                      ["--safe-top" as any]: `${safeTopPx}px`,
                      ["--safe-bottom" as any]: `${safeBottomPx}px`,
                    }}
                  >
                    {showDynamicIsland && (
                      <div className={styles.dynamicIsland} aria-hidden="true">
                        <div className={styles.dynamicIslandCamera} />
                      </div>
                    )}
                    <div className={styles.fillContent}>{ScreenContent}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
