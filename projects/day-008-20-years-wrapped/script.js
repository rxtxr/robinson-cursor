// Day 008 — 20 Years Wrapped pt. I

const GENRE_COLORS = {
  'Electronic':            '#6c5ce7',
  'Indie / Alternative':   '#00cec9',
  'Rock':                  '#e17055',
  'Hip-Hop':               '#fdcb6e',
  'Trip-Hop / Downtempo':  '#a29bfe',
  'Folk / Singer-Songwriter': '#55efc4',
  'Post-Punk / New Wave':  '#fd79a8',
  'Soul / Funk':           '#e84393',
  'Punk / Hardcore':       '#d63031',
  'DnB / Breakcore':       '#00b894',
  'Jazz':                  '#ffeaa7',
  'Post-Rock':             '#74b9ff',
  'Metal':                 '#636e72',
  'Pop':                   '#fab1a0',
  'Industrial':            '#b2bec3',
  'Experimental':          '#dfe6e9',
  'Classical':             '#c7ecee',
  'Country':               '#d4a373',
  'Soundtrack':            '#e9c46a',
  'Other':                 '#444466',
};

const tooltip = d3.select('#tooltip');

function showTooltip(evt, html) {
  tooltip.html(html).classed('visible', true);
  const tt = tooltip.node();
  const x = Math.min(evt.clientX + 12, window.innerWidth - tt.offsetWidth - 20);
  const y = Math.min(evt.clientY - 10, window.innerHeight - tt.offsetHeight - 20);
  tooltip.style('left', x + 'px').style('top', y + 'px');
}

function hideTooltip() {
  tooltip.classed('visible', false);
}

// ============================================================
// NAVIGATION
// ============================================================

const vizInited = {};

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.viz-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.viz;
    document.getElementById(id).classList.add('active');
    if (!vizInited[id]) {
      vizInited[id] = true;
      if (id === 'similarity') initSimilarity();
      if (id === 'credits') initCredits();
    }
  });
});

// ============================================================
// 1. RIVER CHART (Streamgraph)
// ============================================================

