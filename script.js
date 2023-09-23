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

document.getElementById('importButton').addEventListener('click', function() {
    const uploaderName = document.getElementById('uploaderName').value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const date = document.getElementById('dateInput').value;
    const tags = document.getElementById('tagsInput').value.split(',').map(tag => tag.trim());

    if (uploaderName && file && date) {
        const storageRef = storage.ref(`uploads/${file.name}`);
        storageRef.put(file).then(snapshot => {
            snapshot.ref.getDownloadURL().then(downloadURL => {
                db.collection('uploads').add({
                    fileName: file.name,
                    fileType: file.type,
                    fileUrl: downloadURL,
                    uploaderName: uploaderName,
                    date: date,
                    tags: tags
                }).then(() => {
                    fetchData();
                });
            });
        });
    } else {
        alert('Please enter all required details and select a file to upload.');
    }
});

function fetchData() {
    const contentContainer = document.getElementById('contentContainer');
    contentContainer.innerHTML = '';

    let contributors = {};
    let allTags = [];
    let yearlyData = {};

    db.collection("uploads")
        .orderBy('date', 'asc')
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                let data = doc.data();

                if (data.uploaderName) {
                    if (contributors[data.uploaderName]) {
                        contributors[data.uploaderName] += 1;
                    } else {
                        contributors[data.uploaderName] = 1;
                    }
                }

                if (data.tags) {
                    allTags.push(...data.tags);
                }

                let div = document.createElement('div');
                div.className = "content";
                div.setAttribute('data-tags', data.tags.join(', '));

                if (data.fileType && data.fileType.startsWith("image/")) {
                    let img = document.createElement('img');
                    img.src = data.fileUrl;
                    img.alt = data.fileName;
                    div.appendChild(img);
                } else if (data.fileType === "application/pdf") {
                    let iframe = document.createElement('iframe');
                    iframe.src = data.fileUrl;
                    div.appendChild(iframe);
                }

                let pillDiv = document.createElement('div');
                pillDiv.className = "pill-outline";

                let pInfo = document.createElement('p');
                pInfo.className = "hotpink-text";
                pInfo.innerHTML = data.fileName;

                let uploaderInfo = document.createElement('span');
                uploaderInfo.className = "uploader";
                uploaderInfo.innerText = `Uploaded by: ${data.uploaderName}`;

                pillDiv.appendChild(pInfo);
                pillDiv.appendChild(uploaderInfo);
                div.appendChild(pillDiv);

                let year = new Date(data.date).getFullYear();
                if (!yearlyData[year]) {
                    yearlyData[year] = [];
                }
                yearlyData[year].push(div);
            });

            // Loop through the desired range of years
            for (let year = 2004; year <= 2023; year++) {
                let yearContainer = document.createElement('div');
                yearContainer.className = "year-container";

                let yearLabel = document.createElement('div');
                yearLabel.className = "year-label";
                yearLabel.innerText = year;
                yearContainer.appendChild(yearLabel);

                let itemsContainer = document.createElement('div');
                itemsContainer.className = "items-container";
                
                if (yearlyData[year]) {
                    yearlyData[year].forEach(item => itemsContainer.appendChild(item));
                }
                
                yearContainer.appendChild(itemsContainer);
                contentContainer.appendChild(yearContainer);
            }

            updateContributorsList(contributors);
            updateTagFilter(allTags);
        });
}

function updateTagFilter(tags) {
    const tagFilter = document.getElementById('tagFilter');
    // Clear existing options
    while(tagFilter.firstChild) {
        tagFilter.removeChild(tagFilter.firstChild);
    }

    // Add 'All' option
    let allOption = document.createElement('option');
    allOption.value = "";
    allOption.textContent = "all";
    tagFilter.appendChild(allOption);

    // Add unique tags
    let uniqueTags = [...new Set(tags)];
    uniqueTags.forEach(tag => {
        let option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

function filterByTag(selectedTag) {
    // Get all content elements
    let contents = document.getElementsByClassName('content');

    // Loop through all content elements and hide/show based on the selected tag
    for(let content of contents) {
        let contentTags = content.getAttribute('data-tags').split(', ');

        if (selectedTag === "" || contentTags.includes(selectedTag)) {
            content.style.display = 'block'; // Show content with matching tag or if 'all' is selected
        } else {
            content.style.display = 'none'; // Hide non-matching content
        }
    }
}

document.getElementById('tagFilter').addEventListener('change', function() {
    filterByTag(this.value);
});

function updateContributorsList(contributors) {
    const contributorsList = document.getElementById('contributorsList');
    contributorsList.innerHTML = '';

    for(let name in contributors) {
        let div = document.createElement('div');
        div.className = "contributor";
        
        let pName = document.createElement('p');
        pName.innerText = name;

        let pCount = document.createElement('p');
        pCount.innerText = `${contributors[name]} item${contributors[name] > 1 ? 's' : ''}`;

        div.appendChild(pName);
        div.appendChild(pCount);
        
        contributorsList.appendChild(div);
    }
}

// Fetch the data when the page loads
fetchData();
