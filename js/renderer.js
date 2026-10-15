/**
 * Overlay Canvas Renderer (v2.0 Pro Studio)
 * High-performance HTML5 Canvas rendering engine for social running overlays.
 * Supports freeform drag & drop, interactive resizing, custom texts & stickers,
 * and 6-7 distinct design variants for every widget.
 */

// Color themes with high-contrast accessibility presets
export const THEMES = {
  volt: {
    id: 'volt',
    name: 'Electric Volt',
    accent: '#ccff00',
    accentSecondary: '#10b981',
    text: '#ffffff',
    textMuted: '#94a3b8',
    cardBg: 'rgba(18, 18, 24, 0.78)',
    cardBorder: 'rgba(204, 255, 0, 0.25)',
  },
  cyan: {
    id: 'cyan',
    name: 'Tokyo Neon',
    accent: '#00f0ff',
    accentSecondary: '#ec4899',
    text: '#ffffff',
    textMuted: '#a5f3fc',
    cardBg: 'rgba(10, 15, 30, 0.78)',
    cardBorder: 'rgba(0, 240, 255, 0.28)',
  },
  coral: {
    id: 'coral',
    name: 'Hot Coral',
    accent: '#ff3366',
    accentSecondary: '#f43f5e',
    text: '#ffffff',
    textMuted: '#fecdd3',
    cardBg: 'rgba(20, 10, 18, 0.78)',
    cardBorder: 'rgba(255, 51, 102, 0.28)',
  },
  white: {
    id: 'white',
    name: 'Minimal White',
    accent: '#ffffff',
    accentSecondary: '#e2e8f0',
    text: '#ffffff',
    textMuted: '#94a3b8',
    cardBg: 'rgba(0, 0, 0, 0.65)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
  },
  gold: {
    id: 'gold',
    name: 'Champion Gold',
    accent: '#fbbf24',
    accentSecondary: '#f59e0b',
    text: '#ffffff',
    textMuted: '#fde68a',
    cardBg: 'rgba(20, 18, 10, 0.78)',
    cardBorder: 'rgba(251, 191, 36, 0.3)',
  },
};

// Aspect ratio pixel specifications
export const ASPECT_RATIOS = {
  '9:16': { width: 1080, height: 1920, label: '9:16 Story / Reels / TikTok' },
  '1:1': { width: 1080, height: 1080, label: '1:1 Square Post' },
  '4:5': { width: 1080, height: 1350, label: '4:5 Portrait Post' },
  '16:9': { width: 1920, height: 1080, label: '16:9 Landscape' },
};

