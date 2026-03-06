// Shared script for responsive navigation and contact form validation.
document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const savedTheme = localStorage.getItem("theme");

    // Floating theme toggle (shown on all pages).
    const themeToggle = document.createElement("button");
    themeToggle.type = "button";
    themeToggle.className = "theme-toggle";
    themeToggle.setAttribute("aria-live", "polite");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    const setToggleIcon = () => {
        const isDarkMode = document.body.classList.contains("dark-mode");
        themeToggle.textContent = isDarkMode ? "☀" : "🌙";
        themeToggle.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
        themeToggle.setAttribute("title", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
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
            const expanded = navLinks.classList.contains("open");
            menuButton.setAttribute("aria-expanded", String(expanded));
        });
    }


    const homeCommunityQuestion = document.getElementById("homeCommunityQuestion");
    if (homeCommunityQuestion) {
        const redirectToCommunity = () => {
            const queryText = homeCommunityQuestion.value.trim();
            const params = new URLSearchParams({ focus: "ask" });
            if (queryText) {
                params.set("q", queryText);
            }
            window.location.href = `community.html?${params.toString()}`;
        };

        homeCommunityQuestion.addEventListener("focus", redirectToCommunity);
        homeCommunityQuestion.addEventListener("click", redirectToCommunity);
        homeCommunityQuestion.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                redirectToCommunity();
            }
        });
    }

    const contactForm = document.getElementById("contactForm");
    if (!contactForm) {
        return;
    }

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
});
