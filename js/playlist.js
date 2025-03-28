import { listenEvent, sendEvent } from './helpers/event.js'
import getParams from './helpers/getParams.js'

const playerCdThumb = document.querySelector('.music__player-info-thumb')
const overlay = document.querySelector('#overlay')
const openPlaylistSidebarBtn = document.querySelector('.open-playlist-sidebar')
const playlistSidebar = document.querySelector('#playlist-sidebar')
const togglePlayBtn = document.querySelector('.btn-toggle-play')
const audio = document.querySelector('#music__player-audio')
const progress = document.querySelector('#music__player-control-progress')
const nextSongBtn = document.querySelector('.btn-next')
const prevSongBtn = document.querySelector('.btn-prev')
const randomSongBtn = document.querySelector('.btn-random')
const repeatSongBtn = document.querySelector('.btn-repeat')

const cdThumbAnimate = playerCdThumb.animate([{ transform: 'rotate(360deg)' }], {
    duration: 12000,
    iterations: Infinity,
})

cdThumbAnimate.pause()

const playerController = {
    songs: [],
    currentIndex: 0, // index of the current song
    isPlaying: false,
    playerIndexes: [],
    isRandom: localStorage.getItem('isRandom') === 'true' || false,
    isRepeat: localStorage.getItem('isRepeat') === 'true' || false,

    async getSongs() {
        const token = localStorage.getItem('token')
        const res = await fetch('https://zing-api.huancanhcut.click/api/music', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!res.ok) {
            localStorage.removeItem('token')
            return
        }

        const data = await res.json()

        this.songs = data.musics

        const songId = getParams('id')

        if (songId) {
            this.currentIndex = this.songs.findIndex((song) => song.id === Number(songId))
        }
    },

    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex]
            },
        })
    },

    loadCurrentSong() {
        const currentSong = this.currentSong

        audio.src = currentSong.url

        playerCdThumb.src = currentSong.thumbnail

        document.querySelector('.music__player-info-title-name').textContent = currentSong.name
        document.querySelector('.music__player-info-title-artist').textContent = currentSong.artist
    },

    loadConfig() {
        randomSongBtn.classList.toggle('active', this.isRandom)
        repeatSongBtn.classList.toggle('active', this.isRepeat)
    },

    handleEvent() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                playlistSidebar.classList.remove('active')
                overlay.classList.remove('active')
            }
        })

        openPlaylistSidebarBtn.onclick = () => {
            playlistSidebar.classList.add('active')
            overlay.classList.add('active')
        }

        overlay.onclick = () => {
            playlistSidebar.classList.remove('active')
            overlay.classList.remove('active')
        }

        togglePlayBtn.onclick = () => {
            this.isPlaying ? audio.pause() : audio.play()
        }

        audio.onplay = () => {
            this.isPlaying = true
            togglePlayBtn.classList.add('playing')
            this.isPlaying = true
            cdThumbAnimate.play()

            sendEvent({ eventName: 'song:is-playing', detail: true })

            // increase view count of current song
            fetch(`https://zing-api.huancanhcut.click/api/music/${this.currentSong.id}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    song_id: this.currentSong.id,
                }),
            })
        }

        audio.onpause = () => {
            this.isPlaying = false
            togglePlayBtn.classList.remove('playing')
            this.isPlaying = false
            cdThumbAnimate.pause()

            sendEvent({ eventName: 'song:is-playing', detail: false })
        }

        progress.oninput = () => {
            const seek = (audio.duration / 100) * progress.value
            audio.currentTime = seek
        }

        audio.ontimeupdate = function () {
            const progressPercent = (audio.currentTime / audio.duration) * 100
            if (audio.duration) {
                progress.value = progressPercent
                function getSongDuration(song) {
                    let minutes = Math.floor(song.duration / 60)
                    let seconds = Math.floor(song.duration - minutes * 60)
                    if (seconds < 10) {
                        return minutes + ':0' + seconds
                    }
                    return minutes + ':' + seconds
                }
                document.querySelector('.duration-song').innerText = getSongDuration(audio)
            }

            function getCurrentTime(song) {
                let minutes = Math.floor(song.currentTime / 60)
                let seconds = Math.floor(song.currentTime - minutes * 60)

                if (seconds < 10) {
                    return minutes + ':0' + seconds
                }

                return minutes + ':' + seconds
            }
            document.querySelector('.current-time').innerText = getCurrentTime(audio)
        }

        nextSongBtn.onclick = () => {
            if (this.isRandom) {
                this.randomSong()
            }
            this.nextSong()

            audio.play()
            sendEvent({ eventName: 'song:next-song', detail: this.currentIndex })
        }

        prevSongBtn.onclick = () => {
            if (this.isRandom) {
                this.randomSong()
            }
            this.prevSong()
            audio.play()
            sendEvent({ eventName: 'song:prev-song', detail: this.currentIndex })
        }

        randomSongBtn.onclick = () => {
            this.isRandom = !this.isRandom

            if (this.isRandom) {
                this.isRepeat = false
                repeatSongBtn.classList.remove('active')
                localStorage.setItem('isRepeat', this.isRepeat)
            }

            randomSongBtn.classList.toggle('active', this.isRandom)
            localStorage.setItem('isRandom', this.isRandom)
        }

        repeatSongBtn.onclick = () => {
            this.isRepeat = !this.isRepeat
            if (this.isRepeat) {
                this.isRandom = false
                randomSongBtn.classList.remove('active')
                localStorage.setItem('isRandom', this.isRandom)
            }

            repeatSongBtn.classList.toggle('active', this.isRepeat)
            localStorage.setItem('isRepeat', this.isRepeat)
        }

        audio.onended = () => {
            if (this.isRepeat) {
                audio.play()
            } else if (this.isRandom) {
                this.randomSong()
                audio.play()
            } else {
                nextSongBtn.click()
            }

            sendEvent({ eventName: 'song:next-song', detail: this.currentIndex })
        }

        listenEvent({
            eventName: 'song:choose-song',
            handler: (e) => {
                const currentTime = audio.currentTime

                this.currentIndex = e.detail
                this.loadCurrentSong()

                audio.currentTime = currentTime

                audio.play()
            },
        })

        listenEvent({
            eventName: 'song:play',
            handler: (e) => {
                this.isPlaying = e.detail

                this.isPlaying ? audio.play() : audio.pause()
            },
        })

        listenEvent({
            eventName: 'music:add',
            handler: ({ detail }) => {
                const data = JSON.parse(detail)
                this.songs.unshift(data.data)
                this.loadCurrentSong()

                const currentTime = audio.currentTime

                this.loadCurrentSong()

                audio.currentTime = currentTime

                audio.play()
            },
        })

        listenEvent({
            eventName: 'music:new-songs',
            handler: ({ detail }) => {
                this.songs = detail.songs
                this.loadCurrentSong()
            },
        })

        listenEvent({
            eventName: 'music:update',
            handler: ({ detail }) => {
                const data = JSON.parse(detail)
                const songIndex = this.songs.findIndex((song) => song.id === Number(data.data.id))
                this.songs[songIndex] = data.data

                const currentTime = audio.currentTime

                this.loadCurrentSong()

                audio.currentTime = currentTime

                audio.play()
            },
        })
    },

    nextSong() {
        this.currentIndex++
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0
        }

        this.loadCurrentSong()
    },

    prevSong() {
        this.currentIndex--
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1
        }

        this.loadCurrentSong()
    },

    randomSong() {
        let newIndex

        if (this.playerIndexes.length === this.songs.length) {
            this.playerIndexes = []
        }

        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        } while (this.playerIndexes.includes(newIndex))

        this.playerIndexes.push(newIndex)

        this.currentIndex = newIndex
        this.loadCurrentSong()
    },

    setCurrentIndex() {
        const songId = getParams('id')

        if (songId) {
            const songIndex = this.songs.findIndex((song) => song.id === Number(songId))
            return songIndex
        }

        return this.currentIndex
    },

    async init() {
        await this.getSongs()
        this.currentIndex = this.setCurrentIndex()
        this.loadConfig()
        this.defineProperties()
        this.loadCurrentSong()
        this.handleEvent()
    },
}

playerController.init()
