// Configurazione Firebase - Dati reali del progetto
const firebaseConfig = {
  apiKey: "AIzaSyBek0A-fUWzmRdX1NVLhC9tzE2C9_VZEaI",
  authDomain: "dadi-311e5.firebaseapp.com",
  databaseURL: "https://dadi-311e5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dadi-311e5",
  storageBucket: "dadi-311e5.firebasestorage.app",
  messagingSenderId: "203636655353",
  appId: "1:203636655353:web:a9d8a032ed96ddc7c28e28"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);
window.database = firebase.database();


