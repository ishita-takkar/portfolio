import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale; 
let commits = [];

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const commitObj = {
        id: commit,
        url: 'https://github.com/ishita-takkar/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(commitObj, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return commitObj;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.groups(data, d => d.file).length;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  const maxFileLength = d3.max(data, d => d.line);
  dl.append('dt').text('Max file length');
  dl.append('dd').text(maxFileLength);

  const longestLine = d3.greatest(data, d => d.length)?.length;
  dl.append('dt').text('Longest line (characters)');
  dl.append('dd').text(longestLine);

  const avgFileLength = d3.mean(
    d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
    d => d[1]
  );
  dl.append('dt').text('Average file length');
  dl.append('dd').text(avgFileLength.toFixed(1));

  const maxPeriod = d3.greatest(
    d3.rollups(data, v => v.length, d =>
      new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    ),
    d => d[1]
  )?.[0];
  dl.append('dt').text('Most active time of day');
  dl.append('dd').text(maxPeriod);
}

function renderScatterPlot(data) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usableArea = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickSize(-usableArea.width).tickFormat(''))
    .selectAll('line')
    .attr('stroke', d => {
      const h = d % 24;
      return h < 6 || h >= 20 ? '#457b9d' : h < 12 ? '#f4a261' : '#e76f51';
    });

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commits, d => d.totalLines))
    .range([2, 30]);

  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(d3.sort(commits, d => -d.totalLines))
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle')
    .classed('selected', d => isCommitSelected(selection, d))
    .attr('fill', d => isCommitSelected(selection, d) ? '#ff6b6b' : 'steelblue');

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}


function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  const p = document.getElementById('selection-count');
  p.textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  const lines = selected.flatMap(d => d.lines);
  const container = document.getElementById('language-breakdown');

  if (lines.length === 0) return container.innerHTML = '';

  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  container.innerHTML = '';
  for (const [lang, count] of breakdown) {
    const pct = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `<dt>${lang.toUpperCase()}</dt><dd>${count} lines (${pct})</dd>`;
  }
}

function renderTooltipContent(commit) {
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('commit-time').textContent = commit.datetime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(show) {
  document.getElementById('commit-tooltip').hidden = !show;
}

function updateTooltipPosition(event) {
  const t = document.getElementById('commit-tooltip');
  t.style.left = `${event.clientX}px`;
  t.style.top = `${event.clientY}px`;
}

// Run everything
const data = await loadData();
commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data);
