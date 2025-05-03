import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');
let projectsContainer = document.querySelector('.projects');
let title = document.querySelector('.projects-title');
let searchInput = document.querySelector('.searchBar');

let selectedIndex = -1;
let query = '';

function updateTitle(projectsShown) {
  if (!title) return;
  if (selectedIndex === -1) {
    title.textContent = `${projectsShown.length} Projects`;
  } else {
    const year = data[selectedIndex].label;
    title.textContent = `${projectsShown.length} Projects from ${year}`;
  }
}

function filterProjects(data) {
  return data.filter((project) => {
    let matchesQuery = Object.values(project).join(' ').toLowerCase().includes(query.toLowerCase());
    let matchesYear = selectedIndex === -1 || project.year === data[selectedIndex].label;
    return matchesQuery && matchesYear;
  });
}

let data = [];

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        svg.selectAll('path').attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        legend.selectAll('li').attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        const filtered = filterProjects(projects);
        renderProjects(filtered, projectsContainer, 'h2');
        updateTitle(filtered);
      });
  });

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();
  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color: ${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        svg.selectAll('path').attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        legend.selectAll('li').attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        const filtered = filterProjects(projects);
        renderProjects(filtered, projectsContainer, 'h2');
        updateTitle(filtered);
      });
  });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);
updateTitle(projects);

searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();
  const filtered = filterProjects(projects);
  renderProjects(filtered, projectsContainer, 'h2');
  updateTitle(filtered);
});
