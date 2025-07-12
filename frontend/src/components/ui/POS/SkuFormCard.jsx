import React from 'react';
import Card from '../../common/Card';
import FormField from '../../common/FormField';
import Input from '../../common/Input';
import Button from '../../common/Button';

/**
 * SKU Form Card Component
 * Form for entering SKU codes and quantities
 */
function SkuFormCard({ 
  sku,
  setSku,
  quantity,
  setQuantity,
  handleAddToCart,
  className = '',
  ...props
}) {
  return (
    <Card 
      className={`flex-shrink-0 emphasized-card ${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex flex-col gap-1 shadow-xl">
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
      </div>
    </Card>
  );
}

export default SkuFormCard; 