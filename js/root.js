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
                    this.closeAuthModal()
                    toast({
                        title: 'Thành công',
                        message: e.data.data.message,
                        type: 'success',
                    })

                    this.loadHeaderActionUI()
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
            this.closeAuthModal()
            this.closeThemeModal()
        })

        // listen keydown event
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    this.closeAuthModal()
                    this.closeThemeModal()
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

    closeAuthModal() {
        modal.classList.remove('active')
        overlay.classList.remove('active')
    },

    openAuthModal(modalName) {
        modal.setAttribute('src', `./modal/${modalName}.html`)
        modal.classList.add('active')
        overlay.classList.add('active')
    },

    init() {
        this.loadHeaderActionUI()
        this.handleEvent()
    },
}

app.init()
