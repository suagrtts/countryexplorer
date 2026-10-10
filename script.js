// script.js - Country Explorer Front-End Logic

// State variables
let allCountries = [];
let filteredCountries = [];
let displayedCount = 12;
const ITEMS_PER_PAGE = 12;

// DOM Elements
const countryGrid = document.getElementById("country-grid");
const countrySearchInput = document.getElementById("country-search");
const regionFilterSelect = document.getElementById("region-filter");
const populationSearchInput = document.getElementById("population-search");
const showMoreBtn = document.getElementById("show-more-btn");
const nameError = document.getElementById("name-error");
const populationError = document.getElementById("population-error");
const statusMessage = document.getElementById("status-message");

/**
 * Fetches country data from the Node.js server via the /countries endpoint
 * @returns {Promise<Array>}
 */
function fetchData() {
  return fetch("/countries")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error! Status: " + response.status);
      }
      return response.json();
    })
    .catch(function (error) {
      console.error("Error fetching countries data");
      throw error; // Propagate the error further
    });
}

/**
 * Creates a comma-separated string of currencies
 * @param {Object} currencies 
 * @returns {string} Comma-separated currency names
 */
function getFormattedCurrencies(currencies) {
  if (!currencies) return "";
  const currencyCodes = Object.keys(currencies);
  let currencyNames = [];
  for (let i = 0; i < currencyCodes.length; i++) {
    const code = currencyCodes[i];
    if (currencies[code] && currencies[code].name) {
      currencyNames.push(currencies[code].name);
    }
  }
  return currencyNames.join(", ");
}

/**
 * Creates a comma-separated string of languages
 * @param {Object} languages 
 * @returns {string} Comma-separated language names
 */
function getFormattedLanguages(languages) {
  if (!languages) return "";
  const languageCodes = Object.keys(languages);
  let languageNames = [];
  for (let i = 0; i < languageCodes.length; i++) {
    const code = languageCodes[i];
    if (languages[code]) {
      languageNames.push(languages[code]);
    }
  }
  return languageNames.join(", ");
}

/**
 * Legacy getFormattedNames kept for backwards compatibility
 */
function getFormattedNames(items) {
  if (!items) return "";
  if (Array.isArray(items)) return items.join(", ");
  return Object.values(items).join(", ");
}

/**
 * Handler for clicking on a country card.
 * Generates the query string with formatted currencies and languages,
 * then navigates to the Details page.
 * @param {Object} country 
 */
function countryCardHandler(country) {
  const currencies = getFormattedCurrencies(country.currencies);
  const languages = getFormattedLanguages(country.languages);

  const commonName = (country.name && country.name.common) ? country.name.common : "";
  const officialName = (country.name && country.name.official) ? country.name.official : commonName;
  const flagUrl = country.flags ? (country.flags.png || country.flags.svg || "") : "";
  const population = country.population !== undefined ? country.population : "";
  let capital = "";
  if (country.capital) {
    capital = Array.isArray(country.capital) ? country.capital.join(", ") : country.capital;
  }
  const region = country.region || "";
  const subregion = country.subregion || "";
  let tld = "";
  if (country.tld) {
    tld = Array.isArray(country.tld) ? country.tld.join(", ") : country.tld;
  }
  let borders = "";
  if (country.borders) {
    borders = Array.isArray(country.borders) ? country.borders.join(",") : country.borders;
  }

  const queryParams = new URLSearchParams({
    country: commonName || officialName,
    official: officialName,
    flag: flagUrl,
    population: population,
    capital: capital,
    region: region,
    subregion: subregion,
    currencies: currencies,
    languages: languages,
    tld: tld,
    borders: borders
  });

  window.location.href = "detail.html?" + queryParams.toString();
}

/**
 * Populates country cards when data is loaded
 * @param {Array} data 
 */
function populateCountryCards(data) {
  allCountries = data || [];
  filteredCountries = allCountries;
  displayedCount = ITEMS_PER_PAGE;
  applyFilters();
}

/**
 * Validates the Country Name input
 */
