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
    contentContainer.innerHTML = '';
    makeDraggable(div);
    db.collection("uploads").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let div = document.createElement('div');
            div.className = "content";
            makeDraggable(div);
            if (data.fileType.startsWith("image/")) {
                let img = document.createElement('img');
                img.src = data.fileUrl;
                img.alt = data.fileName;
                div.appendChild(img);
                div.innerHTML += `<p>${data.fileName}<br><span class="uploader">Uploaded by: ${data.uploaderName}</span></p>`;
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
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elem.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        elem.style.cursor = 'grabbing';
    }

    function elementDrag(e) {
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elem.style.top = (elem.offsetTop - pos2) + "px";
        elem.style.left = (elem.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        elem.style.cursor = 'grab';
    }
}


