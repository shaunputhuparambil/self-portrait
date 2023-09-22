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
const storageRef = firebase.storage().ref();

function resizeImage(file, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(callback, file.type);
    };
    img.src = URL.createObjectURL(file);
}

function makeMovable(element) {
    let offsetX, offsetY, isDown = false;

    element.addEventListener('mousedown', (e) => {
        isDown = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
    });

    document.addEventListener('mouseup', () => {
        isDown = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDown) {
            element.style.left = (e.clientX - offsetX) + 'px';
            element.style.top = (e.clientY - offsetY) + 'px';
        }
    });
}

function fetchData() {
    const contentContainer = document.getElementById('contentContainer');
    contentContainer.innerHTML = '';
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
                makeMovable(img);
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

            resizeImage(file, 500, 500, function(resizedBlob) {
                let fileRef = storageRef.child('uploads/' + file.name);

                fileRef.put(resizedBlob).then(snapshot => {
                    fileRef.getDownloadURL().then(url => {
                        db.collection("uploads").add({
                            fileName: file.name,
                            fileType: file.type,
                            fileUrl: url,
                            uploaderName: uploaderName
                        }).then(() => {
                            fetchData();
                        }).catch((error) => {
                            console.error("Error adding document: ", error);
                        });
                    });
                }).catch((error) => {
                    console.error("Error uploading file: ", error);
                });
            });
        }

        event.target.value = "";
        document.getElementById('uploaderName').value = "";
    });
});
