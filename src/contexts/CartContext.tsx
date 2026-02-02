
import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface CartLineItem {
  qty: number;
  feet: number;
  inches: number;
  fraction: number;
  pieceMark: string;
  lengthPerPanel: number;
  totalLF: number;
  linePrice: number;
}

export interface CartItem {
  productId: string;
  title: string;
  unit: string;
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
  img: string;
  lines?: CartLineItem[];
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

const calculateTotals = (items: CartItem[]): { totalItems: number; totalAmount: number } => {
  const totalItems = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  return { totalItems, totalAmount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: action.payload.quantity,
                totalPrice: action.payload.totalPrice,
              }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      const { totalItems, totalAmount } = calculateTotals(newItems);
      return { items: newItems, totalItems, totalAmount };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.productId === action.payload.productId
          ? {
              ...item,
              quantity: action.payload.quantity,
              totalPrice: item.pricePerUnit * action.payload.quantity,
            }
          : item
      );
      const { totalItems, totalAmount } = calculateTotals(newItems);
      return { items: newItems, totalItems, totalAmount };
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => item.productId !== action.payload);
      const { totalItems, totalAmount } = calculateTotals(newItems);
      return { items: newItems, totalItems, totalAmount };
    }

    case 'CLEAR_CART':
      return initialState;

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('roofing-cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('roofing-cart', JSON.stringify(state));
  }, [state]);

  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    }
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
