const playlist = document.querySelector('.home__content_playlist')
const slider = document.querySelector('.home__content_slider')
const playerCdThumb = document.querySelector('.music__player-info-thumb')
const cdUserAvatar = document.querySelector('.user_info-avatar')
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

const homeApp = {
    songs: [],
    currentIndex: 0, // index of the current song
    isPlaying: false,
    playerIndexes: [],
    isRandom: localStorage.getItem('isRandom') === 'true' || false,
    isRepeat: localStorage.getItem('isRepeat') === 'true' || false,

    async getSongs() {
        const res = await fetch('https://api.zingmp3.local/api/music')
        const data = await res.json()

        this.songs = data.musics
    },

    renderPlaylist() {
        const html = this.songs.map((song, index) => {
            return `
                <div class="home__content_playlist-item ${
                    this.currentIndex === index ? 'active' : ''
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
        const currentSong = this.currentSong

        audio.src = currentSong.url

        playerCdThumb.src = currentSong.thumbnail
        cdUserAvatar.src = currentSong.thumbnail

        document.querySelector('.music__player-info-title-name').textContent = currentSong.name
        document.querySelector('.music__player-info-title-artist').textContent = currentSong.artist

        playlist.innerHTML = this.renderPlaylist().join('')
    },

    loadConfig() {
        randomSongBtn.classList.toggle('active', this.isRandom)
        repeatSongBtn.classList.toggle('active', this.isRepeat)
    },

    handleEvent() {
        window.addEventListener('click', (e) => {
            if (!e.target.closest(`#playlist-sidebar`) && !e.target.closest(`.open-playlist-sidebar`)) {
                playlistSidebar.classList.remove('active')
            }
        })

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                playlistSidebar.classList.remove('active')
            }
        })

        openPlaylistSidebarBtn.onclick = () => {
            playlistSidebar.classList.add('active')
        }

        togglePlayBtn.onclick = () => {
            this.isPlaying ? audio.pause() : audio.play()
        }

        audio.onplay = () => {
            this.isPlaying = true
            togglePlayBtn.classList.add('playing')
            this.isPlaying = true
            cdThumbAnimate.play()
        }

        audio.onpause = () => {
            this.isPlaying = false
            togglePlayBtn.classList.remove('playing')
            this.isPlaying = false
            cdThumbAnimate.pause()
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
            this.songActiveIntoView()
            audio.play()
        }

        prevSongBtn.onclick = () => {
            if (this.isRandom) {
                this.randomSong()
            }
            this.prevSong()
            this.songActiveIntoView()
            audio.play()
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
        }
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

        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        } while (this.playerIndexes.includes(newIndex))

        this.playerIndexes.push(newIndex)

        this.currentIndex = newIndex
        this.loadCurrentSong()
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
        this.loadConfig()
        this.defineProperties()
        this.loadCurrentSong()
        this.handleEvent()
        this.handleSlider()
    },
}

homeApp.init()
