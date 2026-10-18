const contentSections = document.querySelectorAll(".content-area > main, .content-area > section[id]");
const sectionLinks = document.querySelectorAll('a[href="#hem"], a[href="#tjanster"], a[href="#om-oss"], a[href="#kontakt"]');
const servicesNavLink = document.querySelector('.navbar-nav a[href="#tjanster"]');

sectionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetSection = document.getElementById(link.hash.slice(1));
        if (!targetSection) {
            return;
        }

        event.preventDefault();
        contentSections.forEach((section) => {
            section.hidden = section !== targetSection;
        });

        servicesNavLink.setAttribute("aria-expanded", String(targetSection.id === "tjanster"));
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

const currentTimeElement = document.getElementById("current-time");
const currentDateElement = document.getElementById("current-date");
const openStatusElement = document.getElementById("open-status");
const stockholmTimeZone = "Europe/Stockholm";
const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: stockholmTimeZone
});
const timePartsFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: stockholmTimeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
});
const weekdayNumbers = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

function updateCurrentTime() {
    const now = new Date();
    const parts = Object.fromEntries(
        timePartsFormatter.formatToParts(now).map(({ type, value }) => [type, value])
    );
    const hours = parts.hour.padStart(2, "0");
    const minutes = parts.minute.padStart(2, "0");
    const weekday = weekdayNumbers[parts.weekday];
    const currentMinutes = Number(hours) * 60 + Number(minutes);
    const isOpen =
        (weekday >= 1 && weekday <= 5 && currentMinutes >= 7 * 60 && currentMinutes < 18 * 60) ||
        (weekday === 6 && currentMinutes >= 8 * 60 && currentMinutes < 14 * 60);

    currentTimeElement.textContent = `${hours}:${minutes}:${String(now.getSeconds()).padStart(2, "0")}`;
    currentDateElement.textContent = dateFormatter.format(now);
    openStatusElement.textContent = isOpen ? "Öppet just nu" : "Stängt just nu";
    openStatusElement.classList.toggle("is-open", isOpen);
    openStatusElement.classList.toggle("is-closed", !isOpen);
}

updateCurrentTime();
setInterval(updateCurrentTime, 1000);