# variant-density-vis-interface
This project implemented a REST API service for storing and sharing variant data for eukaryotic genomes.

### Achieved Objectives
The following were implemented in the assignment:
•	A relational database (SQLite) capable of storing variant data.
•	A tool for parsing VCF files to populate the database.
•	REST API server capable of serving some requests about the variant data in the database.

### ER Diagram
The VCF file used has several columns containing different data about the variants data (SNPs and InDels) and were grouped as follows depending on their relevance to achieving the aim and objectives of the task.

<img width="470" alt="image" src="https://github.com/user-attachments/assets/f4d28466-3820-4929-9fe2-48e8393e10b6" />

Figure 1: An Entity relationship(ER) diagram of the VCF file data used to create the database.

NB: CHROM = chromosome, POS = position of reference, REF = reference allele, ALT = alternative allele, QUAL = phred quality score, ID = variant type ID, INFO = more information 

### Relational Database
An SQL script genome_db_schema.sql to create the required tables in the database was created to achieve this objective. Three tables were created to contain the imported dataset as shown in Figure 2. The genomes table stores all imported VCF datasets and assigns each a genome identifier of type integer as the primary key. This table was designed for retrieving a list of all genomes from the database. The variants_data table which references the genomes table contains the most important parameters in implementing most of the required endpoints in the database and includes CHROM, POS, REF, and ALT. The more_info_data table was designed to contain the remaining columns from the datasets that are not necessary for achieving the main objectives of the assignment but might be needed in the future.

<img width="443" alt="image" src="https://github.com/user-attachments/assets/ee26f2ab-219e-41e1-9969-ce82cb77c5ee" />

Figure 2: a schema diagram showing the structure of the database.

NB: the arrow in the figure shows what each table is referencing (foreign key); more_info_data references variant_id in the variants_data table, and variants_data table references genome_id of the genomes table while the genomes table has no foreign key. The INFO and FORMAT columns in the more_info_data table were not assigned a NOT NULL constraint in the schema script because they may possess some missing values.

### Populating the Database
An import tool import_genomedb.js was developed for this purpose. The ‘bionode-vcf’ library in addition to ‘fs’ and ‘sqlite3’ modules was used to read the content of VCF files, create the required tables using the schema script and populate the database. The parseVCF() function which takes as input the VCF file path, reads the content of the file and extracts the relevant variant data to be inserted into the database. The function also performs preprocessing of the data and replaces missing values of some columns (INFO and FORMAT in this case) with null to allow populating the data without issue. The insertDataIntoDatabase() function which takes as input the database file, the genome (dataset) name and the variant data populates the three tables of the database. Before inserting the data, the processFilesFromFront() function processes each file sequentially and extracts the genome name from the file. An HTML page called upload_and_plot.html was designed to allow the user to dynamically upload the VCF files for processing and populating the database. This was achieved using the multer package. The front-end request to this effect is handled by the genome_router.post() function in router.js which handles all requests to the server.
The processFilesFromFront() function which performs the final task of populating the database is exported from the import script and called in the upload endpoint in the router.js script to initiate populating the database as soon as the VCF files are uploaded into the data-upload folder.

### REST API server.
A REST API server server.js deployed on localhost port 8000 was created using express. A router router.js defining the various API endpoints to this server is imported into the server. The various endpoints handling requests to the server are described below.

### REST API Endpoints.
The libraries used to develop the following endpoints include ‘express’ for initializing the router and ‘sqlite3’ for accessing the populated database. Incoming requests are handled by the genome_router.use() function which directs the request to the appropriate genome_router.get() function (endpoint) using the next() function. In addition to the following described endpoints, two additional endpoints were implemented in the routert.js script. The first which retrieves a list of unique chromosomes genome_router.get(‘/chromosome_input,) was created to populate the chromosome dropdown menu with unique chromosome numbers on the HTML page, and is used for producing the variant density plot described at the end of this report. The second, which uses the post() command genome_router.post(‘/upload_files’) was developed to handle file upload and processing from the front-end page. It uses the map() function to obtain all the uploaded VCF files in the data-upload folder and pass them to the pocessFilesFromFront() function for processing.

