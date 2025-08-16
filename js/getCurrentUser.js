import * as axiosClient from '../config/axiosClient.js'

const getCurrentUser = async () => {
    try {
        const res = await axiosClient.get('/me')

        return res.data.data
    } catch (error) {
        console.log(error)
    }
}

export default getCurrentUser
