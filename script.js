/* ======================================
   Weather App
   --------------------------------------
   Features:
   - Search weather by city
   - Live weather data
   - Hourly & daily forecast
   - Unit conversion
   - Loading & error states
   - Search suggestions
====================================== */

/* ======================================
   DOM Elements
====================================== */
const unitsBtn = document.querySelector(".units-btn");
const unitsMenu = document.querySelector(".units-menu");
const dayBtn = document.querySelector(".day-btn");
const dayMenu = document.querySelector(".day-menu");
const dayDropdown = document.querySelector(".day-dropdown");
const cityName = document.querySelector(".city-name");
const currentDate = document.querySelector(".current-date");
const feelsLike = document.querySelector(".feels-like");
const humidity = document.querySelector(".humidity");
const windSpeed = document.querySelector(".wind-speed");
const precipitation = document.querySelector(".precipitation");
const currentTemp = document.querySelector(".current-temp");
const weatherIcon = document.querySelector(".sun");
const hourlyList = document.querySelector(".hourly-list");
const dailyForecast = document.querySelector(".daily-forecast");
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".button-search");
const tempOptions = document.querySelectorAll(".temp-option");
const windOptions = document.querySelectorAll(".wind-option");
const rainOptions = document.querySelectorAll(".rain-option");
const suggestions = document.querySelector(".search-suggestions");
const loadingState = document.querySelector(".loading-state");
const errorState = document.querySelector(".error-state");
const retryBtn = document.querySelector(".retry-btn");
const headerBottom = document.querySelector(".header-bottom");
const mainContent = document.querySelector(".main-content");
const bgCloud = document.querySelector(".bg-cloud");

/* ======================================
   Application State
====================================== */
let lastCity = "";
let lastLat = null;
let lastLon = null;
let temperatureUnit = localStorage.getItem("temperatureUnit") || "celsius";
let windUnit = localStorage.getItem("windUnit") || "kmh";
let precipitationUnit = localStorage.getItem("precipitationUnit") || "mm";
let currentWeatherData = null;
let currentHourlyData = null;
let currentDailyData = null;
let selectedDayIndex = 0;
let currentTime = "";

/* ======================================
   API Requests
====================================== */

// Fetch weather data using latitude and longitude
async function getWeather(lat, lon) {
  try {
    showLoading();

    lastLat = lat;
    lastLon = lon;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("API Error");
    }

    const data = await response.json();
    currentWeatherData = data.current;

    renderCurrentWeather(data.current);
    const weatherCode = data.current.weather_code;

    weatherIcon.src = getWeatherIcon(weatherCode);
    currentHourlyData = data.hourly;
    currentTime = data.current.time;
    currentDailyData = data.daily;

    renderHourlyForecast(currentHourlyData, selectedDayIndex);
    renderDayMenu(data.daily);
    renderDailyForecast(data.daily);
    showContent();
  } catch (error) {
    showError();
  }
}
// Fetch city coordinates from the geocoding API
async function getCoordinates(city) {
  try {
    lastCity = city;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Geocoding API Error");
    }

    const data = await response.json();

    if (!data.results) {
      suggestions.innerHTML = `
    <div class="suggestion-item empty">
      No cities found
    </div>
  `;

      suggestions.classList.add("show");

      return;
    }

    const location = data.results[0];

    cityName.textContent = `${location.name}, ${location.country}`;

    currentDate.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    await getWeather(location.latitude, location.longitude);
  } catch (error) {
    showError();
  }
}
/* ======================================
   Helper Functions
====================================== */

async function searchCity() {
  const city = searchInput.value.trim();

  if (!city) {
    alert("Please enter a city name!");
    return;
  }

  searchBtn.textContent = "Loading...";
  searchBtn.disabled = true;

  await getCoordinates(city);

  searchBtn.textContent = "Search";
  searchBtn.disabled = false;
}
searchBtn.addEventListener("click", searchCity);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchCity();
  }
});

// Return the correct weather icon based on the weather code
function getWeatherIcon(code) {
  if (code === 0) {
    return "assets/images/icon-sunny.webp";
  }

  if ([1, 2, 3].includes(code)) {
    return "assets/images/icon-partly-cloudy.webp";
  }

  if ([45, 48].includes(code)) {
    return "assets/images/icon-fog.webp";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "assets/images/icon-drizzle.webp";
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return "assets/images/icon-rain.webp";
  }

  if ([71, 73, 75, 77].includes(code)) {
    return "assets/images/icon-snow.webp";
  }

  if ([95, 96, 99].includes(code)) {
    return "assets/images/icon-storm.webp";
  }

  return "assets/images/icon-sunny.webp";
}

