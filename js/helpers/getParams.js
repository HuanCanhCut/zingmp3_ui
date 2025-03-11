export default function getParams(param) {
    const urlString = window.location
    const url = new URL(urlString)
    const value = url.searchParams.get(param)

    return value
}
