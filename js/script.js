const siteHeader = document.querySelector(".site-header");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".site-nav");

window.addEventListener("scroll", () => {
  siteHeader?.classList.toggle("scrolled", window.scrollY > 12);
});

hamburger?.addEventListener("click", () => {
  const isOpen = hamburger.classList.toggle("open");
  navMenu?.classList.toggle("open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".site-nav a").forEach(link => {
  link.addEventListener("click", () => {
    hamburger?.classList.remove("open");
    navMenu?.classList.remove("open");
    hamburger?.setAttribute("aria-expanded", "false");
  });
});

const currentPage = document.documentElement.dataset.page;
document.querySelectorAll(".site-nav a").forEach(link => {
  const href = link.getAttribute("href");
  if (
    (currentPage === "home" && href === "#home") ||
    (currentPage === "about" && href === "about.html") ||
    (currentPage === "projects" && href === "projects.html") ||
    (currentPage === "contact" && href === "contact.html")
  ) {
    link.classList.add("active");
  }
});

if (currentPage === "home") {
  const homeSections = Array.from(document.querySelectorAll("main section[id], main section[data-nav-target]"));
  const homeNavLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));

  if (homeSections.length && homeNavLinks.length) {
    const setActiveLink = id => {
      homeNavLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
    };

    const sectionObserver = new IntersectionObserver(entries => {
      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length) {
        const activeId = visibleEntries[0].target.dataset.navTarget || visibleEntries[0].target.id;
        setActiveLink(activeId);
      }
    }, {
      rootMargin: "-35% 0px -45% 0px",
      threshold: [0.2, 0.45, 0.7]
    });

    homeSections.forEach(section => sectionObserver.observe(section));

    if (window.location.hash) {
      setActiveLink(window.location.hash.slice(1));
    }
  }
}

const revealItems = document.querySelectorAll(".reveal");
if (revealItems.length) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");

        if (entry.target.classList.contains("skills-section")) {
          entry.target.querySelectorAll(".skill-fill").forEach(fill => {
            fill.classList.add("animate");
          });
        }
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach(item => revealObserver.observe(item));
}

const filterButtons = document.querySelectorAll(".filter-btn");
const projectItems = document.querySelectorAll(".project-item");

if (filterButtons.length && projectItems.length) {
  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      projectItems.forEach(item => {
        const matches = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("is-hidden", !matches);
      });
    });
  });
}

function showToast(icon, message, type = "success") {
  const existing = document.querySelector(".toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
  toast.textContent = `${icon} ${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

window.showToast = showToast;
