const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const app = {
    themes: [
        {
            background_image: '../assets/backgroundThemes/Rose.jpg',
            name: 'Rose',
            background_model: '../assets/modalThemes/RoseBgModel.jpg',
            model: '../assets/modalThemes/RoseModel.jpg',
            category: 'Nghệ sĩ',
            text_primary: '#fff',
            text_primary_contradictory: '#222',
            border_gray_color: 'rgba(255, 255, 255, 0.1)',
            smoke_overlay: 'rgba(255, 255, 255, 0.05)',
            gray_opacity_50: 'rgba(255, 255, 255, 0.5)',
        },
        {
            background_image: '../assets/backgroundThemes/Eiffel.jpg',
            name: 'Eiffel',
            background_model: '../assets/modalThemes/EiffelBgModel.jpg',
            model: '../assets/modalThemes/EiffelModel.jpg',
            category: 'Dynamic',
            text_primary: '#fff',
            text_primary_contradictory: '#222',
            border_gray_color: 'rgba(255, 255, 255, 0.1)',
            smoke_overlay: 'rgba(255, 255, 255, 0.05)',
            gray_opacity_50: 'rgba(255, 255, 255, 0.5)',
        },
        {
            background_image: '../assets/backgroundThemes/IU.jpg',
            name: 'IU',
            background_model: '../assets/modalThemes/IUBgModel.jpg',
            model: '../assets/modalThemes/IUModel.jpg',
            category: 'Nghệ sĩ',
            text_primary: '#222',
            text_primary_contradictory: '#fff',
            border_gray_color: 'rgba(0, 0, 0, 0.1)',
            smoke_overlay: 'rgba(0, 0, 0, 0.05)',
            gray_opacity_50: 'rgba(0, 0, 0, 0.5)',
        },
        {
            background_image: '../assets/backgroundThemes/Jisoo.jpg',
            name: 'Jisoo',
            background_model: '../assets/modalThemes/JisooBgModel.jpg',
            model: '../assets/modalThemes/JisooModel.jpg',
            category: 'Nghệ sĩ',
            text_primary: '#222',
            text_primary_contradictory: '#fff',
            border_gray_color: 'rgba(0, 0, 0, 0.1)',
            smoke_overlay: 'rgba(0, 0, 0, 0.05)',
            gray_opacity_50: 'rgba(0, 0, 0, 0.5)',
        },
    ],

    renderThemes() {
        const themesGroupByCategory = this.themes.reduce((acc, theme, index) => {
            acc[theme.category] = acc[theme.category] || []
            acc[theme.category].push({ ...theme, index })
            return acc
        }, {})

        const themesGroupByCategoryHTML = Object.keys(themesGroupByCategory).map((category) => {
            return `
                <div class="main__content-group">
                    <h3 class="main__content-title">${category}</h3>
                    <div class="theme__group">
                        ${themesGroupByCategory[category]
                            .map((theme) => {
                                return `
                                <div class="theme__item">
                                    <div class="theme__item-img">
                                        <img class="theme__item-img-model" src="${theme.model}" alt="" />
                                        <button class="theme__item-apply" data-theme-index="${theme.index}">Áp dụng</button>
                                    </div>
                                    <p class="theme__item-name">${theme.name}</p>
                                </div>
                            `
                            })
                            .join('')}
                    </div>
                </div>
            `
        })

        $('.main__content').innerHTML = themesGroupByCategoryHTML.join('')
    },

    handleEvents() {
        Array.from($$('.theme__item-apply')).forEach((item) => {
            item.addEventListener('click', (e) => {
                const themeData = this.themes[e.target.dataset.themeIndex]

                window.parent.postMessage(
                    {
                        type: 'theme:apply',
                        data: themeData,
                    },
                    '*'
                )

                localStorage.setItem('theme', JSON.stringify(themeData))
            })
        })
    },

    init() {
        this.renderThemes()
        this.handleEvents()
    },
}

app.init()
