// Khalid Adam Yusuf (s411309)
// Data Integration Module
// 17/02/2024
// Data Import Script

// Load required modules
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose(); // SQLite library
const vcf = require('bionode-vcf');

// Function to parse VCF file and extract variant data
function parseVCF(filePath) {
    return new Promise((resolve, reject) => {
        const variants = [];

        // Read VCF file stream
        vcf.readStream(fs.createReadStream(filePath))
            .on('data', data => {
                // Replace empty FORMAT and INFO values with a placeholder or handle them as null
                const filter = data.filter && data.filter.trim() === '' ? 'NA' : data.filter; // Treat missing values as NA
                const info = data.info && data.info.trim() === '' ? null : data.info; // Treat empty INFO values as NULL
                const format = data.format && data.format.trim() === '' ? null : data.format; // Treat empty FORMAT values as NULL

                // Push the entire data object for each variant
                variants.push({
                    CHROM: data.chr,
                    POS: data.pos,
                    REF: data.ref,
                    ALT: data.alt,
                    ID: data.id,
                    QUAL: data.qual,
                    FILTER: filter,
                    INFO: info,
                    FORMAT: format
                    // Add more fields as needed
                });
            })
            .on('end', () => {
                resolve(variants); // Resolve promise with extracted variant data
            })
            .on('error', err => {
                reject(err); // Reject promise with error if any
            });
    });
}

// Function to insert data into SQLite database
async function insertDataIntoDatabase(db, genomeName, variantData) {
    try {
        // Insert genome name into genomes table
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO genomes (name) VALUES (?)', [genomeName], function (err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Inserted genome ${genomeName} into genomes table`);
                    resolve();
                }
            });
        });

        // Insert variant data into variants_data table and more_info_data table
        let ins = []
        await Promise.all(
            variantData.map(async (variant, index) => {
                ins.push(index)
                await new Promise((resolve, reject) => {
                    // Construct the SQL query dynamically based on the variant object
                    const variantKeys = ['CHROM', 'POS', 'REF', 'ALT'];
                    const variantValues = [variant.CHROM, variant.POS, variant.REF, variant.ALT];
                    const variantPlaceholders = variantKeys.map(() => '?').join(', ');
                    const variantSql = `INSERT INTO variants_data (genome_id, ${variantKeys.join(', ')}) VALUES ((SELECT genome_id FROM genomes WHERE name = ?), ${variantPlaceholders})`;

                    // Execute the SQL query to insert variant data
                    db.run(variantSql, [genomeName, ...variantValues], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('Inserted variant data into variants_data table');
                            // Insert more_info_data
                            const variantId = this.lastID; // Get the last inserted variant_id
                            const moreInfoKeys = ['variant_id', 'ID', 'QUAL', 'FILTER', 'INFO', 'FORMAT'];
                            const moreInfoValues = [variantId, variant.ID, variant.QUAL, variant.FILTER, variant.INFO, variant.FORMAT];
                            const moreInfoPlaceholders = moreInfoKeys.map(() => '?').join(', ');
                            const moreInfoSql = `INSERT INTO more_info_data (${moreInfoKeys.join(', ')}) VALUES (${moreInfoPlaceholders})`;

                            // Execute the SQL query to insert more_info_data
                            db.run(moreInfoSql, moreInfoValues, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    console.log('Inserted variant data into more_info_data table');
                                        resolve(`completed`)
                                }
                            });
                        }
                    });
                });

            })
        );

    } catch (err) {
        console.error('Error inserting data:', err.message);
    }
}

// Connect to SQLite database
const db = new sqlite3.Database('genome_db.sqlite');

// (Re-)Create schema
const schemaScript = fs.readFileSync('genome_db_schema.sql', 'utf-8');
db.exec(schemaScript);

// Process VCF files into the database
const processFilesFromFront = async (vcfFilesFF) => {
    try {
        for (const [index, filePath] of vcfFilesFF.entries()) {
            const genomeName = filePath.split('/').pop().split('.')[0]; // Extract genome name from file path
            let status;
            try {
                const variantData = await parseVCF(filePath); // Parse VCF file to extract data
                status = await insertDataIntoDatabase(db, genomeName, variantData); // Insert data into SQLite database
                console.log(`File ${index + 1} processed successfully`);
            } catch (err) {
                console.error('Error processing VCF file:', err.message);
                throw err; // Propagate the error
            }
        }

    // Close the database connection after all files are processed
    db.close();
    return 'completed'; // Indicate that all files were processed successfully
    } catch (error) {
        console.error('Error processing files:', error);
        throw error; // Propagate the error
    }   
};


module.exports = { processFilesFromFront };


// // Path to the VCF files
// const vcfFiles = ['./data/genome_7208.vcf', './data/genome_8233.vcf', './data/genome_9968.vcf' /* Add more file paths as needed */];

// // Process each VCF file sequentially
// (async function processFiles() {
//     for (const filePath of vcfFiles) {
//         const genomeName = filePath.split('/').pop().split('.')[0]; // Extract genome name from file path
//         try {
//             const variantData = await parseVCF(filePath); // Parse VCF file to extract data
//             await insertDataIntoDatabase(db, genomeName, variantData); // Insert data into SQLite database
//         } catch (err) {
//             console.error('Error processing VCF file:', err.message);
//         }
//     }

//     // Close the database connection when done processing all files
//     db.close();
// });
