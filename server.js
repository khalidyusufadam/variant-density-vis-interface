// Khalid Adam Yusuf (s411309)
// Data Integration Module
// 17/02/2024
// Server Script

// Required packages
const express = require("express");
const cors = require('cors');
const app = express();

// Enable CORS middleware
app.use(cors())

// Specify the port number
const port = 8000;

// Start the server and listen on the specified port
app.listen(port, function(){
    console.log(`Application deployed on port ${port}`);
});

// Import the router module for defining API endpoints
const router = require('./router');

// Mount the router to the '/api' path so that all routes are prefixed with '/api'
app.use('/api', router);

