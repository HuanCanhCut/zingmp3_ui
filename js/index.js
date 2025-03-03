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

const app = {
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

        $('#header__input-search').oninput = async (e) => {
            await this.handleSearch(e)
        }

        $('#header__input-search').onfocus = () => {
            $('.header__search-wrapper-input-result').classList.add('active')
        }
    },

    async handleSearch(e) {
        const value = e.target.value

        $('.header__search-wrapper-input-result').classList.toggle('active', !!value.trim())

        if (value.length === 0) {
            $('.header__search-wrapper-input-result-list').innerHTML = ''
        }

        if (value.length > 0) {
            // debounce value
            const debounce = (callback, delay) => {
                let timeout
                return function () {
                    clearTimeout(timeout)
                    timer = setTimeout(() => {
                        callback()
                    }, delay)
                }
            }

            const handleSearch = debounce(async () => {
                const res = await fetch(`https://api.zingmp3.local/api/music/search?query=${value}`)
                const data = await res.json()

                if (Array.isArray(data.musics)) {
                    $('.header__search-wrapper-input-result-list').innerHTML = data.musics
                        .map((music) => {
                            return `
                                <div class="header__search-wrapper-input-result-item">
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
                                </div>
                            `
                        })
                        .join('')
                }
            }, 500)

            handleSearch()
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

        Object.assign($('.music-player').style, {
            backgroundImage: `url('${themeData.background_model}')`,
            backgroundSize: 'cover',
        })

        // set text color
        document.documentElement.style.setProperty('--text-primary', themeData.text_primary)
        document.documentElement.style.setProperty('--text-primary-contradictory', themeData.text_primary_contradictory)
        document.documentElement.style.setProperty('--border-gray-color', themeData.border_gray_color)
        document.documentElement.style.setProperty('--smoke-overlay', themeData.smoke_overlay)
    },

    init() {
        this.loadHeaderActionUI()
        this.handleEvent()
    },
}

app.init()
