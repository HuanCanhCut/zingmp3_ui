// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js'
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyD8tsLhzP0_YoTARvfN1n_ncfozzOIOJHM',
    authDomain: 'zing-mp3-c8ea0.firebaseapp.com',
    projectId: 'zing-mp3-c8ea0',
    storageBucket: 'zing-mp3-c8ea0.firebasestorage.app',
    messagingSenderId: '1040520817780',
    appId: '1:1040520817780:web:6915f18a341148f7ea3521',
    measurementId: 'G-KME5X6JNGG',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
