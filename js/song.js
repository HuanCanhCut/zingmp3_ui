import getParams from './helpers/getParams.js'
import { listenEvent, sendEvent } from './helpers/event.js'

const playList = document.querySelector('.content__playlist-container')
const togglePlayBtn = document.querySelector('.toggle-play-btn')
const thumbnailImg = document.querySelector('.content__thumbnail__thumb-img')

const cdThumbAnimate = thumbnailImg.animate([{ transform: 'rotate(360deg)' }], {
    duration: 12000,
    iterations: Infinity,
})

cdThumbAnimate.pause()

const SongApp = {
    songs: [],
    currentIndex: Number(getParams('id')),
    isPlaying: false,
    async getSongs() {
        const res = await fetch('https://api.zingmp3.local/api/music')
        const data = await res.json()

        this.songs = data.musics
    },

    defineProperties() {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex]
            },
        })
    },

    renderPlaylist() {
        const html = this.songs.map((song, index) => {
            return `
                <div
                    class="song-item ${Number(this.currentIndex) === index ? 'active' : ''}"
                    data-index="${index}"
                >
                    <div class="song-item-wrapper">
                        <div class="song-item-wrapper-img">
                            <img
                                src="${song.thumbnail}"
                                alt=""
                            />
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <div class="song-item-info">
                            <p class="song-item-info-title">${song.name}</p>
                            <p class="song-item-info-artist">${song.artist}</p>
                        </div>
                    </div>
                    <div class="song-item-actions">
                        <button class="song-item-actions-btn song__item-heart">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>
            `
        })

        return html.join('')
    },

    loadCurrentSong() {
        playList.innerHTML = this.renderPlaylist()

        document.querySelector('.content__thumbnail__thumb-img').src = this.currentSong.thumbnail
        document.querySelector('.content__thumbnail-info-title').textContent = this.currentSong.name
        document.querySelector('.content__thumbnail-info-artist').textContent = this.currentSong.artist
    },

    handleEvent() {
        // play song when click
        playList.onclick = (e) => {
            const songIndex = e.target.closest('.song-item:not(.active)')?.getAttribute('data-index')

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

        listenEvent({
            eventName: 'song:is-playing',
            handler: ({ detail }) => {
                this.isPlaying = detail
                togglePlayBtn.textContent = this.isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'

                this.isPlaying ? cdThumbAnimate.play() : cdThumbAnimate.pause()
            },
        })

        togglePlayBtn.onclick = () => {
            this.isPlaying = !this.isPlaying
            togglePlayBtn.textContent = this.isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'

            this.isPlaying ? cdThumbAnimate.play() : cdThumbAnimate.pause()

            sendEvent({ eventName: 'song:play', detail: this.isPlaying })
        }
    },

    songActiveIntoView() {
        setTimeout(() => {
            const songActive = document.querySelector('.song-item.active')
            const songIndex = songActive.getAttribute('data-index')
            songActive.scrollIntoView({
                behavior: 'smooth',
                block: songIndex < 1 ? 'center' : 'nearest',
            })
        }, 200)
    },

    loadCurrentIndex() {
        const songId = getParams('id')

        if (songId) {
            return this.songs.findIndex((song) => song.id === Number(songId))
        }

        return this.currentIndex
    },

    async init() {
        await this.getSongs()
        this.currentIndex = this.loadCurrentIndex()
        this.defineProperties()
        this.loadCurrentSong()
        this.handleEvent()
    },
}

SongApp.init()
