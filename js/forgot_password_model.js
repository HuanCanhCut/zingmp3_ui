const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const redirectLogin = $('.form__footer-forgot-password--login')
const redirectRegister = $('.form__footer-toggle--register')
const sendVerificationCodeBtn = $('.form-control-send-code')
const email = $('#email')

const app = {
    handleEvent() {
        redirectLogin.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'login_modal' }, '*')
        }

        redirectRegister.onclick = () => {
            window.parent.postMessage({ type: 'modal:toggle-modal', data: 'register_modal' }, '*')
        }

        // listen when user click on send verification code button
        sendVerificationCodeBtn.onclick = async () => {
            try {
                if (!email.value) {
                    throw new Error('Email is required')
                }

                const response = await fetch('https://zing-api.huancanhcut.click/api/auth/verify', {
                    method: 'POST',
                    body: JSON.stringify({ email: email.value }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error(response.status)
                }

                window.parent.postMessage(
                    {
                        type: 'modal:toast-success',
                        data: {
                            message:
                                'Mã xác nhận đã được gửi đến email của bạn, nếu không thấy hãy kiểm tra thư rác hoặc spam',
                        },
                    },
                    '*'
                )

                sendVerificationCodeBtn.disabled = true

                let countdown = 60

                const interval = setInterval(() => {
                    countdown--
                    $('.form-control-send-code').textContent = `${countdown}s`

                    if (countdown < 0) {
                        clearInterval(interval)
                        $('.form-control-send-code').textContent = 'Gửi lại mã'
                        $('.form-control-send-code').disabled = false
                    }
                }, 1000)
            } catch (error) {
                if (error.message === '404') {
                    $('.error-message').textContent = 'Email không tồn tại trong hệ thống, vui lòng nhập lại'
                    return
                }

                $('.error-message').textContent = 'Đã xảy ra lỗi, vui lòng thử lại sau'
            }
        }
    },

    init() {
        this.handleEvent()
    },
}

app.init()
