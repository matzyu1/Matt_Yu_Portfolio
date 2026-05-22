const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const sections = document.querySelectorAll("main section[id]");
const emailCopyButton = document.querySelector(".email-copy");

document.querySelector("#year").textContent = new Date().getFullYear();

// Opens and closes the mobile navigation menu.
navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// Highlights the current navigation item while scrolling.
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

// Copies Matt's email, confirms it briefly, then restores the email display.
const copyEmailToClipboard = async (email) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(email);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = email;
  textArea.style.position = "fixed";
  textArea.style.left = "-999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
};

if (emailCopyButton) {
  emailCopyButton.addEventListener("click", async () => {
    const email = emailCopyButton.dataset.email;

    try {
      await copyEmailToClipboard(email);
      emailCopyButton.textContent = "Copied to clipboard";
    } catch {
      emailCopyButton.textContent = "Copy failed";
    }

    setTimeout(() => {
      emailCopyButton.textContent = email;
    }, 1800);
  });
}
