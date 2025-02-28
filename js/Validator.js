function Validator(options) {
    let formElement = document.querySelector(options.form)
    let selectorRules = {}

    function getParentElement(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    if (formElement) {
        //? function invalid
        function invalid(inputElement, rule) {
            let errorElement = getParentElement(inputElement, options.formGroup).querySelector(options.errorSelector)
            let errorMessage

            let rules = selectorRules[rule.selector]
            for (let i = 0; i < rules.length; ++i) {
                errorMessage = rules[i](inputElement.value)
                if (errorMessage) {
                    break
                }
            }

            if (errorMessage) {
                errorElement.innerText = errorMessage
                getParentElement(inputElement, options.formGroup).classList.add('invalid')
            } else {
                errorElement.innerText = ''
                getParentElement(inputElement, options.formGroup).classList.remove('invalid')
            }

            //? input handled
            inputElement.oninput = function () {
                document.querySelector('.error-message').innerText = ''
                errorElement.innerText = ''
                getParentElement(inputElement, options.formGroup).classList.remove('invalid')
            }
            return !errorMessage
        }

        let arrayRules = options.rules
        //? handled submit
        formElement.onsubmit = async function (e) {
            e.preventDefault()

            var isFormValid = true

            for (let rule of arrayRules) {
                let inputElement = document.querySelector(rule.selector)
                let isValid = invalid(inputElement, rule)
                if (!isValid) {
                    isFormValid = false
                }
            }

            if (isFormValid) {
                //? submit with javascript
                if (typeof options.submit === 'function') {
                    const enabledInputs = formElement.querySelectorAll('[name]')

                    const data = Array.from(enabledInputs).reduce((value, input) => {
                        return (value[input.name] = input.value) && value
                    }, {})

                    await options.submit(data)
                } else {
                    formElement.submit()
                }
            }
        }

        for (let rule of arrayRules) {
            //! Handle the case where there are many overlapping rules
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }

            let inputElement = document.querySelector(rule.selector)
            inputElement.onblur = () => {
                if (inputElement.value === '') {
                    invalid(inputElement, rule)
                }
            }
        }
    }
}

Validator.isRequired = function (selector) {
    return {
        selector: selector,
        test: function (value) {
            return value.trim() ? undefined : 'Vui lòng nhập trường này!'
        },
    }
}

Validator.isEmail = function (selector) {
    return {
        selector: selector,
        test: function (value) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value) ? undefined : 'Email không đúng!'
        },
    }
}
Validator.isPassword = function (selector, min) {
    return {
        selector: selector,
        test: function (value) {
            return value.trim().length >= min ? undefined : `Password phải có ít nhất ${min} ký tự!`
        },
    }
}

Validator.isConfirm = function (selector, getConfirmValue) {
    return {
        selector: selector,
        test: function (value) {
            return value.trim() === getConfirmValue() ? undefined : 'Mật khẩu không khớp!'
        },
    }
}
