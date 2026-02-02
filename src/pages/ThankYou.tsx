
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';

const ThankYou = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart when user reaches thank you page
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-[#77bd47] mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-lg text-gray-600">
              Your payment has been processed successfully.
            </p>
          </div>

          <div className="bg-[#146193] bg-opacity-5 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              What Happens Next?
            </h2>
            <div className="text-left space-y-2 text-gray-700">
              <p>• You will receive an email confirmation shortly</p>
              <p>• Our team will contact you within 24 hours to arrange delivery</p>
              <p>• We'll provide tracking information once your order ships</p>
              <p>• If you have questions, feel free to contact our support team</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-[#146193] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#125580] transition-colors duration-200"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </button>
            
            <div className="text-sm text-gray-500 mt-6">
              Order confirmation and receipt have been sent to your email.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
