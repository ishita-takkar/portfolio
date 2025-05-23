console.log("IT’S ALIVE!");

export function renderProjects(projects, container, headingLevel = 'h2') {
  container.innerHTML = '';

  for (let project of projects) {
    const article = document.createElement('article');

    const heading = document.createElement(headingLevel);
    if (project.url) {
    const link = document.createElement('a');
    link.href = project.url;
    link.target = '_blank';
    link.textContent = project.title;
    heading.appendChild(link);
  } else {
    heading.textContent = project.title;
  }

    const img = document.createElement('img');
    img.src = project.image;
    img.alt = project.title;

    const description = document.createElement('p');
    description.textContent = project.description;

    const year = document.createElement('p');
    year.textContent = `Year: ${project.year}`;
    year.classList.add('project-year');

    const textContainer = document.createElement('div');
    textContainer.classList.add('project-text');
    textContainer.append(description, year);

    article.append(heading, img, textContainer);
    container.append(article);
  }

  if (projects.length === 0) {
    container.innerHTML = '<p>No projects found.</p>';
  }
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log(response);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/";

let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume.html', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'meta/', title: 'Meta' },
  { url: "https://github.com/ishita-takkar", title: "GitHub" }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  a.toggleAttribute("target", a.host !== location.host);
  a.toggleAttribute("rel", a.host !== location.host);
  nav.append(a);
}

const themeLabel = document.createElement('label');
themeLabel.className = 'color-scheme';
themeLabel.innerHTML = `
  Theme:
  <select id="theme-switch">
    <option value="light dark">Automatic</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
`;
document.body.insertBefore(themeLabel, nav);

const select = document.querySelector('#theme-switch');

function setColorScheme(scheme) {
  document.documentElement.classList.remove('light', 'dark', 'auto');

  if (scheme === 'light dark') {
    document.documentElement.classList.add('auto');
  } else {
    document.documentElement.classList.add(scheme);
  }

  document.documentElement.style.setProperty('color-scheme', scheme);
  if (select) select.value = scheme;
}

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme('light dark');
}

select?.addEventListener('input', function (event) {
  const scheme = event.target.value;
  localStorage.colorScheme = scheme;
  setColorScheme(scheme);
});

const form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
  event.preventDefault();
  const data = new FormData(form);
  const params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${params.join("&")}`;
  location.href = url;
});
