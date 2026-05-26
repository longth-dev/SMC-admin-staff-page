import axios from "axios";

const AxiosSetup = axios.create({
    baseURL: "https://smcride2-001-site1.ntempurl.com/api",
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
