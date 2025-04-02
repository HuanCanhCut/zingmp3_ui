const closeModalBtn = document.querySelector('.close-modal-btn')
closeModalBtn.addEventListener('click', () => {
    window.parent.postMessage({ type: 'modal:close' }, '*')
})
