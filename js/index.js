import { listenEvent, sendEvent } from './helpers/event.js'

const playlist = document.querySelector('.home__content_playlist')
const slider = document.querySelector('.home__content_slider')
const uploadBtn = document.querySelector('.home__content_playlist_upload-btn')
const modal = document.querySelector('#modal')
const overlay = document.querySelector('#overlay')

const homeApp = {
    songs: [],
    currentIndex: 0, // index of the current song

    async getSongs() {
        const token = localStorage.getItem('token')
        const res = await fetch('https://zing-api.huancanhcut.click/api/music', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

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
                            <i class="fa-solid fa-heart ${song.is_favorite ? 'active' : ''}"></i>
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
        playlist.onclick = async (e) => {
            if (!e.target.closest('.playlist__item-heart')) {
                const songIndex = e.target
                    .closest('.home__content_playlist-item:not(.active)')
                    ?.getAttribute('data-index')

                this.currentIndex = Number(songIndex)
                this.loadCurrentSong()
                sendEvent({ eventName: 'song:choose-song', detail: songIndex })
            }

            // if click heart button
            if (e.target.closest('.playlist__item-heart')) {
                const songIndex = Number(e.target.closest('.home__content_playlist-item')?.getAttribute('data-index'))

                this.handleFavoriteSong(songIndex)

                this.loadCurrentSong()
            }
        }

        uploadBtn.onclick = () => {
            const token = localStorage.getItem('token')

            if (!token) {
                // open login form
                sendEvent({
                    eventName: 'modal:open-auth-modal',
                })
                return
            }

            // open upload form
            modal.setAttribute('src', `./modal/upload_music_modal.html`)
            modal.classList.add('active')
            overlay.classList.add('active')
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

        listenEvent({
            eventName: 'music:add',
            handler: ({ detail }) => {
                const data = JSON.parse(detail)

                this.songs.unshift(data.data)
                this.loadCurrentSong()
            },
        })

        listenEvent({
            eventName: 'music:update',
            handler: ({ detail }) => {
                const data = JSON.parse(detail)

                const songIndex = this.songs.findIndex((song) => song.id === Number(data.data.id))
                this.songs[songIndex] = data.data

                const audioIsPlaying = !audio.paused

                this.loadCurrentSong()

                if (audioIsPlaying) {
                    audio.play()
                }
            },
        })
    },

    async handleFavoriteSong(songIndex) {
        const isFavorite = this.songs[songIndex].is_favorite

        // fetch api update favorite
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
            try {
                // remove favorite
                const res = await fetch(`https://zing-api.huancanhcut.click/api/favorite/${this.songs[songIndex].id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

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
