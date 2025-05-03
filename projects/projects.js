import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedIndex = -1;
let dataForPie = [];

renderProjects(projects, projectsContainer, 'h2');
updateTitle(projects.length);
renderPieChart(projects);

function updateTitle(count, year = '') {
  titleElement.textContent = year
    ? `${count} ${count === 1 ? 'Project' : 'Projects'} from ${year}`
    : `${count} ${count === 1 ? 'Project' : 'Projects'}`;
}

function filterProjects(data) {
  return data.filter((project) => {
    const values = Object.values(project).join(' ').toLowerCase();
    const matchesQuery = values.includes(query);
    const matchesYear =
      selectedIndex === -1 ||
      project.year === dataForPie[selectedIndex]?.label;
    return matchesQuery && matchesYear;
  });
}

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path').remove();
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

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(dataForPie);
  const arc = d3.arc().innerRadius(0).outerRadius(50);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((arcDatum, i) => {
    svg
      .append('path')
      .attr('d', arc(arcDatum))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        const filtered = filterProjects(projects);
        renderProjects(filtered, projectsContainer, 'h2');
        renderPieChart(projects); 
        updateTitle(filtered.length, selectedIndex !== -1 ? dataForPie[selectedIndex].label : '');
      });
  });

  legend
    .selectAll('li')
    .data(dataForPie)
    .join('li')
    .attr('class', (d, i) => `legend-item${i === selectedIndex ? ' selected' : ''}`)
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (_, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;
      const filtered = filterProjects(projects);
      renderProjects(filtered, projectsContainer, 'h2');
      renderPieChart(projects); 
      updateTitle(filtered.length, selectedIndex !== -1 ? dataForPie[selectedIndex].label : '');
    });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();
  const filtered = filterProjects(projects);
  renderProjects(filtered, projectsContainer, 'h2');
  updateTitle(filtered.length, selectedIndex !== -1 ? dataForPie[selectedIndex].label : '');
  
});
