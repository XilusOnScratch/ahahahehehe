import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAuthenticated, setPinAuthenticated } from '../../lib/storage';

function PinPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dash');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin === '326') {
      try {
        setPinAuthenticated(true);
        setError('');
        navigate('/camera');
      } catch (err) {
        console.error('Error setting auth:', err);
        setError('Storage error');
      }
    } else {
      setError('Invalid code');
      setPin('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length <= 3 && /^\d*$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        {/* Faded Title */}
        <h1 className="text-4xl font-serif text-gray-900 opacity-[0.6%] mb-12 select-none">
          last three digits of ur phone number
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            value={pin}
            onChange={handleChange}
            maxLength={3}
            autoFocus
            className="w-full text-center text-3xl tracking-widest py-4 border-b border-gray-300 focus:outline-none focus:border-black transition"
          />

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pin.length !== 3}
            className="w-full py-3 bg-black text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default PinPage;
