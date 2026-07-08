const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const sections = document.querySelectorAll("main section[id]");
const jobHub = document.querySelector("#job-hub");
const revealItems = document.querySelectorAll(".reveal");
const emailCopyButton = document.querySelector(".email-copy");

const siteHeader = document.querySelector(".site-header");

const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

// Adds a subtle solid state to the floating header once the page is scrolled.
if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 24);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

if (revealItems.length > 0) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }
}

// Opens and closes the mobile navigation menu.
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = targetId && targetId.startsWith("#") ? document.querySelector(targetId) : null;

    if (navMenu && navToggle) {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }

    if (!target) return;

    event.preventDefault();

    const headerOffset = document.querySelector(".site-header").getBoundingClientRect().height + 32;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.history.pushState(null, "", targetId);
    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  });
});

// Highlights the current navigation item while scrolling.
if (sections.length > 0 && navLinks.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

if (emailCopyButton) {
  const status = emailCopyButton.parentElement.querySelector(".copy-status");
  let resetTimer;

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  };

  emailCopyButton.addEventListener("click", async () => {
    const email = emailCopyButton.dataset.email;

    try {
      await copyText(email);
      status.textContent = "Copied to clipboard";
      emailCopyButton.classList.add("copied");
    } catch {
      status.textContent = "Copy failed";
    }

    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      status.textContent = "";
      emailCopyButton.classList.remove("copied");
    }, 2200);
  });
}

if (jobHub) {
  const roleInput = document.querySelector("#job-role");
  const locationInput = document.querySelector("#job-location");
  const remoteInput = document.querySelector("#job-remote");
  const linkList = document.querySelector("#job-source-links");
  const applicationForm = document.querySelector("#application-form");
  const applicationList = document.querySelector("#application-list");
  const sourceButtons = document.querySelectorAll("[data-source]");
  const clearApplicationsButton = document.querySelector("#clear-applications");
  const storageKey = "matt-yu-job-search-applications";

  const sources = [
    {
      key: "linkedin",
      name: "LinkedIn Jobs",
      detail: "Broad market search",
      buildUrl: ({ role, location, remote }) => {
        const params = new URLSearchParams({
          keywords: role,
          location,
        });
        if (remote) params.set("f_WT", "2");
        return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
      },
    },
    {
      key: "indeed",
      name: "Indeed",
      detail: "High-volume UK listings",
      buildUrl: ({ role, location, remote }) => {
        const query = remote ? `${role} remote` : role;
        return `https://uk.indeed.com/jobs?${new URLSearchParams({ q: query, l: location }).toString()}`;
      },
    },
    {
      key: "otta",
      name: "Welcome to the Jungle",
      detail: "Startup and tech roles",
      buildUrl: ({ role, location }) => `https://app.welcometothejungle.com/jobs?${new URLSearchParams({ query: role, location }).toString()}`,
    },
    {
      key: "wellfound",
      name: "Wellfound",
      detail: "Startup jobs",
      buildUrl: ({ role, location }) => `https://wellfound.com/jobs?${new URLSearchParams({ query: role, location }).toString()}`,
    },
    {
      key: "google",
      name: "Google Jobs Search",
      detail: "Fast cross-site scan",
      buildUrl: ({ role, location, remote }) => {
        const query = `${role} ${remote ? "remote " : ""}${location} jobs`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
    {
      key: "greenhouse",
      name: "Greenhouse Boards",
      detail: "Direct ATS postings",
      buildUrl: ({ role, location }) => {
        const query = `site:boards.greenhouse.io ${role} ${location}`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
    {
      key: "lever",
      name: "Lever Boards",
      detail: "Direct ATS postings",
      buildUrl: ({ role, location }) => {
        const query = `site:jobs.lever.co ${role} ${location}`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
    {
      key: "ashby",
      name: "Ashby Boards",
      detail: "Direct ATS postings",
      buildUrl: ({ role, location }) => {
        const query = `site:jobs.ashbyhq.com ${role} ${location}`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
  ];

  const getSearch = () => ({
    role: roleInput.value.trim() || "junior data analyst",
    location: locationInput.value.trim() || "London",
    remote: remoteInput.checked,
  });

  const renderLinks = () => {
    const search = getSearch();
    linkList.innerHTML = sources
      .map((source) => {
        const url = source.buildUrl(search);
        return `
          <li>
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              <span>
                <strong>${source.name}</strong>
                <small>${source.detail}</small>
              </span>
              <span aria-hidden="true">Open</span>
            </a>
          </li>
        `;
      })
      .join("");
  };

  const loadApplications = () => JSON.parse(localStorage.getItem(storageKey) || "[]");

  const saveApplications = (applications) => {
    localStorage.setItem(storageKey, JSON.stringify(applications));
  };

  const renderApplications = () => {
    const applications = loadApplications();

    if (applications.length === 0) {
      applicationList.innerHTML = '<li class="empty-state">No saved applications yet.</li>';
      return;
    }

    applicationList.innerHTML = applications
      .map(
        (application) => `
          <li>
            <span>
              <strong>${application.company}</strong>
              <small>${application.role} - ${application.status}</small>
            </span>
            ${application.link ? `<a href="${application.link}" target="_blank" rel="noopener noreferrer">View</a>` : ""}
          </li>
        `
      )
      .join("");
  };

  [roleInput, locationInput, remoteInput].forEach((input) => {
    input.addEventListener("input", renderLinks);
    input.addEventListener("change", renderLinks);
  });

  sourceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const source = sources.find((item) => item.key === button.dataset.source);
      if (source) window.open(source.buildUrl(getSearch()), "_blank", "noopener,noreferrer");
    });
  });

  applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(applicationForm);
    const application = {
      company: String(formData.get("company") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      status: formData.get("status"),
      link: String(formData.get("link") || "").trim(),
    };

    const applications = [application, ...loadApplications()].slice(0, 12);
    saveApplications(applications);
    applicationForm.reset();
    renderApplications();
  });

  clearApplicationsButton.addEventListener("click", () => {
    saveApplications([]);
    renderApplications();
  });

  renderLinks();
  renderApplications();
}
