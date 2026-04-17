document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const savedTheme = localStorage.getItem("theme");

    const normalizeNavbar = () => {
        const navList = document.querySelector(".navbar .nav-links");
        if (!navList) return;

        const path = window.location.pathname.replace(/\/$/, "") || "/";
        const inNestedDirectory = path.startsWith("/blogs/") || path.startsWith("/calculators/");
        const base = inNestedDirectory ? "../" : "";
        const links = [
            { label: "Home", href: `${base}` },
            { label: "Calculators", href: `${base}calculators` },
            { label: "Blogs", href: `${base}blogs` },
            { label: "Contact", href: `${base}contact` }
        ];

        const isActiveRoute = (href) => {
            const cleanHref = href.replace(/^\.\//, "").replace(/\/$/, "");
            if (!cleanHref) return path === "/";
            return path === `/${cleanHref}` || path.startsWith(`/${cleanHref}/`);
        };

        navList.innerHTML = links
            .map(({ label, href }) => `<li><a class="${isActiveRoute(href) ? "active" : ""}" href="${href}">${label}</a></li>`)
            .join("");
    };

    normalizeNavbar();

    const themeToggle = document.createElement("button");
    themeToggle.type = "button";
    themeToggle.className = "theme-toggle";
    themeToggle.setAttribute("aria-live", "polite");

    if (savedTheme === "dark") document.body.classList.add("dark-mode");

    const setToggleIcon = () => {
        const isDarkMode = document.body.classList.contains("dark-mode");
        themeToggle.textContent = isDarkMode ? "☀" : "🌙";
        themeToggle.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
    };

    setToggleIcon();
    themeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
        setToggleIcon();
    });
    document.body.appendChild(themeToggle);

    if (menuButton && navLinks) {
        menuButton.addEventListener("click", () => {
            navLinks.classList.toggle("open");
            menuButton.setAttribute("aria-expanded", String(navLinks.classList.contains("open")));
        });
    }

    const setupInsightsSlider = () => {
        const slider = document.getElementById("insightsSlider");
        if (!slider) return;

        const prevBtn = document.getElementById("insightsPrev");
        const nextBtn = document.getElementById("insightsNext");
        const scrollByAmount = () => Math.max(slider.clientWidth * 0.78, 260);

        const scrollSlider = (direction) => {
            slider.scrollBy({ left: direction * scrollByAmount(), behavior: "smooth" });
        };

        prevBtn?.addEventListener("click", () => scrollSlider(-1));
        nextBtn?.addEventListener("click", () => scrollSlider(1));

        let autoScroll = window.setInterval(() => scrollSlider(1), 5500);
        const stopAuto = () => {
            window.clearInterval(autoScroll);
            autoScroll = 0;
        };

        slider.addEventListener("pointerdown", stopAuto, { once: true });
    };

    const improveBlogSeoStructure = () => {
        if (!window.location.pathname.includes("/blogs/")) return;

        const article = document.querySelector(".article-content");
        if (!article) return;

        article.querySelectorAll("h2").forEach((heading) => {
            if (/^\d+\)/.test(heading.textContent.trim())) {
                const h3 = document.createElement("h3");
                h3.textContent = heading.textContent;
                heading.replaceWith(h3);
            }
        });

        if (!article.querySelector(".faq-item")) {
            const faqTitle = document.createElement("h2");
            faqTitle.textContent = "Frequently Asked Questions";
            article.appendChild(faqTitle);

            [
                ["How often should I review this financial plan?", "Quarterly reviews are ideal so you can increase SIPs, rebalance assets, and keep goals on track."],
                ["Can I start with small monthly amounts?", "Yes. Starting small and increasing contributions over time is more sustainable than waiting for a perfect amount."],
                ["Which calculator should I use first?", "Start with EMI and SIP calculators to understand debt impact and long-term investment growth before finalizing your budget."]
            ].forEach(([q, a]) => {
                const box = document.createElement("section");
                box.className = "faq-item";
                box.innerHTML = `<h3>${q}</h3><p>${a}</p>`;
                article.appendChild(box);
            });
        }

        if (!article.querySelector('a[href*="/calculators/sip"], a[href*="../calculators/sip"], a[href*="/calculators/emi"], a[href*="../calculators/emi"]')) {
            const linkPara = document.createElement("p");
            linkPara.innerHTML = 'Use our <a href="../calculators/sip">SIP Calculator</a> and <a href="../calculators/emi">EMI Calculator</a> to convert these ideas into a monthly action plan.';
            article.appendChild(linkPara);
        }
    };

    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        const formMessage = document.getElementById("formMessage");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !message) {
                formMessage.textContent = "Please fill in all fields before submitting.";
                formMessage.className = "form-message error-state";
                return;
            }
            if (!emailRegex.test(email)) {
                formMessage.textContent = "Please enter a valid email address.";
                formMessage.className = "form-message error-state";
                return;
            }

            formMessage.textContent = "Thanks for contacting Rupaya Saathi! We will reach out soon.";
            formMessage.className = "form-message success-state";
            contactForm.reset();
        });
    }

    setupInsightsSlider();
    improveBlogSeoStructure();
});
