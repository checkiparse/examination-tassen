/* datum och tid */

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

/*bokningsförfrågningar*/

const bookingStorageKey = "tassen-booking-requests";
const bookingForm = document.getElementById("booking-form");
const bookingList = document.getElementById("booking-list");
const bookingMessage = document.getElementById("booking-message");
let bookingRequests = [];

function showBookingMessage(message, type) {
    bookingMessage.textContent = message;
    bookingMessage.className = type ? `is-${type}` : "";
}

function saveBookingRequests() {
    try {
        localStorage.setItem(bookingStorageKey, JSON.stringify(bookingRequests));
        return true;
    } catch (error) {
        showBookingMessage("Kunde inte spara förfrågningen i webbläsaren. Kontrollera lagringsutrymmet och försök igen.", "error");
        return false;
    }
}

function renderBookingRequests() {
    bookingList.replaceChildren();

    if (bookingRequests.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "Du har inga bokningsförfrågningar ännu.";
        bookingList.append(emptyItem);
        return;
    }

    bookingRequests.forEach((request) => {
        const item = document.createElement("li");
        const details = document.createElement("p");
        const cancelButton = document.createElement("button");
        const date = new Date(`${request.date}T00:00:00`);

        item.className = "booking-request";
        const service = request.service || "Tjänst ej angiven";
        details.textContent = `${service} – ${request.dogName} – ${new Intl.DateTimeFormat("sv-SE", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date)}`;
        cancelButton.type = "button";
        cancelButton.textContent = "Avboka";
        cancelButton.addEventListener("click", () => {
            bookingRequests = bookingRequests.filter((entry) => entry.id !== request.id);
            if (saveBookingRequests()) {
                showBookingMessage("Förfrågan avbokad.", "error");
            }
            renderBookingRequests();
        });

        item.append(details, cancelButton);
        bookingList.append(item);
    });
}

try {
    const savedRequests = localStorage.getItem(bookingStorageKey);
    if (savedRequests) {
        const parsedRequests = JSON.parse(savedRequests);
        if (!Array.isArray(parsedRequests) || parsedRequests.some((request) =>
            !request ||
            typeof request.id !== "string" ||
            typeof request.dogName !== "string" ||
            typeof request.date !== "string" ||
            (request.service !== undefined && typeof request.service !== "string")
        )) {
            throw new Error("Invalid saved booking data.");
        }
        bookingRequests = parsedRequests;
    }
} catch (error) {
    showBookingMessage("error");
}

renderBookingRequests();

bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const dogName = bookingForm.elements.dogName.value.trim();
    const date = bookingForm.elements.date.value;
    const service = bookingForm.elements.service.value;
    if (!dogName || !date || !service) {
        showBookingMessage("Fyll i hundens namn, önskat datum och välj en tjänst.", "error");
        return;
    }

    bookingRequests.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        dogName,
        date,
        service
    });

    if (saveBookingRequests()) {
        showBookingMessage("Din förfrågan har sparats i den här webbläsaren.", "success");
    }
    renderBookingRequests();
    bookingForm.reset();
});