async function initRiver() {
  const [data, peaks] = await Promise.all([
    d3.json('data_river.json'),
    d3.json('data_peaks.json'),
  ]);
  const { series, genres } = data;

  // Genre grouping
  const GROUPS = {
    'Electronic & Dance': ['Electronic', 'DnB / Breakcore'],
    'Trip-Hop & Downtempo': ['Trip-Hop / Downtempo'],
    'Rock & Alternative': ['Rock', 'Indie / Alternative', 'Post-Punk / New Wave', 'Post-Rock', 'Metal', 'Punk / Hardcore'],
    'Hip-Hop':            ['Hip-Hop'],
    'Soul, Funk & Pop':   ['Soul / Funk', 'Pop', 'Folk / Singer-Songwriter'],
    'Jazz & Classical':   ['Jazz', 'Classical', 'Soundtrack'],
    'Experimental & Industrial': ['Experimental', 'Industrial'],
    'Other':              ['Other'],
  };

  const GROUP_COLORS = {
    'Electronic & Dance':        '#6c5ce7',
    'Trip-Hop & Downtempo':      '#a29bfe',
    'Rock & Alternative':        '#e17055',
    'Hip-Hop':                   '#fdcb6e',
    'Soul, Funk & Pop':          '#e84393',
    'Jazz & Classical':          '#ffeaa7',
    'Experimental & Industrial': '#b2bec3',
    'Other':                     '#444466',
  };

  const groupKeys = Object.keys(GROUPS);

  // Build grouped series from raw detail series
  function groupSeries(src) {
    return src.map(d => {
      const entry = { year: d.year };
      for (const [group, members] of Object.entries(GROUPS)) {
        entry[group] = members.reduce((sum, g) => sum + (d[g] || 0), 0);
      }
      return entry;
    });
  }

  const container = document.getElementById('river-chart');
  const rect = container.getBoundingClientRect();
  const margin = { top: 30, right: 30, bottom: 40, left: 50 };
  const width = rect.width - margin.left - margin.right;
  const height = rect.height - margin.top - margin.bottom;

  const svg = d3.select('#river-chart').append('svg')
    .attr('width', rect.width)
    .attr('height', rect.height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(series, d => d.year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 0]);

  // Axes (static)
  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d * 100) + '%'));

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(10));

  const layerG = g.append('g');
  const dotG = g.append('g');
  const legend = d3.select('#river-legend');

  let currentMode = 'detail';

  function render(mode) {
    currentMode = mode;
    const isGrouped = mode === 'grouped';
    const keys = isGrouped ? groupKeys : genres;
    const colors = isGrouped ? GROUP_COLORS : GENRE_COLORS;
    const rawSeries = isGrouped ? groupSeries(series) : series;

    // Normalize
    const seriesNorm = rawSeries.map((d, i) => {
      const total = keys.reduce((sum, k) => sum + (d[k] || 0), 0);
      const entry = { year: d.year, _i: i };
      keys.forEach(k => { entry[k] = total > 0 ? (d[k] || 0) / total : 0; });
      return entry;
    });

    const stack = d3.stack()
      .keys(keys)
      .offset(d3.stackOffsetNone)
      .order(d3.stackOrderReverse);

    const stacked = stack(seriesNorm);

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    // Layers
    layerG.selectAll('*').remove();
    const activeKeys = new Set(keys);

    const layers = layerG.selectAll('.layer')
      .data(stacked)
      .join('path')
      .attr('class', 'layer')
      .attr('d', area)
      .attr('fill', d => colors[d.key] || '#444')
      .attr('opacity', 0.85)
      .on('mousemove', (evt, d) => {
        const [mx] = d3.pointer(evt, g.node());
        const year = Math.round(x.invert(mx));
        const normEntry = seriesNorm.find(s => s.year === year);
        const rawEntry = rawSeries.find(s => s.year === year);
        const pct = normEntry ? (normEntry[d.key] * 100).toFixed(1) : 0;
        const abs = rawEntry ? rawEntry[d.key] || 0 : 0;

        let detail = '';
        if (isGrouped && GROUPS[d.key]) {
          const yr = rawSeries.find(s => s.year === year);
          // Show breakdown from original detail series
          const detailEntry = series.find(s => s.year === year);
          if (detailEntry) {
            detail = GROUPS[d.key]
              .filter(g => (detailEntry[g] || 0) > 0)
              .map(g => `${g}: ${detailEntry[g].toLocaleString()}`)
              .join('<br>');
          }
        }

        showTooltip(evt,
          `<div class="tt-title">${d.key}</div>` +
          `<div class="tt-detail">${year}: ${pct}% (${abs.toLocaleString()} listens)</div>` +
          (detail ? `<div class="tt-detail" style="margin-top:4px">${detail}</div>` : '')
        );
      })
      .on('mouseleave', hideTooltip);

    // Peak dots (detail mode only)
    dotG.selectAll('*').remove();
    if (!isGrouped) {
      const peakData = genres
        .filter(genre => peaks[genre] && genre !== 'Other')
        .map(genre => {
          const p = peaks[genre];
          const layer = stacked.find(l => l.key === genre);
          const yearIdx = seriesNorm.findIndex(s => s.year === p.year);
          if (!layer || yearIdx < 0) return null;
          const y0v = layer[yearIdx][0];
          const y1v = layer[yearIdx][1];
          return {
            genre, year: p.year, pct: p.pct, abs: p.abs, top3: p.top3,
            cx: x(p.year), cy: y((y0v + y1v) / 2),
          };
        })
        .filter(Boolean);

      const dots = dotG.selectAll('.peak-dot')
        .data(peakData)
        .join('g')
        .attr('class', 'peak-dot')
        .attr('transform', d => `translate(${d.cx},${d.cy})`);

      dots.append('circle')
        .attr('r', 5)
        .attr('fill', '#fff')
        .attr('stroke', d => GENRE_COLORS[d.genre] || '#444')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      dots.on('mouseenter', (evt, d) => {
        const artists = d.top3.map(a => `${a.name} (${a.plays})`).join('<br>');
        showTooltip(evt,
          `<div class="tt-title">${d.genre} — peak ${d.year}</div>` +
          `<div class="tt-detail">${d.pct}% (${d.abs.toLocaleString()} listens)</div>` +
          `<div class="tt-detail" style="margin-top:4px">${artists}</div>`
        );
      })
      .on('mousemove', (evt) => {
        const tt = tooltip.node();
        const tx = Math.min(evt.clientX + 12, window.innerWidth - tt.offsetWidth - 20);
        const ty = Math.min(evt.clientY - 10, window.innerHeight - tt.offsetHeight - 20);
        tooltip.style('left', tx + 'px').style('top', ty + 'px');
      })
      .on('mouseleave', hideTooltip);
    }

    // Legend
    legend.selectAll('*').remove();
    keys.forEach(key => {
      const item = legend.append('div')
        .attr('class', 'legend-item')
        .on('click', () => {
          if (activeKeys.has(key)) {
            activeKeys.delete(key);
            item.classed('dimmed', true);
          } else {
            activeKeys.add(key);
            item.classed('dimmed', false);
          }
          layers.attr('opacity', d => activeKeys.has(d.key) ? 0.85 : 0.06);
        });

      item.append('div')
        .attr('class', 'legend-swatch')
        .style('background', colors[key] || '#444');

      item.append('span').text(key);
    });
  }

  // Toggle buttons
  document.querySelectorAll('#river-controls .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#river-controls .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.mode);
    });
  });

  render('detail');
}

