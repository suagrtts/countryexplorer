// countries-services.js - Service to fetch countries data from REST Countries API
const https = require("https");
const fs = require("fs");
const path = require("path");

function fetchCountries() {
  return new Promise(function(resolve, reject) {
    const API_URL = "https://restcountries.com/v3.1/all?fields=name,capital,flags,currencies,languages,region,subregion,population&fullText=True";

    function getLocalBackup() {
      try {
        const backupPath = path.join(__dirname, "all-countries.json");
        if (fs.existsSync(backupPath)) {
          return JSON.parse(fs.readFileSync(backupPath, "utf-8"));
        }
      } catch (e) {
        console.error("Backup load error:", e);
      }
      return [];
    }

    let req = https.get(API_URL, function(res) {
      // Follow redirect if returned by the API
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, function(redirectRes) {
          let redirectData = "";
          redirectRes.on("data", function(chunk) {
            redirectData += chunk;
          });
          redirectRes.on("end", function() {
            try {
              let countriesData = JSON.parse(redirectData);
              if (Array.isArray(countriesData) && countriesData.length > 0) {
                resolve(countriesData);
              } else {
                resolve(getLocalBackup());
              }
            } catch (err) {
              resolve(getLocalBackup());
            }
          });
        }).on("error", function() {
          resolve(getLocalBackup());
        });
        return;
      }

      let data = "";

      // A chunk of data has been received.
      res.on("data", function(chunk) {
        data += chunk;
      });

      // The whole response has been received.
      res.on("end", function() {
        try {
          let countriesData = JSON.parse(data);
          if (Array.isArray(countriesData) && countriesData.length > 0) {
            resolve(countriesData);
          } else {
            resolve(getLocalBackup());
          }
        } catch (error) {
          resolve(getLocalBackup());
        }
      });
    });

    // Handle errors in the request
    req.on("error", function() {
      resolve(getLocalBackup());
    });

    req.end();
  });
}

module.exports = {
  fetchCountries
};