const today = new Date();

const options = {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
};
// Load saved unit preferences and update the active menu items
function loadSavedUnits() {
  tempOptions.forEach((item) => {
    item.classList.toggle("active", item.dataset.unit === temperatureUnit);
  });

  windOptions.forEach((item) => {
    item.classList.toggle("active", item.dataset.unit === windUnit);
  });

  rainOptions.forEach((item) => {
    item.classList.toggle("active", item.dataset.unit === precipitationUnit);
  });
}
function updateBackgroundImage() {
  if (window.innerWidth <= 375) {
    bgCloud.src = "assets/images/bg-today-small.svg";
  } else {
    bgCloud.src = "assets/images/bg-today-large.svg";
  }
}
currentDate.textContent = today.toLocaleDateString("en-US", options);

/* ======================================
   Render Functions
====================================== */

// Render hourly forecast cards
function renderHourlyForecast(hourly, dayIndex) {
  hourlyList.innerHTML = "";

  let start;

  if (dayIndex === 0) {
    // امروز → از ساعت فعلی شهر انتخاب‌شده
    const currentHour = new Date(currentTime).getHours();
    start = currentHour;
  } else {
    // روزهای بعد → از ساعت 00:00
    start = dayIndex * 24;
  }

  const end = Math.min(start + 8, (dayIndex + 1) * 24);

  for (let i = start; i < end; i++) {
    const time = hourly.time[i];
    let temp = hourly.temperature_2m[i];

    if (temperatureUnit === "fahrenheit") {
      temp = (temp * 9) / 5 + 32;
    }

    temp = Math.round(temp);

    const code = hourly.weather_code[i];

    const hour = new Date(time).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });

    hourlyList.innerHTML += `
      <div class="hour-item">
        <img src="${getWeatherIcon(code)}" alt="weather icon">
        <span class="time">${hour}</span>
        <span class="temp">${temp}°</span>
      </div>
    `;
  }
}
function renderDayMenu(daily) {
  dayMenu.innerHTML = "";

  daily.time.forEach((date, index) => {
    const dayName = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    dayMenu.innerHTML += `
      <div class="day-item" data-index="${index}">
        ${dayName}
      </div>
    `;
    dayBtn.textContent = `${dayMenu.firstElementChild.textContent} ▼`;
  });
}
// Render daily forecast cards
function renderDailyForecast(daily) {
  dailyForecast.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const date = new Date(daily.time[i]);

    const dayName = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    let maxTemp = daily.temperature_2m_max[i];
    let minTemp = daily.temperature_2m_min[i];

    if (temperatureUnit === "fahrenheit") {
      maxTemp = (maxTemp * 9) / 5 + 32;
      minTemp = (minTemp * 9) / 5 + 32;
    }

    maxTemp = Math.round(maxTemp);
    minTemp = Math.round(minTemp);

    const code = daily.weather_code[i];

    dailyForecast.innerHTML += `
      <div class="day">
        <span>${dayName}</span>

        <img
          src="${getWeatherIcon(code)}"
          alt="${dayName} weather"
        />

        <span>${maxTemp}°/${minTemp}°</span>
      </div>
    `;
  }
}
// Update the current weather card
function renderCurrentWeather(data) {
  let temp = data.temperature_2m;
  let feels = data.apparent_temperature;
  let wind = data.wind_speed_10m;
  let rain = data.precipitation;

  if (temperatureUnit === "fahrenheit") {
    temp = (temp * 9) / 5 + 32;
    feels = (feels * 9) / 5 + 32;
  }

  if (windUnit === "mph") {
    wind *= 0.621371;
  }

  if (precipitationUnit === "in") {
    rain /= 25.4;
  }

  currentTemp.textContent = `${Math.round(temp)}°`;

  feelsLike.textContent = `${Math.round(feels)}°`;

  humidity.textContent = `${data.relative_humidity_2m}%`;

  windSpeed.textContent = `${Math.round(wind)} ${windUnit === "kmh" ? "km/h" : "mph"}`;

  precipitation.textContent = `${rain.toFixed(1)} ${precipitationUnit === "mm" ? "mm" : "in"}`;
}

// Render city search suggestions
function renderSuggestions(results) {
  suggestions.innerHTML = "";

  results.slice(0, 5).forEach((city) => {
    suggestions.innerHTML += `
      <div
        class="suggestion-item"
        data-lat="${city.latitude}"
        data-lon="${city.longitude}"
        data-name="${city.name}"
        data-country="${city.country}"
      >
        ${city.name}, ${city.country}
      </div>
    `;
  });

  suggestions.classList.add("show");
}