### Listing all the VCF datasets (genomes) loaded into the database.
genome_router.get(‘/genomes’) – this endpoint retrieves all datasets from the database using the SELECT * FROM genomes query. This endpoint has just the name of the genomes table as the required parameter to get a response from the server.

### Listing the number of variants (SNPs, InDels, or both) contained in each genome, grouped by chromosome.
genome_router.get(‘/variants/:variantType/:genomeName) – this endpoint was designed to require the type of variants (SNPs, InDels or both) and the genome the user is interested in as input parameters. SNPs are obtained when the length of the reference (REF) and alternate (ALT) alleles are equal to one (1) which signifies a substitution, else the variant is termed insertion/deletion (InDel). The SELECT FROM, SUM(CASE WHEN) and LEFT JOIN WHERE query commands were used to implement this logic and extract relevant data from the variants_data and genomes tables of the database.

### Returning a list of variants (SNPs, InDels, or both) located in a specified location of a specific chromosome in a dataset.
genome_router.get(‘/variants/:genomeName/:chromosome/:start/:end’) – this endpoint was designed to execute when the user specifies the genome name, chromosome number and start and end positions as parameters. Relevant data are extracted from the variants_data and genomes tables of the database using the SELECT * FROM and JOIN WHERE AND BETWEEN query commands. CHROM, POS and genome_id columns were used in the query to implement the logic and extract list variants of specific chromosomes, at specified positions in a specific dataset.

### Reporting the variant density for a specified window size, across a specified chromosome for a specific dataset.
genome_router.get(‘/variant-density/:genomeName/:chromosome/:windowSize’) – this endpoint was implemented to require genome name, chromosome number, and window size as parameters to execute the query. The endpoint uses a sliding window approach and keeps track of total variants (SNPs and InDels) in each window using the SUM and COUNT SQLite commands logic.

**Plotting the variant density** – this was to be handled by the front-end server view_plot_server.js which can be deployed on port 8080, which was created to serve the front-end page of the database. The view_plot_server.js script responds to the user via the upload_and_plot.html page. The HTML script sends a GET request to the main server server.js (back-end) using the fetch() function to extract variant density data from the genome_router.get() variant-density API for plotting. Plotly.js library was used to produce the variant density plot while CSS bootstrap and some inbuild HTML functionalities were used for styling the user interface page.
Example outputs produced by each of the above-described endpoints are shown in the user manual document attached to this report.

### Deliverables/Attachments
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

## User Manual
This is a simple guide to using the developed REST APIs to store and share variant data for eukaryotic genomes. It is assumed that the user has Node.js installed on their computer and also has the necessary SQLite execution files (especially sqlite3.exe) in the appropriate directory. It is also assumed that the user knows how to interact with the command prompt.
To set up the server and interact with the endpoints (and the created database), the following steps should be followed:

