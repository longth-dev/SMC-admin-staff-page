import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AxiosSetup from '../../services/AxiosSetup';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
                <h1 className="login-card__title">Đăng nhập SMC-Admin-Web</h1>
                <p className="login-card__subtitle">
                    Vui lòng nhập email và mật khẩu để tiếp tục
                </p>

                <form className="login-form" onSubmit={handleLogin}>
                    <label className="login-form__label" htmlFor="email">
                        Địa chỉ email:
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
                            Mật khẩu
                        </label>
                    </div>

                    <div className="login-form__password-wrap">
                        <input
                            id="password"
                            className="login-form__input login-form__input--password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="login-form__password-toggle"
                            onClick={() => setShowPassword((current) => !current)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>

                    <label className="login-form__checkbox">
                        <input type="checkbox" defaultChecked />
                        <span>Ghi nhớ mật khẩu</span>
                    </label>

                    {error ? <p className="login-form__error">{error}</p> : null}

                    <button type="submit" className="login-form__submit" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <p className="login-form__footer">
                        Sau khi đăng nhập, bạn có thể mở trang bảng điều khiển.
                    </p>

                    <p className="login-form__footer">
                        Chưa có tài khoản? <a href="/register">Tạo tài khoản</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
