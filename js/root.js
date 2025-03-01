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
                default:
                    break
            }
        })

        window.addEventListener('click', (e) => {
            // if click outside of user avatar popper, close it
            if (!e.target.closest(`.header__actions-user-avatar-wrapper`)) {
                userAvatarPopper.classList.remove('active')
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

        // set text color
        document.documentElement.style.setProperty('--text-primary', themeData.text_primary)
        document.documentElement.style.setProperty('--text-primary-contradictory', themeData.text_primary_contradictory)
        document.documentElement.style.setProperty('--border-gray-color', themeData.border_gray_color)
    },

    init() {
        this.loadHeaderActionUI()
        this.handleEvent()
    },
}

app.init()