### Package Installation and Setup.
All the required packages are stored in the package.json file, execute the npm init command in the command prompt to install all the packages. Run server.js and view_plot_server.js scripts using the node command by typing node server.js and node view_plot_server.js (in different terminals) respectively. This will start two servers, one deployed on port 8080 (the view_plot_server.js), which is accessible via the front end, and the other on port 8000 (server.js), accessible on the back end. Double-click on the upload_and_plot.html file to open an interactive user interface that looks like the one below.
![image](https://github.com/user-attachments/assets/dafb57f4-7b17-4be2-8ad2-293ac826cfb3)
Figure 3: Showing an interractive user interface of the REST API webpage
 
### Parsing inputs and populating the database.
Click on Choose Files to upload VCF files into the database (or use the already populated database genome_db.sqlite attached to the report). A maximum of 10 files can be uploaded at a time. Processing the files into the database is initiated as soon as the upload is completed and may take seconds to hours, depending on the size of the VCF file(s) and the structure of the database (schema). Populating the database with the uploaded VCF files can be monitored via the command line terminal, as reporting the progress on the user interface could not be completed at the time of compiling this report.

### REST APIs
Kindly note that only file uploads and plotting variant density can be carried out on the interactive HTML page, other interactions with the servers are via URL on port 8000 as described below.

### Listing all the VCF datasets loaded into the database.
To view all datasets (genomes) loaded into the database, visit http://localhost:8000/api/genomes in your browser. An example output is shown below.
 ![image](https://github.com/user-attachments/assets/53d72ffe-6623-432f-acfd-fdf394a1c423)
Figure 4: Showing all datasets loaded into the database

The URL will return all the uploaded genomes with genome IDs that were automatically generated on loading the datasets into the database.

### Listing the number of variants (SNPs, InDels, or both) contained in each genome, grouped by chromosome.
In this case, the user needs to specify the variant type and genome name in addition to the base URL http://localhost:8000/api/variants/ to view variants in the specified genome grouped by chromosome. An example output generated for SNPs using http://localhost:8000/api/variants/SNPs/genome_8233  is shown below. The link returns the sum of SNPs in each chromosome of genome_8233.
 ![image](https://github.com/user-attachments/assets/3f6c77ed-bdfe-4d05-a745-07bdb402061d)
Figure 5: Showing the sum of SNPs in each chromosome of genome_8233

When ‘both’ or ‘variantType’ or any other parameter is used, the total number of both SNPs and InDels will be returned, for example http://localhost:8000/api/variants/both/genome_8233 
 ![image](https://github.com/user-attachments/assets/1188cda9-6ba8-4acc-a1bf-a9af0cd5af2f)
Figure 6: Showing both SNPs and InDels of each chromosome of genome_8233

Returns the total number of SNPs and InDels in each chromosome of genome_8233.

### Returning a list of variants (SNPs, InDels, or both) located in a specified region of a specified chromosome in a specific dataset.
To achieve this, the user should specify the genome name, chromosome number, as well as the start and end position in addition to http://localhost:8000/api/variants/, an example output can be obtained using http://localhost:8000/api/variants/genome_7208/2/920604/1547977, which will return a list of all the variants between 920604 and 1547977 positions of chromosome 2 in the genome_7208 dataset.
 ![image](https://github.com/user-attachments/assets/4829ea0b-0a3a-42ae-b80e-c1f3490a2db8)
Figure 7: Showing the list of all variants between 920604 and 1547977 positions of chromosome 2 in the genome_7208 dataset

In the first item of the array, we can observe that at position 943400 of genome_7208, it is a ‘C’ in the reference genome while it is ‘CT’ in this genome, which signifies an insertion. Kindly note that the specified positions in the URL must be a reference position in the dataset.

### Reporting the variant (SNPs, InDels, or both) density for a specified window size, across a specified chromosome, for a specific dataset.
This can be achieved by providing genome name, chromosome number, and window size as input parameters to the base URL http://localhost:8000/api/variant-density/, for example, http://localhost:8000/api/variant-density/genome_9968/3/200000 will return the variant count of both SNPs InDels present in chromosome 3 of genome_9968 for every 200000 bases.
 ![image](https://github.com/user-attachments/assets/a38fb4a0-7831-45be-bc93-e2df70011e15)
Figure 8: Showing the variant count of both SNPs and InDels present in chromosome 3 of genome_9968 for every 200000 bases.

This shows that in the first window of 200000bps of chromosome 3, there are 4 InDels and 112 SNPs, which sum up to 116 variants.

### Plotting the variant density.
This can be achieved using the interactive HTML page upload_and_plot.html introduced earlier, the other sections of the page shown below were created for this purpose.
 ![image](https://github.com/user-attachments/assets/752a56cd-a2f7-4be2-b195-724fc0630acc)
Figure 9: Showing the some sections of the interactive HTML page of the web service.

Select a specific genome, chromosome number, and variant type from the dropdown menus and specify a window size. Click on the Plot Graph button to plot the variant density of the specified parameters. An example is given below.
![image](https://github.com/user-attachments/assets/8b3ce762-f8a7-4ec7-a751-572b746cfe4d)
Figure 10: Showing the plotted variant density graph of the specified parameters.
 
The above is an example of a variant density plot for all the InDels present in chromosome 1 and genome_8233 using a window size of 200000. Explore different combinations of the parameters and observe how the variant density plot changes, including the label on the y-axis when a particular variant is selected.


