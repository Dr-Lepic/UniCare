import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // In a real scenario, this connects to your backend login endpoint
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      const { user, token } = response.data;
      // Save token (e.g. localStorage.setItem('token', token))
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      
      // Redirect based on role (nurse, doctor, student)
      navigate(`/panel/${user.role}/dashboard`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Try again.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>UniCare Login</h2>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="login-btn">Login</button>
      </form>
    </div>
  );
}
