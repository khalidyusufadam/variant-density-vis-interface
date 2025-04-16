// Khalid Adam Yusuf (s411309)
// Data Integration Module
// 17/02/2024
// Files Uploads and Variant Density Plot Server Script

// Load required packages
const http = require('http');
const fs = require('fs');

const PORT = 8080;

// Read the HTML file asynchronously
fs.readFile('upload_and_plot.html', function (err, html) {

    // Handle errors, if any
    if (err) {
        console.log(err);
    } else {
        // Create an HTTP server
        http.createServer(function (request, response) {
            // Set the response header with status code 200 and content type as HTML
            response.writeHeader(200, { "Content-Type": "text/html" });
            // Write the HTML content to the response
            response.write(html);
            // End the response
            response.end();
        }).listen(PORT, (res, err) => {
            // Check if the server started successfully
            if (!err) {
                console.log("Server is running on port " + PORT);
            } else {
                console.log("Error occurred while starting server: " + err);
            }
        });
    }
});
