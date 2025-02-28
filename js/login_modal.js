const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const app = {
    handleEvent() {
        // handle redirect to register modal
        const redirectRegister = $('.form__footer-toggle--register')
        const redirectForgotPassword = $('.form__footer-forgot-password')

        redirectRegister.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'register_modal' }, '*')
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
