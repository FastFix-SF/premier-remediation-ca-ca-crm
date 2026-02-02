import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ScrollLink from './ui/scroll-link';
import { ShoppingCart, Search, User, LogOut, Shield, Menu, X, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { companyConfig } from '@/config/company';
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state
  } = useCart();
  const {
    user,
    signOut
  } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (user) {
      checkUserRole();
    } else {
      setUserRole(null);
    }
  }, [user]);
  const checkUserRole = async () => {
    try {
      const {
        data
      } = await supabase.from('user_roles').select('role').eq('user_id', user?.id).maybeSingle();
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
    }
  };
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    window.scrollTo(0, 0);
  };
  const navItems = [
    { label: 'All Products', path: '/store' },
    { label: 'Standing Seam', path: '/store/category/standing-seam' },
    { label: 'R-Panel', path: '/store/category/r-panel' },
    { label: 'Max-Rib', path: '/store/category/max-rib' },
  ];
  return <header className="bg-card/95 backdrop-blur-md sticky top-0 z-50 border-b shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <button onClick={() => {
          navigate('/');
          window.scrollTo(0, 0);
        }} className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-semibold text-foreground">
                {companyConfig.shortName}
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Premium Materials
              </p>
            </div>
          </button>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
              <input type="text" placeholder="Search roofing materials..." className="w-full pl-10 pr-4 py-2 bg-muted/50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all placeholder:text-muted-foreground" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  window.scrollTo(0, 0);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-primary hover:bg-muted/80'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* User Authentication - Desktop */}
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 ml-2">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline max-w-24 truncate">
                      {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="text-sm">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                navigate('/store/orders');
                window.scrollTo(0, 0);
              }}>
                      <Package className="w-4 h-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                  {(userRole === 'admin' || userRole === 'sales_rep') && <DropdownMenuItem onClick={() => {
                navigate('/admin');
                window.scrollTo(0, 0);
              }}>
                      <Shield className="w-4 h-4 mr-2" />
                      {userRole === 'admin' ? 'Admin Dashboard' : 'Sales Dashboard'}
                    </DropdownMenuItem>}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button variant="outline" size="sm" className="gap-2 ml-2" onClick={() => {
            const target = location.pathname.startsWith('/store') ? '/store/auth' : '/admin-login';
            navigate(target);
            window.scrollTo(0, 0);
          }}>
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">Sign In</span>
              </Button>}

            <button onClick={() => {
            navigate('/cart');
            window.scrollTo(0, 0);
          }} className="relative p-2 text-muted-foreground hover:text-foreground transition-smooth hover:bg-muted/80 rounded-lg group ml-1">
              <ShoppingCart className="w-5 h-5" />
              {state.totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm group-hover:scale-110 transition-transform">
                  {state.totalItems}
                </span>}
            </button>
          </nav>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => {
            navigate('/cart');
            window.scrollTo(0, 0);
          }} className="relative p-2 text-muted-foreground hover:text-foreground transition-smooth hover:bg-muted/80 rounded-lg group">
              <ShoppingCart className="w-5 h-5" />
              {state.totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
                  {state.totalItems}
                </span>}
            </button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      </div>
                      <div>
                        <h1 className="text-lg font-semibold text-foreground">{companyConfig.shortName}</h1>
                        <p className="text-xs text-muted-foreground">Premium Materials</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Search Bar - Mobile */}
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <input type="text" placeholder="Search materials..." className="w-full pl-10 pr-4 py-2 bg-muted/50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all" />
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <nav className="flex flex-col gap-1">
                      {navItems.map(item => <button key={item.path} onClick={() => {
                      navigate(item.path);
                      window.scrollTo(0, 0);
                      setIsOpen(false);
                    }} className={`text-left font-medium transition-colors py-3 px-2 rounded-lg ${location.pathname === item.path ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/80'}`}>
                          {item.label}
                        </button>)}
                    </nav>
                  </div>

                  {/* User Authentication - Mobile */}
                  <div className="p-4 border-t">
                    {user ? <div className="space-y-3">
                        <div className="text-sm text-muted-foreground px-2">
                          {user.email}
                        </div>
                        <Button variant="outline" onClick={() => {
                      navigate('/store/orders');
                      window.scrollTo(0, 0);
                      setIsOpen(false);
                    }} className="w-full justify-start gap-2">
                            <Package className="w-4 h-4" />
                            My Orders
                          </Button>
                        {(userRole === 'admin' || userRole === 'sales_rep') && <Button variant="outline" onClick={() => {
                      navigate('/admin');
                      window.scrollTo(0, 0);
                      setIsOpen(false);
                    }} className="w-full justify-start gap-2">
                            <Shield className="w-4 h-4" />
                            {userRole === 'admin' ? 'Admin Dashboard' : 'Sales Dashboard'}
                          </Button>}
                        <Button variant="outline" onClick={handleSignOut} className="w-full justify-start gap-2 text-destructive">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                      </div> : <Button onClick={() => {
                    const target = location.pathname.startsWith('/store') ? '/store/auth' : '/admin-login';
                    navigate(target);
                    window.scrollTo(0, 0);
                    setIsOpen(false);
                  }} className="w-full justify-start gap-2">
                        <User className="w-4 h-4" />
                        Sign In
                      </Button>}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;