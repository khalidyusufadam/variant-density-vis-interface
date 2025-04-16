// Khalid Adam Yusuf (s411309)
// Data Integration Module
// 17/02/2024
// Router Script

// Load required modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./genome_db.sqlite');
const fs = require('fs');
const multer = require('multer');
const { processFilesFromFront } = require("./import_genomedb.js")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './data-upload/'); // Specify the destination directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Preserve the original filename
    },
    preservePath: true // Preserve the original path of the file
});

const upload = multer({ storage: storage });
// Initialize Express Router
const genome_router = express.Router();

// Middleware to log incoming requests
genome_router.use(function (req, res, next) {
    console.log('Received request');
    next();
});

// Endpoint to list all VCF datasets (genomes) loaded into the database
genome_router.get('/genomes', function (req, res) {
    const query = 'SELECT * FROM genomes;';
    db.all(query, [], function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Endpoint to get unique chromosome inputs from user for making variant density plot
genome_router.get('/chromosome_inputs', function (req, res) {
    db.all(`SELECT DISTINCT CHROM FROM variants_data`, function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

//upload files from front end
genome_router.post('/upload_files', upload.array('files', 10), async (req, res) => {
    try {
        // Handle file upload here
        const files = req.files;
        if (!files || !files.length) {
            console.log("no files")
            res.status(400).send('No files uploaded.');
            return;
        }

        // Prepare file paths for processing
        const files_to_process = files.map((item) => `./data-upload/${item.originalname}`);

        // Process files
        if (files_to_process.length > 0) {
            const status = await processFilesFromFront(files_to_process);
            console.log(status); // Log completion status
            res.status(200).send('Files uploaded and processed successfully.');
        }
    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).send('Internal server error.');
    }
});

// Endpoint to list the number of variants (SNPs, InDels, or both) contained in each genome, grouped by chromosome
genome_router.get('/variants/:variantType/:genomeName', function (req, res) {
    // Extract parameters from the request URL
    const variantType = req.params.variantType; // SNP, InDel, or both
    const genomeName = req.params.genomeName; // Genome name

    // Initialize the base query
    let query = `
        SELECT g.name AS genome_name, v.CHROM, 
        SUM(CASE WHEN LENGTH(v.REF) = 1 AND LENGTH(v.ALT) = 1 THEN 1 ELSE 0 END) AS num_snps, 
        SUM(CASE WHEN LENGTH(v.REF) != 1 OR LENGTH(v.ALT) != 1 THEN 1 ELSE 0 END) AS num_indels 
        FROM genomes g 
        LEFT JOIN variants_data v ON g.genome_id = v.genome_id 
        WHERE g.name = ?
        GROUP BY g.name, v.CHROM;
    `;

    // Modify query based on variant type
    if (variantType === 'SNPs') {
        query = `
            SELECT g.name AS genome_name, v.CHROM, 
            SUM(CASE WHEN LENGTH(v.REF) = 1 AND LENGTH(v.ALT) = 1 THEN 1 ELSE 0 END) AS num_snps 
            FROM genomes g 
            LEFT JOIN variants_data v ON g.genome_id = v.genome_id 
            WHERE g.name = ?
            GROUP BY g.name, v.CHROM;
        `;
    } else if (variantType === 'InDels') {
        query = `
            SELECT g.name AS genome_name, v.CHROM, 
            SUM(CASE WHEN LENGTH(v.REF) != 1 OR LENGTH(v.ALT) != 1 THEN 1 ELSE 0 END) AS num_indels 
            FROM genomes g 
            LEFT JOIN variants_data v ON g.genome_id = v.genome_id 
            WHERE g.name = ?
            GROUP BY g.name, v.CHROM;
        `;
    }

    // Execute the query
    db.all(query, [genomeName], function (err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to get variants within a specified range (region) for a given genome and chromosome
genome_router.get('/variants/:genomeName/:chromosome/:start/:end', function (req, res) {
    // Extract parameters from the request URL
    const genomeName = req.params.genomeName; // Genome name
    const chromosome = req.params.chromosome; // Chromosome
    const start = parseInt(req.params.start); // Start position
    const end = parseInt(req.params.end); // End position

    // Construct the query to retrieve variants within the specified region
    const query = `
        SELECT *
        FROM variants_data v
        JOIN genomes g ON v.genome_id = g.genome_id
        WHERE g.name = ? AND v.CHROM = ? AND v.POS BETWEEN ? AND ?;
    `;

    // Execute the query
    db.all(query, [genomeName, chromosome, start, end], function (err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to report variants density for a specified window size, across a specified chromosome for a specific genome (dataset)
// Variant density plot via the view_plot_server.js in an front-backend fashion
genome_router.get('/variant-density/:genomeName/:chromosome/:windowSize', function (req, res) {
    // Extract parameters from the request URL
    const genomeName = req.params.genomeName;
    const chromosome = req.params.chromosome;
    const windowSize = parseInt(req.params.windowSize);

    // Construct the query to calculate variant density
    const query = `
        SELECT 
            v.CHROM,
            FLOOR(v.POS / ?) * ? AS window_start,
            FLOOR(v.POS / ?) * ? + ? AS window_end,
            SUM(CASE WHEN LENGTH(v.REF) != 1 OR LENGTH(v.ALT) != 1 THEN 1 ELSE 0 END) AS num_indel,
            SUM(CASE WHEN LENGTH(v.REF) = 1 AND LENGTH(v.ALT) = 1 THEN 1 ELSE 0 END) AS num_snps,
            COUNT(*) AS variant_count
        FROM variants_data v
        INNER JOIN genomes g ON v.genome_id = g.genome_id
        WHERE g.name = ? AND v.CHROM = ?
        GROUP BY v.CHROM, window_start
        ORDER BY v.CHROM, window_start;
    `;

    // Execute the query
    db.all(query, [windowSize, windowSize, windowSize, windowSize, windowSize, genomeName, chromosome], function (err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ variantDensityData: rows });
    });
});

// Export the router for use in other modules
module.exports = genome_router;

