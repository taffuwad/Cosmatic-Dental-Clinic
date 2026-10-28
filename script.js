(function () {
  "use strict";

  /* ---------- Lucide ---------- */
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  /* ---------- Lenis ---------- */
  let lenis = null;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ---------- Anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- GSAP ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Hero entrance ---------- */
  if (window.gsap && !prefersReduced) {
    const heroLines = document.querySelectorAll("[data-hero-line]");
    gsap.set(heroLines, { yPercent: 115 });
    gsap.to(heroLines, {
      yPercent: 0,
      duration: 1.3,
      stagger: 0.12,
      ease: "power4.out",
      delay: 0.2,
    });
  }

  /* ---------- Heading reveals ---------- */
  function revealHeadingLines(selector) {
    if (!window.gsap || !window.ScrollTrigger) return;
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    if (prefersReduced) {
      els.forEach((el) => {
        el.style.transform = "none";
      });
      return;
    }

    gsap.set(els, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: els[0].closest("section"),
      start: "top 78%",
      once: true,
      onEnter: () => {
        gsap.to(els, {
          yPercent: 0,
          duration: 1.2,
          stagger: 0.09,
          ease: "power4.out",
        });
      },
    });
  }

  revealHeadingLines("[data-intro-line]");
  revealHeadingLines("[data-dir-line]");

  /* ---------- Process lines, floating imgs, team cards ---------- */
  if (window.gsap && window.ScrollTrigger && !prefersReduced) {
    document.querySelectorAll(".process-line").forEach((el) => {
      const baseOpacity = parseFloat(el.style.opacity || "1");
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: baseOpacity,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    });

    document.querySelectorAll(".float-img").forEach((img, i) => {
      gsap.fromTo(
        img,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 0.85,
          duration: 1.2,
          delay: i * 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: img,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        },
      );
    });

    document.querySelectorAll(".team-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: i * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    });
  }

  /* ============================================================
     TREATMENT HOVER IMAGES — floating preview
     ============================================================ */
  (function () {
    const wrap = document.getElementById("hoverImg");
    const imgEl = document.getElementById("hoverImgEl");
    const list = document.getElementById("treatmentList");
    const rows = list ? list.querySelectorAll(".treatment-row") : [];
    if (!wrap || !imgEl || !list || !rows.length) return;

    const W = 300,
      H = 380,
      PAD = 16;
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 0.16;

    let enabled = canHover && window.innerWidth >= 1024;
    let visible = false;
    let tx = 0,
      ty = 0; // target coords
    let cx = 0,
      cy = 0; // current coords
    let rafId = null;

    /* Preload all treatment images so the first hover is instant */
    rows.forEach((row) => {
      const src = row.dataset.img;
      if (src) {
        const i = new Image();
        i.src = src;
      }
    });

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    function render() {
      cx += (tx - cx) * smooth;
      cy += (ty - cy) * smooth;

      const x = clamp(cx + 28, PAD, window.innerWidth - W - PAD);
      const y = clamp(cy - H / 2, PAD, window.innerHeight - H - PAD);

      wrap.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      rafId = visible ? requestAnimationFrame(render) : null;
    }

    function start() {
      if (rafId === null) rafId = requestAnimationFrame(render);
    }

    function show(row, e) {
      const src = row.dataset.img;
      if (!src) return;

      if (imgEl.getAttribute("src") !== src) imgEl.src = src;

      if (!visible) {
        // First appearance: jump straight to the cursor (no fly-in from 0,0)
        let px = tx,
          py = ty;
        if (e && typeof e.clientX === "number") {
          px = e.clientX;
          py = e.clientY;
        } else {
          const r = row.getBoundingClientRect();
          px = r.left + r.width / 2;
          py = r.top + r.height / 2;
        }
        cx = tx = px;
        cy = ty = py;
        visible = true;
        wrap.classList.add("is-visible");
      }
      start();
    }

    function hide() {
      visible = false;
      wrap.classList.remove("is-visible");
    }

    if (!enabled) return;

    /* Follow the cursor */
    window.addEventListener(
      "mousemove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        if (visible) start();
      },
      { passive: true },
    );

    rows.forEach((row) => {
      row.addEventListener("mouseenter", (e) => show(row, e));
      row.addEventListener("focus", () => show(row, null));
      row.addEventListener("blur", hide);
      // Stub links: avoid the "#" jump
      row.addEventListener("click", (e) => {
        if (row.getAttribute("href") === "#") e.preventDefault();
      });
    });

    /* Hide only when leaving the whole list → no flicker between rows */
    list.addEventListener("mouseleave", hide);

    /* Keep it working after resize */
    window.addEventListener("resize", () => {
      enabled = canHover && window.innerWidth >= 1024;
      if (!enabled) hide();
    });
  })();

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll("#faqList .faq-item").forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const panel = item.querySelector(".faq-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      document.querySelectorAll("#faqList .faq-item").forEach((other) => {
        other.classList.remove("is-open");
        const t = other.querySelector(".faq-trigger");
        const p = other.querySelector(".faq-panel");
        if (t) t.setAttribute("aria-expanded", "false");
        if (p) p.style.maxHeight = "0px";
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  /* ---------- Hamburger menu ---------- */
  const burger = document.getElementById("burger");
  const menuOverlay = document.getElementById("menuOverlay");
  const closeMenuBtn = document.getElementById("closeMenu");
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    menuOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }

  function closeMenu() {
    menuOpen = false;
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    menuOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }

  burger &&
    burger.addEventListener("click", () => {
      menuOpen ? closeMenu() : openMenu();
    });
  closeMenuBtn && closeMenuBtn.addEventListener("click", closeMenu);

  menuOverlay &&
    menuOverlay.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) closeMenu();
  });

  /* ---------- Contact form (stub) ---------- */
  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector(".submit-btn");
      if (submitBtn) {
        submitBtn.textContent = "Invio in corso…";
        submitBtn.disabled = true;
      }
      setTimeout(() => {
        if (submitBtn) submitBtn.innerHTML = "Inviato ✓";
        if (formStatus) formStatus.classList.remove("hidden");
        form.reset();
      }, 800);
    });
  }

  /* ---------- Refresh ---------- */
  window.addEventListener("load", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