initRiver();

// ============================================================
// 2. SIMILARITY NETWORK
// ============================================================

async function initSimilarity() {
  const raw = await d3.json('data_similarity.json');

  // Keep immutable copies — D3 force mutates source/target to object refs
  const origEdges = raw.edges.map(e => ({ source: e.source, target: e.target, weight: e.weight }));
  const nodeMap = new Map(raw.nodes.map(n => [n.name, n]));

  const container = document.getElementById('sim-chart');
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const svg = d3.select('#sim-chart').append('svg')
    .attr('width', width)
    .attr('height', height);

  const zoomG = svg.append('g');

  svg.call(d3.zoom()
    .scaleExtent([0.2, 8])
    .on('zoom', (evt) => zoomG.attr('transform', evt.transform)));

  const minPlaysSlider = document.getElementById('sim-min-plays');
  const minWeightSlider = document.getElementById('sim-min-weight');
  const minPlaysVal = document.getElementById('sim-min-val');
  const minWeightVal = document.getElementById('sim-weight-val');

  let activeSim = null;

  function render() {
    const minPlays = +minPlaysSlider.value;
    const minWeight = +minWeightSlider.value;
    minPlaysVal.textContent = minPlays;
    minWeightVal.textContent = minWeight;

    // Stop previous simulation
    if (activeSim) activeSim.stop();

    // Filter from immutable originals
    const edgeCandidates = origEdges.filter(e => e.weight >= minWeight);

    const nodeSet = new Set();
    edgeCandidates.forEach(e => { nodeSet.add(e.source); nodeSet.add(e.target); });

    const nodes = [...nodeSet]
      .map(name => nodeMap.get(name))
      .filter(n => n && n.plays >= minPlays);

    const validNames = new Set(nodes.map(n => n.name));

    // Fresh edge copies for this simulation (will be mutated by D3)
    const filteredEdges = edgeCandidates
      .filter(e => validNames.has(e.source) && validNames.has(e.target))
      .map(e => ({ source: e.source, target: e.target, weight: e.weight }));

    // Fresh node copies
    const nodeData = nodes.map(n => ({ ...n }));

    const rScale = d3.scaleSqrt()
      .domain([0, d3.max(nodeData, n => n.plays) || 1])
      .range([2, 24]);

    zoomG.selectAll('*').remove();

    const linkG = zoomG.append('g');
    const nodeG = zoomG.append('g');

    const link = linkG.selectAll('line')
      .data(filteredEdges)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#888')
      .attr('stroke-width', d => d.weight * 2);

    const node = nodeG.selectAll('g')
      .data(nodeData, d => d.name)
      .join('g')
      .call(d3.drag()
        .on('start', (evt, d) => {
          if (!evt.active) activeSim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (evt, d) => { d.fx = evt.x; d.fy = evt.y; })
        .on('end', (evt, d) => {
          if (!evt.active) activeSim.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', d => rScale(d.plays))
      .attr('fill', d => GENRE_COLORS[d.genre] || GENRE_COLORS.Other)
      .attr('opacity', 0.8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);

    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', d => rScale(d.plays) + 10)
      .text(d => d.plays > 50 ? d.name : '');

    node.on('mousemove', (evt, d) => {
      showTooltip(evt,
        `<div class="tt-title">${d.name}</div>` +
        `<div class="tt-detail">${d.genre}<br>${d.plays.toLocaleString()} plays</div>`
      );
    }).on('mouseleave', hideTooltip);

    activeSim = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(filteredEdges).id(d => d.name).distance(80).strength(d => d.weight * 0.5))
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => rScale(d.plays) + 2))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
  }

  minPlaysSlider.addEventListener('input', render);
  minWeightSlider.addEventListener('input', render);
  render();
}

// ============================================================
// 3. CREDITS NETWORK
// ============================================================

async function initCredits() {
  const rawData = await d3.json('data_credits.json');
  // Immutable copies — D3 force mutates source/target
  const origEdges = rawData.edges.map(e => ({ source: e.source, target: e.target, role: e.role, count: e.count }));
  const origNodes = rawData.nodes;
  const raw = { nodes: origNodes, get edges() { return origEdges; } };

  const container = document.getElementById('credits-chart');
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const svg = d3.select('#credits-chart').append('svg')
    .attr('width', width)
    .attr('height', height);

  const zoomG = svg.append('g');

  svg.call(d3.zoom()
    .scaleExtent([0.2, 8])
    .on('zoom', (evt) => zoomG.attr('transform', evt.transform)));

  const minConnSlider = document.getElementById('cred-min-conn');
  const minConnVal = document.getElementById('cred-min-val');

  // Role colors
  const ROLE_COLORS = {
    'Remix': '#6c5ce7',
    'Producer': '#fdcb6e',
    'Written-By': '#55efc4',
    'Featuring': '#fd79a8',
    'Mixed By': '#74b9ff',
    'Shared Release': '#e17055',
  };

  // Build role legend
  const credLegend = d3.select('#credits-legend');
  Object.entries(ROLE_COLORS).forEach(([role, color]) => {
    const item = credLegend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-line').style('background', color);
    item.append('span').text(role);
  });
  // Artist vs collaborator
  credLegend.append('div').attr('class', 'legend-item')
    .html('<div class="legend-swatch" style="background:#6c5ce7;border-radius:50%"></div><span>Artist (in library)</span>');
  credLegend.append('div').attr('class', 'legend-item')
    .html('<div class="legend-swatch" style="background:#888;border-radius:50%;border:1px dashed #aaa"></div><span>Collaborator</span>');

  let lockedNode = null;
  let activeSim = null;

  function render() {
    const minConn = +minConnSlider.value;
    minConnVal.textContent = minConn;
    lockedNode = null;

    if (activeSim) activeSim.stop();

    // Count connections per node (from immutable originals)
    const connCount = {};
    origEdges.forEach(e => {
      connCount[e.source] = (connCount[e.source] || 0) + 1;
      connCount[e.target] = (connCount[e.target] || 0) + 1;
    });

    // Filter nodes by connection count
    const validNames = new Set();
    origNodes.forEach(n => {
      if ((connCount[n.name] || 0) >= minConn) validNames.add(n.name);
    });

    // Fresh copies for this simulation
    const edges = origEdges
      .filter(e => validNames.has(e.source) && validNames.has(e.target))
      .map(e => ({ source: e.source, target: e.target, role: e.role, count: e.count }));

    const edgeNodeNames = new Set();
    edges.forEach(e => { edgeNodeNames.add(e.source); edgeNodeNames.add(e.target); });

    const nodes = origNodes
      .filter(n => edgeNodeNames.has(n.name))
      .map(n => ({ ...n }));

    const rScale = d3.scaleSqrt()
      .domain([0, d3.max(nodes, n => n.plays) || 1])
      .range([3, 20]);

    zoomG.selectAll('*').remove();

    const linkG = zoomG.append('g');
    const nodeG = zoomG.append('g');

    const link = linkG.selectAll('line')
      .data(edges)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', d => ROLE_COLORS[d.role] || '#666')
      .attr('stroke-width', d => Math.min(d.count, 5) * 0.6 + 0.5);

    const node = nodeG.selectAll('g')
      .data(nodes, d => d.name)
      .join('g')
      .call(d3.drag()
        .on('start', (evt, d) => {
          if (!evt.active) activeSim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (evt, d) => { d.fx = evt.x; d.fy = evt.y; })
        .on('end', (evt, d) => {
          if (!evt.active) activeSim.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', d => rScale(d.plays))
      .attr('fill', d => d.isArtist ? (GENRE_COLORS[d.genre] || GENRE_COLORS.Other) : '#888')
      .attr('opacity', d => d.isArtist ? 0.85 : 0.5)
      .attr('stroke', d => d.isArtist ? '#fff' : '#aaa')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', d => d.isArtist ? 'none' : '2,2');

    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', d => rScale(d.plays) + 10)
      .text(d => (connCount[d.name] || 0) >= minConn + 1 || d.plays > 100 ? d.name : '');

    // Highlight helpers
    function getNodeName(d) { return typeof d === 'string' ? d : d.name; }

    function highlightNode(d) {
      const neighbors = new Set();
      neighbors.add(d.name);
      link.each(function(e) {
        const sn = getNodeName(e.source), tn = getNodeName(e.target);
        if (sn === d.name || tn === d.name) {
          neighbors.add(sn);
          neighbors.add(tn);
        }
      });

      node.classed('node-highlight', n => neighbors.has(n.name))
          .classed('node-dimmed', n => !neighbors.has(n.name));
      link.classed('link-highlight', e => getNodeName(e.source) === d.name || getNodeName(e.target) === d.name)
          .classed('link-dimmed', e => getNodeName(e.source) !== d.name && getNodeName(e.target) !== d.name);
    }

    function clearHighlight() {
      node.classed('node-highlight', false).classed('node-dimmed', false);
      link.classed('link-highlight', false).classed('link-dimmed', false);
    }

    node.on('mouseenter', (evt, d) => {
      if (!lockedNode) highlightNode(d);
      // Tooltip
      const conns = edges.filter(e => getNodeName(e.source) === d.name || getNodeName(e.target) === d.name);
      const partners = conns.map(e => {
        const other = getNodeName(e.source) === d.name ? getNodeName(e.target) : getNodeName(e.source);
        return `${other} <span style="color:${ROLE_COLORS[e.role] || '#666'}">(${e.role})</span>`;
      });
      showTooltip(evt,
        `<div class="tt-title">${d.name}</div>` +
        `<div class="tt-detail">${d.isArtist ? d.genre : 'Collaborator'}` +
        `${d.plays ? ' · ' + d.plays.toLocaleString() + ' plays' : ''}</div>` +
        (partners.length ? `<div class="tt-detail" style="margin-top:4px">${partners.slice(0, 12).join('<br>')}` +
        (partners.length > 12 ? `<br>… +${partners.length - 12} more` : '') + '</div>' : '')
      );
    })
    .on('mousemove', (evt) => {
      const tt = tooltip.node();
      const x = Math.min(evt.clientX + 12, window.innerWidth - tt.offsetWidth - 20);
      const y = Math.min(evt.clientY - 10, window.innerHeight - tt.offsetHeight - 20);
      tooltip.style('left', x + 'px').style('top', y + 'px');
    })
    .on('mouseleave', () => {
      if (!lockedNode) clearHighlight();
      hideTooltip();
    })
    .on('click', (evt, d) => {
      evt.stopPropagation();
      if (lockedNode === d.name) {
        lockedNode = null;
        clearHighlight();
      } else {
        lockedNode = d.name;
        highlightNode(d);
      }
    });

    // Click background to unlock
    svg.on('click', () => {
      lockedNode = null;
      clearHighlight();
    });

    activeSim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.name).distance(60).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-40))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => rScale(d.plays) + 2))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
  }

  minConnSlider.addEventListener('input', render);
  render();
}
