console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

/*let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
);*/

// currentLink?.classList.add("current");

let pages = [
    { url: 'index.html', title: 'Home' },
    { url: 'resume.html', title: 'Home' },
    { url: 'projects/', title: 'projects' },
    { url: 'contact/', title: 'contact' }
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // next step: create link and add it to nav
    nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
  }

