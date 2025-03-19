import { listenEvent, sendEvent } from './helpers/event.js'

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const modal = $('#modal')
const loginBtn = $('.header__actions-login-btn')
const registerBtn = $('.header__actions-register-btn')
const headerActionsAuth = $('.header__actions_auth')
const headerActionsUser = $('.header__actions_user')
const userAvatar = $('.header__actions-user-avatar')
const userAvatarPopper = $('.header__actions-user-avatar-popper')
const userAvatarPopperBtns = $$('.header__actions-user-avatar-popper-btn')
const themeModalBtn = $('.header__actions-theme-btn')
const inputSearch = $('#header__input-search')
const overlay = $('#overlay')

const app = {
    favoriteSongs: [],
    currentIndex: 0,

    loadHeaderActionUI() {
        const token = localStorage.getItem('token')

        if (token) {
            headerActionsAuth.classList.remove('active')
            headerActionsUser.classList.add('active')
        } else {
            headerActionsAuth.classList.add('active')
            headerActionsUser.classList.remove('active')
        }
    },

    handleEvent() {
        // listen message from login modal
        window.addEventListener('message', (e) => {
            switch (e.data.type) {
                case 'modal:toggle-modal':
                    modal.setAttribute('src', `./modal/${e.data.data}.html`)
                    break
                case 'modal:auth-success':
                    this.closeModal()
                    toast({
                        title: 'Thành công',
                        message: e.data.data.message,
                        type: 'success',
                    })
                    this.loadHeaderActionUI()
                    break

                case 'theme:apply':
                    const themeData = e.data.data

                    this.handleSetTheme(themeData)
                    break

                case 'modal:toast-success':
                    toast({
                        title: 'Thành công',
                        message: e.data.data.message,
                        type: 'success',
                    })
                    break
                default:
                    break
            }
        })

        window.addEventListener('click', (e) => {
            // if click outside of user avatar popper, close it
            if (!e.target.closest(`.header__actions-user-avatar-wrapper`)) {
                userAvatarPopper.classList.remove('active')
            }

            if (!e.target.closest(`.header__search-wrapper`)) {
                $('.header__search-wrapper-input-result').classList.remove('active')
            }
        })

        // handle open auth modal
        loginBtn.addEventListener('click', () => {
            this.openAuthModal('login_modal')
        })

        registerBtn.addEventListener('click', () => {
            this.openAuthModal('register_modal')
        })

        // close auth modal when click on overlay
        overlay.addEventListener('click', () => {
            this.closeModal()

            this.favoriteSongs = this.favoriteSongs.filter((favorite) => favorite.is_favorite)

            this.loadPlaylistSidebar()
        })

        // listen keydown event
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    this.closeModal()
                    break
            }
        })

        // listen click on user avatar
        userAvatar.onclick = () => {
            userAvatarPopper.classList.toggle('active')
        }

        Array.from(userAvatarPopperBtns).forEach((btn) => {
            btn.onclick = () => {
                switch (btn.dataset.type) {
                    case 'logout':
                        localStorage.removeItem('token')
                        this.loadHeaderActionUI()
                        break
                    case 'my-songs':
                        break
                }
            }
        })

        $('.nav--next').onclick = () => {
            window.history.back()
        }

        $('.nav--prev').onclick = () => {
            window.history.forward()
        }

        themeModalBtn.onclick = () => {
            this.openThemeModal()
        }

        inputSearch.oninput = async (e) => {
            await this.handleSearch(e)
        }

        inputSearch.onfocus = () => {
            if (inputSearch.value.trim()) {
                $('.header__search-wrapper-input-result').classList.add('active')
            }
        }

        $('.playlist-sidebar__close-btn').onclick = () => {
            $('#playlist-sidebar').classList.remove('active')
            overlay.classList.remove('active')

            this.favoriteSongs = this.favoriteSongs.filter((favorite) => favorite.is_favorite)

            this.loadPlaylistSidebar()
        }

        $('.playlist-sidebar__content').onclick = async (e) => {
            if (!e.target.closest('.playlist__item-heart')) {
                if (e.target.closest('.content_playlist-item:not(.active)')) {
                    const songId = e.target.closest('.content_playlist-item').dataset.id

                    this.currentIndex = e.target.closest('.content_playlist-item').dataset.index

                    sendEvent({
                        eventName: 'favorite:choose-song',
                        detail: songId,
                    })

                    this.loadPlaylistSidebar()
                }
            }

            if (e.target.closest('.playlist__item-heart')) {
                const songIndex = Number(e.target.closest('.content_playlist-item')?.getAttribute('data-index'))

                const isFavorite = this.favoriteSongs[songIndex].is_favorite

                this.favoriteSongs[songIndex].is_favorite = !isFavorite

                // fetch api update favorite
                const token = localStorage.getItem('token')

                if (!token) {
                    sendEvent({
                        eventName: 'modal:open-auth-modal',
                    })
                    return
                }

                // add favorite
                if (!isFavorite) {
                    await fetch(`https://api.zingmp3.local/api/favorite`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            song_id: this.favoriteSongs[songIndex].song.id,
                        }),
                    })
                    sendEvent({
                        eventName: 'favorite:add',
                        detail: this.favoriteSongs[songIndex].song.id,
                    })
                } else {
                    // remove favorite
                    await fetch(`https://api.zingmp3.local/api/favorite/${this.favoriteSongs[songIndex].song.id}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })
                    sendEvent({
                        eventName: 'favorite:remove',
                        detail: this.favoriteSongs[songIndex].song.id,
                    })
                }

                this.loadPlaylistSidebar()
            }
        }

        // Listen custom event
        listenEvent({
            eventName: 'modal:open-auth-modal',
            handler: () => {
                this.openAuthModal('login_modal')
            },
        })

        listenEvent({
            eventName: 'favorite:add',
            handler: async (e) => {
                await this.getFavoriteSongs()
                this.loadPlaylistSidebar()
            },
        })

        listenEvent({
            eventName: 'favorite:remove',
            handler: (e) => {
                this.favoriteSongs = this.favoriteSongs.filter((favorite) => favorite.song.id !== Number(e.detail))

                this.loadPlaylistSidebar()
            },
        })
    },

    async handleSearch(e) {
        const value = e.target.value

        $('.header__search-wrapper-input-result').classList.toggle('active', !!value.trim())

        if (value.length === 0) {
            $('.header__search-wrapper-input-result-list').innerHTML = ''
        }

        if (value.length > 0) {
            // Create debounced search function only once
            if (!this.debouncedSearch) {
                this.debouncedSearch = (() => {
                    let timeoutId
                    return async (searchValue) => {
                        clearTimeout(timeoutId)
                        timeoutId = setTimeout(async () => {
                            const res = await fetch(`https://api.zingmp3.local/api/music/search?query=${searchValue}`)
                            const data = await res.json()

                            if (Array.isArray(data.musics)) {
                                $('.header__search-wrapper-input-result-list').innerHTML = data.musics
                                    .map((music) => {
                                        return `
                                            <a href="/song.html?id=${music.id}" class="header__search-wrapper-input-result-item">
                                                <div class="header__search-wrapper-input-result-img">
                                                    <img
                                                        src="${music.thumbnail}"
                                                        alt=""
                                                    />
                                                    <i class="fa-solid fa-play"></i>
                                                </div>

                                                <div class="header__search-wrapper-input-result-info">
                                                    <p class="header__search-wrapper-input-result-info-title">
                                                        ${music.name}
                                                    </p>
                                                    <p class="header__search-wrapper-input-result-info-artist">
                                                        ${music.artist}
                                                    </p>
                                                </div>
                                            </a>
                                        `
                                    })
                                    .join('')
                            }
                        }, 300)
                    }
                })()
            }

            // Use the cached debounced function
            this.debouncedSearch(value)
        }
    },

    openThemeModal() {
        modal.setAttribute('src', `./modal/theme_modal.html`)
        modal.classList.add('active')
        overlay.classList.add('active')
    },

    closeModal() {
        modal.classList.remove('active')
        overlay.classList.remove('active')
    },

    openAuthModal(modalName) {
        modal.setAttribute('src', `./modal/${modalName}.html`)
        modal.classList.add('active')
        overlay.classList.add('active')
    },

    handleSetTheme(themeData) {
        Object.assign($('.app').style, {
            background: `url('${themeData.background_image}')`,
            backgroundSize: 'cover',
        })

        Object.assign($('#header').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            backgroundSize: 'cover',
        })

        Object.assign($('.header__actions-theme-btn').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            color: themeData.text_primary,
        })

        Object.assign($('#mobile-sidebar').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            backgroundSize: 'cover',
        })

        Object.assign($('.header__actions-user-avatar-popper').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            color: themeData.text_primary,
        })

        Object.assign($('.header__search-wrapper-input-result').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            backgroundSize: 'cover',
        })

        Object.assign($('.music__player').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            backgroundSize: 'cover',
        })

        Object.assign($('#playlist-sidebar').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            backgroundSize: 'cover',
        })

        // set text color
        document.documentElement.style.setProperty('--text-primary', themeData.text_primary)
        document.documentElement.style.setProperty('--text-primary-contradictory', themeData.text_primary_contradictory)
        document.documentElement.style.setProperty('--border-gray-color', themeData.border_gray_color)
        document.documentElement.style.setProperty('--smoke-overlay', themeData.smoke_overlay)
    },

    loadCurrentTheme() {
        const currentTheme = localStorage.getItem('theme')

        if (currentTheme) {
            this.handleSetTheme(JSON.parse(currentTheme))
        }
    },

    async getFavoriteSongs() {
        const token = localStorage.getItem('token')

        if (!token) {
            return
        }

        const res = await fetch('https://api.zingmp3.local/api/favorite', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const data = await res.json()

        this.favoriteSongs = data.data.map((favorite) => {
            return {
                ...favorite,
                is_favorite: true,
            }
        })
    },

    loadPlaylistSidebar() {
        const playlistSidebar = $('.playlist-sidebar__content')

        playlistSidebar.innerHTML = this.favoriteSongs
            .map((favorite, index) => {
                return `
                <div
                    style="margin-top: 4px"
                    class="content_playlist-item ${Number(this.currentIndex) === index ? 'active' : ''}"
                    data-index="${index}"
                    data-id="${favorite.song.id}"
                >
                    <div class="content_playlist-item-wrapper">
                        <div class="content_playlist-item-wrapper-img">
                            <img src="${favorite.song.thumbnail}" alt="" />
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <div class="content_playlist-item-info">
                            <p class="content_playlist-item-info-title">${favorite.song.name}</p>
                            <p class="content_playlist-item-info-artist">${favorite.song.artist}</p>
                        </div>
                    </div>
                    <div class="content_playlist-item-actions">
                        <button class="content_playlist-item-actions-btn playlist__item-heart">
                            <i class="fa-solid fa-heart ${favorite.is_favorite ? 'active' : ''}"></i>
                        </button>
                    </div>
                </div>
            `
            })
            .join('')
    },

    async init() {
        this.loadCurrentTheme()
        this.loadHeaderActionUI()
        this.handleEvent()
        await this.getFavoriteSongs()
        this.loadPlaylistSidebar()
    },
}

app.init()
