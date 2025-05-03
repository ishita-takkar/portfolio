import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');


const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projects.length} Projects`;
}

let rolledData = d3.rollups(
  projects,
  v => v.length,      
  d => d.year          
);

let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});


let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let sliceGenerator = d3.pie().value(d => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map(d => arcGenerator(d));

d3.select('#projects-plot')
  .selectAll('path')
  .data(arcs)
  .join('path')
  .attr('d', d => d)
  .attr('fill', (_, i) => colors(i));

let legend = d3.select('.legend');
legend.selectAll('li')
  .data(data)
  .join('li')
  .attr('class', 'legend-item')
  .attr('style', (_, i) => `--color:${colors(i)}`)
  .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);

  function renderPieChart(projectsGiven) {

    const svg = d3.select('#projects-plot');
    svg.selectAll('path').remove();
  
    const legend = d3.select('.legend');
    legend.selectAll('li').remove();
  

    let rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
  
    let data = rolledData.map(([year, count]) => {
      return { value: count, label: year };
    });
  
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map(d => arcGenerator(d));
  
    svg.selectAll('path')
      .data(arcs)
      .join('path')
      .attr('d', d => d)
      .attr('fill', (_, i) => colors(i));
  
    legend.selectAll('li')
      .data(data)
      .join('li')
      .attr('class', 'legend-item')
      .attr('style', (_, i) => `--color:${colors(i)}`)
      .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  }
  

  renderPieChart(projects);
  
  let query = '';
  let searchInput = document.querySelector('.searchBar');
  
  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    let filteredProjects = projects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });
  