export class OverlayRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bgImage = null; // HTMLImageElement
    this.widgetBounds = {}; // Track bounding boxes of all rendered widgets for interactive selection/drag
  }

  setBgImage(image) {
    this.bgImage = image;
  }

  recordBounds(key, name, x, y, width, height) {
    if (!this.widgetBounds) this.widgetBounds = {};
    this.widgetBounds[key] = {
      id: key,
      name: name,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  getWidgetPos(config, key, defaultX, defaultY, defaultW, defaultH) {
    if (config && config.widgetPositions && config.widgetPositions[key]) {
      const p = config.widgetPositions[key];
      return {
        x: p.x !== undefined ? p.x : defaultX,
        y: p.y !== undefined ? p.y : defaultY,
        width: p.width !== undefined ? p.width : defaultW,
        height: p.height !== undefined ? p.height : defaultH,
        isCustom: true,
      };
    }
    return {
      x: defaultX,
      y: defaultY,
      width: defaultW,
      height: defaultH,
      isCustom: false,
    };
  }

  getWidgetBgBounds(config, widgetKey, x, y, width, height) {
    const bgCustom = (config && config.widgetBgStyles && config.widgetBgStyles[widgetKey]) || {};
    const offsetX = typeof bgCustom.offsetX === 'number' ? bgCustom.offsetX : 0;
    const offsetY = typeof bgCustom.offsetY === 'number' ? bgCustom.offsetY : 0;
    const widthDelta = typeof bgCustom.widthDelta === 'number' ? bgCustom.widthDelta : 0;
    const heightDelta = typeof bgCustom.heightDelta === 'number' ? bgCustom.heightDelta : 0;
    const customW = typeof bgCustom.width === 'number' ? bgCustom.width : (width + widthDelta);
    const customH = typeof bgCustom.height === 'number' ? bgCustom.height : (height + heightDelta);
    const bgX = x + offsetX;
    const bgY = y + offsetY;
    const bgW = Math.max(20, customW);
    const bgH = Math.max(16, customH);
    const radius = typeof bgCustom.radius === 'number' ? bgCustom.radius : (config.cardRadius || 16);
    const borderWidth = typeof bgCustom.borderWidth === 'number' ? bgCustom.borderWidth : 1;
    const borderColor = bgCustom.borderColor || null;
    const fillColor = bgCustom.fillColor || null;
    const z = typeof bgCustom.z === 'number' ? bgCustom.z : 0;
    const visible = bgCustom.visible !== false;
    return { x: bgX, y: bgY, width: bgW, height: bgH, radius, borderWidth, borderColor, fillColor, z, visible };
  }

  drawWidgetCardBg(ctx, widgetKey, x, y, width, height, config, theme, highlight = false) {
    const { cardStyle } = this.getEffectiveColors(config, theme, theme.accent, widgetKey);
    if (cardStyle === 'floating') return null; // Floating / transparent (no backdrop)

    const bg = this.getWidgetBgBounds(config, widgetKey, x, y, width, height);
    if (!bg.visible) return null;

    // Record background border bounds for interactive selection/resizing
    this.recordBounds(widgetKey + '_bg', (widgetKey.toUpperCase() + ' Border'), bg.x, bg.y, bg.width, bg.height);

    ctx.save();
    this.drawRoundedRect(ctx, bg.x, bg.y, bg.width, bg.height, bg.radius);

    const style = bg.style || cardStyle || 'glass';
    const strokeColor = bg.borderColor || (highlight ? theme.accent : theme.cardBorder);
    const lineWidth = bg.borderWidth !== undefined ? bg.borderWidth : (highlight ? 1.5 : 1);

    if (bg.fillColor) {
      ctx.fillStyle = bg.fillColor;
      ctx.fill();
    } else if (style === 'minimal' || style === 'outline') {
      // Outlined only
    } else if (style === 'solid') {
      ctx.fillStyle = '#14141d';
      ctx.fill();
    } else {
      // Default glass style
      ctx.fillStyle = highlight ? 'rgba(30, 30, 42, 0.85)' : theme.cardBg;
      ctx.fill();
    }

    if (lineWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    ctx.restore();
    return bg;
  }

  getElementOffset(config, widgetKey, partKey) {
    if (config && config.widgetElementOffsets && config.widgetElementOffsets[widgetKey]) {
      const part = config.widgetElementOffsets[widgetKey][partKey];
      if (part) {
        return {
          x: typeof part.x === 'number' ? part.x : 0,
          y: typeof part.y === 'number' ? part.y : 0,
          z: typeof part.z === 'number' ? part.z : 1,
        };
      }
    }
    return { x: 0, y: 0, z: 1 };
  }

  applyZDepth(ctx, z = 1) {
    if (z > 1) {
      ctx.shadowColor = 'rgba(0, 0, 0, ' + Math.min(0.85, 0.35 + z * 0.1) + ')';
      ctx.shadowBlur = Math.min(24, z * 5);
      ctx.shadowOffsetY = Math.min(12, z * 2.5);
    } else if (z < 0) {
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  getTextOverride(config, widgetKey, fieldKey, defaultVal) {
    if (config && config.widgetTextOverrides && config.widgetTextOverrides[widgetKey]) {
      const val = config.widgetTextOverrides[widgetKey][fieldKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val);
      }
    }
    return defaultVal;
  }

  getMetricLabel(config, key, defaultLabel) {
    if (config && config.widgetTextOverrides && config.widgetTextOverrides.metrics) {
      const val = config.widgetTextOverrides.metrics[key.toLowerCase()];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim().toUpperCase();
      }
    }
    if (config && config['label' + key] && config['label' + key].trim()) {
      return config['label' + key].trim().toUpperCase();
    }
    return defaultLabel;
  }

  getElementStyle(config, key) {
    const defaults = {
      fontFamily: 'default',
      fontSizeScale: 1.0,
      color: null,
      accentColor: null,
      textAlign: 'default',
      cardStyle: 'default',
      opacity: 100,
    };
    const custom = (config && config.elementStyles && config.elementStyles[key]) || {};
    return { ...defaults, ...custom };
  }

  getEffectiveFont(config, key, weight = 'bold', baseSize = 20) {
    const el = this.getElementStyle(config, key);
    const fontName = el.fontFamily && el.fontFamily !== 'default' ? el.fontFamily : config.fontFamily;
    const fontFam = this.getFontFamily(fontName);
    let scale = typeof el.fontSizeScale === 'number' && !isNaN(el.fontSizeScale) ? el.fontSizeScale : 1.0;
    if (scale > 5) scale = scale / 100; // Normalize percentage values (e.g. 100 -> 1.0, 150 -> 1.5)
    const finalSize = Math.max(8, Math.round(baseSize * scale));
    return `${weight} ${finalSize}px ${fontFam}`;
  }

  getEffectiveColors(config, theme, accent, key) {
    const el = this.getElementStyle(config, key);
    const text = el.color || theme.text;
    const textMuted = el.color ? el.color + 'bb' : theme.textMuted;
    const elAccent = el.accentColor || accent;
    const cardStyle = el.cardStyle && el.cardStyle !== 'default' ? el.cardStyle : config.cardStyle;
    const align = el.textAlign && el.textAlign !== 'default' ? el.textAlign : null;
    const opacity = typeof el.opacity === 'number' && !isNaN(el.opacity) ? el.opacity / 100 : 1.0;
    return { text, textMuted, accent: elAccent, cardStyle, align, opacity };
  }

  /**
   * Main render function
   * @param {Object} activity - Normalized activity data
   * @param {Object} config - User customization options
   * @param {number} scaleMultiplier - Resolution multiplier (1x preview, 2x export)
   */
  render(activity, config, scaleMultiplier = 1) {
    const ratioSpec = ASPECT_RATIOS[config.aspectRatio] || ASPECT_RATIOS['9:16'];
    const W = ratioSpec.width * scaleMultiplier;
    const H = ratioSpec.height * scaleMultiplier;

    this.canvas.width = W;
    this.canvas.height = H;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(scaleMultiplier, scaleMultiplier);

    const baseW = ratioSpec.width;
    const baseH = ratioSpec.height;

    // Reset bounding boxes on every render
    this.widgetBounds = {};

    const theme = THEMES[config.theme] || THEMES.volt;
    const accentColor = config.customAccentColor || theme.accent;

    // 1. Draw Background
    this.drawBackground(ctx, baseW, baseH, config);

    if (!activity) {
      this.drawPlaceholder(ctx, baseW, baseH);
      ctx.restore();
      return;
    }

    // 2. Render layout
    this.renderLayout(ctx, baseW, baseH, activity, config, theme, accentColor);

    // 3. Render Custom Texts & Stickers
    this.drawCustomTexts(ctx, baseW, baseH, config.customTexts, theme, accentColor);

    ctx.restore();
  }

  drawBackground(ctx, w, h, config) {
    ctx.clearRect(0, 0, w, h);

    if (config.bgType === 'transparent') {
      return;
    }

    if (config.bgType === 'photo' && this.bgImage) {
      ctx.save();
      const blur = config.photoBlur || 0;
      const brightness = config.photoBrightness || 100;
      const contrast = config.photoContrast || 100;

      ctx.filter = `blur(${blur}px) brightness(${brightness}%) contrast(${contrast}%)`;

      const img = this.bgImage;
      const imgAspect = img.width / img.height;
      const canvasAspect = w / h;

      let drawW, drawH;
      if (imgAspect > canvasAspect) {
        drawH = h;
        drawW = h * imgAspect;
      } else {
        drawW = w;
        drawH = w / imgAspect;
      }

      const zoom = config.photoZoom || 1;
      drawW *= zoom;
      drawH *= zoom;

      const panX = (config.photoPanX || 0) * (w / 100);
      const panY = (config.photoPanY || 0) * (h / 100);

      const dx = (w - drawW) / 2 + panX;
      const dy = (h - drawH) / 2 + panY;

      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      // Top and bottom protective gradient fades so text pops
      if (config.photoProtectionGradient !== false) {
        const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.35);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        topGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, h * 0.35);

        const bottomGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
        bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
        bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, h * 0.45, w, h * 0.55);
      }
      return;
    }

    if (config.bgType === 'gradient') {
      const gradPreset = config.gradientPreset || 'sunset';
      const grad = ctx.createLinearGradient(0, 0, w, h);

      if (gradPreset === 'sunset') {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#3b0764');
      } else if (gradPreset === 'cyber') {
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
      } else if (gradPreset === 'neon') {
        grad.addColorStop(0, '#0369a1');
        grad.addColorStop(0.5, '#4f46e5');
        grad.addColorStop(1, '#1e1b4b');
      } else {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#020617');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // Default Solid
    const solidColor = config.solidBgColor || '#0a0a0c';
    ctx.fillStyle = solidColor;
    ctx.fillRect(0, 0, w, h);
  }

  drawPlaceholder(ctx, w, h) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select or upload an activity file to start', w / 2, h / 2);
  }

  /**
   * Layout dispatcher
   */
  renderLayout(ctx, w, h, activity, config, theme, accent) {
    const template = config.template || 'story-pro';

    switch (template) {
      case 'split-focus':
        this.renderSplitFocusLayout(ctx, w, h, activity, config, theme, accent);
        break;
      case 'minimal-hud':
        this.renderMinimalHudLayout(ctx, w, h, activity, config, theme, accent);
        break;
      case 'stat-beast':
        this.renderStatBeastLayout(ctx, w, h, activity, config, theme, accent);
        break;
      case 'route-focus':
        this.renderRouteFocusLayout(ctx, w, h, activity, config, theme, accent);
        break;
      case 'lap-workout':
        this.renderLapWorkoutLayout(ctx, w, h, activity, config, theme, accent);
        break;
      case 'story-pro':
      default:
        this.renderStoryProLayout(ctx, w, h, activity, config, theme, accent);
        break;
    }
  }

  // ==========================================
  // TEMPLATE 1: STORY PRO
  // ==========================================
  renderStoryProLayout(ctx, w, h, activity, config, theme, accent) {
    const pad = w * 0.06;
    let currY = h * 0.05;

    // 1. Header
    if (config.showWidgetHeader !== false) {
      const pos = this.getWidgetPos(config, 'header', pad, currY, w - pad * 2, 80);
      const nextY = this.drawHeader(ctx, pos.x, pos.y, pos.width, activity, config, theme, accent, pos.height);
      if (!pos.isCustom) currY = nextY + 18;
    }

    // 2. Route Map
    if (config.showWidgetMap !== false && activity.hasRoute) {
      const defaultMapH = h * (config.aspectRatio === '16:9' ? 0.42 : 0.26);
      const pos = this.getWidgetPos(config, 'map', pad, currY, w - pad * 2, defaultMapH);
      this.drawRouteMap(ctx, pos.x, pos.y, pos.width, pos.height, activity, config, theme, accent);
      if (!pos.isCustom) currY += pos.height + 20;
    }

    // 3. Hero Metric
    if (config.showWidgetHero !== false) {
      const pos = this.getWidgetPos(config, 'hero', pad, currY, w - pad * 2, 105);
      const nextY = this.drawHeroStat(ctx, pos.x, pos.y, pos.width, activity, config, theme, accent, pos.height);
      if (!pos.isCustom) currY = nextY + 16;
    }

    // 4. Secondary Metrics Grid
    if (config.showWidgetMetrics !== false) {
      const pos = this.getWidgetPos(config, 'metrics', pad, currY, w - pad * 2, 80);
      const nextY = this.drawMetricsGrid(ctx, pos.x, pos.y, pos.width, activity, config, theme, accent, 3, pos.height);
      if (!pos.isCustom) currY = nextY + 16;
    }

    // 5. Avg Heart Rate Badge (Optional dedicated widget)
    if (config.showWidgetAvgHrBadge && activity.avgHr && currY < h * 0.85) {
      const pos = this.getWidgetPos(config, 'hrBadge', pad, currY, w - pad * 2, 60);
      const nextY = this.drawAvgHeartRateBadge(ctx, pos.x, pos.y, pos.width, activity, config, theme, accent, pos.height);
      if (!pos.isCustom) currY = nextY + 16;
    }

    // 6. Splits Widget (Bar chart or Spotlight Card)
    if (config.showWidgetSplits !== false) {
      if (config.splitWidgetMode === 'highlight') {
        const pos = this.getWidgetPos(config, 'splitHighlight', pad, currY, w - pad * 2, 115);
        const nextY = this.drawSplitHighlightCard(ctx, pos.x, pos.y, pos.width, activity, config, theme, accent, pos.height);
        if (!pos.isCustom) currY = nextY + 16;
      } else {
        const pos = this.getWidgetPos(config, 'splits', pad, currY, w - pad * 2, 150);
        const nextY = this.drawSplitsBarChart(ctx, pos.x, pos.y, pos.width, activity, config, theme, accent, pos.height);
        if (!pos.isCustom) currY = nextY + 16;
      }
    }

    // 7. Pace Graph (If enabled)
    if (config.showWidgetPaceGraph && currY < h * 0.86) {
      const defaultH = Math.min(100, Math.max(50, h * 0.9 - currY));
      const pos = this.getWidgetPos(config, 'paceGraph', pad, currY, w - pad * 2, defaultH);
      const nextY = this.drawPaceGraph(ctx, pos.x, pos.y, pos.width, pos.height, activity, config, theme, accent);
      if (!pos.isCustom) currY = nextY + 16;
    }

    // 8. Heart Rate Graph (If enabled)
    if (config.showWidgetHrGraph && currY < h * 0.88) {
      const defaultH = Math.min(100, Math.max(50, h * 0.91 - currY));
      const pos = this.getWidgetPos(config, 'hrGraph', pad, currY, w - pad * 2, defaultH);
      const nextY = this.drawHeartRateGraph(ctx, pos.x, pos.y, pos.width, pos.height, activity, config, theme, accent);
      if (!pos.isCustom) currY = nextY + 16;
    }

    // 9. Elevation Profile (If enabled)
    if (config.showWidgetElevation && currY < h * 0.90) {
      const defaultH = Math.min(85, Math.max(45, h * 0.92 - currY));
      const pos = this.getWidgetPos(config, 'elevation', pad, currY, w - pad * 2, defaultH);
      this.drawElevationProfile(ctx, pos.x, pos.y, pos.width, pos.height, activity, config, theme, accent);
      if (!pos.isCustom) currY += pos.height + 16;
    }

    // 10. Watermark
    if (config.showWidgetBrand !== false) {
      const pos = this.getWidgetPos(config, 'brand', pad, h - h * 0.045, w - pad * 2, 26);
      this.drawBrandWatermark(ctx, pos.x, pos.y, pos.width, config, theme, accent, pos.height);
    }
  }

  // ==========================================
  // TEMPLATE 2: SPLIT FOCUS
  // ==========================================
  renderSplitFocusLayout(ctx, w, h, activity, config, theme, accent) {
    const pad = w * 0.06;
    let currY = h * 0.05;

    const posH = this.getWidgetPos(config, 'header', pad, currY, w - pad * 2, 80);
    currY = this.drawHeader(ctx, posH.x, posH.y, posH.width, activity, config, theme, accent, posH.height) + 16;

    // Split Spotlight Card
    const posSp = this.getWidgetPos(config, 'splitHighlight', pad, currY, w - pad * 2, 115);
    currY = this.drawSplitHighlightCard(ctx, posSp.x, posSp.y, posSp.width, activity, config, theme, accent, posSp.height) + 18;

    // Full Splits Bar Chart
    const posSb = this.getWidgetPos(config, 'splits', pad, currY, w - pad * 2, 175);
    currY = this.drawSplitsBarChart(ctx, posSb.x, posSb.y, posSb.width, activity, config, theme, accent, posSb.height) + 18;

    // Pace or HR Graph
    if (config.showWidgetPaceGraph) {
      const posP = this.getWidgetPos(config, 'paceGraph', pad, currY, w - pad * 2, 95);
      currY = this.drawPaceGraph(ctx, posP.x, posP.y, posP.width, posP.height, activity, config, theme, accent) + 16;
    } else if (activity.hasRoute && currY < h * 0.76) {
      const mapH = Math.min(160, h * 0.84 - currY);
      const posM = this.getWidgetPos(config, 'map', pad, currY, w - pad * 2, mapH);
      this.drawRouteMap(ctx, posM.x, posM.y, posM.width, posM.height, activity, config, theme, accent);
      currY += posM.height + 16;
    }

    // Compact Summary Pill
    currY = this.drawCompactSummaryPill(ctx, pad, currY, w - pad * 2, activity, config, theme, accent);

    const posB = this.getWidgetPos(config, 'brand', pad, h - h * 0.04, w - pad * 2, 26);
    this.drawBrandWatermark(ctx, posB.x, posB.y, posB.width, config, theme, accent, posB.height);
  }

  // ==========================================
  // TEMPLATE 3: MINIMAL HUD
  // ==========================================
  renderMinimalHudLayout(ctx, w, h, activity, config, theme, accent) {
    const pad = w * 0.06;

    // Top Floating Glass Pill
    const topY = h * 0.06;
    this.drawFloatingHudPill(ctx, pad, topY, w - pad * 2, activity, config, theme, accent);

    // Subtle route map
    if (activity.hasRoute) {
      const mapH = h * 0.32;
      const mapY = h * 0.48;
      const posM = this.getWidgetPos(config, 'map', pad * 1.5, mapY, w - pad * 3, mapH);
      this.drawRouteMap(ctx, posM.x, posM.y, posM.width, posM.height, activity, config, theme, accent);
    }

    // Avg HR Badge or Pace/HR graph bottom
    if (config.showWidgetAvgHrBadge && activity.avgHr) {
      const posHb = this.getWidgetPos(config, 'hrBadge', pad, h * 0.81, w - pad * 2, 60);
      this.drawAvgHeartRateBadge(ctx, posHb.x, posHb.y, posHb.width, activity, config, theme, accent, posHb.height);
    }

    // Bottom Split Mini-bar
    const botY = h * 0.88;
    if (config.showWidgetSplits !== false) {
      this.drawMiniSplitsBar(ctx, pad, botY, w - pad * 2, activity, config, theme, accent);
    }

    const posB = this.getWidgetPos(config, 'brand', pad, h - h * 0.035, w - pad * 2, 26);
    this.drawBrandWatermark(ctx, posB.x, posB.y, posB.width, config, theme, accent, posB.height);
  }

  // ==========================================
  // TEMPLATE 4: STAT BEAST
  // ==========================================
  renderStatBeastLayout(ctx, w, h, activity, config, theme, accent) {
    const pad = w * 0.05;
    let currY = h * 0.04;

    const posH = this.getWidgetPos(config, 'header', pad, currY, w - pad * 2, 80);
    currY = this.drawHeader(ctx, posH.x, posH.y, posH.width, activity, config, theme, accent, posH.height) + 10;

    // Route Map (compact)
    if (activity.hasRoute) {
      const mapH = h * 0.20;
      const posM = this.getWidgetPos(config, 'map', pad, currY, w - pad * 2, mapH);
      this.drawRouteMap(ctx, posM.x, posM.y, posM.width, posM.height, activity, config, theme, accent);
      currY += posM.height + 12;
    }

    // Hero + Metrics
    const posHero = this.getWidgetPos(config, 'hero', pad, currY, w - pad * 2, 105);
    currY = this.drawHeroStat(ctx, posHero.x, posHero.y, posHero.width, activity, config, theme, accent, posHero.height) + 12;

    const posMet = this.getWidgetPos(config, 'metrics', pad, currY, w - pad * 2, 80);
    currY = this.drawMetricsGrid(ctx, posMet.x, posMet.y, posMet.width, activity, config, theme, accent, 3, posMet.height) + 12;

    // Pace Graph & Heart Rate Graph
    if (config.showWidgetPaceGraph && currY < h * 0.78) {
      const posP = this.getWidgetPos(config, 'paceGraph', pad, currY, w - pad * 2, 75);
      currY = this.drawPaceGraph(ctx, posP.x, posP.y, posP.width, posP.height, activity, config, theme, accent) + 12;
    }

    if (config.showWidgetHrGraph && currY < h * 0.82) {
      const posHr = this.getWidgetPos(config, 'hrGraph', pad, currY, w - pad * 2, 75);
      currY = this.drawHeartRateGraph(ctx, posHr.x, posHr.y, posHr.width, posHr.height, activity, config, theme, accent) + 12;
    } else if (activity.trackpoints && activity.trackpoints.length > 2 && currY < h * 0.82) {
      const posE = this.getWidgetPos(config, 'elevation', pad, currY, w - pad * 2, 70);
      this.drawElevationProfile(ctx, posE.x, posE.y, posE.width, posE.height, activity, config, theme, accent);
      currY += posE.height + 12;
    }

    // Splits Bar
    if (config.showWidgetSplits !== false && currY < h * 0.88) {
      const posS = this.getWidgetPos(config, 'splits', pad, currY, w - pad * 2, 100);
      currY = this.drawSplitsBarChart(ctx, posS.x, posS.y, posS.width, activity, config, theme, accent, posS.height) + 12;
    }

    // HR Zones
    if (activity.hrZones && config.showWidgetHrZones !== false && currY < h * 0.92) {
      this.drawHrZonesBar(ctx, pad, currY, w - pad * 2, activity, config, theme, accent);
    }

    const posB = this.getWidgetPos(config, 'brand', pad, h - h * 0.035, w - pad * 2, 26);
    this.drawBrandWatermark(ctx, posB.x, posB.y, posB.width, config, theme, accent, posB.height);
  }

  // ==========================================
  // TEMPLATE 5: ROUTE FOCUS
  // ==========================================
  renderRouteFocusLayout(ctx, w, h, activity, config, theme, accent) {
    const pad = w * 0.06;
    let currY = h * 0.05;

    const posH = this.getWidgetPos(config, 'header', pad, currY, w - pad * 2, 80);
    currY = this.drawHeader(ctx, posH.x, posH.y, posH.width, activity, config, theme, accent, posH.height) + 16;

    // Massive Route Map (Dominates 50% of the canvas)
    if (activity.hasRoute) {
      const mapH = h * 0.52;
      const posM = this.getWidgetPos(config, 'map', pad, currY, w - pad * 2, mapH);
      this.drawRouteMap(ctx, posM.x, posM.y, posM.width, posM.height, activity, config, theme, accent);
      currY += posM.height + 18;
    }

    // Floating Hero Overlay
    const posHero = this.getWidgetPos(config, 'hero', pad, currY, w - pad * 2, 105);
    currY = this.drawHeroStat(ctx, posHero.x, posHero.y, posHero.width, activity, config, theme, accent, posHero.height) + 16;

    // Metrics Strip
    const posMet = this.getWidgetPos(config, 'metrics', pad, currY, w - pad * 2, 80);
    currY = this.drawMetricsGrid(ctx, posMet.x, posMet.y, posMet.width, activity, config, theme, accent, 3, posMet.height) + 16;

    const posB = this.getWidgetPos(config, 'brand', pad, h - h * 0.035, w - pad * 2, 26);
    this.drawBrandWatermark(ctx, posB.x, posB.y, posB.width, config, theme, accent, posB.height);
  }

  // ==========================================
  // TEMPLATE 6: LAP WORKOUT
  // ==========================================
  renderLapWorkoutLayout(ctx, w, h, activity, config, theme, accent) {
    const pad = w * 0.06;
    let currY = h * 0.05;

    const posH = this.getWidgetPos(config, 'header', pad, currY, w - pad * 2, 80);
    currY = this.drawHeader(ctx, posH.x, posH.y, posH.width, activity, config, theme, accent, posH.height) + 16;

    // Fastest / Spotlight Lap Card
    const posSp = this.getWidgetPos(config, 'splitHighlight', pad, currY, w - pad * 2, 115);
    currY = this.drawSplitHighlightCard(ctx, posSp.x, posSp.y, posSp.width, activity, config, theme, accent, posSp.height) + 16;

    // High chart for all workout laps
    const posS = this.getWidgetPos(config, 'splits', pad, currY, w - pad * 2, 220);
    currY = this.drawSplitsBarChart(ctx, posS.x, posS.y, posS.width, activity, config, theme, accent, posS.height) + 16;

    // Pace or HR Graph
    if (config.showWidgetPaceGraph && currY < h * 0.84) {
      const posP = this.getWidgetPos(config, 'paceGraph', pad, currY, w - pad * 2, 85);
      currY = this.drawPaceGraph(ctx, posP.x, posP.y, posP.width, posP.height, activity, config, theme, accent) + 16;
    }

    // HR Zones bar
    if (activity.hrZones && currY < h * 0.88) {
      currY = this.drawHrZonesBar(ctx, pad, currY, w - pad * 2, activity, config, theme, accent) + 18;
    }

    const posB = this.getWidgetPos(config, 'brand', pad, h - h * 0.035, w - pad * 2, 26);
    this.drawBrandWatermark(ctx, posB.x, posB.y, posB.width, config, theme, accent, posB.height);
  }

  // =========================================================================
  // WIDGET 1: HEADER
  // Designs: 'modern', 'editorial', 'athletic', 'pill', 'retro-cyber', 'minimalist-stamp', 'badge-shield'
  // =========================================================================
  drawHeader(ctx, x, y, width, activity, config, theme, accent, customH = null) {
    ctx.save();
    const elStyle = this.getElementStyle(config, 'header');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'header');
    if (opacity < 1) ctx.globalAlpha = opacity;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.headerTemplate || config.headerDesign || 'modern';
    const title = this.getTextOverride(config, 'header', 'title', config.customTitle || activity.title || 'Morning Run');
    const dateText = this.getTextOverride(config, 'header', 'subtitle', config.customSubtitle || `${activity.dateFormatted} • ${activity.timeFormatted}`);
    const runnerName = this.getTextOverride(config, 'header', 'runner', config.runnerName || '@runner');
    const location = this.getTextOverride(config, 'header', 'location', config.locationName || '');
    const weatherText = this.getTextOverride(config, 'header', 'weather', config.weatherText || '');

    // Sub-element X, Y, Z offsets
    const offTitle = this.getElementOffset(config, 'header', 'title');
    const offSub = this.getElementOffset(config, 'header', 'subtitle');
    const offRunner = this.getElementOffset(config, 'header', 'runner');
    const offLoc = this.getElementOffset(config, 'header', 'location');
    const offWeather = this.getElementOffset(config, 'header', 'weather');

    // TEMPLATE: HUD FLIGHT INSTRUMENT
    if (design === 'hud-flight') {
      const h = customH || 96;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);
      // Top flight bracket ticks
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 16); ctx.lineTo(x + 12, y + 8); ctx.lineTo(x + 36, y + 8);
      ctx.moveTo(x + width - 12, y + 16); ctx.lineTo(x + width - 12, y + 8); ctx.lineTo(x + width - 36, y + 8);
      ctx.stroke();

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = `bold 11px monospace`;
      ctx.fillText(`▲ RUN_TELEMETRY // ${runnerName.toUpperCase()}`, x + 20 + offRunner.x, y + 26 + offRunner.y);

      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 30);
      ctx.fillText(title.toUpperCase(), x + 20 + offTitle.x, y + 58 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '500', 12);
      ctx.fillText(`${dateText} ${location ? '• ' + location : ''}`, x + 20 + offSub.x, y + 80 + offSub.y);

      this.applyZDepth(ctx, offWeather.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = `bold 11px monospace`;
      ctx.fillText(weatherText || 'GPS LOCK: 100%', x + width - 20 + offWeather.x, y + 26 + offWeather.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: RACE TICKER TAPE
    if (design === 'race-ticker') {
      const h = customH || 88;
      ctx.save();
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      // Top racing hazard stripes
      const sw = 10;
      ctx.fillStyle = elAccent;
      for (let sx = x + 6; sx < x + width - 12; sx += sw * 2) {
        ctx.fillRect(sx, y + 3, sw, 4);
      }

      this.applyZDepth(ctx, offTitle.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 30);
      ctx.fillText(title.toUpperCase(), x + 20 + offTitle.x, y + 46 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
      ctx.fillText(`⚡ ${dateText}  •  ${runnerName}`, x + 20 + offSub.x, y + 72 + offSub.y);

      if (location) {
        this.applyZDepth(ctx, offLoc.z);
        ctx.textAlign = 'right';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
        ctx.fillText(location.toUpperCase(), x + width - 20 + offLoc.x, y + 46 + offLoc.y);
      }

      ctx.restore();
      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: CENTERED HERO
    if (design === 'centered-hero') {
      const h = customH || 102;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);
      ctx.textAlign = 'center';

      // Top Runner Tag
      this.applyZDepth(ctx, offRunner.z);
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
      ctx.letterSpacing = '2px';
      ctx.fillText(`★  ${runnerName.toUpperCase()}  ★`, x + width / 2 + offRunner.x, y + 24 + offRunner.y);

      // Main Title
      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 34);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(title.toUpperCase(), x + width / 2 + offTitle.x, y + 58 + offTitle.y);
      ctx.shadowBlur = 0;

      // Subtitle / Date Badge
      this.applyZDepth(ctx, offSub.z);
      const subW = Math.min(width * 0.85, ctx.measureText(dateText).width + 42);
      this.drawRoundedRect(ctx, x + width / 2 - subW / 2 + offSub.x, y + 68 + offSub.y, subW, 24, 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', '600', 11);
      ctx.fillText(`${dateText} ${location ? '• ' + location : ''}`, x + width / 2 + offSub.x, y + 84 + offSub.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: SPLIT BANNER (CALENDAR DATE STAMP BOX)
    if (design === 'split-banner') {
      const h = customH || 96;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      const dateParts = dateText.split('•').map((s) => s.trim());

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
      ctx.fillText(runnerName.toUpperCase(), x + 20 + offRunner.x, y + 24 + offRunner.y);

      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 30);
      ctx.fillText(title, x + 20 + offTitle.x, y + 56 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '500', 13);
      ctx.fillText(location ? `📍 ${location} • ${dateParts[1] || ''}` : dateParts[1] || dateText, x + 20 + offSub.x, y + 78 + offSub.y);

      // Right Side: Calendar Stamp Box (66x74)
      const calX = x + width - 84;
      const calY = y + 10;
      const calW = 66;
      const calH = 74;

      this.drawRoundedRect(ctx, calX, calY, calW, calH, 10);
      ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Month Bar in Calendar
      this.drawRoundedRect(ctx, calX, calY, calW, 20, 10);
      ctx.fillStyle = elAccent;
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      const monthStr = (activity.dateFormatted || 'RUN').split(' ')[1] || 'OCT';
      ctx.fillText(monthStr.toUpperCase().slice(0, 3), calX + calW / 2, calY + 14);

      // Day Number
      ctx.fillStyle = text;
      ctx.font = 'bold 26px sans-serif';
      const dayStr = (activity.dateFormatted || '15').split(' ')[0] || '15';
      ctx.fillText(dayStr, calX + calW / 2, calY + 47);

      // Bottom time
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(activity.timeFormatted ? activity.timeFormatted.split(' ')[0] : '06:30', calX + calW / 2, calY + 65);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: MINIMAL TOP BAR
    if (design === 'minimal-topbar') {
      const h = customH || 52;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      this.applyZDepth(ctx, offTitle.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
      ctx.fillText('⚡', x + 20 + offTitle.x, y + 32 + offTitle.y);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 16);
      ctx.fillText(title, x + 40 + offTitle.x, y + 33 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      const titleW = ctx.measureText(title).width;
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '500', 13);
      ctx.fillText(`•   ${dateText}`, x + 52 + titleW + offSub.x, y + 33 + offSub.y);

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 13);
      ctx.fillText(runnerName, x + width - 20 + offRunner.x, y + 33 + offRunner.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: MAGAZINE COVER
    if (design === 'magazine-cover') {
      const h = customH || 104;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);
      const padX = (cardStyle !== 'floating') ? 20 : 0;

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 11);
      ctx.letterSpacing = '3px';
      ctx.fillText(`// RUNNER'S LOG — ISSUE 2026 //`, x + padX + offRunner.x, y + 20 + offRunner.y);

      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 38);
      ctx.fillText(title.toUpperCase(), x + padX + offTitle.x, y + 60 + offTitle.y);

      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + padX, y + 72);
      ctx.lineTo(x + width - padX, y + 72);
      ctx.stroke();

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '500', 13);
      ctx.fillText(`${dateText}   |   ${location || 'ROAD WORKOUT'}`, x + padX + offSub.x, y + 90 + offSub.y);

      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 13);
      ctx.fillText(`ATHLETE: ${runnerName.toUpperCase()}`, x + width - padX + offRunner.x, y + 90 + offRunner.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: RETRO CYBER HUD
    if (design === 'retro-cyber' || design === 'cyber-hud') {
      const h = customH || 96;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      // Corner Tech Crosshairs '+'
      ctx.fillStyle = elAccent;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('+', x + 8, y + 16);
      ctx.fillText('+', x + 8, y + h - 8);
      ctx.textAlign = 'right';
      ctx.fillText('+', x + width - 8, y + 16);
      ctx.fillText('+', x + width - 8, y + h - 8);

      // System Tag
      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = elAccent;
      ctx.fillText(`[ SYS.RUN // ${runnerName.toUpperCase()} ]`, x + 24 + offRunner.x, y + 26 + offRunner.y);

      // Main Title
      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 28);
      ctx.fillText(title.toUpperCase(), x + 24 + offTitle.x, y + 58 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = '11px monospace';
      ctx.fillText(`${dateText} ${location ? '// ' + location.toUpperCase() : ''}`, x + 24 + offSub.x, y + 80 + offSub.y);

      // Right Status Pill
      this.applyZDepth(ctx, offWeather.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('● ONLINE [OK]', x + width - 24 + offWeather.x, y + 26 + offWeather.y);
      if (weatherText) {
        ctx.fillStyle = textMuted;
        ctx.fillText(weatherText, x + width - 24 + offWeather.x, y + 58 + offWeather.y);
      }

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: MINIMALIST PASSPORT STAMP
    if (design === 'minimalist-stamp') {
      const h = customH || 92;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 11);
      ctx.letterSpacing = '3px';
      ctx.fillText('★ OFFICIAL ATHLETIC ENTRY ★', x + 22 + offRunner.x, y + 24 + offRunner.y);

      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 30);
      ctx.letterSpacing = '1px';
      ctx.fillText(title.toUpperCase(), x + 22 + offTitle.x, y + 58 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '600', 12);
      ctx.fillText(`${dateText}  |  ${location || runnerName}`, x + 22 + offSub.x, y + 78 + offSub.y);

      // Circular Seal Badge on Right
      const sealR = 26;
      const sealX = x + width - sealR - 22;
      const sealY = y + h / 2;
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = elAccent;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('RUN', sealX, sealY - 4);
      ctx.fillText('STAMP', sealX, sealY + 10);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: BADGE SHIELD / ATHLETIC BADGE
    if (design === 'badge-shield' || design === 'athletic-badge') {
      const h = customH || 96;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme, true);

      // Shield Icon
      ctx.fillStyle = elAccent;
      this.drawRoundedRect(ctx, x + 18, y + 18, 56, 56, 12);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 24px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText('🏆', x + 46, y + 54);

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
      ctx.fillText(`★ ★ ★  ${runnerName.toUpperCase()}  ★ ★ ★`, x + 88 + offRunner.x, y + 34 + offRunner.y);

      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 28);
      ctx.fillText(title, x + 88 + offTitle.x, y + 66 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '500', 13);
      ctx.fillText(dateText, x + width - 22 + offSub.x, y + 44 + offSub.y);
      if (location) {
        this.applyZDepth(ctx, offLoc.z);
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
        ctx.fillText(location, x + width - 22 + offLoc.x, y + 66 + offLoc.y);
      }

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: GLASS PILL
    if (design === 'pill') {
      const h = customH || 86;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme, true);
      // Athlete Avatar Icon
      ctx.fillStyle = elAccent;
      ctx.beginPath();
      ctx.arc(x + 40, y + 43, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 16px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText('🏃', x + 40, y + 49);

      // Title & Date
      this.applyZDepth(ctx, offTitle.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 22);
      ctx.fillText(title, x + 76 + offTitle.x, y + 38 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '500', 13);
      ctx.fillText(`${dateText} ${location ? '• ' + location : ''}`, x + 76 + offSub.x, y + 62 + offSub.y);

      // Right: Runner handle
      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 14);
      ctx.fillText(runnerName, x + width - 22 + offRunner.x, y + 46 + offRunner.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: STACKED EDITORIAL
    if (design === 'editorial' || design === 'stacked-editorial') {
      const h = customH || 96;
      const padX = (cardStyle !== 'floating') ? 22 : 10;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      this.applyZDepth(ctx, offSub.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 11);
      ctx.letterSpacing = '2px';
      ctx.fillText(`// ${dateText.toUpperCase()} //`, x + padX + offSub.x, y + 20 + offSub.y);

      this.applyZDepth(ctx, offTitle.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 36);
      ctx.fillText(title, x + padX + offTitle.x, y + 56 + offTitle.y);

      // Thin separator line
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + padX, y + 68);
      ctx.lineTo(x + width - padX, y + 68);
      ctx.stroke();

      // Meta row below line
      this.applyZDepth(ctx, offLoc.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '600', 13);
      ctx.fillText(location ? `📍 ${location}` : 'ROAD WORKOUT', x + padX + offLoc.x, y + 86 + offLoc.y);

      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 13);
      ctx.fillText(`${runnerName.toUpperCase()}`, x + width - padX + offRunner.x, y + 86 + offRunner.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // TEMPLATE: SPORT ATHLETIC HUD
    if (design === 'athletic') {
      const h = customH || 94;
      const padX = (cardStyle !== 'floating') ? 22 : 12;
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);

      // Category chip
      ctx.fillStyle = elAccent;
      this.drawRoundedRect(ctx, x + padX, y + 10, 80, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 11px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText('⚡ RUN HUD', x + padX + 40, y + 25);

      // Title
      this.applyZDepth(ctx, offTitle.z);
      ctx.textAlign = 'left';
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 28);
      ctx.fillText(title.toUpperCase(), x + padX + offTitle.x, y + 58 + offTitle.y);

      this.applyZDepth(ctx, offSub.z);
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'header', '600', 13);
      ctx.fillText(`${dateText}  |  ${location || 'WORKOUT'}`, x + padX + offSub.x, y + 80 + offSub.y);

      // Right: Runner
      this.applyZDepth(ctx, offRunner.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'header', 'bold', 15);
      ctx.fillText(runnerName.toUpperCase(), x + width - padX + offRunner.x, y + 58 + offRunner.y);

      ctx.restore();
      this.recordBounds('header', 'Header', x, y, width, h);
      return y + h;
    }

    // DEFAULT 'modern' / 'modern-clean':
    const padX = (cardStyle !== 'floating') ? 24 : 12;
    const padY = (cardStyle !== 'floating') ? 14 : 8;
    const h = customH || (config.weatherText ? 96 : 84);
    if (cardStyle !== 'floating') {
      this.drawWidgetCardBg(ctx, 'header', x, y, width, h, config, theme);
    }
    const alignMode = align || 'left';
    ctx.textAlign = alignMode;

    const titleX = (alignMode === 'center' ? x + width / 2 : alignMode === 'right' ? x + width - padX : x + padX) + offTitle.x;
    const subX = (alignMode === 'center' ? x + width / 2 : alignMode === 'right' ? x + width - padX : x + padX) + offSub.x;

    this.applyZDepth(ctx, offTitle.z);
    ctx.fillStyle = text;
    ctx.font = this.getEffectiveFont(config, 'header', 'bold', 32);
    ctx.fillText(title, titleX, y + padY + 30 + offTitle.y);

    this.applyZDepth(ctx, offSub.z);
    ctx.font = this.getEffectiveFont(config, 'header', '500', 14);
    ctx.fillStyle = textMuted;
    ctx.fillText(dateText, subX, y + padY + 54 + offSub.y);

    if (alignMode === 'left') {
      ctx.textAlign = 'right';
      const rightX = x + width - padX;
      if (location) {
        this.applyZDepth(ctx, offLoc.z);
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'header', 'bold', 12);
        ctx.fillText(location.toUpperCase(), rightX + offLoc.x, y + padY + 20 + offLoc.y);
      }

      this.applyZDepth(ctx, offRunner.z);
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'header', '600', 15);
      ctx.fillText(runnerName, rightX + offRunner.x, y + padY + (location ? 42 : 28) + offRunner.y);

      if (config.weatherText) {
        this.applyZDepth(ctx, offWeather.z);
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'header', '500', 12);
        ctx.fillText(config.weatherText, rightX + offWeather.x, y + padY + (location ? 64 : 50) + offWeather.y);
      }
    }

    ctx.restore();
    this.recordBounds('header', 'Header', x, y, width, h);
    return y + h;
  }

  // =========================================================================
  // WIDGET 2: ROUTE MAP
  // Designs: 'glow', 'card', 'milestones', 'minimal', 'neon-pulse', 'framed-polaroid', 'gradient-speed'
  // =========================================================================
  drawRouteMap(ctx, x, y, width, height, activity, config, theme, accent) {
    if (!activity.hasRoute || !activity.bounds || activity.bounds.minLat === 90) return;

    ctx.save();
    const { accent: mapAccent, opacity: mapOpacity, cardStyle } = this.getEffectiveColors(config, theme, accent, 'map');
    if (mapOpacity < 1) ctx.globalAlpha = mapOpacity;
    accent = mapAccent;

    const design = config.mapDesign || 'glow';
    this.recordBounds('map', 'Route Map', x, y, width, height);

    const offRoute = this.getElementOffset(config, 'map', 'route');
    const offCaption = this.getElementOffset(config, 'map', 'caption');

    // Check if bare route (no backdrop) or floating is chosen
    const isBareRoute = design === 'bare-route' || design === 'bare-glow' || design === 'bare-speed' || cardStyle === 'floating';

    // Frame / Background
    if (isBareRoute) {
      // Zero backdrop drawn! Pure floating map
    } else if (design === 'framed-polaroid') {
      // White / bright polaroid card with bottom caption
      this.drawWidgetCardBg(ctx, 'map', x, y, width, height, config, theme) || (() => {
        ctx.fillStyle = '#ffffff';
        this.drawRoundedRect(ctx, x, y, width, height, 12);
        ctx.fill();
      })();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 16;
      // Simulated top masking tape
      ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
      this.drawRoundedRect(ctx, x + width / 2 - 40, y - 8, 80, 18, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark inner viewport for the map
      const padP = 16;
      const innerH = height - 52;
      ctx.fillStyle = '#0f172a';
      this.drawRoundedRect(ctx, x + padP, y + padP, width - padP * 2, innerH, 8);
      ctx.fill();

      // Polaroid bottom caption
      ctx.save();
      this.applyZDepth(ctx, offCaption.z);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold 14px ${this.getFontFamily(config.fontFamily)}`;
      ctx.fillText(`${config.locationName || activity.title || 'Run'} • ${activity.distanceMain} ${activity.distanceUnit}`, x + width / 2 + offCaption.x, y + height - 16 + offCaption.y);
      ctx.restore();
    } else if (design === 'neon-pulse') {
      // Tech grid backdrop
      this.drawWidgetCardBg(ctx, 'map', x, y, width, height, config, theme);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridStep = 30;
      for (let gx = x; gx < x + width; gx += gridStep) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + height); ctx.stroke();
      }
      for (let gy = y; gy < y + height; gy += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + width, gy); ctx.stroke();
      }
    } else {
      this.drawWidgetCardBg(ctx, 'map', x, y, width, height, config, theme);
    }

    const pad = design === 'framed-polaroid' ? 28 : isBareRoute ? 8 : 24;
    const mapW = width - pad * 2;
    const mapH = (design === 'framed-polaroid' ? height - 60 : height) - pad * 2;
    const mapX = x + pad;
    const mapY = y + pad;

    const bounds = activity.bounds;
    const dLat = bounds.maxLat - bounds.minLat || 0.0001;
    const dLon = bounds.maxLon - bounds.minLon || 0.0001;

    const midLatRad = ((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180);
    const lonScale = Math.cos(midLatRad);
    const geoW = dLon * lonScale;
    const geoH = dLat;

    const scale = Math.min(mapW / geoW, mapH / geoH);
    const offsetX = mapX + (mapW - geoW * scale) / 2;
    const offsetY = mapY + (mapH - geoH * scale) / 2;

    const project = (lat, lon) => {
      const px = offsetX + (lon - bounds.minLon) * lonScale * scale + offRoute.x;
      const py = offsetY + (bounds.maxLat - lat) * scale + offRoute.y;
      return [px, py];
    };

    const pts = activity.trackpoints;

    // Glowing track shadow
    if (design === 'glow' || design === 'bare-glow' || design === 'neon-pulse' || config.mapGlow) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = design === 'bare-glow' ? 18 : 14;
    }

    const colorMode = config.mapColorMode || 'accent';
    const isSpeedGradient = design === 'gradient-speed' || design === 'bare-speed' || colorMode === 'pace';

    if (isSpeedGradient || colorMode === 'hr') {
      ctx.lineWidth = design === 'minimal' ? 3.5 : 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = project(pts[i].lat, pts[i].lon);
        const p2 = project(pts[i + 1].lat, pts[i + 1].lon);

        let segColor = accent;
        if (isSpeedGradient) {
          const pace = pts[i].speed ? 1000 / pts[i].speed : activity.avgPace;
          const ratio = Math.max(0, Math.min(1, (activity.avgPace * 1.3 - pace) / (activity.avgPace * 0.6)));
          segColor = this.interpolateColor('#ff3366', '#00f0ff', ratio);
        } else if (colorMode === 'hr') {
          const hr = pts[i].hr || activity.avgHr || 150;
          const ratio = Math.max(0, Math.min(1, (hr - 120) / 65));
          segColor = this.interpolateColor('#10b981', '#ef4444', ratio);
        }

        ctx.strokeStyle = segColor;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      }
    } else {
      // Solid Accent Path
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const [px, py] = project(p.lat, p.lon);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });

      ctx.strokeStyle = accent;
      ctx.lineWidth = design === 'minimal' ? 3.5 : 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Milestones markers
    if (design === 'milestones' && activity.splits && activity.splits.length > 0) {
      const font = this.getFontFamily(config.fontFamily);
      activity.splits.forEach((split, sIdx) => {
        if (!split.endPoint) return;
        const [mx, my] = project(split.endPoint.lat, split.endPoint.lon);

        ctx.fillStyle = '#0a0a0d';
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 10px ${font}`;
        ctx.textAlign = 'center';
        ctx.fillText(`${sIdx + 1}`, mx, my + 3.5);
      });
    }

    // Start Marker (Green Ring)
    const startPt = project(pts[0].lat, pts[0].lon);
    if (design === 'neon-pulse') {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(startPt[0], startPt[1], 14, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(startPt[0], startPt[1], 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(startPt[0], startPt[1], 3, 0, Math.PI * 2); ctx.fill();

    // Finish marker (Red ring)
    const endPt = project(pts[pts.length - 1].lat, pts[pts.length - 1].lon);
    if (design === 'neon-pulse') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(endPt[0], endPt[1], 14, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(endPt[0], endPt[1], 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(endPt[0], endPt[1], 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // WIDGET 3: HERO STAT
  // Designs: 'mega', 'card', 'split-pill', 'outline', 'tape-sticker', 'digital-lcd', 'speedometer'
  // =========================================================================
  drawHeroStat(ctx, x, y, width, activity, config, theme, accent, customH = null) {
    ctx.save();
    const elStyle = this.getElementStyle(config, 'hero');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'hero');
    if (opacity < 1) ctx.globalAlpha = opacity;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.heroDesign || 'mega';
    const heroType = config.heroMetric || 'distance';

    let mainVal = activity.distanceMain;
    let mainUnit = activity.distanceUnit.toUpperCase();
    let defaultLabel = 'TOTAL DISTANCE';

    if (heroType === 'time') {
      mainVal = activity.durationFormatted;
      mainUnit = '';
      defaultLabel = 'MOVING TIME';
    } else if (heroType === 'pace') {
      mainVal = activity.avgPaceFormatted.split(' ')[0];
      mainUnit = activity.avgPaceFormatted.split(' ')[1] || '/KM';
      defaultLabel = 'AVERAGE PACE';
    }

    const labelKey = heroType === 'time' ? 'Time' : heroType === 'pace' ? 'Pace' : 'Distance';
    let label = this.getMetricLabel(config, labelKey, defaultLabel);

    // Apply individual text overrides for hero metric
    label = this.getTextOverride(config, 'hero', 'label', label);
    mainVal = this.getTextOverride(config, 'hero', 'value', mainVal);
    mainUnit = this.getTextOverride(config, 'hero', 'unit', mainUnit);

    const offLabel = this.getElementOffset(config, 'hero', 'label');
    const offVal = this.getElementOffset(config, 'hero', 'value');
    const offUnit = this.getElementOffset(config, 'hero', 'unit');
    const offSec = this.getElementOffset(config, 'hero', 'secondary');

    const h = customH || 105;
    this.recordBounds('hero', 'Hero Metric', x, y, width, h);

    if (design === 'boxed-bracket') {
      // Style 8: Futuristic Tech HUD Boxed Brackets with glowing corner anchors
      if (cardStyle !== 'floating') {
        this.drawWidgetCardBg(ctx, 'hero', x, y, width, h, config, theme);
      }
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 2;
      const bLen = 16;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8 + bLen); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + 8 + bLen, y + 8);
      ctx.moveTo(x + width - 8 - bLen, y + 8); ctx.lineTo(x + width - 8, y + 8); ctx.lineTo(x + width - 8, y + 8 + bLen);
      ctx.moveTo(x + 8, y + h - 8 - bLen); ctx.lineTo(x + 8, y + h - 8); ctx.lineTo(x + 8 + bLen, y + h - 8);
      ctx.moveTo(x + width - 8 - bLen, y + h - 8); ctx.lineTo(x + width - 8, y + h - 8); ctx.lineTo(x + width - 8, y + h - 8 - bLen);
      ctx.stroke();

      ctx.fillStyle = elAccent;
      ctx.beginPath(); ctx.arc(x + 24, y + 26, 4, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'left';
      ctx.font = `bold 11px monospace`;
      ctx.fillText(label.toUpperCase(), x + 34, y + 30);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 56);
      ctx.fillText(mainVal, x + 24, y + 84);

      if (mainUnit) {
        const vw = ctx.measureText(mainVal).width;
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 22);
        ctx.fillText(mainUnit, x + 36 + vw, y + 82);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = textMuted;
      ctx.font = `bold 10px monospace`;
      ctx.fillText(`GPS ACTIVE // METRIC`, x + width - 24, y + 82);

      ctx.restore();
      return y + h;
    }

    if (design === 'stacked-duo') {
      // Style 9: Vertical Split-Tone Stack with Sub-Bar
      const subH = 26;
      const topH = h - subH;
      this.drawRoundedRect(ctx, x, y, width, topH, 12);
      ctx.fillStyle = cardStyle === 'solid' ? '#111118' : 'rgba(15, 15, 22, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      this.drawRoundedRect(ctx, x, y + topH - 4, width, subH + 4, 8);
      ctx.fillStyle = elAccent;
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 11);
      ctx.fillText(label, x + width / 2, y + 20);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 48);
      ctx.fillText(`${mainVal} ${mainUnit}`, x + width / 2, y + topH - 12);

      ctx.fillStyle = '#000000';
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 11);
      ctx.letterSpacing = '1px';
      ctx.fillText(`⚡ RUN TRACKER OFFICIAL STAT`, x + width / 2, y + topH + 16);

      ctx.restore();
      return y + h;
    }

    if (design === 'badge-pill') {
      // Style 10: Horizontal Athletic Capsule Pill with circular runner icon
      const r = Math.min(28, h / 2);
      this.drawRoundedRect(ctx, x, y, width, h, r);
      ctx.fillStyle = cardStyle === 'solid' ? '#14141e' : 'rgba(20, 20, 30, 0.88)';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 2;
      ctx.stroke();

      const iconR = r - 6;
      ctx.fillStyle = elAccent;
      ctx.beginPath();
      ctx.arc(x + r + 6, y + h / 2, iconR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 22px sans-serif`;
      ctx.textAlign = 'center';
      const icon = heroType === 'time' ? '⏱️' : heroType === 'pace' ? '⚡' : '🏃';
      ctx.fillText(icon, x + r + 6, y + h / 2 + 7);

      ctx.textAlign = 'left';
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 52);
      const startTextX = x + r * 2 + 20;
      ctx.fillText(mainVal, startTextX, y + h / 2 + 18);

      const valW = ctx.measureText(mainVal).width;
      if (mainUnit) {
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 20);
        ctx.fillText(mainUnit, startTextX + valW + 10, y + h / 2 + 16);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 12);
      ctx.fillText(label, x + width - 24, y + h / 2 + 5);

      ctx.restore();
      return y + h;
    }

    if (design === 'cyber-glass') {
      // Style 11: Neon Glassmorphic HUD Bar
      this.drawRoundedRect(ctx, x, y, width, h, 14);
      ctx.fillStyle = 'rgba(10, 16, 26, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = elAccent;
      this.drawRoundedRect(ctx, x, y, 6, h, 3);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = `bold 11px monospace`;
      ctx.fillText(`// ${label}`, x + 24, y + 26);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 58);
      ctx.shadowColor = elAccent;
      ctx.shadowBlur = 10;
      ctx.fillText(mainVal, x + 24, y + 84);
      ctx.shadowBlur = 0;

      if (mainUnit) {
        const vw = ctx.measureText(mainVal).width;
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 22);
        ctx.fillText(mainUnit, x + 34 + vw, y + 82);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      this.drawRoundedRect(ctx, x + width - 110, y + 16, 96, 24, 6);
      ctx.fill();
      ctx.fillStyle = elAccent;
      ctx.font = `bold 10px monospace`;
      ctx.fillText(`● LIVE_DATA`, x + width - 24, y + 32);

      ctx.restore();
      return y + h;
    }

    if (design === 'racing-bib') {
      // Style 12: Official Marathon Racing Bib
      this.drawRoundedRect(ctx, x, y, width, h, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      this.drawRoundedRect(ctx, x + 2, y + 2, width - 4, 26, 6);
      ctx.fillStyle = elAccent;
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 12);
      ctx.letterSpacing = '1px';
      ctx.fillText(`★ OFFICIAL RACE SPLIT // ${label} ★`, x + width / 2, y + 20);

      ctx.fillStyle = '#0f172a';
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 56);
      ctx.fillText(`${mainVal} ${mainUnit}`, x + width / 2, y + 82);

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(x + 12, y + 12, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + width - 12, y + 12, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 12, y + h - 12, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + width - 12, y + h - 12, 3, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
      return y + h;
    }

    if (design === 'minimal-line') {
      // Style 13: Ultra-Minimal Hairline (Zero Box Background)
      const alignMode = align || 'left';
      ctx.textAlign = alignMode;
      const startX = alignMode === 'center' ? x + width / 2 : alignMode === 'right' ? x + width : x + 8;

      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 12);
      ctx.letterSpacing = '1.5px';
      ctx.fillText(label.toUpperCase(), startX, y + 22);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 64);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(mainVal, startX, y + 84);

      if (mainUnit) {
        const vw = ctx.measureText(mainVal).width;
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 24);
        ctx.shadowBlur = 0;
        const uX = alignMode === 'center' ? startX + vw / 2 + 12 : alignMode === 'right' ? startX : startX + vw + 14;
        ctx.fillText(mainUnit, uX, y + 80);
      }

      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 94);
      ctx.lineTo(x + width - 8, y + 94);
      ctx.stroke();

      ctx.restore();
      return y + h;
    }

    if (design === 'tape-sticker') {
      // Style 5: Athletic Tape Sticker with racing stripes
      ctx.save();
      this.drawRoundedRect(ctx, x, y, width, h, 6);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();

      // Top and bottom diagonal hazard tape strips
      const stripeW = 16;
      ctx.fillStyle = elAccent;
      for (let sx = x; sx < x + width; sx += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + stripeW, y);
        ctx.lineTo(sx + stripeW - 6, y + 8);
        ctx.lineTo(sx - 6, y + 8);
        ctx.closePath();
        ctx.fill();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 13);
      ctx.fillText(`⚡ ${label}`, x + 24, y + 36);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 58);
      ctx.fillText(mainVal, x + 24, y + 86);

      if (mainUnit) {
        const vw = ctx.measureText(mainVal).width;
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 22);
        ctx.fillText(mainUnit, x + 34 + vw, y + 84);
      }

      ctx.restore();
      ctx.restore();
      return y + h;
    }

    if (design === 'digital-lcd') {
      // Style 6: Retro Digital Stopwatch LCD
      this.drawRoundedRect(ctx, x, y, width, h, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Metallic top rim
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x + 2, y + 2, width - 4, 18);

      ctx.textAlign = 'center';
      ctx.fillStyle = elAccent;
      ctx.font = `bold 11px monospace`;
      ctx.fillText(`[ DIGITAL TIMER // ${label} ]`, x + width / 2, y + 15);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 60);
      ctx.shadowColor = elAccent;
      ctx.shadowBlur = 12;
      ctx.fillText(`${mainVal} ${mainUnit}`, x + width / 2, y + 82);
      ctx.shadowBlur = 0;

      ctx.restore();
      return y + h;
    }

    if (design === 'speedometer') {
      // Style 7: Curved Speedometer Arc Motif
      if (cardStyle !== 'floating') {
        this.drawCardBackground(ctx, x, y, width, h, config, theme);
      }
      const cx = x + width / 2;
      const cy = y + h - 10;
      const r = Math.min(width * 0.38, h * 0.85);

      // Arc track
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Active arc (filled 70%)
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 1.72);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 12);
      ctx.fillText(label, cx, y + 30);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 48);
      ctx.fillText(`${mainVal} ${mainUnit}`, cx, y + 76);

      ctx.restore();
      return y + h;
    }

    if (design === 'split-pill') {
      this.drawRoundedRect(ctx, x, y, width, h, 24);
      ctx.fillStyle = cardStyle === 'solid' ? '#14141d' : 'rgba(20, 20, 28, 0.85)';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.stroke();

      // Left Accent Strip
      ctx.fillStyle = elAccent;
      this.drawRoundedRect(ctx, x + 8, y + 8, 88, h - 16, 18);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 24px ${font}`;
      ctx.textAlign = 'center';
      const icon = heroType === 'time' ? '⏱️' : heroType === 'pace' ? '⚡' : '🏃';
      ctx.fillText(icon, x + 52, y + 58);

      // Right Stats
      ctx.textAlign = 'left';
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 12);
      ctx.fillText(label, x + 115, y + 36);

      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 52);
      ctx.fillText(mainVal, x + 115, y + 82);

      if (mainUnit) {
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 20);
        const valW = ctx.measureText(mainVal).width;
        ctx.fillText(mainUnit, x + 125 + valW, y + 80);
      }

      ctx.restore();
      return y + h;
    }

    if (design === 'outline') {
      const alignMode = align || 'center';
      const centerX = alignMode === 'left' ? x + 24 : alignMode === 'right' ? x + width - 24 : x + width / 2;
      ctx.textAlign = alignMode;
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 13);
      ctx.fillText(label, centerX, y + 24);

      const valFont = this.getEffectiveFont(config, 'hero', 'bold', 68);
      const unitFont = this.getEffectiveFont(config, 'hero', 'bold', 26);

      ctx.font = valFont;
      const valW = ctx.measureText(mainVal).width;
      ctx.font = unitFont;
      const unitW = mainUnit ? ctx.measureText(mainUnit).width : 0;
      const gap = mainUnit ? 14 : 0;
      const totalW = valW + gap + unitW;

      let startX;
      if (alignMode === 'left') {
        startX = x + 24;
      } else if (alignMode === 'right') {
        startX = x + width - 24 - totalW;
      } else {
        startX = Math.round(x + (width - totalW) / 2);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = elAccent;
      ctx.font = valFont;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;
      ctx.fillText(mainVal, startX, y + 84);

      if (mainUnit) {
        ctx.fillStyle = text;
        ctx.font = unitFont;
        ctx.shadowBlur = 0;
        ctx.fillText(mainUnit, startX + valW + gap, y + 80);
      }

      ctx.restore();
      return y + h;
    }

    // Default 'mega' and 'card':
    if (cardStyle !== 'floating') {
      this.drawWidgetCardBg(ctx, 'hero', x, y, width, h, config, theme, design === 'card');
    }

    const alignMode = align || 'center';
    const centerX = (alignMode === 'left' ? x + 24 : alignMode === 'right' ? x + width - 24 : x + width / 2) + offLabel.x;
    ctx.textAlign = alignMode;
    this.applyZDepth(ctx, offLabel.z);
    ctx.fillStyle = textMuted;
    ctx.font = this.getEffectiveFont(config, 'hero', 'bold', 13);
    ctx.letterSpacing = '1px';
    ctx.fillText(label, centerX, y + 26 + offLabel.y);

    const valFont = this.getEffectiveFont(config, 'hero', 'bold', 64);
    const unitFont = this.getEffectiveFont(config, 'hero', 'bold', 24);

    ctx.font = valFont;
    const valW = ctx.measureText(mainVal).width;
    ctx.font = unitFont;
    const unitW = mainUnit ? ctx.measureText(mainUnit).width : 0;
    const gap = mainUnit ? 14 : 0;
    const totalW = valW + gap + unitW;

    let startX;
    if (alignMode === 'left') {
      startX = x + 24;
    } else if (alignMode === 'right') {
      startX = x + width - 24 - totalW;
    } else {
      startX = Math.round(x + (width - totalW) / 2);
    }

    ctx.textAlign = 'left';
    this.applyZDepth(ctx, offVal.z);
    ctx.fillStyle = text;
    ctx.font = valFont;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillText(mainVal, startX + offVal.x, y + 84 + offVal.y);

    if (mainUnit) {
      this.applyZDepth(ctx, offUnit.z);
      ctx.shadowBlur = 0;
      ctx.fillStyle = elAccent;
      ctx.font = unitFont;
      ctx.fillText(mainUnit, startX + valW + gap + offUnit.x, y + 80 + offUnit.y);
    }

    ctx.restore();
    return y + h;
  }

  // =========================================================================
  // WIDGET 4: SECONDARY METRICS
  // Designs: 'grid', 'strip', 'badges', 'compact', 'circular-gauges', 'editorial-table', 'pill-row'
  // =========================================================================
  drawMetricsGrid(ctx, x, y, width, activity, config, theme, accent, cols = 3, customH = null) {
    ctx.save();
    const elStyle = this.getElementStyle(config, 'metrics');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'metrics');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.metricsDesign || 'grid';

    const offLabel = this.getElementOffset(config, 'metrics', 'label');
    const offVal = this.getElementOffset(config, 'metrics', 'val');

    const metrics = [];
    if (config.heroMetric !== 'time') metrics.push({ label: this.getMetricLabel(config, 'Time', 'TIME'), val: activity.durationFormatted, icon: '⏱️' });
    if (config.heroMetric !== 'pace') metrics.push({ label: this.getMetricLabel(config, 'Pace', 'AVG PACE'), val: activity.avgPaceFormatted, icon: '⚡' });
    if (activity.avgHr && config.metricShowHr !== false) metrics.push({ label: this.getMetricLabel(config, 'Hr', 'AVG HR'), val: `${activity.avgHr} bpm`, icon: '❤️' });
    if (activity.elevationGain !== null && config.metricShowElevation !== false) metrics.push({ label: this.getMetricLabel(config, 'Elevation', 'ELEV GAIN'), val: `+${activity.elevationGain}m`, icon: '⛰️' });
    if (activity.avgCadence && config.metricShowCadence !== false) metrics.push({ label: this.getMetricLabel(config, 'Cadence', 'CADENCE'), val: `${activity.avgCadence} spm`, icon: '👟' });
    if (activity.calories && config.metricShowCalories !== false) metrics.push({ label: this.getMetricLabel(config, 'Calories', 'CALORIES'), val: `${activity.calories} kcal`, icon: '🔥' });
    if (activity.bestPaceFormatted && config.metricShowBestPace !== false) metrics.push({ label: this.getMetricLabel(config, 'BestPace', 'BEST PACE'), val: activity.bestPaceFormatted, icon: '🚀' });

    const displayMetrics = metrics.slice(0, cols);
    const cardH = customH || 80;
    this.recordBounds('metrics', 'Secondary Metrics', x, y, width, cardH);
    this.drawWidgetCardBg(ctx, 'metrics', x, y, width, cardH, config, theme);

    if (design === 'cards-2col') {
      // Style 8: 2-Column Bold Stat Cards with Left Accent Indicator
      const halfCols = 2;
      const count = displayMetrics.length;
      const rows = Math.ceil(count / halfCols);
      const gapX = 12;
      const gapY = 8;
      const itemW = (width - gapX) / 2;
      const singleH = Math.max(50, Math.floor((cardH - (rows - 1) * gapY) / rows));
      const totalH = rows * singleH + (rows - 1) * gapY;
      this.recordBounds('metrics', 'Secondary Metrics', x, y, width, totalH);

      displayMetrics.forEach((m, idx) => {
        const c = idx % 2;
        const r = Math.floor(idx / 2);
        const ix = x + c * (itemW + gapX);
        const iy = y + r * (singleH + gapY);

        this.drawRoundedRect(ctx, ix, iy, itemW, singleH, 10);
        ctx.fillStyle = cardStyle === 'solid' ? '#14141e' : 'rgba(20, 20, 30, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = elAccent;
        this.drawRoundedRect(ctx, ix + 2, iy + 6, 4, singleH - 12, 2);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 10);
        ctx.fillText(m.label, ix + 14, iy + singleH * 0.38);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 18);
        ctx.fillText(m.val, ix + 14, iy + singleH * 0.82);
      });

      ctx.restore();
      return y + totalH;
    }

    if (design === 'vertical-stacked-hud') {
      // Style 9: Vertical Telemetry Rows with icons & right values
      const count = displayMetrics.length;
      const rowH = Math.max(26, Math.floor(cardH / count));
      const totalH = count * rowH;
      this.recordBounds('metrics', 'Secondary Metrics', x, y, width, totalH);

      if (cardStyle !== 'floating') {
        this.drawCardBackground(ctx, x, y, width, totalH, config, theme);
      }

      displayMetrics.forEach((m, idx) => {
        const ry = y + idx * rowH;
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath(); ctx.moveTo(x + 12, ry); ctx.lineTo(x + width - 12, ry); ctx.stroke();
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 12);
        ctx.fillText(`${m.icon} ${m.label}`, x + 16, ry + rowH * 0.68);

        ctx.textAlign = 'right';
        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 14);
        ctx.fillText(m.val, x + width - 16, ry + rowH * 0.68);
      });

      ctx.restore();
      return y + totalH;
    }

    if (design === 'split-scoreboard') {
      // Style 10: LED Marathon Scoreboard Tiles
      const cardGap = 8;
      const itemW = (width - cardGap * (displayMetrics.length - 1)) / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const itemX = x + idx * (itemW + cardGap);
        this.drawRoundedRect(ctx, itemX, y, itemW, cardH, 6);
        ctx.fillStyle = '#0a0a10';
        ctx.fill();
        ctx.strokeStyle = '#222230';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f59e0b';
        ctx.font = `bold 10px monospace`;
        ctx.fillText(m.label, itemX + itemW / 2, y + 24);

        ctx.fillStyle = elAccent;
        ctx.font = `bold 19px monospace`;
        ctx.shadowColor = elAccent;
        ctx.shadowBlur = 8;
        ctx.fillText(m.val, itemX + itemW / 2, y + 58);
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'cyber-brackets') {
      // Style 11: Cyberpunk Corner Brackets on Each Stat Card
      const cardGap = 10;
      const itemW = (width - cardGap * (displayMetrics.length - 1)) / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const itemX = x + idx * (itemW + cardGap);
        this.drawRoundedRect(ctx, itemX, y, itemW, cardH, 4);
        ctx.fillStyle = 'rgba(10, 16, 26, 0.88)';
        ctx.fill();

        ctx.strokeStyle = elAccent;
        ctx.lineWidth = 1.5;
        const b = 6;
        ctx.beginPath();
        ctx.moveTo(itemX, y + b); ctx.lineTo(itemX, y); ctx.lineTo(itemX + b, y);
        ctx.moveTo(itemX + itemW - b, y); ctx.lineTo(itemX + itemW, y); ctx.lineTo(itemX + itemW, y + b);
        ctx.moveTo(itemX, y + cardH - b); ctx.lineTo(itemX, y + cardH); ctx.lineTo(itemX + b, y + cardH);
        ctx.moveTo(itemX + itemW - b, y + cardH); ctx.lineTo(itemX + itemW, y + cardH); ctx.lineTo(itemX + itemW, y + cardH - b);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = elAccent;
        ctx.font = `bold 10px monospace`;
        ctx.fillText(`[ ${m.label} ]`, itemX + itemW / 2, y + 24);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 20);
        ctx.fillText(m.val, itemX + itemW / 2, y + 56);
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'hex-badges') {
      // Style 12: Athletic Chamfered Badges
      const cardGap = 8;
      const itemW = (width - cardGap * (displayMetrics.length - 1)) / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const itemX = x + idx * (itemW + cardGap);
        this.drawRoundedRect(ctx, itemX, y, itemW, cardH, 12);
        ctx.fillStyle = cardStyle === 'solid' ? '#14141e' : 'rgba(25, 25, 35, 0.85)';
        ctx.fill();
        ctx.strokeStyle = elAccent;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 10);
        ctx.fillText(m.label, itemX + itemW / 2, y + 24);

        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 20);
        ctx.fillText(m.val, itemX + itemW / 2, y + 56);
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'horizontal-ticker') {
      // Style 13: Compact Single-Line Stat Ribbon
      const hTickerH = 46;
      this.drawRoundedRect(ctx, x, y, width, hTickerH, hTickerH / 2);
      ctx.fillStyle = cardStyle === 'solid' ? '#111118' : 'rgba(15, 15, 24, 0.9)';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1;
      ctx.stroke();

      const itemW = width / displayMetrics.length;
      displayMetrics.forEach((m, idx) => {
        const cx = x + idx * itemW + itemW / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 12);
        ctx.fillText(`${m.label}: `, cx - 14, y + 28);
        ctx.fillStyle = elAccent;
        ctx.fillText(m.val, cx + 22, y + 28);
      });

      ctx.restore();
      return y + hTickerH;
    }

    if (design === 'circular-gauges') {
      // Style 5: Radial Gauge Rings for metrics
      if (cardStyle !== 'floating') {
        this.drawCardBackground(ctx, x, y, width, cardH, config, theme);
      }
      const colW = width / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const cx = x + idx * colW + colW / 2;
        const cy = y + cardH / 2;
        const r = Math.min(26, cardH * 0.32);

        // Circular background track
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(cx, cy - 6, r, 0, Math.PI * 2); ctx.stroke();

        // Accent arc
        ctx.strokeStyle = elAccent;
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(cx, cy - 6, r, -Math.PI / 2, Math.PI * 0.85); ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 13);
        ctx.fillText(m.val.split(' ')[0], cx, cy - 2);

        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 10);
        ctx.fillText(m.label, cx, y + cardH - 10);
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'editorial-table') {
      // Style 6: Official Results Table
      this.drawRoundedRect(ctx, x, y, width, cardH, 8);
      ctx.fillStyle = cardStyle === 'solid' ? '#14141d' : 'rgba(10, 10, 15, 0.9)';
      ctx.fill();
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1;
      ctx.stroke();

      const colW = width / displayMetrics.length;
      displayMetrics.forEach((m, idx) => {
        const cx = x + idx * colW;
        if (idx % 2 === 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(cx, y + 1, colW, cardH - 2);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 10);
        ctx.fillText(`// ${m.label}`, cx + 12, y + 24);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 22);
        ctx.fillText(m.val, cx + 12, y + 56);
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'pill-row') {
      // Style 7: Segmented Pill Row
      const cardGap = 8;
      const itemW = (width - cardGap * (displayMetrics.length - 1)) / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const itemX = x + idx * (itemW + cardGap);
        this.drawRoundedRect(ctx, itemX, y, itemW, cardH, cardH / 2);
        ctx.fillStyle = cardStyle === 'solid' ? '#14141d' : 'rgba(20, 20, 30, 0.85)';
        ctx.fill();
        ctx.strokeStyle = elAccent;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 10);
        ctx.fillText(`${m.icon} ${m.label}`, itemX + itemW / 2, y + 26);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 18);
        ctx.fillText(m.val, itemX + itemW / 2, y + 56);
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'strip') {
      if (cardStyle !== 'floating') {
        this.drawCardBackground(ctx, x, y, width, cardH, config, theme);
      }
      const colW = width / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const cx = x + idx * colW + colW / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'metrics', '600', 12);
        ctx.fillText(m.label, cx, y + 26);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 22);
        ctx.fillText(m.val, cx, y + 60);

        if (idx < displayMetrics.length - 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.moveTo(x + (idx + 1) * colW, y + 15);
          ctx.lineTo(x + (idx + 1) * colW, y + cardH - 15);
          ctx.stroke();
        }
      });

      ctx.restore();
      return y + cardH;
    }

    if (design === 'badges') {
      const cardGap = 10;
      const itemW = (width - cardGap * (displayMetrics.length - 1)) / displayMetrics.length;

      displayMetrics.forEach((m, idx) => {
        const itemX = x + idx * (itemW + cardGap);
        this.drawRoundedRect(ctx, itemX, y, itemW, cardH, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = elAccent;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = elAccent;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 11);
        ctx.fillText(m.label, itemX + itemW / 2, y + 25);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 20);
        ctx.fillText(m.val, itemX + itemW / 2, y + 57);
      });

      ctx.restore();
      return y + cardH;
    }

    // Default 'grid' & 'compact':
    const cardGap = 12;
    const itemW = (width - cardGap * (displayMetrics.length - 1)) / displayMetrics.length;

    displayMetrics.forEach((m, idx) => {
      const itemX = x + idx * (itemW + cardGap);
      if (cardStyle !== 'floating') {
        this.drawCardBackground(ctx, itemX, y, itemW, cardH, config, theme);
      }

      ctx.save();
      this.applyZDepth(ctx, offLabel.z);
      ctx.textAlign = 'center';
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 11);
      ctx.letterSpacing = '0.5px';
      ctx.fillText(m.label, itemX + itemW / 2 + offLabel.x, y + 26 + offLabel.y);
      ctx.restore();

      ctx.save();
      this.applyZDepth(ctx, offVal.z);
      ctx.textAlign = 'center';
      ctx.fillStyle = text;
      ctx.font = this.getEffectiveFont(config, 'metrics', 'bold', 22);
      ctx.fillText(m.val, itemX + itemW / 2 + offVal.x, y + 58 + offVal.y);
      ctx.restore();
    });

    ctx.restore();
    return y + cardH;
  }

  // =========================================================================
  // WIDGET 5: SPLITS BAR CHART
  // Designs: 'vertical-bars', 'horizontal-bars', 'speed-dots', 'pace-table', 'split-bubbles'
  // =========================================================================
  drawSplitsBarChart(ctx, x, y, width, activity, config, theme, accent, chartH = 150) {
    const isLapSource = config.splitDataSource === 'laps' && activity.hasLaps;
    const items = isLapSource ? activity.laps : activity.splits;

    if (!items || items.length === 0) return y;

    ctx.save();
    const elStyle = this.getElementStyle(config, 'splits');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'splits');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.splitsDesign || 'vertical-bars';
    this.recordBounds('splits', 'Splits Chart', x, y, width, chartH);

    if (cardStyle !== 'floating') {
      this.drawWidgetCardBg(ctx, 'splits', x, y, width, chartH, config, theme);
    }

    const offTitle = this.getElementOffset(config, 'splits', 'title');
    const offBadge = this.getElementOffset(config, 'splits', 'badge');
    const offTable = this.getElementOffset(config, 'splits', 'table');

    const padX = 20;
    const titleY = y + 26;
    const defaultTitle = isLapSource ? `WORKOUT LAPS (${items.length} TOTAL)` : `SPLITS (${activity.splitDistanceMeters ? (activity.splitDistanceMeters / 1000) + 'KM' : '1KM'} • ${items.length} TOTAL)`;
    const chartTitle = this.getTextOverride(config, 'splits', 'title', config.splitCustomTitle || defaultTitle);

    this.applyZDepth(ctx, offTitle.z);
    ctx.textAlign = 'left';
    ctx.fillStyle = textMuted;
    ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 13);
    ctx.letterSpacing = '1px';
    ctx.fillText(chartTitle, x + padX + offTitle.x, titleY + offTitle.y);

    const showFastest = config.splitHighlightFastest !== false;
    const fastest = showFastest ? items.find((it) => it.isFastest) : null;
    if (fastest) {
      this.applyZDepth(ctx, offBadge.z);
      ctx.textAlign = 'right';
      ctx.fillStyle = elAccent;
      ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 12);
      ctx.fillText(`⚡ FASTEST: ${fastest.shortName} (${fastest.paceFormatted.split(' ')[0]})`, x + width - padX + offBadge.x, titleY + offBadge.y);
    }

    if (design === 'speed-dots') {
      // Style 3: Connected Pace Dots (Displays ALL splits)
      const dotAreaY = y + 45;
      const dotAreaH = chartH - 70;
      const dotAreaW = width - padX * 2;

      let minP = Infinity, maxP = 0;
      items.forEach((it) => {
        if (it.pace > 0) {
          if (it.pace < minP) minP = it.pace;
          if (it.pace > maxP) maxP = it.pace;
        }
      });
      if (minP === Infinity) minP = 240;
      if (maxP <= minP) maxP = minP + 60;

      const stepX = dotAreaW / Math.max(1, items.length - 1);
      ctx.beginPath();
      items.forEach((it, idx) => {
        const dx = x + padX + idx * stepX;
        const dy = dotAreaY + (it.pace - minP) / (maxP - minP || 1) * dotAreaH;
        if (idx === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      });
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw dots and labels
      const labelStep = items.length > 20 ? 4 : items.length > 10 ? 2 : 1;
      items.forEach((it, idx) => {
        const dx = x + padX + idx * stepX;
        const dy = dotAreaY + (it.pace - minP) / (maxP - minP || 1) * dotAreaH;
        ctx.fillStyle = it.isFastest && showFastest ? elAccent : text;
        ctx.beginPath(); ctx.arc(dx, dy, it.isFastest && showFastest ? 6 : 4, 0, Math.PI * 2); ctx.fill();

        if (idx % labelStep === 0 || (it.isFastest && showFastest) || idx === items.length - 1) {
          ctx.textAlign = 'center';
          ctx.fillStyle = it.isFastest && showFastest ? elAccent : textMuted;
          ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 10);
          ctx.fillText(it.shortName, dx, dotAreaY + dotAreaH + 16);
        }
      });

      ctx.restore();
      return y + chartH;
    }

    if (design === 'pace-delta-bars') {
      // Style 6: Bi-directional +/- Delta Bar Equalizer
      const count = items.length;
      const avgPace = activity.avgPace || 0;
      const isCustomPos = config.widgetPositions && config.widgetPositions['splits'];
      const effectiveH = isCustomPos ? chartH : Math.max(chartH, Math.min(460, 56 + count * 22));
      this.recordBounds('splits', 'Splits Chart', x, y, width, effectiveH);

      if (!isCustomPos && cardStyle !== 'floating') {
        ctx.clearRect(x, y, width, effectiveH);
        this.drawCardBackground(ctx, x, y, width, effectiveH, config, theme);
        ctx.textAlign = 'left';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 13);
        ctx.letterSpacing = '1px';
        ctx.fillText(chartTitle, x + padX, titleY);
        if (fastest) {
          ctx.textAlign = 'right';
          ctx.fillStyle = elAccent;
          ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 12);
          ctx.fillText(`⚡ FASTEST: ${fastest.shortName} (${fastest.paceFormatted.split(' ')[0]})`, x + width - padX, titleY);
        }
      }

      const tableW = width - padX * 2;
      const tableStartY = y + 46;
      const availableH = effectiveH - 54;
      const rowH = Math.min(22, Math.max(14, availableH / count));
      const midX = x + padX + tableW * 0.62;
      const maxBarSpan = tableW * 0.26;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(midX, tableStartY); ctx.lineTo(midX, tableStartY + count * rowH);
      ctx.stroke();
      ctx.setLineDash([]);

      items.forEach((it, idx) => {
        const ry = tableStartY + idx * rowH;
        const deltaSec = avgPace > 0 && it.pace > 0 ? Math.round(it.pace - avgPace) : 0;
        const splitCustom = (config.splitCustomLabels && config.splitCustomLabels[it.index]) || it.name || ('Split ' + it.shortName);

        ctx.textAlign = 'left';
        ctx.fillStyle = it.isFastest && showFastest ? elAccent : text;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 11);
        ctx.fillText(`${splitCustom}${it.isFastest && showFastest ? ' ⚡' : ''}`, x + padX, ry + rowH * 0.72);

        ctx.textAlign = 'left';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', '500', 11);
        ctx.fillText(it.paceFormatted.split(' ')[0], x + padX + 80, ry + rowH * 0.72);

        const barLen = Math.min(maxBarSpan, Math.abs(deltaSec) * 3);
        if (deltaSec < 0) {
          ctx.fillStyle = elAccent;
          this.drawRoundedRect(ctx, midX - barLen, ry + 4, barLen, rowH - 8, 2);
          ctx.fill();
          ctx.textAlign = 'right';
          ctx.fillText(`-${Math.abs(deltaSec)}s`, midX - barLen - 6, ry + rowH * 0.72);
        } else if (deltaSec > 0) {
          ctx.fillStyle = '#ff5555';
          this.drawRoundedRect(ctx, midX, ry + 4, barLen, rowH - 8, 2);
          ctx.fill();
          ctx.textAlign = 'left';
          ctx.fillText(`+${deltaSec}s`, midX + barLen + 6, ry + rowH * 0.72);
        } else {
          ctx.textAlign = 'center';
          ctx.fillStyle = textMuted;
          ctx.fillText('EVEN', midX, ry + rowH * 0.72);
        }
      });

      ctx.restore();
      return y + effectiveH;
    }

    if (design === 'card-grid') {
      // Style 7: Compact Multi-Card Split Tiles
      const count = items.length;
      const isCustomPos = config.widgetPositions && config.widgetPositions['splits'];
      const cols = count <= 6 ? 2 : count <= 12 ? 3 : 4;
      const rows = Math.ceil(count / cols);
      const gap = 8;
      const tileW = (width - padX * 2 - (cols - 1) * gap) / cols;
      const tileH = 50;
      const gridAreaY = y + 42;
      const totalGridH = rows * (tileH + gap) + 48;
      const effectiveH = isCustomPos ? chartH : Math.min(500, Math.max(chartH, totalGridH));
      this.recordBounds('splits', 'Splits Chart', x, y, width, effectiveH);

      if (!isCustomPos && cardStyle !== 'floating') {
        ctx.clearRect(x, y, width, effectiveH);
        this.drawCardBackground(ctx, x, y, width, effectiveH, config, theme);
        ctx.textAlign = 'left';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 13);
        ctx.letterSpacing = '1px';
        ctx.fillText(chartTitle, x + padX, titleY);
        if (fastest) {
          ctx.textAlign = 'right';
          ctx.fillStyle = elAccent;
          ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 12);
          ctx.fillText(`⚡ FASTEST: ${fastest.shortName} (${fastest.paceFormatted.split(' ')[0]})`, x + width - padX, titleY);
        }
      }

      items.forEach((it, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const tx = x + padX + c * (tileW + gap);
        const ty = gridAreaY + r * (tileH + gap);
        if (ty + tileH > y + effectiveH) return;

        this.drawRoundedRect(ctx, tx, ty, tileW, tileH, 8);
        ctx.fillStyle = it.isFastest && showFastest ? 'rgba(204, 255, 0, 0.12)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = it.isFastest && showFastest ? elAccent : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = it.isFastest && showFastest ? elAccent : textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 10);
        ctx.fillText(`SPLIT ${it.shortName}${it.isFastest && showFastest ? ' ⚡' : ''}`, tx + 8, ty + 18);

        ctx.fillStyle = text;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 15);
        ctx.fillText(it.paceFormatted.split(' ')[0], tx + 8, ty + 38);

        ctx.textAlign = 'right';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', '500', 11);
        ctx.fillText(it.timeFormatted, tx + tileW - 8, ty + 24);
        if (it.avgHr) {
          ctx.fillText(`${it.avgHr} bpm`, tx + tileW - 8, ty + 38);
        }
      });

      ctx.restore();
      return y + effectiveH;
    }

    if (design === 'pace-table') {
      // Style 4: Clean Single-Column Split Breakdown Table with customizable columns & +/- Delta
      const count = items.length;
      const avgPace = activity.avgPace || 0;
      const isCustomPos = config.widgetPositions && config.widgetPositions['splits'];
      const effectiveH = isCustomPos ? chartH : Math.max(chartH, Math.min(460, 56 + count * 22));

      // Re-record bounding box with effective height
      this.recordBounds('splits', 'Splits Chart', x, y, width, effectiveH);

      // Card Background if dynamic height changed
      if (!isCustomPos && cardStyle !== 'floating') {
        ctx.clearRect(x, y, width, effectiveH);
        this.drawWidgetCardBg(ctx, 'splits', x, y, width, effectiveH, config, theme);
        // Redraw title
        this.applyZDepth(ctx, offTitle.z);
        ctx.textAlign = 'left';
        ctx.fillStyle = textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 13);
        ctx.letterSpacing = '1px';
        ctx.fillText(chartTitle, x + padX + offTitle.x, titleY + offTitle.y);
        if (fastest) {
          this.applyZDepth(ctx, offBadge.z);
          ctx.textAlign = 'right';
          ctx.fillStyle = elAccent;
          ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 12);
          ctx.fillText(`⚡ FASTEST: ${fastest.shortName} (${fastest.paceFormatted.split(' ')[0]})`, x + width - padX + offBadge.x, titleY + offBadge.y);
        }
      }

      const tableW = width - padX * 2;
      const headerY = y + 44 + offTable.y;

      // Customizable columns configuration:
      const splitCols = config.splitColumns || { time: true, pace: true, delta: true };
      const colDefs = [
        { key: 'split', title: this.getTextOverride(config, 'splits', 'headerSplit', 'SPLIT'), align: 'left', flex: 1.2 },
      ];
      if (splitCols.time !== false) colDefs.push({ key: 'time', title: this.getTextOverride(config, 'splits', 'headerTime', 'TIME'), align: 'center', flex: 1.0 });
      if (splitCols.pace !== false) colDefs.push({ key: 'pace', title: this.getTextOverride(config, 'splits', 'headerPace', 'PACE'), align: 'right', flex: 1.0 });
      if (splitCols.delta !== false) colDefs.push({ key: 'delta', title: this.getTextOverride(config, 'splits', 'headerDelta', '+/- DELTA'), align: 'right', flex: 1.0 });
      if (splitCols.avgHr) colDefs.push({ key: 'avgHr', title: this.getTextOverride(config, 'splits', 'headerHr', 'AVG HR'), align: 'right', flex: 0.9 });
      if (splitCols.maxHr) colDefs.push({ key: 'maxHr', title: this.getTextOverride(config, 'splits', 'headerMaxHr', 'MAX HR'), align: 'right', flex: 0.9 });
      if (splitCols.minHr) colDefs.push({ key: 'minHr', title: this.getTextOverride(config, 'splits', 'headerMinHr', 'MIN HR'), align: 'right', flex: 0.9 });
      if (splitCols.cadence) colDefs.push({ key: 'cadence', title: this.getTextOverride(config, 'splits', 'headerCad', 'CADENCE'), align: 'right', flex: 0.9 });
      if (splitCols.elevation) colDefs.push({ key: 'elevation', title: this.getTextOverride(config, 'splits', 'headerElev', 'ELEV'), align: 'right', flex: 0.8 });

      const totalFlex = colDefs.reduce((acc, c) => acc + c.flex, 0);

      let curColX = x + padX;
      const computedCols = colDefs.map((c) => {
        const cW = (c.flex / totalFlex) * tableW;
        const posX = c.align === 'left' ? curColX : c.align === 'center' ? curColX + cW / 2 : curColX + cW;
        const res = { ...c, width: cW, posX, startX: curColX };
        curColX += cW;
        return res;
      });

      // Table Column Headers
      ctx.fillStyle = textMuted;
      ctx.font = this.getEffectiveFont(config, 'splits', '600', 10);
      ctx.letterSpacing = '0.5px';
      computedCols.forEach((col) => {
        ctx.textAlign = col.align;
        ctx.fillText(col.title, col.posX, headerY);
      });

      // Subtle Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + padX, headerY + 6);
      ctx.lineTo(x + width - padX, headerY + 6);
      ctx.stroke();

      const tableStartY = headerY + 12;
      const availableH = effectiveH - (tableStartY - y) - 8;
      const rowH = Math.min(22, Math.max(14, availableH / count));
      const fontSize = Math.min(12, Math.max(9, Math.round(rowH * 0.58)));

      items.forEach((it, idx) => {
        const ry = tableStartY + idx * rowH;

        if (idx % 2 === 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          ctx.fillRect(x + padX - 4, ry, tableW + 8, rowH);
        }

        const deltaSec = avgPace > 0 && it.pace > 0 ? Math.round(it.pace - avgPace) : 0;
        let deltaStr = 'EVEN';
        let deltaColor = textMuted;
        if (deltaSec < 0) {
          const abs = Math.abs(deltaSec);
          const m = Math.floor(abs / 60);
          const s = abs % 60;
          deltaStr = m > 0 ? `-${m}:${String(s).padStart(2, '0')}` : `-${s}s`;
          deltaColor = elAccent;
        } else if (deltaSec > 0) {
          const m = Math.floor(deltaSec / 60);
          const s = deltaSec % 60;
          deltaStr = m > 0 ? `+${m}:${String(s).padStart(2, '0')}` : `+${s}s`;
          deltaColor = '#ff5555';
        }

        const splitCustom = (config.splitCustomLabels && config.splitCustomLabels[it.index]) || it.name || ('Split ' + it.shortName);

        computedCols.forEach((col) => {
          ctx.textAlign = col.align;
          let cellText = '';
          let cellColor = text;

          switch (col.key) {
            case 'split':
              cellText = `${splitCustom}${it.isFastest && showFastest ? ' ⚡' : ''}`;
              cellColor = it.isFastest && showFastest ? elAccent : text;
              break;
            case 'time':
              cellText = it.timeFormatted;
              cellColor = textMuted;
              break;
            case 'pace':
              cellText = it.paceFormatted.split(' ')[0];
              cellColor = it.isFastest && showFastest ? elAccent : text;
              break;
            case 'delta':
              cellText = deltaStr;
              cellColor = deltaColor;
              break;
            case 'avgHr':
              cellText = it.avgHr ? `${it.avgHr} bpm` : '--';
              cellColor = text;
              break;
            case 'maxHr':
              cellText = it.maxHr ? `${it.maxHr} bpm` : '--';
              cellColor = text;
              break;
            case 'minHr':
              cellText = it.minHr ? `${it.minHr} bpm` : '--';
              cellColor = text;
              break;
            case 'cadence':
              cellText = it.avgCadence ? `${it.avgCadence} spm` : '--';
              cellColor = text;
              break;
            case 'elevation':
              cellText = typeof it.elevationGain === 'number' ? `+${it.elevationGain}m` : '--';
              cellColor = text;
              break;
          }

          ctx.fillStyle = cellColor;
          ctx.font = this.getEffectiveFont(config, 'splits', (col.key === 'time' ? '500' : 'bold'), fontSize);
          ctx.fillText(cellText, col.posX, ry + rowH * 0.74);
        });
      });

      ctx.restore();
      return y + effectiveH;
    }

    if (design === 'split-bubbles') {
      // Style 5: Floating Rounded Split Bubbles (Displays ALL splits wrapped in rows)
      const count = items.length;
      const rows = count <= 8 ? 1 : count <= 16 ? 2 : 3;
      const perRow = Math.ceil(count / rows);
      const bubbleAreaY = y + 44;
      const gap = 4;
      const bubbleW = Math.min(54, (width - padX * 2 - (perRow - 1) * gap) / perRow);
      const bubbleH = Math.min(48, (chartH - 56 - (rows - 1) * gap) / rows);

      items.forEach((it, idx) => {
        const row = Math.floor(idx / perRow);
        const col = idx % perRow;
        const bx = x + padX + col * (bubbleW + gap);
        const by = bubbleAreaY + row * (bubbleH + gap);

        this.drawRoundedRect(ctx, bx, by, bubbleW, bubbleH, Math.min(12, bubbleH / 2));
        ctx.fillStyle = (it.isFastest && showFastest) ? elAccent : 'rgba(255, 255, 255, 0.08)';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = (it.isFastest && showFastest) ? '#000000' : textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 10);
        ctx.fillText(it.shortName, bx + bubbleW / 2, by + bubbleH * 0.38);

        ctx.fillStyle = (it.isFastest && showFastest) ? '#000000' : text;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 11);
        ctx.fillText(it.paceFormatted.split(' ')[0], bx + bubbleW / 2, by + bubbleH * 0.82);
      });

      ctx.restore();
      return y + chartH;
    }

    if (design === 'horizontal-bars') {
      // Style 2: Horizontal Bars (Multi-column so ALL splits to end of workout fit)
      const count = items.length;
      const colCount = count <= 8 ? 1 : 2;
      const perCol = Math.ceil(count / colCount);
      const rowH = Math.min(22, (chartH - 48) / perCol);
      const barAreaY = y + 42;
      const colGap = 20;
      const colW = (width - padX * 2 - (colCount - 1) * colGap) / colCount;

      let minP = Infinity, maxP = 0;
      items.forEach((it) => {
        if (it.pace > 0) {
          if (it.pace < minP) minP = it.pace;
          if (it.pace > maxP) maxP = it.pace;
        }
      });
      if (minP === Infinity) minP = 240;
      if (maxP <= minP) maxP = minP + 60;

      items.forEach((it, idx) => {
        const col = Math.floor(idx / perCol);
        const row = idx % perCol;
        const colX = x + padX + col * (colW + colGap);
        const ry = barAreaY + row * rowH;

        ctx.textAlign = 'left';
        ctx.fillStyle = (it.isFastest && showFastest) ? elAccent : textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 10);
        ctx.fillText(it.shortName, colX, ry + 13);

        const nameW = 24;
        const paceW = 42;
        const barStart = colX + nameW;
        const maxBarW = colW - nameW - paceW;
        const ratio = Math.max(0.2, 1 - (it.pace - minP) / (maxP - minP || 1) * 0.7);
        const bw = Math.max(4, maxBarW * ratio);

        ctx.fillStyle = (it.isFastest && showFastest) ? elAccent : 'rgba(255, 255, 255, 0.4)';
        this.drawRoundedRect(ctx, barStart, ry + 3, bw, rowH - 6, 2);
        ctx.fill();

        ctx.textAlign = 'right';
        ctx.fillStyle = (it.isFastest && showFastest) ? elAccent : text;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 10);
        ctx.fillText(it.paceFormatted.split(' ')[0], colX + colW, ry + 13);
      });

      ctx.restore();
      return y + chartH;
    }

    // Default 'vertical-bars': (Displays ALL splits dynamically)
    const barAreaY = y + 42;
    const barAreaH = chartH - 65;
    const barAreaW = width - padX * 2;

    let minPace = Infinity, maxPace = 0;
    items.forEach((it) => {
      if (it.pace > 0) {
        if (it.pace < minPace) minPace = it.pace;
        if (it.pace > maxPace) maxPace = it.pace;
      }
    });

    if (minPace === Infinity) minPace = 240;
    if (maxPace <= minPace) maxPace = minPace + 60;

    const count = items.length;
    const barGap = count > 25 ? 2 : count > 15 ? 4 : count > 8 ? 6 : 10;
    const barW = Math.max(4, (barAreaW - barGap * (count - 1)) / count);
    const labelStep = count > 24 ? 5 : count > 14 ? 2 : 1;

    items.forEach((it, idx) => {
      const bx = x + padX + idx * (barW + barGap);
      const paceNorm = Math.max(0.2, Math.min(1, 1 - (it.pace - minPace) / (maxPace - minPace || 1) * 0.75));
      const bh = barAreaH * paceNorm;
      const by = barAreaY + (barAreaH - bh);

      if (it.isFastest && showFastest) {
        ctx.fillStyle = elAccent;
        ctx.shadowColor = elAccent;
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.shadowBlur = 0;
      }

      this.drawRoundedRect(ctx, bx, by, barW, bh, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      const shouldShowLabel = (idx % labelStep === 0) || (it.isFastest && showFastest) || (idx === count - 1);
      if (shouldShowLabel) {
        ctx.textAlign = 'center';
        ctx.fillStyle = (it.isFastest && showFastest) ? elAccent : textMuted;
        ctx.font = this.getEffectiveFont(config, 'splits', '600', 10);
        ctx.fillText(it.shortName, bx + barW / 2, barAreaY + barAreaH + 16);
      }

      if (barW >= 28) {
        ctx.fillStyle = (it.isFastest && showFastest) ? elAccent : text;
        ctx.font = this.getEffectiveFont(config, 'splits', 'bold', 10);
        ctx.fillText(it.paceFormatted.split(' ')[0], bx + barW / 2, by - 6);
      }
    });

    ctx.restore();
    return y + chartH;
  }

  // =========================================================================
  // WIDGET 6: SPLIT HIGHLIGHT CARD
  // Designs: 'spotlight', 'bib', 'medal-podium', 'polaroid-clip'
  // =========================================================================
  drawSplitHighlightCard(ctx, x, y, width, activity, config, theme, accent, customH = null) {
    const isLapSource = config.splitDataSource === 'laps' && activity.hasLaps;
    const items = isLapSource ? activity.laps : activity.splits;

    if (!items || items.length === 0) return y;

    let target = items[0];
    const targetKey = config.highlightSplitTarget || 'fastest';

    if (targetKey === 'fastest') target = items.find((it) => it.isFastest) || items[0];
    else if (targetKey === 'slowest') target = items.find((it) => it.isSlowest) || items[0];
    else if (targetKey === 'last') target = items[items.length - 1];
    else if (targetKey.startsWith('index-')) {
      const idx = parseInt(targetKey.replace('index-', ''), 10);
      target = items[idx] || items[0];
    }

    ctx.save();
    const elStyle = this.getElementStyle(config, 'splitHighlight');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'splitHighlight');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.splitHighlightDesign || 'spotlight';
    const cardH = customH || 115;
    this.recordBounds('splitHighlight', 'Split Highlight', x, y, width, cardH);
    this.drawWidgetCardBg(ctx, 'splitHighlight', x, y, width, cardH, config, theme, true);

    const padX = 24;

    if (design === 'medal-podium') {
      // Style 3: Gold Medal Trophy Podium
      // Trophy Icon
      ctx.fillStyle = '#fbbf24';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🥇', x + padX + 24, y + 68);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold 12px ${font}`;
      ctx.fillText(`★ PODIUM SPLIT • ${target.name.toUpperCase()} ★`, x + padX + 60, y + 36);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 42px ${font}`;
      ctx.fillText(target.paceFormatted, x + padX + 60, y + 80);

      ctx.textAlign = 'right';
      ctx.fillStyle = theme.textMuted;
      ctx.font = `bold 14px ${font}`;
      ctx.fillText(`TIME: ${target.timeFormatted}`, x + width - padX, y + 54);
      if (target.avgHr) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`HR: ${target.avgHr} BPM`, x + width - padX, y + 78);
      }

      ctx.restore();
      return y + cardH;
    }

    if (design === 'polaroid-clip') {
      // Style 4: Pinned Paper Card with Paperclip
      ctx.fillStyle = '#f8fafc';
      this.drawRoundedRect(ctx, x, y, width, cardH, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Paperclip icon
      ctx.fillStyle = '#64748b';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📎', x + 16, y + 32);

      ctx.fillStyle = '#0f172a';
      ctx.font = `bold 14px ${font}`;
      ctx.fillText(`SPLIT NOTE: ${target.name}`, x + 50, y + 30);

      ctx.fillStyle = '#0284c7';
      ctx.font = `bold 46px ${font}`;
      ctx.fillText(target.paceFormatted, x + 50, y + 84);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#475569';
      ctx.font = `600 14px ${font}`;
      ctx.fillText(`Split Time: ${target.timeFormatted}`, x + width - 20, y + 52);
      ctx.fillText(`Elev: +${target.elevationGain || 0}m`, x + width - 20, y + 78);

      ctx.restore();
      return y + cardH;
    }

    if (design === 'bib') {
      this.drawCardBackground(ctx, x, y, width, cardH, config, theme, true);
      ctx.fillStyle = accent;
      this.drawRoundedRect(ctx, x + padX, y + 16, 52, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 12px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(target.shortName, x + padX + 26, y + 33);

      ctx.textAlign = 'left';
      ctx.fillStyle = theme.text;
      ctx.font = `bold 14px ${font}`;
      ctx.fillText(target.name.toUpperCase(), x + padX + 64, y + 33);

      ctx.fillStyle = accent;
      ctx.font = `bold 48px ${font}`;
      ctx.fillText(target.paceFormatted, x + padX, y + 88);

      ctx.textAlign = 'right';
      ctx.fillStyle = theme.textMuted;
      ctx.font = `600 13px ${font}`;
      ctx.fillText(`SPLIT TIME: ${target.timeFormatted}`, x + width - padX, y + 52);
      if (target.avgHr) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`HEART RATE: ${target.avgHr} BPM`, x + width - padX, y + 74);
      }

      ctx.restore();
      return y + cardH;
    }

    // Default 'spotlight':
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    this.drawCardBackground(ctx, x, y, width, cardH, config, theme, true);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.font = `bold 12px ${font}`;
    ctx.letterSpacing = '1px';
    const tag = target.isFastest ? '⚡ FASTEST SPLIT SPOTLIGHT' : 'HIGHLIGHTED SPLIT';
    ctx.fillText(tag, x + padX, y + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 44px ${font}`;
    ctx.fillText(target.paceFormatted, x + padX, y + 82);

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.text;
    ctx.font = `bold 18px ${font}`;
    ctx.fillText(target.name, x + width - padX, y + 36);

    ctx.fillStyle = theme.textMuted;
    ctx.font = `600 14px ${font}`;
    ctx.fillText(`Time: ${target.timeFormatted}`, x + width - padX, y + 62);
    if (target.elevationGain !== undefined) {
      ctx.fillText(`Gain: +${target.elevationGain}m`, x + width - padX, y + 84);
    }

    ctx.restore();
    return y + cardH;
  }

  // =========================================================================
  // WIDGET 7: ELEVATION PROFILE
  // Designs: 'area', 'line', 'stepped-gradient', 'mountain-peaks'
  // =========================================================================
  drawElevationProfile(ctx, x, y, width, height, activity, config, theme, accent) {
    const pts = activity.trackpoints || [];
    if (!pts || pts.length < 3) return;

    ctx.save();
    const elStyle = this.getElementStyle(config, 'elevation');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'elevation');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.elevationDesign || 'area';
    this.recordBounds('elevation', 'Elevation Profile', x, y, width, height);

    this.drawWidgetCardBg(ctx, 'elevation', x, y, width, height, config, theme);

    const offTitle = this.getElementOffset(config, 'elevation', 'title');
    const offStat = this.getElementOffset(config, 'elevation', 'stat');
    const offChart = this.getElementOffset(config, 'elevation', 'chart');

    const pad = 16;
    const chartW = width - pad * 2;
    const chartH = height - 36;
    const chartX = x + pad;
    const chartY = y + 26;

    const elevTitle = this.getTextOverride(config, 'elevation', 'title', 'ELEVATION PROFILE');
    ctx.save();
    this.applyZDepth(ctx, offTitle.z);
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.textMuted;
    ctx.font = `bold 11px ${font}`;
    ctx.fillText(elevTitle, chartX + offTitle.x, y + 18 + offTitle.y);
    ctx.restore();

    ctx.save();
    this.applyZDepth(ctx, offStat.z);
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.fillText(`+${activity.elevationGain || 0}M GAIN  •  PEAK ${activity.maxElevation || 0}M`, chartX + chartW + offStat.x, y + 18 + offStat.y);
    ctx.restore();

    const minEle = activity.minElevation || 0;
    const maxEle = Math.max(minEle + 10, activity.maxElevation || 100);
    const dEle = maxEle - minEle;
    const totalDist = activity.distance || 1;

    const getY = (ele) => chartY + chartH - ((ele - minEle) / dEle) * chartH;

    if (design === 'topo-contours') {
      // Style 5: Topographic Contour Fill
      const layers = 4;
      for (let l = 1; l <= layers; l++) {
        const factor = l / layers;
        const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(chartX, chartY + chartH);
        pts.forEach((p) => {
          const px = chartX + (p.dist / totalDist) * chartW;
          const py = chartY + chartH - ((p.ele - minEle) / dEle) * chartH * factor;
          ctx.lineTo(px, py);
        });
        ctx.lineTo(chartX + chartW, chartY + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.18;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.ele);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
      return y + height;
    }

    if (design === 'gradient-altitude') {
      // Style 6: High-Contrast Altitude Gradient with Summit Callout Pill
      const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.5, '#818cf8');
      grad.addColorStop(1, '#c084fc');

      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);
      pts.forEach((p) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.ele);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.ele);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      let peakPt = pts[0];
      pts.forEach((p) => { if (p.ele > peakPt.ele) peakPt = p; });
      const peakX = chartX + (peakPt.dist / totalDist) * chartW;
      const peakY = getY(peakPt.ele);
      this.drawRoundedRect(ctx, peakX - 32, peakY - 22, 64, 18, 9);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold 10px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(`▲ ${Math.round(peakPt.ele)}m`, peakX, peakY - 10);

      ctx.restore();
      return y + height;
    }

    if (design === 'mountain-peaks') {
      // Style 4: Mountain Silhouette with summit flag
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);
      pts.forEach((p) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.ele);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.closePath();
      ctx.fill();

      // Peak flag
      let peakPt = pts[0];
      pts.forEach((p) => { if (p.ele > peakPt.ele) peakPt = p; });
      const peakX = chartX + (peakPt.dist / totalDist) * chartW;
      const peakY = getY(peakPt.ele);
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚩', peakX, peakY - 4);
    } else if (design === 'stepped-gradient' || design === 'area') {
      const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);
      pts.forEach((p) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.ele);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Top Line stroke
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = chartX + (p.dist / totalDist) * chartW;
      const py = getY(p.ele);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // WIDGET 8: PACE GRAPH
  // Designs: 'area', 'line', 'gradient-zone', 'stepped-splits'
  // =========================================================================
  drawPaceGraph(ctx, x, y, width, height, activity, config, theme, accent) {
    const pts = activity.paceCurve || [];
    if (!pts || pts.length < 3) return y;

    ctx.save();
    const elStyle = this.getElementStyle(config, 'paceGraph');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'paceGraph');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.paceGraphDesign || 'area';
    this.recordBounds('paceGraph', 'Pace Graph', x, y, width, height);

    this.drawWidgetCardBg(ctx, 'paceGraph', x, y, width, height, config, theme);

    const offTitle = this.getElementOffset(config, 'paceGraph', 'title');
    const offStat = this.getElementOffset(config, 'paceGraph', 'stat');
    const offChart = this.getElementOffset(config, 'paceGraph', 'chart');

    const pad = 16;
    const chartW = width - pad * 2;
    const chartH = height - 38;
    const chartX = x + pad;
    const chartY = y + 28;

    const paceTitle = this.getTextOverride(config, 'paceGraph', 'title', 'PACE PROFILE');
    ctx.save();
    this.applyZDepth(ctx, offTitle.z);
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.textMuted;
    ctx.font = `bold 11px ${font}`;
    ctx.fillText(paceTitle, chartX + offTitle.x, y + 18 + offTitle.y);
    ctx.restore();

    ctx.save();
    this.applyZDepth(ctx, offStat.z);
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.fillText(`AVG: ${activity.avgPaceFormatted}  •  BEST: ${activity.bestPaceFormatted || '--'}`, chartX + chartW + offStat.x, y + 18 + offStat.y);
    ctx.restore();

    let minPace = Infinity, maxPace = 0;
    pts.forEach((p) => {
      if (p.pace > 0) {
        if (p.pace < minPace) minPace = p.pace;
        if (p.pace > maxPace) maxPace = p.pace;
      }
    });

    if (minPace === Infinity) minPace = 240;
    if (maxPace <= minPace) maxPace = minPace + 60;

    const dPace = maxPace - minPace;
    const totalDist = activity.distance || 1;
    const getY = (pace) => chartY + ((pace - minPace) / dPace) * chartH;

    if (design === 'bar-histogram') {
      // Style 5: High-Density Pace Bar Histogram
      const barCount = Math.min(36, pts.length);
      const step = Math.floor(pts.length / barCount);
      const bW = chartW / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const pt = pts[i * step] || pts[pts.length - 1];
        const bx = chartX + i * (bW + 2);
        const paceNorm = Math.max(0.15, Math.min(1, 1 - (pt.pace - minPace) / (dPace || 1)));
        const bh = chartH * paceNorm;
        const by = chartY + chartH - bh;

        ctx.fillStyle = pt.pace < activity.avgPace ? elAccent : 'rgba(255, 255, 255, 0.35)';
        this.drawRoundedRect(ctx, bx, by, bW, bh, 2);
        ctx.fill();
      }

      ctx.restore();
      return y + height;
    }

    if (design === 'cyber-hud-pace') {
      // Style 6: Cyberpunk Grid Pace Curve with Target Line & HUD Callouts
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let gy = chartY; gy <= chartY + chartH; gy += chartH / 3) {
        ctx.beginPath(); ctx.moveTo(chartX, gy); ctx.lineTo(chartX + chartW, gy); ctx.stroke();
      }

      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.pace);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const avgY = getY(activity.avgPace);
      ctx.strokeStyle = elAccent;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(chartX, avgY); ctx.lineTo(chartX + chartW, avgY); ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
      return y + height;
    }

    if (design === 'gradient-zone') {
      // Green / Cyan / Orange zone fills
      const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      grad.addColorStop(0, '#10b981'); // fast
      grad.addColorStop(0.5, '#00f0ff');
      grad.addColorStop(1, '#ff3366'); // slow

      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);
      pts.forEach((p) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.pace);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (design === 'area') {
      const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);
      pts.forEach((p) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.pace);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Line stroke
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = chartX + (p.dist / totalDist) * chartW;
      const py = getY(p.pace);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Average Pace dashed baseline
    const avgY = getY(activity.avgPace);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartX, avgY);
    ctx.lineTo(chartX + chartW, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
    return y + height;
  }

  // =========================================================================
  // WIDGET 9: HEART RATE GRAPH
  // Designs: 'filled-area', 'ecg-wave', 'zone-bars', 'pulse-glow'
  // =========================================================================
  drawHeartRateGraph(ctx, x, y, width, height, activity, config, theme, accent) {
    const pts = activity.hrCurve || [];
    if (!pts || pts.length < 3) return y;

    ctx.save();
    const elStyle = this.getElementStyle(config, 'hrGraph');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'hrGraph');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.hrGraphDesign || 'filled-area';
    this.recordBounds('hrGraph', 'Heart Rate Graph', x, y, width, height);

    this.drawWidgetCardBg(ctx, 'hrGraph', x, y, width, height, config, theme);

    const offTitle = this.getElementOffset(config, 'hrGraph', 'title');
    const offStat = this.getElementOffset(config, 'hrGraph', 'stat');
    const offChart = this.getElementOffset(config, 'hrGraph', 'chart');

    const pad = 16;
    const chartW = width - pad * 2;
    const chartH = height - 38;
    const chartX = x + pad;
    const chartY = y + 28;

    const hrTitle = this.getTextOverride(config, 'hrGraph', 'title', 'HEART RATE PROFILE');
    ctx.save();
    this.applyZDepth(ctx, offTitle.z);
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.textMuted;
    ctx.font = `bold 11px ${font}`;
    ctx.fillText(hrTitle, chartX + offTitle.x, y + 18 + offTitle.y);
    ctx.restore();

    ctx.save();
    this.applyZDepth(ctx, offStat.z);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`AVG: ${activity.avgHr || '--'} BPM  •  MAX: ${activity.maxHr || '--'}`, chartX + chartW + offStat.x, y + 18 + offStat.y);
    ctx.restore();

    const minH = activity.minHr || 120;
    const maxH = Math.max(minH + 20, activity.maxHr || 185);
    const dH = maxH - minH;
    const totalDist = activity.distance || 1;

    const getY = (hr) => chartY + chartH - ((hr - minH) / dH) * chartH;

    if (design === 'zone-gradient-strip') {
      // Style 5: Continuous Z1-Z5 Multi-Zone Color Gradient
      const grad = ctx.createLinearGradient(0, chartY + chartH, 0, chartY);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(0.3, '#10b981');
      grad.addColorStop(0.6, '#f59e0b');
      grad.addColorStop(0.85, '#f97316');
      grad.addColorStop(1, '#ef4444');

      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);
      pts.forEach((p) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.hr);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.hr);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
      return y + height;
    }

    if (design === 'cardiac-monitor') {
      // Style 6: Pro Cardiac Oscilloscope CRT Display
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      for (let gx = chartX; gx <= chartX + chartW; gx += 30) {
        ctx.beginPath(); ctx.moveTo(gx, chartY); ctx.lineTo(gx, chartY + chartH); ctx.stroke();
      }

      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.hr);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const lastP = pts[pts.length - 1];
      const endX = chartX + chartW;
      const endY = getY(lastP.hr);
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(endX, endY, 5, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
      return y + height;
    }

    if (design === 'zone-bars') {
      // 5-Zone Colored Vertical Frequency Bars
      const barCount = Math.min(30, pts.length);
      const step = Math.floor(pts.length / barCount);
      const bW = chartW / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const pt = pts[i * step] || pts[pts.length - 1];
        const bx = chartX + i * (bW + 2);
        const bh = ((pt.hr - minH) / dH) * chartH;
        const by = chartY + chartH - bh;

        let zCol = '#3b82f6';
        if (pt.hr > 170) zCol = '#ef4444';
        else if (pt.hr > 155) zCol = '#f97316';
        else if (pt.hr > 140) zCol = '#10b981';

        ctx.fillStyle = zCol;
        this.drawRoundedRect(ctx, bx, by, bW, bh, 2);
        ctx.fill();
      }
    } else {
      if (design === 'filled-area' || design === 'pulse-glow') {
        const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

        ctx.beginPath();
        ctx.moveTo(chartX, chartY + chartH);
        pts.forEach((p) => {
          const px = chartX + (p.dist / totalDist) * chartW;
          const py = getY(p.hr);
          ctx.lineTo(px, py);
        });
        ctx.lineTo(chartX + chartW, chartY + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Line stroke
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = chartX + (p.dist / totalDist) * chartW;
        const py = getY(p.hr);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = design === 'pulse-glow' ? 3.5 : 2.5;
      if (design === 'pulse-glow') {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
      }
      ctx.stroke();
    }

    ctx.restore();
    return y + height;
  }

  // =========================================================================
  // WIDGET 10: AVERAGE HEART RATE BADGE
  // Designs: 'pill', 'card', 'heart-gauge', 'compact-tag'
  // =========================================================================
  drawAvgHeartRateBadge(ctx, x, y, width, activity, config, theme, accent, customH = null) {
    if (!activity.avgHr) return y;

    ctx.save();
    const elStyle = this.getElementStyle(config, 'hrBadge');
    const { text, textMuted, accent: elAccent, cardStyle, align, opacity } = this.getEffectiveColors(config, theme, accent, 'hrBadge');
    if (opacity < 1) ctx.globalAlpha = opacity;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const design = config.hrBadgeDesign || 'pill';
    const h = customH || 60;
    this.recordBounds('hrBadge', 'Avg HR Badge', x, y, width, h);
    this.drawWidgetCardBg(ctx, 'hrBadge', x, y, width, h, config, theme, true);

    const labelOverride = this.getTextOverride(config, 'hrBadge', 'label', null);
    const unitOverride = this.getTextOverride(config, 'hrBadge', 'unit', 'BPM');

    if (design === 'zone-badge') {
      // Style 5: Multi-Zone Telemetry Capsule
      const cardH = customH || 86;
      this.drawWidgetCardBg(ctx, 'hrBadge', x, y, width, cardH, config, theme, true);

      // Determine Zone based on avgHr
      const hr = activity.avgHr;
      let zoneNum = 2;
      let zoneName = 'AEROBIC';
      let zoneCol = '#10b981';
      if (hr < 120) { zoneNum = 1; zoneName = 'RECOVERY'; zoneCol = '#3b82f6'; }
      else if (hr < 142) { zoneNum = 2; zoneName = 'AEROBIC'; zoneCol = '#10b981'; }
      else if (hr < 158) { zoneNum = 3; zoneName = 'TEMPO'; zoneCol = '#f59e0b'; }
      else if (hr < 172) { zoneNum = 4; zoneName = 'THRESHOLD'; zoneCol = '#f97316'; }
      else { zoneNum = 5; zoneName = 'ANAEROBIC'; zoneCol = '#ef4444'; }

      // Top bar with Zone pills
      const pillGap = 6;
      const totalPillW = 140;
      const pillW = (totalPillW - pillGap * 4) / 5;
      const pillH = 6;
      const zoneColors = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
      const pX = x + width - totalPillW - 20;
      const pY = y + 24;

      zoneColors.forEach((zc, idx) => {
        ctx.fillStyle = (idx + 1 === zoneNum) ? zc : 'rgba(255,255,255,0.15)';
        this.drawRoundedRect(ctx, pX + idx * (pillW + pillGap), pY, pillW, pillH, 3);
        ctx.fill();
        if (idx + 1 === zoneNum) {
          ctx.shadowColor = zc;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Label & Zone Badge
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.textMuted;
      ctx.font = `bold 11px ${font}`;
      ctx.letterSpacing = '1px';
      ctx.fillText(labelOverride || 'HEART RATE INTENSITY', x + 20, y + 28);

      // Value
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 36px ${font}`;
      ctx.fillText(`${activity.avgHr}`, x + 20, y + 68);

      const valW = ctx.measureText(`${activity.avgHr}`).width;
      ctx.fillStyle = zoneCol;
      ctx.font = `bold 16px ${font}`;
      ctx.fillText(unitOverride, x + 24 + valW, y + 66);

      // Zone tag badge on right
      const tagW = 90;
      const tagH = 24;
      const tagX = x + width - tagW - 20;
      const tagY = y + 46;
      this.drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 12);
      ctx.fillStyle = `${zoneCol}22`;
      ctx.fill();
      ctx.strokeStyle = zoneCol;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = zoneCol;
      ctx.font = `900 11px ${font}`;
      ctx.fillText(`ZONE ${zoneNum} • ${zoneName}`, tagX + tagW / 2, tagY + 16);

      ctx.restore();
      return y + cardH;
    }

    if (design === 'lcd-pulse') {
      // Style 6: Cardiac Monitor Oscilloscope LCD
      const cardH = customH || 84;
      this.drawRoundedRect(ctx, x, y, width, cardH, 12);
      ctx.fillStyle = '#060d13';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mini ECG waveform line across bottom background
      ctx.save();
      ctx.beginPath();
      const ecgY = y + 54;
      const ecgPts = [
        0, 0, 0.15, 0, 0.2, -6, 0.23, 14, 0.27, -22, 0.31, 8, 0.35, 0,
        0.5, 0, 0.65, 0, 0.7, -6, 0.73, 14, 0.77, -22, 0.81, 8, 0.85, 0, 1.0, 0
      ];
      for (let i = 0; i < ecgPts.length; i += 2) {
        const px = x + ecgPts[i] * width;
        const py = ecgY + ecgPts[i + 1];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Blinking Pulse Dot
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x + 24, y + 26, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#00f5d4';
      ctx.font = `bold 11px ${font}`;
      ctx.letterSpacing = '1.5px';
      ctx.fillText(labelOverride || 'CARDIAC PULSE TELEMETRY', x + 38, y + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 36px ${font}`;
      ctx.fillText(`${activity.avgHr}`, x + 24, y + 68);

      const valW = ctx.measureText(`${activity.avgHr}`).width;
      ctx.fillStyle = '#00f5d4';
      ctx.font = `bold 16px ${font}`;
      ctx.fillText(unitOverride, x + 28 + valW, y + 66);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold 12px ${font}`;
      ctx.fillText(`PEAK: ${activity.maxHr} ${unitOverride}`, x + width - 20, y + 66);

      ctx.restore();
      return y + cardH;
    }

    if (design === 'heart-gauge') {
      // Style 3: Circular Radial Gauge Badge
      const cardH = customH || 82;
      this.drawCardBackground(ctx, x, y, width, cardH, config, theme, true);
      const cx = x + 44;
      const cy = y + cardH / 2;
      const r = 26;

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 0.7); ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', cx, cy + 7);

      ctx.textAlign = 'left';
      ctx.fillStyle = theme.textMuted;
      ctx.font = `bold 11px ${font}`;
      ctx.fillText(labelOverride || 'HEART RATE ZONE', x + 84, y + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 32px ${font}`;
      ctx.fillText(`${activity.avgHr} ${unitOverride}`, x + 84, y + 64);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fca5a5';
      ctx.font = `bold 13px ${font}`;
      ctx.fillText(`MAX ${activity.maxHr} ${unitOverride}`, x + width - 20, y + 46);

      ctx.restore();
      return y + cardH;
    }

    if (design === 'compact-tag') {
      // Style 4: Minimal Smartwatch Complication
      this.drawRoundedRect(ctx, x, y, width, h, 8);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold 16px ${font}`;
      ctx.fillText(`❤️ ${unitOverride}`, x + 16, y + h / 2 + 5);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 22px ${font}`;
      ctx.fillText(`${activity.avgHr}`, x + 82, y + h / 2 + 6);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fca5a5';
      ctx.font = `bold 12px ${font}`;
      ctx.fillText(`PEAK: ${activity.maxHr}`, x + width - 16, y + h / 2 + 5);

      ctx.restore();
      return y + h;
    }

    if (design === 'card') {
      const cardH = customH || 80;
      this.drawCardBackground(ctx, x, y, width, cardH, config, theme, true);
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.textMuted;
      ctx.font = `bold 12px ${font}`;
      ctx.fillText(labelOverride || 'AVERAGE HEART RATE', x + 20, y + 26);

      ctx.fillStyle = '#ef4444';
      ctx.font = `bold 38px ${font}`;
      ctx.fillText(`${activity.avgHr}`, x + 20, y + 64);
      ctx.fillStyle = theme.text;
      ctx.font = `bold 18px ${font}`;
      ctx.fillText(unitOverride, x + 90, y + 62);

      ctx.textAlign = 'right';
      ctx.fillStyle = theme.textMuted;
      ctx.font = `600 13px ${font}`;
      ctx.fillText(`PEAK: ${activity.maxHr} ${unitOverride}`, x + width - 20, y + 45);

      ctx.restore();
      return y + cardH;
    }

    // Default 'pill':
    this.drawRoundedRect(ctx, x, y, width, h, 30);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold 22px ${font}`;
    ctx.fillText('❤️', x + 20, y + 37);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 20px ${font}`;
    ctx.fillText(`${labelOverride || 'AVG HEART RATE'}: ${activity.avgHr} ${unitOverride}`, x + 54, y + 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fca5a5';
    ctx.font = `bold 14px ${font}`;
    ctx.fillText(`MAX: ${activity.maxHr} ${unitOverride}`, x + width - 24, y + 36);

    ctx.restore();
    return y + h;
  }

  // =========================================================================
  // WIDGET 11: HR ZONES BAR
  // =========================================================================
  drawHrZonesBar(ctx, x, y, width, activity, config, theme, accent, customH = null) {
    const zones = activity.hrZones;
    if (!zones) return y;

    ctx.save();
    const font = this.getFontFamily(config.fontFamily);
    const h = customH || 40;
    this.recordBounds('hrZones', 'HR Zones Bar', x, y, width, h);

    const pad = 12;
    const barW = width - pad * 2;
    const barY = y + 16;
    const barH = 12;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
    let curX = x + pad;

    zones.forEach((z, idx) => {
      const zw = barW * z.percent;
      if (zw > 0) {
        ctx.fillStyle = colors[idx % colors.length];
        this.drawRoundedRect(ctx, curX, barY, zw, barH, idx === 0 ? 4 : idx === zones.length - 1 ? 4 : 0);
        ctx.fill();
        curX += zw;
      }
    });

    ctx.restore();
    return y + h;
  }

  drawFloatingHudPill(ctx, x, y, width, activity, config, theme, accent) {
    const h = 70;
    this.drawRoundedRect(ctx, x, y, width, h, 35);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const font = this.getFontFamily(config.fontFamily);
    const colW = width / 3;

    // Dist
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = `bold 11px ${font}`;
    ctx.fillText('DISTANCE', x + colW * 0.5, y + 26);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 22px ${font}`;
    ctx.fillText(`${activity.distanceMain} ${activity.distanceUnit}`, x + colW * 0.5, y + 54);

    // Time
    ctx.fillStyle = accent;
    ctx.font = `bold 11px ${font}`;
    ctx.fillText('TIME', x + colW * 1.5, y + 26);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 22px ${font}`;
    ctx.fillText(activity.durationFormatted, x + colW * 1.5, y + 54);

    // Pace
    ctx.fillStyle = accent;
    ctx.font = `bold 11px ${font}`;
    ctx.fillText('PACE', x + colW * 2.5, y + 26);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 22px ${font}`;
    ctx.fillText(activity.avgPaceFormatted, x + colW * 2.5, y + 54);
  }

  drawMiniSplitsBar(ctx, x, y, width, activity, config, theme, accent) {
    const splits = activity.splits || [];
    if (splits.length === 0) return;

    const count = Math.min(splits.length, 12);
    const gap = 4;
    const barW = (width - gap * (count - 1)) / count;
    const barH = 24;

    splits.slice(0, count).forEach((s, idx) => {
      const bx = x + idx * (barW + gap);
      ctx.fillStyle = s.isFastest ? accent : 'rgba(255, 255, 255, 0.4)';
      this.drawRoundedRect(ctx, bx, y, barW, barH, 4);
      ctx.fill();
    });
  }

  drawCompactSummaryPill(ctx, x, y, width, activity, config, theme, accent) {
    const h = 50;
    this.drawRoundedRect(ctx, x, y, width, h, 25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    const font = this.getFontFamily(config.fontFamily);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px ${font}`;
    ctx.fillText(`${activity.distanceMain} ${activity.distanceUnit}  •  ${activity.durationFormatted}  •  ${activity.avgPaceFormatted}`, x + width / 2, y + 31);
    return y + h;
  }

  drawBrandWatermark(ctx, x, y, width, config, theme, accent, customH = null) {
    ctx.save();
    const elStyle = this.getElementStyle(config, 'brand');
    const { text, textMuted, accent: elAccent, align, opacity } = this.getEffectiveColors(config, theme, accent, 'brand');
    if (opacity < 1) ctx.globalAlpha = opacity;
    accent = elAccent;

    const font = this.getFontFamily(elStyle.fontFamily !== 'default' ? elStyle.fontFamily : config.fontFamily);
    const h = customH || 24;
    this.recordBounds('brand', 'Watermark / Brand', x, y - 14, width, h);

    const brandStyle = config.brandStyle || 'runcut';
    let brandText = '⚡ RUNOVERLAY';

    if (brandStyle === 'strava') {
      brandText = 'STRAVA RUNNER';
    } else if (brandStyle === 'nike') {
      brandText = 'JUST DO IT • RUN CLUB';
    } else if (brandStyle === 'custom' && config.customWatermark) {
      brandText = config.customWatermark.toUpperCase();
    }

    brandText = this.getTextOverride(config, 'brand', 'text', brandText);

    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${font}`;
    ctx.letterSpacing = '2px';
    ctx.fillStyle = config.brandStyle === 'strava' ? '#fc5200' : 'rgba(255, 255, 255, 0.6)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(brandText, x + width / 2, y);

    ctx.restore();
  }

  // =========================================================================
  // CUSTOM TEXTS & STICKERS RENDERER
  // =========================================================================
  drawCustomTexts(ctx, w, h, customTexts, theme, accent) {
    if (!customTexts || !Array.isArray(customTexts) || customTexts.length === 0) return;

    ctx.save();
    customTexts.forEach((item, index) => {
      if (!item || !item.text) return;

      const fontKey = item.fontFamily || 'athletic';
      const font = this.getFontFamily(fontKey);
      const fontSize = item.fontSize || 36;
      const weight = item.fontWeight || 'bold';
      const color = item.color || '#ffffff';
      const bgStyle = item.bgStyle || 'none';
      const align = item.align || 'center';

      ctx.save();
      ctx.font = `${weight} ${fontSize}px ${font}`;

      const textMetrics = ctx.measureText(item.text);
      const textW = textMetrics.width;
      const textH = fontSize * 1.25;

      const padX = bgStyle === 'none' ? 0 : 20;
      const padY = bgStyle === 'none' ? 0 : 12;

      let boxW = item.width || (textW + padX * 2);
      let boxH = item.height || (textH + padY * 2);

      let x = item.x !== undefined ? item.x : (w - boxW) / 2;
      let y = item.y !== undefined ? item.y : (h - boxH) / 2;

      // Draw background if specified
      if (bgStyle === 'pill') {
        this.drawRoundedRect(ctx, x, y, boxW, boxH, boxH / 2);
        ctx.fillStyle = item.bgColor || 'rgba(0, 0, 0, 0.75)';
        ctx.fill();
        ctx.strokeStyle = item.borderColor || accent;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (bgStyle === 'card') {
        this.drawCardBackground(ctx, x, y, boxW, boxH, { cardStyle: 'glass', cardRadius: 16 }, theme);
      } else if (bgStyle === 'tape') {
        ctx.save();
        ctx.translate(x + boxW / 2, y + boxH / 2);
        ctx.rotate(-0.03); // Athletic tilt
        this.drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 4);
        ctx.fillStyle = item.bgColor || '#ff3366';
        ctx.fill();
        ctx.restore();
      } else if (bgStyle === 'neon-box') {
        this.drawRoundedRect(ctx, x, y, boxW, boxH, 8);
        ctx.fillStyle = 'rgba(10, 10, 16, 0.85)';
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      // Draw Text
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;

      let drawTextX = x + boxW / 2;
      if (align === 'left') drawTextX = x + padX;
      else if (align === 'right') drawTextX = x + boxW - padX;

      ctx.fillText(item.text, drawTextX, y + boxH / 2);
      ctx.restore();

      // Record bounds for drag & drop hit test
      const itemId = item.id || `custom_${index}`;
      this.recordBounds(itemId, item.text, x, y, boxW, boxH);
    });
    ctx.restore();
  }

  // ==========================================
  // CARD BACKGROUND HELPER
  // ==========================================
  drawCardBackground(ctx, x, y, w, h, config, theme, highlight = false) {
    const radius = config.cardRadius || 16;
    const style = config.cardStyle || 'glass';

    ctx.save();
    this.drawRoundedRect(ctx, x, y, w, h, radius);

    if (style === 'minimal') {
      ctx.strokeStyle = highlight ? theme.accent : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (style === 'solid') {
      ctx.fillStyle = '#14141d';
      ctx.fill();
      ctx.strokeStyle = highlight ? theme.accent : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Default 'glass' style
    ctx.fillStyle = highlight ? 'rgba(30, 30, 42, 0.85)' : theme.cardBg;
    ctx.fill();

    ctx.strokeStyle = highlight ? theme.accent : theme.cardBorder;
    ctx.lineWidth = highlight ? 1.5 : 1;
    ctx.stroke();

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  getFontFamily(choice) {
    switch (choice) {
      case 'athletic':
        return "'Anton', 'Bebas Neue', 'Impact', sans-serif";
      case 'bebas':
        return "'Bebas Neue', 'Anton', sans-serif";
      case 'oswald':
        return "'Oswald', 'Anton', sans-serif";
      case 'montserrat':
        return "'Montserrat', -apple-system, sans-serif";
      case 'barlow':
        return "'Barlow Condensed', 'Bebas Neue', sans-serif";
      case 'tech':
      case 'cyber':
        return "'Rajdhani', 'Orbitron', monospace";
      case 'mono':
        return "'JetBrains Mono', 'Roboto Mono', monospace";
      case 'serif':
        return "'Playfair Display', 'Georgia', serif";
      case 'script':
        return "'Caveat', 'Brush Script MT', cursive";
      case 'modern':
      default:
        return "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif";
    }
  }

  interpolateColor(c1, c2, factor) {
    const r1 = parseInt(c1.substring(1, 3), 16);
    const g1 = parseInt(c1.substring(3, 5), 16);
    const b1 = parseInt(c1.substring(5, 7), 16);

    const r2 = parseInt(c2.substring(1, 3), 16);
    const g2 = parseInt(c2.substring(3, 5), 16);
    const b2 = parseInt(c2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
