import { sendEvent, listenEvent } from './helpers/event.js'

const content = document.querySelector('#content')
const overlay = document.querySelector('#overlay')
const modal = document.querySelector('#modal')
const deleteConfirmModal = document.querySelector('.delete-confirm-modal')
const deleteConfirmBtnDelete = deleteConfirmModal.querySelector('.delete-confirm-btn-delete')
const deleteConfirmBtnCancel = deleteConfirmModal.querySelector('.delete-confirm-btn-cancel')

const mySong = {
    songs: [],
    currentIndex: 0,

    async getMySongs() {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://zing-api.huancanhcut.click/api/music/my-songs', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await res.json()

            sendEvent({
                eventName: 'music:new-songs',
                detail: data,
            })

            this.songs = data.songs
        } catch (error) {
            toast({
                title: 'Lỗi',
                message: 'Lỗi khi lấy bài danh sách bài hát của tôi',
                type: 'error',
            })
        }
    },

    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex]
            },
        })
    },

    renderMySongs() {
        const html = this.songs.map((song, index) => {
            return `
                    <div
                        class="content_playlist-item ${Number(this.currentIndex) === index ? 'active' : ''}"
                        data-index="${index}"
                    >
                        <div class="content_playlist-item-wrapper">
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
                            <button class="content_playlist-item-actions-btn playlist__item-edit">
                                <i class="fa-solid fa-square-pen"></i>
                            </button>
                            <button class="content_playlist-item-actions-btn playlist__item-delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `
        })

        return html
    },

    loadCurrentSong() {
        const html = this.renderMySongs()

        content.innerHTML = html.join('')
    },

    handleEvent() {
        content.onclick = (e) => {
            // if click delete btn
            if (e.target.closest('.playlist__item-delete')) {
                const songIndex = Number(e.target.closest('.content_playlist-item').getAttribute('data-index'))

                deleteConfirmModal.classList.add('active')
                overlay.classList.add('active')

                deleteConfirmBtnDelete.onclick = async () => {
                    this.handleDeleteSong(songIndex)

                    deleteConfirmModal.classList.remove('active')
                    overlay.classList.remove('active')
                }

                deleteConfirmBtnCancel.onclick = () => {
                    deleteConfirmModal.classList.remove('active')
                    overlay.classList.remove('active')
                }
            }

            // if click edit btn
            if (e.target.closest('.playlist__item-edit')) {
                const songIndex = Number(e.target.closest('.content_playlist-item').getAttribute('data-index'))

                if (songIndex !== undefined) {
                    const songId = this.songs[songIndex].id

                    // open iframe modal

                    const song = this.songs[songIndex]
                    const url = `
                            modal/update_music_modal.html?id=${songId}&name=${song.name}&artist=${song.artist}&thumbnail=${song.thumbnail}&song_url=${song.url}
                        `

                    modal.src = url

                    modal.classList.add('active')
                    overlay.classList.add('active')
                }
            }

            // click to play song
            if (
                e.target.closest('.content_playlist-item:not(.active)') &&
                !e.target.closest('.playlist__item-edit') &&
                !e.target.closest('.playlist__item-delete')
            ) {
                const songIndex = Number(e.target.closest('.content_playlist-item').getAttribute('data-index'))

                this.currentIndex = songIndex

                this.loadCurrentSong()

                sendEvent({ eventName: 'song:choose-song', detail: songIndex })
            }
        }

        overlay.onclick = () => {
            deleteConfirmModal.classList.remove('active')
            overlay.classList.remove('active')
        }

        listenEvent({
            eventName: 'music:update',
            handler: ({ detail }) => {
                const data = JSON.parse(detail)
                const songIndex = this.songs.findIndex((song) => song.id === Number(data.data.id))

                this.songs[songIndex] = data.data
                this.loadCurrentSong()
            },
        })

        listenEvent({
            eventName: 'logout',
            handler: () => {
                this.songs = []
                this.loadCurrentSong()
                this.currentIndex = 0
                this.init()
            },
        })
    },

    async handleDeleteSong(songIndex) {
        const token = localStorage.getItem('token')

        try {
            const musicId = this.songs[songIndex].id

            const res = await fetch(`https://zing-api.huancanhcut.click/api/music/${musicId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`)
            }

            // if successfully
            toast({
                title: 'Thành công',
                message: 'Xóa bài hát thành công',
                type: 'success',
            })

            this.songs.splice(songIndex, 1)
            this.loadCurrentSong()
        } catch (error) {
            toast({
                title: 'Thất bại',
                message: error.message || 'Xóa bài hát không thành công, vui lòng thử lại sau!',
                type: 'error',
            })
        }
    },

    async init() {
        const token = localStorage.getItem('token')

        if (!token) {
            modal.src = 'modal/login_modal.html'
            modal.classList.add('active')
            overlay.classList.add('active')

            window.addEventListener('message', async (e) => {
                switch (e.data.type) {
                    case 'modal:auth-success':
                        await this.getMySongs()
                        this.defineProperties()
                        this.loadCurrentSong()
                        this.handleEvent()
                        break
                }
            })
        } else {
            await this.getMySongs()
            this.defineProperties()
            this.loadCurrentSong()
            this.handleEvent()
        }
    },
}

mySong.init()
