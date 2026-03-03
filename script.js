// Shared script for responsive navigation and contact form validation.
document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    if (navLinks) {
        const toggleItem = document.createElement("li");
        toggleItem.className = "theme-toggle-item";

        const themeToggle = document.createElement("button");
        themeToggle.type = "button";
        themeToggle.className = "theme-toggle";

        const setToggleLabel = () => {
            const isDarkMode = document.body.classList.contains("dark-mode");
            themeToggle.textContent = isDarkMode ? "☀ Light Mode" : "🌙 Dark Mode";
            themeToggle.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
        };

        setToggleLabel();

        themeToggle.addEventListener("click", () => {
            const isDarkMode = document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", isDarkMode ? "dark" : "light");
            setToggleLabel();
        });

        toggleItem.appendChild(themeToggle);
        navLinks.appendChild(toggleItem);
    }

    if (menuButton && navLinks) {
        menuButton.addEventListener("click", () => {
            navLinks.classList.toggle("open");
            const expanded = navLinks.classList.contains("open");
            menuButton.setAttribute("aria-expanded", String(expanded));
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
