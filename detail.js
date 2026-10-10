// detail.js - Country Explorer Details Page Logic

// DOM Elements
const backBtn = document.getElementById("back-btn");
const detailCard = document.getElementById("country-detail-card");
const detailStatus = document.getElementById("detail-status");

const detailFlag = document.getElementById("detail-flag");
const detailName = document.getElementById("detail-name");
const detailOfficial = document.getElementById("detail-official");
const detailNative = document.getElementById("detail-native");
const detailPopulation = document.getElementById("detail-population");
const detailRegion = document.getElementById("detail-region");
const detailSubregion = document.getElementById("detail-subregion");
const detailCapital = document.getElementById("detail-capital");
const detailCurrencies = document.getElementById("detail-currencies");
const detailLanguages = document.getElementById("detail-languages");
const detailTld = document.getElementById("detail-tld");
const detailBorders = document.getElementById("detail-borders");

// Back button handler
backBtn.addEventListener("click", () => {
  if (document.referrer && document.referrer.includes("index.html")) {
    window.history.back();
  } else {
    window.location.href = "index.html";
  }
});

/**
 * Initialize details page by reading query string or fallback data
 */
function initDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const countryParam = urlParams.get("country");

  if (!countryParam) {
    showStatus("No country selected. Returning to home page...", true);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
    return;
  }

  // Read data from URL query string
  const officialParam = urlParams.get("official") || countryParam;
  const flagParam = urlParams.get("flag") || "assets/world.png";
  const popRaw = urlParams.get("population");
  const capitalParam = urlParams.get("capital") || "N/A";
  const regionParam = urlParams.get("region") || "N/A";
  const subregionParam = urlParams.get("subregion") || "N/A";
  const currenciesParam = urlParams.get("currencies") || "N/A";
  const languagesParam = urlParams.get("languages") || "N/A";
  const tldParam = urlParams.get("tld") || "N/A";
  const bordersParam = urlParams.get("borders") || "";

  // If query string has currencies/languages, render directly from query string
  if (urlParams.has("currencies") || urlParams.has("languages")) {
    document.title = `${countryParam} - Country Explorer`;
    if (detailName) detailName.textContent = countryParam;
    if (detailOfficial) detailOfficial.textContent = officialParam;
    if (detailFlag) {
      detailFlag.src = flagParam;
      detailFlag.alt = `Flag of ${countryParam}`;
    }
    if (detailNative) detailNative.textContent = countryParam;
    if (detailPopulation) {
      detailPopulation.textContent = popRaw ? Number(popRaw).toLocaleString() : "N/A";
    }
    if (detailRegion) detailRegion.textContent = regionParam;
    if (detailSubregion) detailSubregion.textContent = subregionParam;
    if (detailCapital) detailCapital.textContent = capitalParam;
    if (detailCurrencies) detailCurrencies.textContent = currenciesParam;
    if (detailLanguages) detailLanguages.textContent = languagesParam;
    if (detailTld) detailTld.textContent = tldParam;

    if (detailBorders) {
      detailBorders.innerHTML = "";
      if (bordersParam) {
        const borderList = bordersParam.split(",").filter(Boolean);
        if (borderList.length > 0) {
          borderList.forEach(code => {
            const badge = document.createElement("a");
            badge.className = "border-badge";
            badge.href = `detail.html?country=${encodeURIComponent(code.trim())}`;
            badge.textContent = code.trim();
            detailBorders.appendChild(badge);
          });
        } else {
          detailBorders.innerHTML = `<span style="font-size: 13px; color: #777;">None</span>`;
        }
      } else {
        detailBorders.innerHTML = `<span style="font-size: 13px; color: #777;">None</span>`;
      }
    }

    hideStatus();
    detailCard.style.display = "grid";
    return;
  }

  // Fallback to searching data.js
  const countryData = findCountryDetails(countryParam);
  if (countryData) {
    renderFromCountryObject(countryData);
    hideStatus();
    detailCard.style.display = "grid";
  } else {
    showStatus(`Details for "${countryParam}" could not be found.`, true);
  }
}

/**
 * Find country details from countriesData (data.js)
 */
function findCountryDetails(query) {
  if (typeof countriesData !== "undefined" && Array.isArray(countriesData)) {
    const lowerQuery = query.toLowerCase();
    return countriesData.find(c => {
      const common = (c.name && c.name.common) ? c.name.common.toLowerCase() : "";
      const official = (c.name && c.name.official) ? c.name.official.toLowerCase() : "";
      return common === lowerQuery || official === lowerQuery || common.includes(lowerQuery) || official.includes(lowerQuery);
    });
  }
  return null;
}

/**
 * Render from country data object
 */
function renderFromCountryObject(country) {
  const commonName = (country.name && country.name.common) ? country.name.common : "Unknown Country";
  const officialName = (country.name && country.name.official) ? country.name.official : commonName;

  document.title = `${commonName} - Country Explorer`;
  detailName.textContent = commonName;
  detailOfficial.textContent = officialName;

  let flagSrc = country.flags ? (country.flags.png || country.flags.svg || "assets/world.png") : "assets/world.png";
  detailFlag.src = flagSrc;
  detailFlag.alt = `Flag of ${commonName}`;

  let nativeName = "N/A";
  if (country.name && country.name.nativeName) {
    const nativeEntries = Object.values(country.name.nativeName);
    if (nativeEntries.length > 0) {
      nativeName = nativeEntries[0].common || nativeEntries[0].official || "N/A";
    }
  }
  detailNative.textContent = nativeName;

  const pop = typeof country.population === "number" ? country.population.toLocaleString() : "N/A";
  detailPopulation.textContent = pop;

  detailRegion.textContent = country.region || "N/A";
  detailSubregion.textContent = country.subregion || "N/A";

  let capital = "N/A";
  if (country.capital) {
    capital = Array.isArray(country.capital) ? country.capital.join(", ") : country.capital;
  }
  detailCapital.textContent = capital;

  let currencies = "N/A";
  if (country.currencies) {
    currencies = Object.values(country.currencies)
      .map(c => c.name || c)
      .join(", ");
  }
  detailCurrencies.textContent = currencies;

  let languages = "N/A";
  if (country.languages) {
    languages = Object.values(country.languages).join(", ");
  }
  detailLanguages.textContent = languages;

  let tld = "N/A";
  if (country.tld && Array.isArray(country.tld)) {
    tld = country.tld.join(", ");
  }
  detailTld.textContent = tld;

  detailBorders.innerHTML = "";
  if (country.borders && Array.isArray(country.borders) && country.borders.length > 0) {
    country.borders.forEach(borderCode => {
      const badge = document.createElement("a");
      badge.className = "border-badge";
      badge.href = `detail.html?country=${encodeURIComponent(borderCode)}`;
      badge.textContent = borderCode;
      detailBorders.appendChild(badge);
    });
  } else {
    detailBorders.innerHTML = `<span style="font-size: 13px; color: #777;">None</span>`;
  }
}

/**
 * Utility for status messages
 */
function showStatus(text, isActive) {
  detailStatus.textContent = text;
  if (isActive) {
    detailStatus.classList.add("active");
  } else {
    detailStatus.classList.remove("active");
  }
}

function hideStatus() {
  detailStatus.textContent = "";
  detailStatus.classList.remove("active");
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initDetailPage);
