const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const app = {
    handleEvent() {
        const redirectLogin = $('.form__footer-toggle--login')
        const redirectForgotPassword = $('.form__footer-forgot-password')

        redirectLogin.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'login_modal' }, '*')
        }

        redirectForgotPassword.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'forgot_password_modal' }, '*')
        }
    },

    init() {
        this.handleEvent()
    },
}

app.init()
