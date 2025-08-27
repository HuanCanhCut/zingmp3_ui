import { listenEvent, sendEvent } from './helpers/event.js'
import getCurrentUser from './getCurrentUser.js'
import * as axiosClient from '../config/axiosClient.js'

const topSong = document.querySelector('.content__top-song')
const toggleMoreBtn = document.querySelector('.content__top-song-toggle')

const COUNT_SONGS = 5

const topSongs = {
    currentUser: null,
    songs: [],
    count: COUNT_SONGS,

    currentIndex: 0,

    async getSongs() {
        try {
            let res = await axiosClient.get('/musics/top')

            sendEvent({
                eventName: 'music:new-songs',
                detail: res.data,
            })

            this.songs = res.data.songs
        } catch (error) {}
    },

    defineProperties() {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex]
            },
        })
    },

    renderSongs(count = this.songs.length) {
        count < this.songs.length ? (toggleMoreBtn.textContent = 'Xem thêm') : (toggleMoreBtn.textContent = 'Thu gọn')

        return this.songs.slice(0, count).map((song, index) => {
            return `
                <div
                    class="content_playlist-item ${Number(this.currentIndex) === index ? 'active' : ''}"
                    data-index="${index}"
                >
                    <div class="content_playlist-item-wrapper">
                        <div class="content_playlist-item-level">
                            <h1 class="${
                                index + 1 === 1 ? 'first' : index + 1 === 2 ? 'second' : index + 1 === 3 ? 'third' : ''
                            }">${index + 1}</h1>
                            <span><i class="fa-solid fa-minus"></i></span>
                        </div>
                        <div class="content_playlist-item-wrapper-img">
                            <img
                                src="${song.thumbnail}"
                                alt=""
                            />
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <div class="content_playlist-item-info">
                            <p class="content_playlist-item-info-title">${song.name}</p>
                            <p class="content_playlist-item-info-artist">${song.artist}</p>
                        </div>
                    </div>
                    <div class="content_playlist-item-actions">
                        <button class="content_playlist-item-actions-btn playlist__item-heart">
                            <i class="fa-solid fa-heart ${song.is_favorite ? 'active' : ''}"></i>
                        </button>
                    </div>
                </div>

            `
        })
    },

    loadCurrentSong() {
        topSong.innerHTML = this.renderSongs(this.count).join('')
    },

    handleEvent() {
        topSong.onclick = (e) => {
            if (!e.target.closest('.playlist__item-heart')) {
                const songIndex = e.target.closest('.content_playlist-item:not(.active)')?.getAttribute('data-index')

                if (!songIndex) return

                this.currentIndex = Number(songIndex)
                this.loadCurrentSong()
                sendEvent({ eventName: 'song:choose-song', detail: songIndex })
            }

            // if click heart button
            if (e.target.closest('.playlist__item-heart')) {
                const songIndex = Number(e.target.closest('.content_playlist-item')?.getAttribute('data-index'))

                this.handleFavoriteSong(songIndex)

                this.loadCurrentSong()
            }
        }

        toggleMoreBtn.onclick = () => {
            this.count = this.count === this.songs.length ? COUNT_SONGS : this.songs.length
            this.loadCurrentSong()
        }

        listenEvent({
            eventName: 'song:next-song',
            handler: (e) => {
                this.currentIndex = e.detail
                if (this.count <= this.currentIndex) {
                    console.log({
                        count: this.count,
                        currentIndex: this.currentIndex,
                    })
                    toggleMoreBtn.click()
                }
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
    },

    songActiveIntoView() {
        setTimeout(() => {
            const songActive = document.querySelector('.content_playlist-item.active')
            songActive.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }, 200)
    },

    async handleFavoriteSong(songIndex) {
        const isFavorite = this.songs[songIndex].is_favorite

        if (!this.currentUser) {
            sendEvent({
                eventName: 'modal:open-auth-modal',
            })
            return
        }

        this.songs[songIndex].is_favorite = !isFavorite

        // add favorite
        if (!isFavorite) {
            try {
                await axiosClient.post('/favorites', {
                    song_id: this.songs[songIndex].id,
                })

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
            try {
                await axiosClient.del(`/favorites/${this.songs[songIndex].id}`)

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
    },

    async init() {
        this.currentUser = await getCurrentUser()

        await this.getSongs()
        this.defineProperties()
        this.loadCurrentSong()
        this.handleEvent()
    },
}

topSongs.init()
