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
const volumeControl = document.querySelector('#volume-control')
const volumeBtn = document.querySelector('.music__player-volume-btn')

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
    currentVolume: localStorage.getItem('volume') ? parseFloat(localStorage.getItem('volume')) : 1,
    isMuted: localStorage.getItem('isMuted') === 'true' || false,

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

        if (!currentSong) {
            return
        }

        audio.src = currentSong.url

        playerCdThumb.src = currentSong.thumbnail

        document.querySelector('.music__player-info-title-name').textContent = currentSong.name
        document.querySelector('.music__player-info-title-artist').textContent = currentSong.artist
    },

    loadConfig() {
        randomSongBtn.classList.toggle('active', this.isRandom)
        repeatSongBtn.classList.toggle('active', this.isRepeat)

        // Cấu hình âm lượng
        audio.volume = this.currentVolume
        volumeControl.value = this.currentVolume * 100
        this.updateVolumeIcon()
    },

    updateVolumeIcon() {
        const volumeIcon = volumeBtn.querySelector('i')
        volumeIcon.className = ''

        if (this.isMuted || this.currentVolume === 0) {
            volumeIcon.className = 'fa-solid fa-volume-xmark'
        } else if (this.currentVolume < 0.3) {
            volumeIcon.className = 'fa-solid fa-volume-off'
        } else if (this.currentVolume < 0.7) {
            volumeIcon.className = 'fa-solid fa-volume-low'
        } else {
            volumeIcon.className = 'fa-solid fa-volume-high'
        }
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

        togglePlayBtn.onclick = async () => {
            try {
                this.isPlaying ? audio.pause() : await audio.play()
            } catch (error) {}
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

        // Xử lý sự kiện thay đổi âm lượng
        volumeControl.oninput = () => {
            const volumeValue = volumeControl.value / 100
            audio.volume = volumeValue
            this.currentVolume = volumeValue
            this.isMuted = volumeValue === 0

            localStorage.setItem('volume', volumeValue)
            localStorage.setItem('isMuted', this.isMuted)

            this.updateVolumeIcon()
        }

        // Xử lý sự kiện click vào nút âm lượng để tắt/bật tiếng
        volumeBtn.onclick = () => {
            this.isMuted = !this.isMuted

            if (this.isMuted) {
                audio.volume = 0
                volumeControl.value = 0
            } else {
                // Nếu âm lượng đã được điều chỉnh, thì sử dụng âm lượng đã điều chỉnh
                // Nếu âm lượng chưa được điều chỉnh, thì sử dụng âm lượng mặc định là 1
                const savedVolume = this.currentVolume > 0 ? this.currentVolume : 1
                audio.volume = savedVolume
                volumeControl.value = savedVolume * 100
                this.currentVolume = savedVolume
            }

            localStorage.setItem('isMuted', this.isMuted)
            this.updateVolumeIcon()
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

        nextSongBtn.onclick = async () => {
            if (this.isRandom) {
                this.randomSong()
            }
            this.nextSong()

            try {
                await audio.play()
            } catch (error) {}
            sendEvent({ eventName: 'song:next-song', detail: this.currentIndex })
        }

        prevSongBtn.onclick = async () => {
            if (this.isRandom) {
                this.randomSong()
            }
            this.prevSong()
            try {
                await audio.play()
            } catch (error) {}
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

        audio.onended = async () => {
            if (this.isRepeat) {
                try {
                    await audio.play()
                } catch (error) {}
            } else if (this.isRandom) {
                this.randomSong()
                try {
                    await audio.play()
                } catch (error) {}
            } else {
                nextSongBtn.click()
            }

            sendEvent({ eventName: 'song:next-song', detail: this.currentIndex })
        }

        window.addEventListener('keydown', (e) => {
            if (e.shiftKey) {
                switch (e.key) {
                    case 'ArrowRight':
                        nextSongBtn.click()
                        break
                    case 'ArrowLeft':
                        prevSongBtn.click()
                        break
                }
            } else {
                switch (e.key) {
                    case 'ArrowRight':
                        audio.currentTime += 10
                        break
                    case 'ArrowLeft':
                        audio.currentTime -= 10
                        break
                    case ' ':
                        e.preventDefault()
                        togglePlayBtn.click()
                        break
                }
            }
        })

        listenEvent({
            eventName: 'song:choose-song',
            handler: async (e) => {
                this.currentIndex = e.detail
                this.loadCurrentSong()

                audio.currentTime = 0

                try {
                    await audio.play()
                } catch (error) {}
            },
        })

        listenEvent({
            eventName: 'song:play',
            handler: async (e) => {
                this.isPlaying = e.detail

                try {
                    this.isPlaying ? audio.play() : audio.pause()
                } catch (error) {}
            },
        })

        listenEvent({
            eventName: 'music:add',
            handler: async ({ detail }) => {
                const data = JSON.parse(detail)
                this.songs.unshift(data.data)
                this.loadCurrentSong()

                const currentTime = audio.currentTime

                this.loadCurrentSong()

                audio.currentTime = currentTime

                try {
                    await audio.play()
                } catch (error) {}
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
            handler: async ({ detail }) => {
                const data = JSON.parse(detail)
                const songIndex = this.songs.findIndex((song) => song.id === Number(data.data.id))
                this.songs[songIndex] = data.data

                const currentTime = audio.currentTime

                const audioIsPlaying = !audio.paused

                this.loadCurrentSong()

                audio.currentTime = currentTime

                if (audioIsPlaying) {
                    try {
                        await audio.play()
                    } catch (error) {}
                }
            },
        })

        listenEvent({
            eventName: 'favorite:choose-song',
            handler: async (e) => {
                const songIndex = this.songs.findIndex((song) => song.id === Number(e.detail))
                this.currentIndex = songIndex
                this.loadCurrentSong()
                try {
                    await audio.play()
                } catch (error) {}
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
