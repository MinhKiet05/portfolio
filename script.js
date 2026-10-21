(() => {
    "use strict";

    const $ = (selector, ctx = document) => ctx.querySelector(selector);
    const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    /* ---------- Hiệu ứng gõ chữ (Typewriter) ---------- */
    function initTypewriter() {
        const textEl = $(".typed-text");
        const cursor = $(".cursor");
        if (!textEl || !cursor) return;

        const roles = [
            "Software Engineering Student",
            "Frontend Developer",
            "Team Leader",
            "AI-assisted Development"
        ];

        if (reducedMotion) {
            textEl.textContent = roles[0];
            return;
        }

        const TYPING_DELAY = 90;
        const ERASING_DELAY = 40;
        const HOLD_DELAY = 1800;
        const NEXT_WORD_DELAY = 450;

        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const tick = () => {
            const word = roles[roleIndex];
            charIndex += isDeleting ? -1 : 1;
            textEl.textContent = word.slice(0, charIndex);

            let delay = isDeleting ? ERASING_DELAY : TYPING_DELAY;
            cursor.classList.add("typing");

            if (!isDeleting && charIndex === word.length) {
                isDeleting = true;
                delay = HOLD_DELAY;
                cursor.classList.remove("typing");
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                delay = NEXT_WORD_DELAY;
                cursor.classList.remove("typing");
            }

            setTimeout(tick, delay);
        };

        setTimeout(tick, 700);
    }

    /* ---------- Menu mobile ---------- */
    function initMobileNav() {
        const toggle = $("#nav-toggle");
        const nav = $("#site-nav");
        if (!toggle || !nav) return;

        const setOpen = (open) => {
            nav.classList.toggle("open", open);
            toggle.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Đóng menu điều hướng" : "Mở menu điều hướng");
        };

        toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));

        $$("a", nav).forEach((link) => link.addEventListener("click", () => setOpen(false)));

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains("open")) {
                setOpen(false);
                toggle.focus();
            }
        });

        document.addEventListener("click", (e) => {
            if (nav.classList.contains("open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
                setOpen(false);
            }
        });

        window.matchMedia("(min-width: 769px)").addEventListener("change", (e) => {
            if (e.matches) setOpen(false);
        });
    }

    /* ---------- Cuộn trang: progress bar, đổ bóng header, nút lên đầu, mục menu đang xem ---------- */
    function initScrollUI() {
        const header = $("#site-header");
        const bar = $("#scroll-progress");
        const toTop = $("#back-to-top");

        const navLinks = $$("#site-nav a[href^='#']");
        const linkById = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
        const sections = Array.from(linkById.keys())
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        const setActive = (id) => {
            navLinks.forEach((link) => {
                const active = link === linkById.get(id);
                link.classList.toggle("is-active", active);
                if (active) link.setAttribute("aria-current", "true");
                else link.removeAttribute("aria-current");
            });
        };

        // Mục menu = section đang nằm ở khoảng giữa màn hình
        if ("IntersectionObserver" in window && sections.length) {
            const spy = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) setActive(entry.target.id);
                    });
                },
                { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
            );
            sections.forEach((section) => spy.observe(section));
        }

        let ticking = false;

        const update = () => {
            ticking = false;
            const y = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

            if (bar) bar.style.transform = `scaleX(${maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0})`;
            if (header) header.classList.toggle("scrolled", y > 12);
            if (toTop) toTop.classList.toggle("visible", y > 600);

            // Chạm đáy trang thì luôn sáng mục cuối (Liên hệ), kể cả khi section quá ngắn
            if (maxScroll > 0 && y >= maxScroll - 4 && sections.length) {
                setActive(sections[sections.length - 1].id);
            }
        };

        window.addEventListener(
            "scroll",
            () => {
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(update);
                }
            },
            { passive: true }
        );
        window.addEventListener("resize", update);
        update();

        if (toTop) {
            toTop.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
            });
        }
    }

    /* ---------- Hiệu ứng xuất hiện khi cuộn (scroll reveal) ---------- */
    function initReveal() {
        const items = $$(".reveal");
        if (!items.length) return;

        // Các thẻ con trong [data-stagger] xuất hiện lần lượt
        $$("[data-stagger]").forEach((group) => {
            $$(".reveal", group).forEach((el, i) => el.style.setProperty("--d", `${i * 90}ms`));
        });

        const show = (el) => {
            el.classList.add("in-view");
            if (reducedMotion) return;

            // Sau khi animation xong, gỡ .reveal để hover (transform/transition riêng của thẻ) hoạt động bình thường
            const onEnd = (e) => {
                if (e.target !== el || e.propertyName !== "transform") return;
                el.removeEventListener("transitionend", onEnd);
                el.classList.remove("reveal");
                el.style.removeProperty("--d");
            };
            el.addEventListener("transitionend", onEnd);
        };

        if (!("IntersectionObserver" in window) || reducedMotion) {
            items.forEach((el) => el.classList.add("in-view"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    show(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
        );

        items.forEach((el) => observer.observe(el));
    }

    /* ---------- Đếm số (stats ở phần giới thiệu) ---------- */
    function initCounters() {
        const counters = $$("[data-count]");
        if (!counters.length || reducedMotion || !("IntersectionObserver" in window)) return;

        const format = (el, value) => value.toFixed(Number(el.dataset.decimals || 0));

        const run = (el) => {
            const target = parseFloat(el.dataset.count);
            const duration = 1400;
            const start = performance.now();

            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = format(el, target * eased);
                if (progress < 1) requestAnimationFrame(step);
            };

            requestAnimationFrame(step);
        };

        counters.forEach((el) => (el.textContent = format(el, 0)));

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    run(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.6 }
        );

        counters.forEach((el) => observer.observe(el));
    }

    /* ---------- Spotlight bám theo con trỏ + parallax nền ---------- */
    function initPointerEffects() {
        if (!canHover) return;

        $$(".spot").forEach((el) => {
            el.addEventListener("pointermove", (e) => {
                const rect = el.getBoundingClientRect();
                el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
                el.style.setProperty("--my", `${e.clientY - rect.top}px`);
            });
        });

        const bg = $("#bg-fx");
        if (!bg || reducedMotion) return;

        let frame = null;
        let nextX = 0;
        let nextY = 0;

        window.addEventListener(
            "pointermove",
            (e) => {
                nextX = e.clientX / window.innerWidth - 0.5;
                nextY = e.clientY / window.innerHeight - 0.5;
                if (frame) return;
                frame = requestAnimationFrame(() => {
                    bg.style.setProperty("--px", nextX.toFixed(3));
                    bg.style.setProperty("--py", nextY.toFixed(3));
                    frame = null;
                });
            },
            { passive: true }
        );
    }

    /* ---------- Sao chép email / số điện thoại ---------- */
    function initCopy() {
        const buttons = $$("[data-copy]");
        const toast = $("#toast");
        if (!buttons.length) return;

        let toastTimer;
        const showToast = (message) => {
            if (!toast) return;
            toast.textContent = message;
            toast.classList.add("show");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
        };

        const copyText = async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                // Dự phòng cho trình duyệt cũ / mở file trực tiếp (file://)
                const area = document.createElement("textarea");
                area.value = text;
                area.setAttribute("readonly", "");
                area.style.position = "fixed";
                area.style.opacity = "0";
                document.body.appendChild(area);
                area.select();
                let ok = false;
                try {
                    ok = document.execCommand("copy");
                } catch (e) {
                    ok = false;
                }
                area.remove();
                return ok;
            }
        };

        buttons.forEach((btn) => {
            btn.addEventListener("click", async () => {
                const ok = await copyText(btn.dataset.copy);
                if (ok) {
                    btn.classList.add("copied");
                    setTimeout(() => btn.classList.remove("copied"), 1600);
                }
                showToast(ok ? btn.dataset.msg || "Đã sao chép" : "Không thể sao chép, hãy thử chọn và copy thủ công");
            });
        });
    }

    /* ---------- Năm ở footer ---------- */
    function initYear() {
        const year = $("#year");
        if (year) year.textContent = new Date().getFullYear();
    }

    document.addEventListener("DOMContentLoaded", () => {
        initTypewriter();
        initMobileNav();
        initScrollUI();
        initReveal();
        initCounters();
        initPointerEffects();
        initCopy();
        initYear();
    });
})();