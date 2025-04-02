// listen event audio change
const audioInput = document.getElementById('audio')

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0]

    document.querySelector('#song_url').value = file.name
})

const urlParams = new URLSearchParams(window.location.search)

const id = urlParams.get('id')
const name = urlParams.get('name')
const artist = urlParams.get('artist')
const thumbnail = urlParams.get('thumbnail')
const songUrl = urlParams.get('song_url')

const songUrlInput = document.getElementById('song_url')

songUrlInput.value = songUrl

document.getElementById('name').value = name
document.getElementById('artist').value = artist
document.getElementById('thumbnail').value = thumbnail
