const firebaseConfig = {
    apiKey: "AIzaSyC1Qe0aZgdIO6n3rrD4EkaNL0ok_IHT6-s",
    authDomain: "self-portrait-a1548.firebaseapp.com",
    projectId: "self-portrait-a1548",
    storageBucket: "self-portrait-a1548.appspot.com",
    messagingSenderId: "572864480055",
    appId: "1:572864480055:web:19b360db9ad590c39d50b2",
    measurementId: "G-VTN8EX1LYL"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

document.getElementById('importButton').addEventListener('click', handleImportClick);

async function handleImportClick() {
    const uploaderName = getInputValue('uploaderName');
    const file = getInputFiles('fileInput')[0];
    const date = getInputValue('dateInput');
    const tags = getTagsFromInput('tagsInput');
    const description = getInputValue('descriptionInput');
    const location = getInputValue('locationInput'); // Get location input

    if (isValidInput(uploaderName, file, date, location)) {
        try {
            // Parse coordinates from location
            const coordinates = await parseCoordinates(location); // Await here
            
            if (coordinates) {
                // Create a marker and add it to the map
                L.marker(coordinates)
                    .addTo(map)
                    .bindPopup(`<strong>${uploaderName}</strong><br>${location}`)
                    .openPopup();
            }

            const downloadURL = await uploadFileToStorage(file);
            await addToDatabase({
                fileName: file.name,
                fileType: file.type,
                fileUrl: downloadURL,
                uploaderName: uploaderName,
                date: date,
                tags: tags,
                description: description,
                location: location // Add location to the data object
            });

            fetchData();
        } catch (error) {
            console.error('Error during import:', error);
            alert('An error occurred during import. Please try again.');
        }
    } else {
        alert('Please enter all required details and select a file to upload.');
    }
}

function getInputValue(id) {
    return document.getElementById(id).value;
}

function getInputFiles(id) {
    return document.getElementById(id).files;
}

function getTagsFromInput(id) {
    return getInputValue(id).split(',').map(tag => tag.trim());
}

function isValidInput(uploaderName, file, date) {
    return uploaderName && file && date;
}

function uploadFileToStorage(file) {
    const storageRef = storage.ref(`uploads/${file.name}`);
    return storageRef.put(file)
        .then(snapshot => snapshot.ref.getDownloadURL());
}

function addToDatabase(data) {
    return db.collection('uploads').add(data);
}

function fetchData() {
    const contentContainer = clearElement('contentContainer');

    const state = {
        contributors: {},
        allTags: [],
        yearlyData: {}
    };

    db.collection("uploads")
        .orderBy('date', 'asc')
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => processDocument(doc, state));
            renderYears(contentContainer, state.yearlyData);
            updateContributorsList(state.contributors);
            updateTagButtons(state.allTags);
        });
}

function processDocument(doc, state) {
    const data = doc.data();
    updateContributors(data.uploaderName, state.contributors);
    appendTags(data.tags, state.allTags);
    appendContent(data, state.yearlyData);
}

function updateContributors(name, contributors) {
    if (name) {
        if (contributors[name]) {
            contributors[name] += 1;
        } else {
            contributors[name] = 1;
        }
    }
}

function appendTags(tags, allTags) {
    if (tags && tags.length) {
        const cleanedTags = tags.filter(tag => tag && tag.trim() !== "");
        allTags.push(...cleanedTags);
    }
}

function appendContent(data, yearlyData) {
    const content = createContentElement(data);
    const year = new Date(data.date).getFullYear();
    yearlyData[year] = yearlyData[year] || [];
    yearlyData[year].push(content);
}

function createContentElement(data) {
    const div = document.createElement('div');
    div.className = "content";
    div.setAttribute('data-tags', data.tags.join(', '));

    div.addEventListener('click', function() {  // Add an event listener to show the content detail box
        showContentDetailBox(data);
    });

    if (data.fileType && data.fileType.startsWith("image/")) {
        const img = document.createElement('img');
        img.src = data.fileUrl;
        img.alt = data.fileName;
        div.appendChild(img);
    } else if (data.fileType === "application/pdf") {
        const iframe = document.createElement('iframe');
        iframe.src = data.fileUrl;
        div.appendChild(iframe);
    }

    const pillDiv = createPillElement(data);
    div.appendChild(pillDiv);
    return div;
}

