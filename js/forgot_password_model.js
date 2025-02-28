const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const app = {
    handleEvent() {
        const redirectLogin = $('.form__footer-forgot-password--login')
        const redirectRegister = $('.form__footer-toggle--register')

        redirectLogin.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'login_modal' }, '*')
        }

        redirectRegister.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'register_modal' }, '*')
        }
    },

    init() {
        this.handleEvent()
    },
}

app.init()
