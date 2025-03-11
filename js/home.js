import { listenEvent, sendEvent } from './helpers/event.js'

const playlist = document.querySelector('.home__content_playlist')
const slider = document.querySelector('.home__content_slider')

const homeApp = {
    songs: [],
    currentIndex: 0, // index of the current song

    async getSongs() {
        const res = await fetch('https://api.zingmp3.local/api/music')
        const data = await res.json()

        this.songs = data.musics
    },

    renderPlaylist() {
        const html = this.songs.map((song, index) => {
            return `
                <div class="home__content_playlist-item ${
                    Number(this.currentIndex) === index ? 'active' : ''
                }" data-index="${index}">
                    <div class="home__content_playlist-item-wrapper">
                        <div
                            class="home__content_playlist-item-wrapper-img"
                        >
                            <img
                                src="${song.thumbnail}"
                                alt=""
                            />
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <div class="home__content_playlist-item-info">
                            <p
                                class="home__content_playlist-item-info-title"
                            >
                                ${song.name}
                            </p>
                            <p
                                class="home__content_playlist-item-info-artist"
                            >
                                ${song.artist}
                            </p>
                        </div>
                    </div>
                    <div class="home__content_playlist-item-actions">
                        <button
                            class="home__content_playlist-item-actions-btn playlist__item-heart"
                        >
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>
            `
        })

        return html
    },

    renderSlider() {
        const imagesPath = this.songs.map((song) => song.thumbnail)
        const classMapping = {
            0: 'first',
            1: 'second',
            2: 'third',
            3: 'fourth',
            4: 'fifth',
        }
        const html = imagesPath.map((image, index) => {
            return `
                <img
                    class="home__content_slider-${index < 4 ? classMapping[index] : 'fifth'}"
                    src="${image}"
                    alt=""
                />`
        })
        slider.innerHTML = html.join('')
    },

    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex]
            },
        })
    },

    loadCurrentSong() {
        playlist.innerHTML = this.renderPlaylist().join('')
    },

    handleEvent() {
        // play song when click
        playlist.onclick = (e) => {
            const songIndex = e.target.closest('.home__content_playlist-item:not(.active)').getAttribute('data-index')
            if (!e.target.closest('.playlist__item-heart') && songIndex) {
                this.currentIndex = Number(songIndex)
                this.loadCurrentSong()
                sendEvent({ eventName: 'song:choose-song', detail: songIndex })
            }
        }

        listenEvent({
            eventName: 'song:next-song',
            handler: (e) => {
                this.currentIndex = e.detail
                this.loadCurrentSong()
                this.songActiveIntoView()
            },
        })

        listenEvent({
            eventName: 'song:prev-song',
            handler: (e) => {
                this.currentIndex = e.detail
                this.loadCurrentSong()
                this.songActiveIntoView()
            },
        })
    },

    songActiveIntoView() {
        setTimeout(() => {
            const songActive = document.querySelector('.home__content_playlist-item.active')
            const songIndex = songActive.getAttribute('data-index')
            songActive.scrollIntoView({
                behavior: 'smooth',
                block: songIndex < 1 ? 'center' : 'nearest',
            })
        }, 200)
    },

    handleSlider() {
        setInterval(() => {
            const firstSlide = document.querySelector('.home__content_slider-first')
            const secondSlide = document.querySelector('.home__content_slider-second')
            const thirdSlide = document.querySelector('.home__content_slider-third')
            const fourthSlide = document.querySelector('.home__content_slider-fourth')
            const fifthSlide = document.querySelectorAll('.home__content_slider-fifth')

            firstSlide.classList.replace('home__content_slider-first', 'home__content_slider-fifth')
            secondSlide.classList.replace('home__content_slider-second', 'home__content_slider-first')

            thirdSlide.classList.replace('home__content_slider-third', 'home__content_slider-second')

            fourthSlide.classList.replace('home__content_slider-fourth', 'home__content_slider-third')

            const randomIndex = Math.floor(Math.random() * fifthSlide.length)
            fifthSlide[randomIndex].classList.replace('home__content_slider-fifth', 'home__content_slider-fourth')
        }, 2500)
    },

    async init() {
        await this.getSongs()
        this.renderPlaylist()
        this.renderSlider()
        this.defineProperties()
        this.loadCurrentSong()
        this.handleEvent()
        this.handleSlider()
    },
}

homeApp.init()
