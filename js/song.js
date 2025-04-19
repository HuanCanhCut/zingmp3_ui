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
        const token = localStorage.getItem('token')
        let res = await fetch('https://zing-api.huancanhcut.click/api/music', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!res.ok) {
            localStorage.removeItem('token')

            if (res.status === 401) {
                res = await fetch('https://zing-api.huancanhcut.click/api/music')

                if (!res.ok) {
                    toast({
                        title: 'Lỗi',
                        message: 'Có lỗi xảy ra khi lấy danh sách bài hát',
                        type: 'error',
                    })
                }
            }
        }

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
                            <i class="fa-solid fa-heart ${song.is_favorite ? 'active' : ''}"></i>
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
        playList.onclick = async (e) => {
            if (!e.target.closest('.song__item-heart')) {
                const songIndex = e.target.closest('.song-item:not(.active)')?.getAttribute('data-index')

                if (!songIndex) return

                this.currentIndex = Number(songIndex)
                this.loadCurrentSong()
                sendEvent({ eventName: 'song:choose-song', detail: songIndex })
            }

            if (e.target.closest('.song__item-heart')) {
                const songIndex = e.target.closest('.song-item')?.getAttribute('data-index')

                const isFavorite = this.songs[songIndex].is_favorite

                const token = localStorage.getItem('token')

                if (!token) {
                    sendEvent({
                        eventName: 'modal:open-auth-modal',
                    })
                    return
                }

                this.songs[songIndex].is_favorite = !isFavorite
                // add favorite
                if (!isFavorite) {
                    try {
                        const res = await fetch(`https://zing-api.huancanhcut.click/api/favorite`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                song_id: this.songs[songIndex].id,
                            }),
                        })

                        if (!res.ok) {
                            const errorData = await res.json()
                            throw new Error(errorData.message || `HTTP error! Status: ${res.status}`)
                        }

                        sendEvent({
                            eventName: 'favorite:add',
                            detail: this.songs[songIndex].id,
                        })
                    } catch (error) {
                        toast({
                            title: 'Thất bại',
                            message: error.message,
                            type: 'error',
                        })
                    }
                } else {
                    // remove favorite
                    try {
                        const res = await fetch(
                            `https://zing-api.huancanhcut.click/api/favorite/${this.songs[songIndex].id}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        )

                        if (!res.ok) {
                            const errorData = await res.json()
                            throw new Error(errorData.message || `HTTP error! Status: ${res.status}`)
                        }

                        sendEvent({
                            eventName: 'favorite:remove',
                            detail: this.songs[songIndex].id,
                        })
                    } catch (error) {
                        toast({
                            title: 'Thất bại',
                            message: error.message,
                            type: 'error',
                        })
                    }
                }

                this.loadCurrentSong()
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

        listenEvent({
            eventName: 'favorite:choose-song',
            handler: (e) => {
                const songIndex = this.songs.findIndex((song) => song.id === Number(e.detail))
                this.currentIndex = songIndex
                this.loadCurrentSong()
            },
        })

        listenEvent({
            eventName: 'favorite:add',
            handler: (e) => {
                const songIndex = this.songs.findIndex((song) => song.id === Number(e.detail))
                this.songs[songIndex].is_favorite = true
                this.loadCurrentSong()
            },
        })

        listenEvent({
            eventName: 'favorite:remove',
            handler: (e) => {
                const songIndex = this.songs.findIndex((song) => song.id === Number(e.detail))
                this.songs[songIndex].is_favorite = false
                this.loadCurrentSong()
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
