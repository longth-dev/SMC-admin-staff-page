import axios from "axios";

const AxiosSetup = axios.create({
    baseURL: "https://smcride-001-site1.jtempurl.com/api",
    headers: {
        "Content-Type": "application/json",
    },
});

AxiosSetup.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(token)
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default AxiosSetup;
