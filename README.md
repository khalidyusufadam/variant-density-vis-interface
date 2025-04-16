# variant-density-vis-interface
This project implemented a REST API service for storing and sharing variant data for eukaryotic genomes.

### Achieved Objectives
The following were implemented in the assignment:
•	A relational database (SQLite) capable of storing variant data.
•	A tool for parsing VCF files to populate the database.
•	REST API server capable of serving some requests about the variant data in the database.
ER Diagram
The VCF file used has several columns containing different data about the variants data (SNPs and InDels) and were grouped as follows depending on their relevance to achieving the aim and objectives of the task.













Figure 1: an ER (entity relationship) diagram of the VCF file data used to create the database.
NB: CHROM = chromosome, POS = position of reference, REF = reference allele, ALT = alternative allele, QUAL = phred quality score, ID = variant type ID, INFO = more information 

Relational Database
An SQL script genome_db_schema.sql to create the required tables in the database was created to achieve this objective. Three tables were created to contain the imported dataset as shown in Figure 2. The genomes table stores all imported VCF datasets and assigns each a genome identifier of type integer as the primary key. This table was designed for retrieving a list of all genomes from the database. The variants_data table which references the genomes table contains the most important parameters in implementing most of the required endpoints in the database and includes CHROM, POS, REF, and ALT. The more_info_data table was designed to contain the remaining columns from the datasets that are not necessary for achieving the main objectives of the assignment but might be needed in the future.







Figure 2: a schema diagram showing the structure of the database.
NB: the arrow in the figure shows what each table is referencing (foreign key); more_info_data references variant_id in the variants_data table, and variants_data table references genome_id of the genomes table while the genomes table has no foreign key. The INFO and FORMAT columns in the more_info_data table were not assigned a NOT NULL constraint in the schema script because they may possess some missing values.
Populating the Database
An import tool import_genomedb.js was developed for this purpose. The ‘bionode-vcf’ library in addition to ‘fs’ and ‘sqlite3’ modules was used to read the content of VCF files, create the required tables using the schema script and populate the database. The parseVCF() function which takes as input the VCF file path, reads the content of the file and extracts the relevant variant data to be inserted into the database. The function also performs preprocessing of the data and replaces missing values of some columns (INFO and FORMAT in this case) with null to allow populating the data without issue. The insertDataIntoDatabase() function which takes as input the database file, the genome (dataset) name and the variant data populates the three tables of the database. Before inserting the data, the processFilesFromFront() function processes each file sequentially and extracts the genome name from the file. An HTML page called upload_and_plot.html was designed to allow the user to dynamically upload the VCF files for processing and populating the database. This was achieved using the multer package. The front-end request to this effect is handled by the genome_router.post() function in router.js which handles all requests to the server.
The processFilesFromFront() function which performs the final task of populating the database is exported from the import script and called in the upload endpoint in the router.js script to initiate populating the database as soon as the VCF files are uploaded into the data-upload folder.
REST API server.
A REST API server server.js deployed on localhost port 8000 was created using express. A router router.js defining the various API endpoints to this server is imported into the server. The various endpoints handling requests to the server are described below.
REST API Endpoints.
The libraries used to develop the following endpoints include ‘express’ for initializing the router and ‘sqlite3’ for accessing the populated database. Incoming requests are handled by the genome_router.use() function which directs the request to the appropriate genome_router.get() function (endpoint) using the next() function. In addition to the following described endpoints, two additional endpoints were implemented in the routert.js script. The first which retrieves a list of unique chromosomes genome_router.get(‘/chromosome_input,) was created to populate the chromosome dropdown menu with unique chromosome numbers on the HTML page, and is used for producing the variant density plot described at the end of this report. The second, which uses the post() command genome_router.post(‘/upload_files’) was developed to handle file upload and processing from the front-end page. It uses the map() function to obtain all the uploaded VCF files in the data-upload folder and pass them to the pocessFilesFromFront() function for processing.
Listing all the VCF datasets (genomes) loaded into the database.
genome_router.get(‘/genomes’) – this endpoint retrieves all datasets from the database using the SELECT * FROM genomes query. This endpoint has just the name of the genomes table as the required parameter to get a response from the server.
Listing the number of variants (SNPs, InDels, or both) contained in each genome, grouped by chromosome.
genome_router.get(‘/variants/:variantType/:genomeName) – this endpoint was designed to require the type of variants (SNPs, InDels or both) and the genome the user is interested in as input parameters. SNPs are obtained when the length of the reference (REF) and alternate (ALT) alleles are equal to one (1) which signifies a substitution, else the variant is termed insertion/deletion (InDel). The SELECT FROM, SUM(CASE WHEN) and LEFT JOIN WHERE query commands were used to implement this logic and extract relevant data from the variants_data and genomes tables of the database.
Returning a list of variants (SNPs, InDels, or both) located in a specified location of a specific chromosome in a dataset.
genome_router.get(‘/variants/:genomeName/:chromosome/:start/:end’) – this endpoint was designed to execute when the user specifies the genome name, chromosome number and start and end positions as parameters. Relevant data are extracted from the variants_data and genomes tables of the database using the SELECT * FROM and JOIN WHERE AND BETWEEN query commands. CHROM, POS and genome_id columns were used in the query to implement the logic and extract list variants of specific chromosomes, at specified positions in a specific dataset.
Reporting the variant density for a specified window size, across a specified chromosome for a specific dataset.
genome_router.get(‘/variant-density/:genomeName/:chromosome/:windowSize’) – this endpoint was implemented to require genome name, chromosome number, and window size as parameters to execute the query. The endpoint uses a sliding window approach and keeps track of total variants (SNPs and InDels) in each window using the SUM and COUNT SQLite commands logic.
Plotting the variant density – this was to be handled by the front-end server view_plot_server.js which can be deployed on port 8080, which was created to serve the front-end page of the database. The view_plot_server.js script responds to the user via the upload_and_plot.html page. The HTML script sends a GET request to the main server server.js (back-end) using the fetch() function to extract variant density data from the genome_router.get() variant-density API for plotting. Plotly.js library was used to produce the variant density plot while CSS bootstrap and some inbuild HTML functionalities were used for styling the user interface page.
Example outputs produced by each of the above-described endpoints are shown in the user manual document attached to this report.
Deliverables/Attachments
Attached to this technical report are the following:
•	User manual – IBIX-DAT-UserManual
•	Shema script – genome_db_schema.sql
•	Data import script – import_genomedb.js
•	User interface HTML page – upload_and_plot.html
•	Front-end server – view_plot_server.js
•	Back-end server – server.js
•	Router script – router.js
•	Populated database – genome_db.sqlite
•	NPM package – package.json