function validateCountryName(name) {
  if (!nameError) return true;
  nameError.textContent = "";
  if (!name) return true;

  // Allow letters, spaces, hyphens, apostrophes, and standard accents
  const validNameRegex = /^[a-zA-Z\s\-\'\.\u00C0-\u024F]+$/;
  if (!validNameRegex.test(name)) {
    nameError.textContent = "Please enter valid country characters only.";
    return false;
  }
  return true;
}

/**
 * Validates the Population input
 */
function validatePopulation(popValue) {
  if (!populationError) return true;
  populationError.textContent = "";

  if (popValue === "" || isNaN(popValue)) {
    populationError.textContent = "Please enter a valid number.";
    return false;
  }

  const num = Number(popValue);
  if (num < 0) {
    populationError.textContent = "Population cannot be negative.";
    return false;
  }
  if (num > 1500000000) {
    populationError.textContent = "Max population is 1.5 billion (1500000000).";
    return false;
  }

  return true;
}

/**
 * Filter countries based on Search Name, Region, and Population
 */
function applyFilters() {
  const nameQuery = countrySearchInput ? countrySearchInput.value.trim().toLowerCase() : "";
  const selectedRegion = regionFilterSelect ? regionFilterSelect.value : "All Regions";
  const popQueryRaw = populationSearchInput ? populationSearchInput.value.trim() : "0";

  // Validate inputs
  const isNameValid = validateCountryName(nameQuery);
  const isPopValid = validatePopulation(popQueryRaw);

  if (!isNameValid || !isPopValid) {
    return;
  }

  const minPopulation = Number(popQueryRaw || 0);

  filteredCountries = allCountries.filter(function (country) {
    // 1. Name match: common name or official name
    const commonName = (country.name && country.name.common) ? country.name.common.toLowerCase() : "";
    const officialName = (country.name && country.name.official) ? country.name.official.toLowerCase() : "";
    const matchesName = !nameQuery || commonName.includes(nameQuery) || officialName.includes(nameQuery);

    // 2. Region match
    const region = country.region || "";
    const matchesRegion = (selectedRegion === "All Regions") || (region.toLowerCase() === selectedRegion.toLowerCase());

    // 3. Population match: countries with population >= minPopulation
    const population = typeof country.population === "number" ? country.population : 0;
    const matchesPopulation = population >= minPopulation;

    return matchesName && matchesRegion && matchesPopulation;
  });

  // Reset pagination count on filter change
  displayedCount = ITEMS_PER_PAGE;
  renderCountries();
}

/**
 * Render the filtered country cards to the grid
 */
function renderCountries() {
  if (!countryGrid) return;
  countryGrid.innerHTML = "";

  if (filteredCountries.length === 0) {
    countryGrid.innerHTML = `<div class="no-results">No countries found matching your criteria.</div>`;
    if (showMoreBtn) showMoreBtn.style.display = "none";
    return;
  }

  const visibleList = filteredCountries.slice(0, displayedCount);

  visibleList.forEach(function (country) {
    const card = createCountryCard(country);
    countryGrid.appendChild(card);
  });

  // Manage Show More button visibility and state
  if (showMoreBtn) {
    if (displayedCount >= filteredCountries.length) {
      showMoreBtn.style.display = "none";
    } else {
      showMoreBtn.style.display = "inline-block";
      showMoreBtn.disabled = false;
    }
  }
}

/**
 * Creates a single country card DOM element
 */
function createCountryCard(country) {
  const card = document.createElement("article");
  card.className = "country-card";

  // Official / Common Name
  const officialName = (country.name && country.name.official) ? country.name.official : (country.name && country.name.common ? country.name.common : "Unknown Country");
  const commonName = (country.name && country.name.common) ? country.name.common : officialName;

  // Flag image
  let flagSrc = "";
  if (country.flags) {
    flagSrc = country.flags.png || country.flags.svg || "";
  }
  if (!flagSrc) {
    flagSrc = "assets/world.png";
  }

  // Population, Capital, Region
  const population = country.population !== undefined ? country.population : "N/A";
  let capital = "N/A";
  if (country.capital) {
    capital = Array.isArray(country.capital) ? (country.capital[0] || "N/A") : country.capital;
  }
  const region = country.region || "N/A";

  card.innerHTML = `
    <div class="card-flag-wrapper">
      <img src="${escapeHtml(flagSrc)}" alt="Flag of ${escapeHtml(commonName)}" class="card-flag" loading="lazy">
    </div>
    <div class="card-info">
      <h3 class="card-name">${escapeHtml(officialName)}</h3>
      <p class="card-detail">Population:${population}</p>
      <p class="card-detail">Capital:${escapeHtml(capital)}</p>
      <p class="card-detail">Region:${escapeHtml(region)}</p>
    </div>
  `;

  // Attach countryCardHandler to click event
  card.addEventListener("click", function () {
    countryCardHandler(country);
  });

  return card;
}

/**
 * Handle "Show More" button click
 */
function handleShowMore() {
  displayedCount += ITEMS_PER_PAGE;
  renderCountries();
}

/**
 * Utility to escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Event Listeners for Filters and Show More
if (countrySearchInput) countrySearchInput.addEventListener("input", applyFilters);
if (regionFilterSelect) regionFilterSelect.addEventListener("change", applyFilters);
if (populationSearchInput) populationSearchInput.addEventListener("input", applyFilters);
if (showMoreBtn) showMoreBtn.addEventListener("click", handleShowMore);

// Call populateCountryCards only when the promise for fetchData() is resolved
document.addEventListener("DOMContentLoaded", function () {
  fetchData().then(function (data) {
    populateCountryCards(data);
  });
});
