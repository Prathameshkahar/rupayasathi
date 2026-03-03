// Shared script for responsive navigation and contact form validation.
document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

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
