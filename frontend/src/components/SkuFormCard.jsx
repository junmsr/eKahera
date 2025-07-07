import React from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import FormField from './FormField';

function SkuFormCard({ sku, setSku, quantity, setQuantity, handleAddToCart, cardBg }) {
  return (
    <Card className={`flex flex-col gap-1 shadow-xl flex-shrink-0 ${cardBg} emphasized-card`} microinteraction>
      <FormField
        label={<span className="font-semibold text-blue-700">Enter SKU Code</span>}
        name="sku"
        value={sku}
        onChange={e => setSku(e.target.value)}
        placeholder="Enter SKU Code"
        className="mb-2"
      />
      <div className="flex items-center gap-2">
        <span className="font-medium text-blue-700">Quantity:</span>
        <Input
          type="number"
          name="quantity"
          value={quantity}
          min={1}
          onChange={e => setQuantity(Number(e.target.value))}
          className="w-20"
          microinteraction
        />
        <Button label="✔" onClick={handleAddToCart} size="sm" variant="primary" microinteraction />
      </div>
      <Button label="ENTER" onClick={handleAddToCart} className="w-full mt-2" variant="primary" size="lg" microinteraction />
    </Card>
  );
}

export default SkuFormCard; 