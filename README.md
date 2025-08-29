# Genealogy DNA Match Analyzer

A web-based tool to identify common ancestors between your DNA matches by analyzing family tree data and DNA match results.

## Features

- Upload GEDCOM family tree files
- Upload DNA match data (CSV format)
- Find common ancestors between DNA matches
- Identify connections between different DNA matches
- Clean, responsive web interface

## How to Use

1. **Open the Tool**: Open `index.html` in your web browser
2. **Upload Family Tree**: Click "Choose GEDCOM file" and upload your family tree (.ged file)
3. **Upload DNA Matches**: Click "Choose CSV file" and upload your DNA match data
4. **View Results**: The tool will automatically analyze and display:
   - Your DNA matches
   - Common ancestors found
   - Connections between matches

## File Formats

### GEDCOM Files (.ged)
Export your family tree from:
- Ancestry.com
- FamilySearch
- MyHeritage
- RootsMagic
- Family Tree Maker

### DNA Match Files (.csv)
Export DNA match data from:
- AncestryDNA: DNA > Matches > Download
- 23andMe: Browse Raw Data > Download
- MyHeritage: DNA > Manage DNA Kits > Download

Expected CSV columns:
- Match Name / Display Name
- Relationship
- Shared DNA (cM)
- Estimated Relationship

## Sample Data

The project includes sample files for testing:
- `sample-family.ged` - Sample family tree with 3 generations
- `sample-dna-matches.csv` - Sample DNA matches corresponding to the family tree

## Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. No build process required - uses vanilla HTML/CSS/JavaScript

## Deployment Options

### GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all files to the repository
3. Enable GitHub Pages in repository settings
4. Your tool will be available at `https://yourusername.github.io/repository-name`

### Netlify (Free)
1. Visit netlify.com
2. Drag and drop your project folder
3. Get instant deployment URL

### Vercel (Free)
1. Visit vercel.com
2. Import your GitHub repository or upload files
3. Get instant deployment URL

## Technical Details

- Pure HTML/CSS/JavaScript (no frameworks)
- Client-side processing (no server required)
- Responsive design for mobile and desktop
- GEDCOM 5.5.1 format support
- CSV parsing with flexible column mapping