import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosSetup from '../../services/AxiosSetup';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await AxiosSetup.post('/auth/systemuser-login', {
                email,
                password,
            });

            const { accessToken, fullName, role } = response.data;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('fullName', fullName || '');
            localStorage.setItem('role', role || '');

            const normalizedRole = String(role || '').toLowerCase();
            if (normalizedRole === 'staff') {
                navigate('/staff', { replace: true });
            } else {
                navigate('/admin', { replace: true });
            }
        } catch (err) {
            setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page__shape login-page__shape--one" />
            <div className="login-page__shape login-page__shape--two" />
            <div className="login-page__shape login-page__shape--three" />

            <div className="login-card">
                <h1 className="login-card__title">Login to SMC-Admin-Web</h1>
                <p className="login-card__subtitle">
                    Please enter your email and password to continue
                </p>

                <form className="login-form" onSubmit={handleLogin}>
                    <label className="login-form__label" htmlFor="email">
                        Email address:
                    </label>
                    <input
                        id="email"
                        className="login-form__input"
                        type="email"
                        placeholder="admin@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <div className="login-form__row">
                        <label className="login-form__label" htmlFor="password">
                            Password
                        </label>
                    </div>

                    <div className="login-form__password-wrap">
                        <input
                            id="password"
                            className="login-form__input login-form__input--password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <label className="login-form__checkbox">
                        <input type="checkbox" defaultChecked />
                        <span>Remember Password</span>
                    </label>

                    {error ? <p className="login-form__error">{error}</p> : null}

                    <button type="submit" className="login-form__submit" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <p className="login-form__footer">
                        After login you can open the dashboard page.
                    </p>

                    <p className="login-form__footer">
                        Don&apos;t have an account? <a href="/register">Create Account</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
