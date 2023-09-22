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
const analytics = firebase.analytics();
const db = firebase.firestore();
const storage = firebase.storage();

// Function to retrieve data from Firestore and display it
function fetchData() {
    const contentContainer = document.getElementById('contentContainer');
    db.collection("uploads").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let div = document.createElement('div');
            div.className = "content";

            if (data.fileType.startsWith("image/")) {
                div.innerHTML = `<img src="${data.fileUrl}" alt="${data.fileName}"><p>${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span></p>`;
            } else if (data.fileType === "application/pdf") {
                div.innerHTML = `<iframe src="${data.fileUrl}"></iframe><p>${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span></p>`;
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

    document.getElementById('fileInput').addEventListener('change', function(event) {
        const uploaderName = document.getElementById('uploaderName').value.trim();
        const files = event.target.files;
        const storageRef = storage.ref();

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let fileRef = storageRef.child('uploads/' + file.name);

            fileRef.put(file).then(snapshot => {
                return snapshot.ref.getDownloadURL();
            }).then(downloadURL => {
                return db.collection("uploads").add({
                    fileName: file.name,
                    fileType: file.type,
                    fileUrl: downloadURL,
                    uploaderName: uploaderName
                });
            }).then((docRef) => {
                fetchData();
            }).catch((error) => {
                console.error("Error uploading or adding document: ", error);
            });
        }

        event.target.value = "";
        document.getElementById('uploaderName').value = "";
    });
});