// Function to display the content detail overlay
function showContentDetailBox(data) {
    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    // Create the content detail box
    const detailBox = document.createElement('div');
    detailBox.className = 'detail-box';


    // Content display (image or pdf)
    if (data.fileType && data.fileType.startsWith("image/")) {
        const img = document.createElement('img');
        img.src = data.fileUrl;
        img.alt = data.fileName;
        detailBox.appendChild(img);
    } else if (data.fileType === "application/pdf") {
        const iframe = document.createElement('iframe');
        iframe.src = data.fileUrl;
        detailBox.appendChild(iframe);
    }

    // Content title (using file name as title)
    const title = document.createElement('h2');
    title.textContent = data.fileName;
    detailBox.appendChild(title);

    // Content description
    const description = document.createElement('p');
    description.textContent = data.description;
    detailBox.appendChild(description);

    // Associated tags
    const validTags = data.tags.filter(tag => tag && tag.trim() !== "");

    if (validTags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.style.display = 'flex';
        tagsContainer.style.flexWrap = 'wrap';
        tagsContainer.style.gap = '10px';  // spacing between tags

        data.tags.forEach(tag => {
            const tagDiv = document.createElement('div');
            tagDiv.textContent = tag;
        
            // Styling for the pink pill
            tagDiv.style.background = 'hotpink';
            tagDiv.style.color = 'white';
            tagDiv.style.padding = '5px 10px';
            tagDiv.style.borderRadius = '20px';
            tagDiv.style.fontSize = '14px';

            tagsContainer.appendChild(tagDiv);
        });

        detailBox.appendChild(tagsContainer);
    }

    // Close button
    const closeButton = document.createElement('span');
    closeButton.textContent = 'X';
    closeButton.className = 'close-button';
    closeButton.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    detailBox.appendChild(closeButton);

    // Append detail box to overlay and then overlay to body
    overlay.appendChild(detailBox);
    document.body.appendChild(overlay);
}

function createPillElement(data) {
    const pillDiv = document.createElement('div');
    pillDiv.className = "pill-outline";

    const pInfo = document.createElement('p');
    pInfo.className = "hotpink-text";
    pInfo.innerHTML = data.fileName;
    pillDiv.appendChild(pInfo);

    const uploaderInfo = document.createElement('span');
    uploaderInfo.className = "uploader";
    uploaderInfo.innerText = `Uploaded by: ${data.uploaderName}`;
    pillDiv.appendChild(uploaderInfo);

    return pillDiv;
}

function renderYears(container, yearlyData) {
    for (let year = 2004; year <= 2023; year++) {
        const yearContainer = document.createElement('div');
        yearContainer.className = "year-container";

        const yearLabel = document.createElement('div');
        yearLabel.className = "year-label";
        yearLabel.innerText = year;
        yearContainer.appendChild(yearLabel);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = "items-container";

        if (yearlyData[year]) {
            yearlyData[year].forEach(item => itemsContainer.appendChild(item));
        }

        yearContainer.appendChild(itemsContainer);
        container.appendChild(yearContainer);
    }
}

function updateTagButtons(tags) {
    const tagButtonsContainer = clearElement('tagButtonsContainer');

    addAllTagButton(tagButtonsContainer);
    const uniqueTags = [...new Set(tags)];
    uniqueTags.forEach(tag => addTagButton(tagButtonsContainer, tag));
}

function addAllTagButton(container) {
    const button = document.createElement('button');
    button.textContent = "All";
    button.addEventListener('click', function () {
        filterByTag("");  // clear filtering
    });
    container.appendChild(button);
}

function addTagButton(container, tag) {
    const button = document.createElement('button');
    button.textContent = tag;
    button.addEventListener('click', function () {
        filterByTag(tag);
        moveImageToStart(tag);
    });
    container.appendChild(button);
}

function filterByTag(selectedTag) {
    const contents = document.getElementsByClassName('content');
    for (let content of contents) {
        const contentTags = content.getAttribute('data-tags').split(', ');

        if (selectedTag === "" || contentTags.includes(selectedTag)) {
            content.style.opacity = '1';
            content.style.filter = 'none';
        } else {
            content.style.opacity = '0.5';
            content.style.filter = 'blur(3px)';
        }
    }
}

function moveImageToStart(selectedTag) {
    const contents = document.getElementsByClassName('content');
    for (let content of contents) {
        const contentTags = content.getAttribute('data-tags').split(', ');

        if (selectedTag === "" || contentTags.includes(selectedTag)) {
            content.parentElement.prepend(content);
        }
    }
}

function updateContributorsList(contributors) {
    const contributorsList = clearElement('contributorsList');

    for (let name in contributors) {
        const div = document.createElement('div');
        div.className = "contributor";

        const pName = document.createElement('p');
        pName.innerText = name;
        div.appendChild(pName);

        const pCount = document.createElement('p');
        pCount.innerText = `${contributors[name]} item${contributors[name] > 1 ? 's' : ''}`;
        div.appendChild(pCount);

        contributorsList.appendChild(div);
    }
}

function clearElement(id) {
    const element = document.getElementById(id);
    element.innerHTML = '';
    return element;
}

// Initialize the map
const map = L.map('map').setView([0, 0], 2); // Set initial view coordinates and zoom level

// Add a tile layer (you can choose different tile providers)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

async function parseCoordinates(location) {
    const apiKey = '4ee3bd790558475696aa9e19adc7f1c5';
    const encodedLocation = encodeURIComponent(location);
    const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodedLocation}&key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from the geocoding API: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const firstResult = data.results[0];

            if (firstResult.geometry) {
                const latitude = firstResult.geometry.lat;
                const longitude = firstResult.geometry.lng;
                return [latitude, longitude];
            } else {
                console.error('No geometry information found in API response.');
                return null;
            }
        } else {
            console.error('No results found in API response.');
            return null;
        }
    } catch (error) {
        console.error('Error while fetching or parsing coordinates:', error);
        return null;
    }
}

fetchData();

