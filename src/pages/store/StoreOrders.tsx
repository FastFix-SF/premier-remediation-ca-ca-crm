import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAuth } from '@/hooks/useStoreAuth';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import { Package, Clock, CheckCircle, Truck, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItem {
  productId: string;
  title: string;
  img: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  created_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'processing':
      return <Package className="w-4 h-4" />;
    case 'shipped':
      return <Truck className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'processing':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'shipped':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const StoreOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useStoreAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/store/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse the items JSONB field
      const parsedOrders = (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      })) as Order[];

      setOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="My Orders | The Roofing Friend Store"
        description="View your order history and track your roofing material orders."
      />
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/store')}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
            <p className="text-muted-foreground mt-1">
              View and track your order history
            </p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No orders yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Start shopping to see your orders here
              </p>
              <Button onClick={() => navigate('/store')}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {order.order_number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)} • {order.items.length} item(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(order.status)} capitalize`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                      <span className="text-lg font-bold text-foreground">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {expandedOrder === order.id && (
                  <CardContent className="border-t border-border pt-6">
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                        >
                          <img
                            src={item.img}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit} × ${item.pricePerUnit.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-foreground">
                              ${item.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Order Summary */}
                      <div className="border-t border-border pt-4 mt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">${order.subtotal.toFixed(2)}</span>
                          </div>
                          {order.tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tax</span>
                              <span className="text-foreground">${order.tax.toFixed(2)}</span>
                            </div>
                          )}
                          {order.shipping > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shipping</span>
                              <span className="text-foreground">${order.shipping.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                            <span className="text-foreground">Total</span>
                            <span className="text-primary">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOrders;
