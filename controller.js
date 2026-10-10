// controller.js - Handles request routing and serves static files
const fs = require("fs");
const path = require("path");
const { fetchCountries } = require("./countries-services");

/**
 * Determines content type header based on file extension
 * @param {string} extname 
 * @returns {string} contentType
 */
function getContentType(extname) {
  let contentType = "";

  switch (extname) {
    case ".html":
      contentType = "text/html";
      break;
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
    case ".json":
      contentType = "application/json";
      break;
  }

  return contentType;
}

/**
 * Reads requested file and serves it with the appropriate status and headers
 * @param {string} filePath 
 * @param {string} extname 
 * @param {http.ServerResponse} res 
 */
function readAndServe(filePath, extname, res) {
  // 1. Decode filePath to handle file names with spaces
  filePath = decodeURIComponent(filePath);

  // 2. If filePath does not exist, return 404
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("File not found");
    return;
  }

  // 3. Read the content of filePath asynchronously
  fs.readFile(filePath, function (error, content) {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server error: " + error.code);
    } else {
      // if the file is found, return 200 and the content
      let contentType = getContentType(extname);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
}

/**
 * Request handler callback for http.createServer
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
function handleRequest(req, res) {
  // 1. Prepend dot to requested URL to make relative path
  let filePath = "." + req.url;

  // 2. Route root to index.html
  if (filePath === "./") {
    filePath = "./index.html";
  }
  // 3. Route detail page requests (ignoring query parameters)
  else if (filePath.startsWith("./detail.html")) {
    filePath = "./detail.html";
  }
  // 4. Route for "./countries" GET request
  else if (filePath === "./countries" && req.method === "GET") {
    fetchCountries()
      .then(function(countriesData) {
        if (countriesData) {
          console.log(countriesData.length);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(countriesData));
        } else {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Response data is null");
        }
      })
      .catch(function(error) {
        console.error("Error fetching countries:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Failed to fetch data");
      });
    return;
  }

  // 5. Get the file extension
  let extname = path.extname(filePath);

  // 6. If file extension exists, read and serve
  if (extname) {
    readAndServe(filePath, extname, res);
  }
}

module.exports = {
  handleRequest,
  readAndServe,
  getContentType
};
