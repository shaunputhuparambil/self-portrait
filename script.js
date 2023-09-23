// Firebase configuration and initialization
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

function fetchData() {
    const contentContainer = document.getElementById('contentContainer');
    contentContainer.innerHTML = ''; // This will clear previous content
    
    db.collection("uploads").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let div = document.createElement('div');
            div.className = "content";
            
            if (data.fileType.startsWith("image/")) {
                let img = document.createElement('img');
                img.src = data.fileUrl;
                img.alt = data.fileName;
                div.appendChild(img);
                let pInfo = document.createElement('p');
                pInfo.innerHTML = `${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span>`;
                div.appendChild(pInfo);
            } else if (data.fileType === "application/pdf") {
                let iframe = document.createElement('iframe');
                iframe.src = data.fileUrl;
                div.appendChild(iframe);
                let pInfo = document.createElement('p');
                pInfo.innerHTML = `${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span>`;
                div.appendChild(pInfo);
            }

            contentContainer.appendChild(div);
            makeDraggable(div);  // Now, making the div draggable
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.getElementById('importButton').addEventListener('click', function() {
        const uploaderName = document.getElementById('uploaderName').value.trim();

        if (!uploaderName) {
            alert('Please enter your name before uploading.');
            return;
        }

        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', function(event) {
        const uploaderName = document.getElementById('uploaderName').value.trim();
        const files = event.target.files;

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            
            // Create a reference in Firebase storage using a unique name
            const storageRef = storage.ref().child('uploads/' + Date.now() + '-' + file.name);

            // Upload the file to Firebase storage
            storageRef.put(file).then(snapshot => {
                return snapshot.ref.getDownloadURL(); // Once uploaded, get the download URL
            }).then(downloadURL => {
                // Store the download URL in Firestore
                return db.collection("uploads").add({
                    fileName: file.name,
                    fileType: file.type,
                    fileUrl: downloadURL,
                    uploaderName: uploaderName
                });
            }).then(() => {
                fetchData(); // Refresh displayed files
            }).catch(error => {
                console.error("Error adding document: ", error);
            });
        }

        // Clear the input for repeated use
        event.target.value = "";
        document.getElementById('uploaderName').value = "";
    });
});

function makeDraggable(elem) {
    let offsetX, offsetY, isDragging = false;

    elem.draggable = true;

    elem.addEventListener('dragstart', function(e) {
        isDragging = true;
        offsetX = e.clientX - elem.getBoundingClientRect().left;
        offsetY = e.clientY - elem.getBoundingClientRect().top;
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
    });

    elem.addEventListener('dragend', function(e) {
        isDragging = false;
    });

    document.addEventListener('dragover', function(e) {
        e.preventDefault(); // Prevent default to allow drop
        if (isDragging) {
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            elem.style.left = x + 'px';
            elem.style.top = y + 'px';
        }
    });
}


