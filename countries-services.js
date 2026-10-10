// countries-services.js - Service to fetch countries data from REST Countries API
const https = require("https");

function fetchCountries() {
  return new Promise(function(resolve, reject) {
    const API_URL = "https://restcountries.com/v3.1/all?fields=name,capital,flags,currencies,languages,region,subregion,population&fullText=True";

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
              resolve(countriesData);
            } catch (err) {
              reject(err);
            }
          });
        }).on("error", function(err) {
          reject(err);
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
          resolve(countriesData);
        } catch (error) {
          reject(error);
        }
      });
    });

    // Handle errors in the request
    req.on("error", function(error) {
      reject(error);
    });

    req.end();
  });
}

module.exports = {
  fetchCountries
};