/* ======================================
   Event Listeners
====================================== */
tempOptions.forEach((item) => {
  item.addEventListener("click", () => {
    tempOptions.forEach((option) => {
      option.classList.remove("active");
    });

    item.classList.add("active");

    temperatureUnit = item.dataset.unit;
    localStorage.setItem("temperatureUnit", temperatureUnit);

    if (currentWeatherData) {
      renderCurrentWeather(currentWeatherData);

      if (currentHourlyData) {
        renderHourlyForecast(currentHourlyData, selectedDayIndex);
      }

      if (currentDailyData) {
        renderDailyForecast(currentDailyData);
      }
    }
  });
});
windOptions.forEach((item) => {
  item.addEventListener("click", () => {
    windOptions.forEach((option) => {
      option.classList.remove("active");
    });

    item.classList.add("active");

    windUnit = item.dataset.unit;
    localStorage.setItem("windUnit", windUnit);

    if (currentWeatherData) {
      renderCurrentWeather(currentWeatherData);
    }
  });
});
rainOptions.forEach((item) => {
  item.addEventListener("click", () => {
    rainOptions.forEach((option) => {
      option.classList.remove("active");
    });

    item.classList.add("active");

    precipitationUnit = item.dataset.unit;
    localStorage.setItem("precipitationUnit", precipitationUnit);

    if (currentWeatherData) {
      renderCurrentWeather(currentWeatherData);
    }
  });
});
dayMenu.addEventListener("click", (e) => {
  if (!e.target.classList.contains("day-item")) return;

  const index = Number(e.target.dataset.index);

  selectedDayIndex = index;

  dayBtn.textContent = `${e.target.textContent} ▼`;

  dayMenu.classList.remove("show");

  renderHourlyForecast(currentHourlyData, index);
});
searchInput.addEventListener("input", async () => {
  try {
    const city = searchInput.value.trim();

    if (city.length < 2) {
      suggestions.innerHTML = "";
      suggestions.classList.remove("show");
      return;
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=5`,
    );

    if (!response.ok) {
      throw new Error("Suggestions API Error");
    }

    const data = await response.json();

    if (data.results) {
      renderSuggestions(data.results);
    } else {
      suggestions.innerHTML = `
        <div class="suggestion-item empty">
          No cities found
        </div>
      `;

      suggestions.classList.add("show");
    }
  } catch (error) {
    suggestions.innerHTML = `
      <div class="suggestion-item empty">
        Failed to load suggestions
      </div>
    `;

    suggestions.classList.add("show");
  }
});
suggestions.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");

  if (!item) return;

  const lat = item.dataset.lat;
  const lon = item.dataset.lon;

  const name = item.dataset.name;
  const country = item.dataset.country;

  searchInput.value = `${name}, ${country}`;

  cityName.textContent = `${name}, ${country}`;

  currentDate.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  suggestions.classList.remove("show");

  showLoading();

  getWeather(lat, lon);
});

retryBtn.addEventListener("click", () => {
  showLoading();

  if (lastLat && lastLon) {
    getWeather(lastLat, lastLon);
  } else if (lastCity) {
    getCoordinates(lastCity);
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) {
    suggestions.classList.remove("show");
  }
});
unitsBtn.addEventListener("click", () => {
  unitsMenu.classList.toggle("show");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".units-dropdown")) {
    unitsMenu.classList.remove("show");
  }
});

dayBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dayMenu.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!dayDropdown.contains(e.target)) {
    dayMenu.classList.remove("show");
  }
});

/* ======================================
   UI State Management
====================================== */

// Display the loading state
function showLoading() {
  loadingState.classList.remove("hidden");
  errorState.classList.add("hidden");

  currentTemp.textContent = "--°";

  feelsLike.textContent = "--";
  humidity.textContent = "--";
  windSpeed.textContent = "--";
  precipitation.textContent = "--";

  // Forecasts
  dailyForecast.classList.add("loading");
  hourlyList.classList.add("loading");
}

// Display the error state
function showError() {
  headerBottom.classList.add("hidden");
  mainContent.classList.add("hidden");

  loadingState.classList.add("hidden");

  errorState.classList.remove("hidden");
}

// Restore the normal application state
function showContent() {
  headerBottom.classList.remove("hidden");
  mainContent.classList.remove("hidden");

  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");

  dailyForecast.classList.remove("loading");
  hourlyList.classList.remove("loading");
}

/* ======================================
   Application Initialization
====================================== */

window.addEventListener("DOMContentLoaded", () => {
  loadSavedUnits();
  updateBackgroundImage();
  getCoordinates("Tehran");
});

window.addEventListener("resize", updateBackgroundImage);

/* ======================================
   End of File
====================================== */
