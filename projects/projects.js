import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');
let projectsContainer = document.querySelector('.projects');
let title = document.querySelector('.projects-title');
let searchInput = document.querySelector('.searchBar');

if (title) title.textContent = `${projects.length} Projects`;

let selectedIndex = -1;

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  arcData.forEach((d, i) => {
    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg
          .selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        legend
          .selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        if (selectedIndex === -1) {
          renderProjects(projectsGiven, projectsContainer, 'h2');
        } else {
          let selectedYear = data[selectedIndex].label;
          let filtered = projectsGiven.filter((p) => p.year === selectedYear);
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color: ${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        svg
          .selectAll('path')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));

        legend
          .selectAll('li')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));

        if (selectedIndex === -1) {
          renderProjects(projectsGiven, projectsContainer, 'h2');
        } else {
          let selectedYear = data[selectedIndex].label;
          let filtered = projectsGiven.filter((p) => p.year === selectedYear);
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

searchInput.addEventListener('change', (event) => {
  let query = event.target.value.toLowerCase();
  let filtered = projects.filter((project) => {
    let values = Object.values(project).join(' ').toLowerCase();
    return values.includes(query);
  });
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});
