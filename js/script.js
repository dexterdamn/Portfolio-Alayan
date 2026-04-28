const siteHeader = document.querySelector(".site-header");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".site-nav");
const navOverlay = document.querySelector(".nav-overlay");
const themeToggles = Array.from(document.querySelectorAll(".theme-toggle"));
const themeStorageKey = "themePreference";
const sunIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></g></svg>';
const moonIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" fill="currentColor"/></svg>';

const applyTheme = theme => {
  document.documentElement.dataset.theme = theme;
  themeToggles.forEach(btn => {
    btn.classList.toggle("dark", theme === "dark");
    btn.classList.toggle("light", theme === "light");
    btn.innerHTML = theme === "dark" ? moonIconSvg : sunIconSvg;
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  });
  localStorage.setItem(themeStorageKey, theme);
};

const initTheme = () => {
  const storedTheme = localStorage.getItem(themeStorageKey);
  const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(storedTheme || defaultTheme);
};

const toggleTheme = () => {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
};

themeToggles.forEach(btn => btn.addEventListener("click", toggleTheme));
initTheme();

window.addEventListener("scroll", () => {
  siteHeader?.classList.toggle("scrolled", window.scrollY > 12);
});

const closeMobileNav = () => {
  hamburger?.classList.remove("open");
  navMenu?.classList.remove("open");
  navOverlay?.classList.remove("open");
  document.body.classList.remove("nav-open");
  hamburger?.setAttribute("aria-expanded", "false");
};

hamburger?.addEventListener("click", () => {
  const isOpen = hamburger.classList.toggle("open");
  navMenu?.classList.toggle("open", isOpen);
  navOverlay?.classList.toggle("open", isOpen);
  document.body.classList.toggle("nav-open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
});

navOverlay?.addEventListener("click", closeMobileNav);

window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMobileNav();
});

window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 769px)").matches) closeMobileNav();
});

const pageLinksByTarget = {
  home: ["index.html", "#home"],
  about: ["about.html", "#about"],
  projects: ["projects.html", "#projects"],
  contact: ["contact.html", "#contact"]
};

const setActiveLink = target => {
  document.querySelectorAll(".site-nav a").forEach(link => {
    const href = link.getAttribute("href");
    const isActive = pageLinksByTarget[target]?.includes(href);
    link.classList.toggle("active", Boolean(isActive));
  });
};

document.querySelectorAll(".site-nav a").forEach(link => {
  link.addEventListener("click", () => {
    closeMobileNav();

    const href = link.getAttribute("href");
    if (href?.startsWith("#")) {
      setActiveLink(href.slice(1));
    }
  });
});

const currentPage = document.documentElement.dataset.page;
setActiveLink(currentPage === "home" ? "home" : currentPage);

document.querySelectorAll(".footer-back-top").forEach(btn => {
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

window.addEventListener("hashchange", () => {
  if (window.location.hash) {
    setActiveLink(window.location.hash.slice(1));
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

    const getSectionId = section => section.dataset.navTarget || section.id;

    const updateActiveSection = () => {
      const offset = window.innerHeight * 0.35;
      let activeSection = homeSections[0];

      homeSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom > offset) {
          activeSection = section;
        }
      });

      setActiveLink(getSectionId(activeSection));
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    updateActiveSection();

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

/* Same-origin page navigations: cross-fade + 3D-style View Transition when supported */
(function initViewTransitions() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof document.startViewTransition !== "function") return;

  document.addEventListener("click", e => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;

    const a = e.target.closest("a");
    if (!a) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;

    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let url;
    try {
      url = new URL(a.href, window.location.href);
    } catch {
      return;
    }

    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;

    const samePathAndSearch =
      url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePathAndSearch && url.hash) return;

    e.preventDefault();
    document.startViewTransition(() => {
      window.location.assign(a.href);
    });
  });
})();

(function initTechStack3DTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".tag-3d").forEach(el => {
    const inner = el.querySelector(".tag-3d-inner");
    if (!inner) return;
    const setTilt = (clientX, clientY) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1) return;
      const x = (clientX - r.left) / r.width - 0.5;
      const y = (clientY - r.top) / r.height - 0.5;
      inner.style.setProperty("--rx", `${-y * 15}deg`);
      inner.style.setProperty("--ry", `${x * 16}deg`);
      inner.style.setProperty("--tz", "10px");
    };
    const reset = () => {
      inner.style.setProperty("--rx", "0deg");
      inner.style.setProperty("--ry", "0deg");
      inner.style.setProperty("--tz", "0px");
    };
    el.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      setTilt(e.clientX, e.clientY);
    });
    el.addEventListener("pointerleave", reset);
  });
})();
