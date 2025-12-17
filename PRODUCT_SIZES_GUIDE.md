# Managing Products with Different Sizes - Best Practices

## Scenario: Canned Sardines - Different Sizes

You have:
- **Small can**: 130g sardines
- **Large can**: 350g sardines
- Both sold **Per Piece** (as individual cans)

## Solution: Create Separate Products

Even though they have the same name, they are **different products** because:
- Different sizes
- Different prices (usually)
- Different inventory counts
- Different SKUs (barcodes)

## How to Add Them:

### Product 1: Canned Sardines (Small)
- **SKU Code**: `SARDINES-130G` (or use the actual barcode)
- **Name**: `Canned Sardines 130g` or `Canned Sardines (Small)`
- **Product Sold By**: `Per Piece`
- **Quantity**: `50` (number of cans)
- **Cost Price**: `15.00`
- **Selling Price**: `25.00`

### Product 2: Canned Sardines (Large)
- **SKU Code**: `SARDINES-350G` (or use the actual barcode)
- **Name**: `Canned Sardines 350g` or `Canned Sardines (Large)`
- **Product Sold By**: `Per Piece`
- **Quantity**: `30` (number of cans)
- **Cost Price**: `30.00`
- **Selling Price**: `45.00`

## Important Notes:

1. **Both are "Per Piece"** - You're selling whole cans, not by weight
2. **Different SKUs** - Each size should have a unique SKU/barcode
3. **Descriptive Names** - Include the size in the product name for clarity
4. **Separate Inventory** - Each size is tracked separately

## When to Use "By Weight" vs "Per Piece":

### Use "Per Piece" when:
- ✅ Selling whole items (cans, bottles, packages)
- ✅ Each item has a fixed weight/size
- ✅ Customer buys by count (1 can, 2 cans, etc.)
- ✅ Examples: Canned goods, bottled drinks, packaged snacks

### Use "By Weight" when:
- ✅ Selling bulk items by weight
- ✅ Customer can buy any amount (100g, 250g, 1kg, etc.)
- ✅ Items are weighed at point of sale
- ✅ Examples: Loose rice, sugar, flour, meat

### Use "By Volume" when:
- ✅ Selling liquids by volume
- ✅ Customer can buy any amount (100mL, 500mL, 1L, etc.)
- ✅ Examples: Cooking oil from bulk container, gasoline

## Example: Your Canned Sardines

**Correct Setup:**
```
Product 1:
- Name: "Canned Sardines 130g"
- SKU: "4801234567890" (actual barcode)
- Sold By: Per Piece
- Stock: 50 cans

Product 2:
- Name: "Canned Sardines 350g"  
- SKU: "4801234567891" (different barcode)
- Sold By: Per Piece
- Stock: 30 cans
```

**Incorrect Setup:**
```
❌ Don't create one product "Canned Sardines" with "By Weight"
   - This would be for bulk sardines sold by weight
   - Not for individual cans
```

## Display in Inventory:

After adding both products, your inventory will show:

| Product Name | Unit | Stock |
|-------------|------|-------|
| Canned Sardines 130g | Per Piece<br>130 g | 50 pcs |
| Canned Sardines 350g | Per Piece<br>350 g | 30 pcs |

The "Unit" column shows:
- **Per Piece** (how it's sold)
- **130 g** or **350 g** (the size/weight of each piece)

This makes it clear they're the same product type but different sizes!

