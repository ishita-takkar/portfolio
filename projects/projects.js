import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "../"
  : "/portfolio/";

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');

if (titleElement) {
  titleElement.textContent = `${projects.length} Projects`;
}

let query = '';
let selectedIndex = -1;
let dataForPie = [];

const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();
  const filtered = filterProjects(projects, query, selectedIndex);
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});

function filterProjects(data, query, selectedIndex) {
  return data.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    const matchesQuery = values.includes(query);
    const matchesYear = selectedIndex === -1 || project.year === dataForPie[selectedIndex]?.label;
    return matchesQuery && matchesYear;
  });
}

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  dataForPie = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(100);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(dataForPie);

  const g = svg
    .attr('viewBox', '0 0 200 200')
    .append('g')
    .attr('transform', 'translate(100,100)');

  arcData.forEach((d, i) => {
    g.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        const filtered = filterProjects(projects, query, selectedIndex);
        renderProjects(filtered, projectsContainer, 'h2');
        renderPieChart(filtered);
      });
  });

  legend.selectAll('li')
    .data(dataForPie)
    .join('li')
    .attr('class', (_, i) => `legend-item${i === selectedIndex ? ' selected' : ''}`)
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (_, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;
      const filtered = filterProjects(projects, query, selectedIndex);
      renderProjects(filtered, projectsContainer, 'h2');
      renderPieChart(filtered);
    });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);
