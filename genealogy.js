class GenealogyAnalyzer {
    constructor() {
        this.familyTree = null;
        this.dnaMatches = [];
        this.init();
    }

    init() {
        document.getElementById('gedcom-file').addEventListener('change', (e) => this.handleGedcomUpload(e));
        document.getElementById('dna-matches').addEventListener('change', (e) => this.handleDnaMatchesUpload(e));
    }

    handleGedcomUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const gedcomContent = e.target.result;
                this.familyTree = this.parseGedcom(gedcomContent);
                console.log('Family tree loaded:', this.familyTree);
                this.updateDisplay();
            } catch (error) {
                console.error('Error parsing GEDCOM:', error);
                alert('Error parsing GEDCOM file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }

    handleDnaMatchesUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                this.dnaMatches = this.parseDnaMatches(csvContent);
                console.log('DNA matches loaded:', this.dnaMatches);
                this.updateDisplay();
            } catch (error) {
                console.error('Error parsing DNA matches:', error);
                alert('Error parsing DNA matches file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }

    parseGedcom(gedcomContent) {
        const lines = gedcomContent.split('\n').map(line => line.trim()).filter(line => line);
        const individuals = {};
        const families = {};
        
        let currentRecord = null;
        let currentId = null;
        
        for (const line of lines) {
            const parts = line.split(' ');
            const level = parseInt(parts[0]);
            const tag = parts[1];
            const value = parts.slice(2).join(' ');
            
            if (level === 0) {
                if (tag.startsWith('@') && tag.endsWith('@')) {
                    currentId = tag.slice(1, -1);
                    const recordType = parts[2];
                    
                    if (recordType === 'INDI') {
                        currentRecord = {
                            id: currentId,
                            type: 'individual',
                            name: '',
                            birthDate: '',
                            deathDate: '',
                            sex: '',
                            parents: [],
                            children: [],
                            spouses: []
                        };
                        individuals[currentId] = currentRecord;
                    } else if (recordType === 'FAM') {
                        currentRecord = {
                            id: currentId,
                            type: 'family',
                            husband: '',
                            wife: '',
                            children: []
                        };
                        families[currentId] = currentRecord;
                    }
                }
            } else if (level === 1 && currentRecord) {
                switch (tag) {
                    case 'NAME':
                        currentRecord.name = value.replace(/\//g, '');
                        break;
                    case 'SEX':
                        currentRecord.sex = value;
                        break;
                    case 'HUSB':
                        currentRecord.husband = value.slice(1, -1);
                        break;
                    case 'WIFE':
                        currentRecord.wife = value.slice(1, -1);
                        break;
                    case 'CHIL':
                        currentRecord.children.push(value.slice(1, -1));
                        break;
                    case 'BIRT':
                    case 'DEAT':
                        // Will be followed by DATE on next line
                        break;
                }
            } else if (level === 2 && currentRecord) {
                if (tag === 'DATE') {
                    // Determine if this is birth or death based on previous line context
                    // For simplicity, we'll just store the first date as birth
                    if (!currentRecord.birthDate) {
                        currentRecord.birthDate = value;
                    } else if (!currentRecord.deathDate) {
                        currentRecord.deathDate = value;
                    }
                }
            }
        }
        
        // Link family relationships
        for (const family of Object.values(families)) {
            // Add children to parents
            if (family.husband && individuals[family.husband]) {
                individuals[family.husband].children.push(...family.children);
                family.children.forEach(childId => {
                    if (individuals[childId]) {
                        individuals[childId].parents.push(family.husband);
                    }
                });
            }
            if (family.wife && individuals[family.wife]) {
                individuals[family.wife].children.push(...family.children);
                family.children.forEach(childId => {
                    if (individuals[childId]) {
                        individuals[childId].parents.push(family.wife);
                    }
                });
            }
            
            // Add spouses
            if (family.husband && family.wife) {
                if (individuals[family.husband]) individuals[family.husband].spouses.push(family.wife);
                if (individuals[family.wife]) individuals[family.wife].spouses.push(family.husband);
            }
        }
        
        return { individuals, families };
    }

    parseDnaMatches(csvContent) {
        const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const matches = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const match = {};
            
            headers.forEach((header, index) => {
                match[header] = values[index] || '';
            });
            
            // Normalize common field names
            if (match.name || match['match name'] || match['display name']) {
                match.normalizedName = match.name || match['match name'] || match['display name'];
            }
            
            matches.push(match);
        }
        
        return matches;
    }

    findCommonAncestors(person1Id, person2Id) {
        if (!this.familyTree || !this.familyTree.individuals) return [];
        
        const ancestors1 = this.getAllAncestors(person1Id);
        const ancestors2 = this.getAllAncestors(person2Id);
        
        const commonAncestors = ancestors1.filter(ancestor => 
            ancestors2.some(a => a.id === ancestor.id)
        );
        
        return commonAncestors;
    }

    getAllAncestors(personId, visitedIds = new Set()) {
        if (!this.familyTree || !this.familyTree.individuals || visitedIds.has(personId)) {
            return [];
        }
        
        visitedIds.add(personId);
        const person = this.familyTree.individuals[personId];
        if (!person) return [];
        
        const ancestors = [person];
        
        // Recursively get ancestors through parents
        person.parents.forEach(parentId => {
            if (!visitedIds.has(parentId)) {
                ancestors.push(...this.getAllAncestors(parentId, visitedIds));
            }
        });
        
        return ancestors;
    }

    analyzeDnaMatches() {
        if (!this.familyTree || !this.dnaMatches.length) return;
        
        const results = {
            matchConnections: [],
            commonAncestors: [],
            unmatchedDnaNames: []
        };
        
        // Try to match DNA match names with family tree individuals
        const matchedIndividuals = [];
        
        this.dnaMatches.forEach(dnaMatch => {
            const matchName = dnaMatch.normalizedName || dnaMatch.name || '';
            const foundPerson = this.findPersonByName(matchName);
            
            if (foundPerson) {
                matchedIndividuals.push({
                    dnaMatch,
                    person: foundPerson
                });
            } else {
                results.unmatchedDnaNames.push(matchName);
            }
        });
        
        // Find common ancestors between matched individuals
        for (let i = 0; i < matchedIndividuals.length; i++) {
            for (let j = i + 1; j < matchedIndividuals.length; j++) {
                const match1 = matchedIndividuals[i];
                const match2 = matchedIndividuals[j];
                
                const commonAncestors = this.findCommonAncestors(match1.person.id, match2.person.id);
                
                if (commonAncestors.length > 0) {
                    results.matchConnections.push({
                        match1: match1.dnaMatch,
                        match2: match2.dnaMatch,
                        commonAncestors
                    });
                    
                    commonAncestors.forEach(ancestor => {
                        if (!results.commonAncestors.find(a => a.id === ancestor.id)) {
                            results.commonAncestors.push(ancestor);
                        }
                    });
                }
            }
        }
        
        return results;
    }

    findPersonByName(searchName) {
        if (!this.familyTree || !searchName) return null;
        
        const normalizedSearch = searchName.toLowerCase().replace(/[^\w\s]/g, '');
        
        for (const person of Object.values(this.familyTree.individuals)) {
            const personName = person.name.toLowerCase().replace(/[^\w\s]/g, '');
            if (personName.includes(normalizedSearch) || normalizedSearch.includes(personName)) {
                return person;
            }
        }
        
        return null;
    }

    updateDisplay() {
        document.querySelector('.analysis-section').style.display = 'block';
        
        if (this.familyTree && this.dnaMatches.length > 0) {
            const results = this.analyzeDnaMatches();
            this.displayResults(results);
        } else {
            this.displayResults(null);
        }
    }

    displayResults(results) {
        // Display DNA matches
        const matchesList = document.getElementById('matches-list');
        if (this.dnaMatches.length > 0) {
            matchesList.innerHTML = this.dnaMatches.slice(0, 10).map(match => 
                `<div class="match-item">
                    <strong>${match.normalizedName || 'Unknown'}</strong>
                    ${match.relationship ? `<br><small>Relationship: ${match.relationship}</small>` : ''}
                </div>`
            ).join('') + (this.dnaMatches.length > 10 ? `<p><small>... and ${this.dnaMatches.length - 10} more</small></p>` : '');
        } else {
            matchesList.innerHTML = '<p>Upload CSV file to see DNA matches</p>';
        }
        
        // Display family tree info
        const ancestorsList = document.getElementById('ancestors-list');
        if (results && results.commonAncestors.length > 0) {
            ancestorsList.innerHTML = results.commonAncestors.map(ancestor => 
                `<div class="ancestor-item">
                    <strong>${ancestor.name}</strong>
                    ${ancestor.birthDate ? `<br><small>Born: ${ancestor.birthDate}</small>` : ''}
                    ${ancestor.deathDate ? `<br><small>Died: ${ancestor.deathDate}</small>` : ''}
                </div>`
            ).join('');
        } else if (this.familyTree && Object.keys(this.familyTree.individuals).length > 0) {
            const individuals = Object.values(this.familyTree.individuals).slice(0, 5);
            ancestorsList.innerHTML = `<p><strong>Family tree loaded:</strong> ${Object.keys(this.familyTree.individuals).length} individuals</p>` +
                individuals.map(person => 
                    `<div class="ancestor-item">
                        <strong>${person.name}</strong>
                        ${person.birthDate ? `<br><small>Born: ${person.birthDate}</small>` : ''}
                    </div>`
                ).join('') +
                (Object.keys(this.familyTree.individuals).length > 5 ? '<p><small>Upload DNA matches to find connections</small></p>' : '');
        } else {
            ancestorsList.innerHTML = '<p>Upload GEDCOM file to see family tree</p>';
        }
        
        // Display match connections
        const connectionsList = document.getElementById('connections-list');
        if (results && results.matchConnections.length > 0) {
            connectionsList.innerHTML = results.matchConnections.map(connection => 
                `<div class="connection-item">
                    <strong>${connection.match1.normalizedName || 'Match 1'}</strong> and 
                    <strong>${connection.match2.normalizedName || 'Match 2'}</strong>
                    <br><small>Share ${connection.commonAncestors.length} common ancestor(s): 
                    ${connection.commonAncestors.map(a => a.name).join(', ')}</small>
                </div>`
            ).join('');
        } else if (this.familyTree && this.dnaMatches.length > 0) {
            connectionsList.innerHTML = '<p>No connections found between DNA matches and family tree</p>';
        } else {
            connectionsList.innerHTML = '<p>Upload both files to find connections</p>';
        }
    }
}

// Initialize the application
const analyzer = new GenealogyAnalyzer();