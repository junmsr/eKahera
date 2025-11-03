import React, { useEffect, useMemo, useRef, useState } from 'react';
import Background from '../../layout/Background';
import Navbar from '../../layout/Navbar';
import ScannerCard from '../../ui/POS/ScannerCard';
import Card from '../../common/Card';
import OrderDrawer from './OrderDrawer';
import CheckoutModal from './CheckoutModal';
import ActionBar from './ActionBar';
import { api, createGcashCheckout } from '../../../lib/api';
import CustomerCartQRModal from '../../modals/CustomerCartQRModal';

function MobileScannerView() {
  const [cart, setCart] = useState([]);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [error, setError] = useState('');
  const [showCartQR, setShowCartQR] = useState(false);
  const hasFinalizedRef = useRef(false);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  // Handle return from online payment (GCash)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    const pending = localStorage.getItem('pending_gcash_cart_public');
    const businessId = localStorage.getItem('business_id');
    if (status === 'success' && pending && businessId) {
      try {
        const parsed = JSON.parse(pending);
        (async () => {
          if (hasFinalizedRef.current) return;
          const guardKey = 'gcash_finalize_done_public';
          if (sessionStorage.getItem(guardKey) === '1') return;
          hasFinalizedRef.current = true;
          sessionStorage.setItem(guardKey, '1');
          try {
            const body = {
              items: parsed.items || [],
              payment_type: 'gcash',
              money_received: parsed.total || null,
              business_id: Number(businessId)
            };
            const resp = await api('/api/sales/public/checkout', { method: 'POST', body: JSON.stringify(body) });
            setCart([]);
            const url = new URL(window.location.origin + '/receipt');
            url.searchParams.set('tn', resp.transaction_number);
            url.searchParams.set('tid', String(resp.transaction_id));
            url.searchParams.set('total', String(resp.total || 0));
            window.location.href = url.toString();
          } catch (e) {
            setError(e.message || 'Failed to record payment');
          } finally {
            localStorage.removeItem('pending_gcash_cart_public');
            const url = new URL(window.location.href);
            url.searchParams.delete('payment');
            window.history.replaceState({}, '', url.toString());
          }
        })();
      } catch (_) {
        localStorage.removeItem('pending_gcash_cart_public');
      }
    }
  }, []);

  const handleScan = async (result) => {
    const code = result?.[0]?.rawValue;
    if (!code) return;
    
    setScannerPaused(true);
    setError('');
    setLoading(true);
    
    try {
      // Check if product already exists in cart
      const existingIndex = cart.findIndex(p => p.sku === code);
      if (existingIndex !== -1) {
        // Just increment quantity for existing item
        setCart(prev => {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
          return updated;
        });
        setScannerPaused(false);
        return;
      }

      // Fetch product from database using public endpoint
      // Prefer stored business_id if available; backend now also supports fallback without it
      const storedBusinessId = localStorage.getItem('business_id');
      const query = storedBusinessId ? `?business_id=${encodeURIComponent(storedBusinessId)}` : '';
      const product = await api(`/api/products/public/sku/${encodeURIComponent(code)}${query}`);

      // Enforce that scanned product belongs to the current store
      if (product && (!storedBusinessId || Number(product.business_id) === Number(storedBusinessId))) {
        const price = Number(product.selling_price || 0);
        const productName = product.product_name || `Product ${code}`;
        
        setCart(prev => [
          ...prev,
          {
            product_id: product.product_id,
            sku: product.sku,
            name: productName,
            quantity: 1,
            price: price,
          },
        ]);
      } else {
        throw new Error('Product not found in this store');
      }
    } catch (err) {
      setError(err.message || 'Product not found');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
      setScannerPaused(false);
    }
  };

  const increment = sku => setCart(prev => prev.map(p => p.sku === sku ? { ...p, quantity: p.quantity + 1 } : p));
  const decrement = sku => setCart(prev => prev.map(p => p.sku === sku ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p));
  const removeItem = sku => setCart(prev => prev.filter(p => p.sku !== sku));

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="min-h-screen pb-32">
        <div className="pt-20 px-4">
          <Navbar />
        </div>

        <div className="px-4 mt-4 space-y-4">
          <div className="max-w-screen-md mx-auto w-full">
            <ScannerCard
            onScan={handleScan}
            paused={scannerPaused}
            onResume={() => setScannerPaused(false)}
            className="w-full"
            textMain="text-blue-700"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm text-center">
              Loading product...
            </div>
          )}

          {cart.length > 0 && (
            <Card className="w-full emphasized-card" variant="glass" microinteraction>
              <OrderDrawer
                open={drawerOpen}
                onToggle={() => setDrawerOpen(v => !v)}
                cart={cart}
                onIncrement={increment}
                onDecrement={decrement}
                onRemove={removeItem}
              />
            </Card>
          )}
        </div>

        <ActionBar
          total={total}
          onCancel={() => setCart([])}
          onCheckout={() => setShowCheckout(true)}
          disabled={cart.length === 0}
        />

        {cart.length > 0 && (
          <CheckoutModal
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            total={total}
            method={paymentMethod}
            setMethod={setPaymentMethod}
          onPay={async (method) => {
            const businessId = localStorage.getItem('business_id');
            if (!businessId) {
              setError('No store selected. Please scan the store QR first.');
              setShowCheckout(false);
              return;
            }
            if (method === 'Cash') {
              setShowCheckout(false);
              setShowCartQR(true);
              return;
            }
            if (method === 'GCash') {
              try {
                const successUrl = window.location.origin + '/customer?payment=success';
                const cancelUrl = window.location.origin + '/customer?payment=cancel';
                localStorage.setItem('pending_gcash_cart_public', JSON.stringify({
                  items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                  total
                }));
                const { checkoutUrl } = await createGcashCheckout({
                  amount: Number(total || 0),
                  description: 'Self-checkout Order',
                  referenceNumber: `SC-${Date.now()}`,
                  cancelUrl,
                  successUrl
                });
                window.location.href = checkoutUrl;
              } catch (e) {
                setError(e.message || 'Failed to initialize online payment');
                localStorage.removeItem('pending_gcash_cart_public');
              } finally {
                setShowCheckout(false);
              }
              return;
            }
            // default: fallback to immediate record (e.g., PayMaya placeholder)
            try {
              const body = {
                items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                payment_type: method,
                money_received: total,
                business_id: Number(businessId),
              };
              const res = await api('/api/sales/public/checkout', { method: 'POST', body: JSON.stringify(body) });
              setCart([]);
              // Redirect to receipt after non-GCash online record
              const url = new URL(window.location.origin + '/receipt');
              url.searchParams.set('tn', res.transaction_number);
              url.searchParams.set('tid', String(res.transaction_id));
              url.searchParams.set('total', String(res.total || 0));
              window.location.href = url.toString();
            } catch (err) {
              setCheckoutMessage('Checkout failed');
            } finally {
              setShowCheckout(false);
            }
          }}
          />
        )}

        <CustomerCartQRModal
          isOpen={showCartQR}
          onClose={() => setShowCartQR(false)}
          cartItems={cart}
          businessId={localStorage.getItem('business_id')}
        />

        {checkoutMessage && (
          <div className="px-4 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {checkoutMessage}
            </div>
          </div>
        )}
      </div>
    </Background>
  );
}

export default MobileScannerView;
