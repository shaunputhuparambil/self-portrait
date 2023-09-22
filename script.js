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
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics(app);

// References to Firestore and Storage
const db = firebase.firestore();
const storage = firebase.storage().ref();

// Function to retrieve data from Firestore and display it
function fetchData() {
    const contentContainer = document.getElementById('contentContainer');
    db.collection("uploads").orderBy('timestamp', 'desc').get().then((querySnapshot) => {
        contentContainer.innerHTML = ""; // clear current content
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let div = document.createElement('div');
            div.className = "content";

            if (data.fileName.endsWith(".jpg") || data.fileName.endsWith(".png")) {
                div.innerHTML = `<img src="${data.fileURL}" alt="${data.fileName}"><p>${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span></p>`;
            } else if (data.fileName.endsWith(".pdf")) {
                div.innerHTML = `<iframe src="${data.fileURL}"></iframe><p>${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span></p>`;
            }

            contentContainer.appendChild(div);
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

    document.getElementById('fileInput').addEventListener('change', async function(event) {
        const uploaderName = document.getElementById('uploaderName').value.trim();
        const files = event.target.files;

        for(let i = 0; i < files.length; i++) {
            let file = files[i];

            // Store file in Firebase Storage
            let storageRef = storage.child('uploads/' + file.name);
            await storageRef.put(file);
            
            let downloadURL = await storageRef.getDownloadURL();

            // Save the file data in Firestore
            await db.collection('uploads').add({
                fileName: file.name,
                fileURL: downloadURL,
                uploaderName: uploaderName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Clear the input for repeated use
        event.target.value = "";
        document.getElementById('uploaderName').value = "";
        
        fetchData(); // Refresh displayed content
    });
});
