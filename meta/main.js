import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
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

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Basic stats
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Custom stats
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
    d3.rollups(
      data,
      v => d3.max(v, d => d.line),
      d => d.file
    ),
    d => d[1]
  );
  dl.append('dt').text('Average file length');
  dl.append('dd').text(avgFileLength.toFixed(1));

  const maxPeriod = d3.greatest(
    d3.rollups(
      data,
      v => v.length,
      d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    ),
    d => d[1]
  )?.[0];
  dl.append('dt').text('Most active time of day');
  dl.append('dd').text(maxPeriod);
}
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  const xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  
  const dots = svg.append('g').attr('class', 'dots');

  dots
  .selectAll('circle')
  .data(commits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', 5)
  .attr('fill', 'steelblue');


 }

// Run all
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits); 
renderScatterPlot(data, commits);