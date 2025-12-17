# Handling Bundle Products

## Quick Answer: Use "Per Piece" for Bundles

Bundles are still sold **"Per Piece"** because:
- ✅ Customer buys whole bundles (1 bundle, 2 bundles, etc.)
- ✅ Each bundle is a fixed unit
- ✅ You're selling the bundle as one item, not individual items from it

---

## Examples of Bundle Products

### Example 1: 6-Pack of Soda
- **Name**: "Coca-Cola 6-Pack" or "Coca-Cola (6-Pack)"
- **Product Sold By**: **Per Piece**
- **Quantity**: `20` (20 bundles = 120 individual cans)
- **Description**: "6-pack of 330mL cans" (optional, for reference)
- **Stock**: 20 bundles

**How it works:**
- Customer buys: 1 bundle, 2 bundles, etc.
- Each bundle contains 6 cans
- You track bundles, not individual cans
- When you sell 1 bundle, inventory decreases by 1 bundle

---

### Example 2: Bundle of 10 Pens
- **Name**: "Ballpoint Pen Bundle (10 pcs)"
- **Product Sold By**: **Per Piece**
- **Quantity**: `15` (15 bundles = 150 individual pens)
- **Description**: "Bundle of 10 pens" (optional)
- **Stock**: 15 bundles

**How it works:**
- Customer buys: 1 bundle, 2 bundles, etc.
- Each bundle contains 10 pens
- You track bundles, not individual pens

---

### Example 3: 3-Pack Instant Noodles
- **Name**: "Lucky Me Pancit Canton 3-Pack"
- **Product Sold By**: **Per Piece**
- **Quantity**: `50` (50 bundles = 150 individual packs)
- **Stock**: 50 bundles

---

## Important Considerations

### 1. **Naming Convention**
Include bundle information in the product name:
- ✅ "Coca-Cola 6-Pack"
- ✅ "Pen Bundle (10 pcs)"
- ✅ "Soap 3-Pack"
- ❌ "Coca-Cola" (unclear if it's a single can or bundle)

### 2. **Pricing**
Set the price for the **entire bundle**:
- Bundle of 6 sodas: ₱150 (not ₱25 per can)
- Bundle of 10 pens: ₱50 (not ₱5 per pen)

### 3. **Inventory Tracking**
You track **bundles**, not individual items:
- If you have 20 bundles of 6 sodas = 20 bundles in inventory
- When you sell 1 bundle, inventory becomes 19 bundles
- You don't track that you have 120 individual cans

### 4. **Description Field (Optional)**
Use the description to note bundle contents:
- "Bundle of 6 cans (330mL each)"
- "Contains 10 pens"
- "3-pack instant noodles"

---

## When to Create Separate Products

### Scenario: You sell both individual items AND bundles

**Example: Soda**
- You sell individual cans AND 6-packs

**Solution: Create 2 separate products**

**Product 1: Individual Can**
- Name: "Coca-Cola 330mL"
- Sold By: Per Piece
- Stock: 100 cans
- Price: ₱25

**Product 2: 6-Pack Bundle**
- Name: "Coca-Cola 6-Pack"
- Sold By: Per Piece
- Stock: 20 bundles
- Price: ₱150 (usually cheaper per unit)

**Why separate?**
- Different SKUs/barcodes
- Different prices
- Different inventory counts
- Customer can choose: buy 1 can or 1 bundle

---

## Bundle vs Individual Items - Decision Guide

### Sell as Bundle if:
- ✅ You only sell in bundles (not individual items)
- ✅ Bundles have their own barcode/SKU
- ✅ Bundles are priced as a unit
- ✅ You receive inventory in bundles

### Create Separate Products if:
- ✅ You sell both individual items AND bundles
- ✅ They have different SKUs/barcodes
- ✅ They have different prices
- ✅ You need to track them separately

---

## Real-World Examples

### ✅ Bundle Product (Only sold as bundle)
```
Product: "Instant Noodles 3-Pack"
- Sold By: Per Piece
- Stock: 50 bundles
- Price: ₱45 (for the bundle)
- Description: "3-pack of instant noodles"
```

### ✅ Individual + Bundle (Separate products)
```
Product 1: "Instant Noodles (Single)"
- Sold By: Per Piece
- Stock: 200 individual packs
- Price: ₱18

Product 2: "Instant Noodles 3-Pack"
- Sold By: Per Piece
- Stock: 30 bundles
- Price: ₱45 (cheaper per unit)
```

---

## Special Case: Weight/Volume Bundles

### Example: Bundle of 5 Soap Bars (Each 100g)
- **Name**: "Soap Bundle (5 pcs)"
- **Product Sold By**: **Per Piece** (still!)
- **Stock**: 20 bundles
- **Why?** You're selling the bundle as one unit, not by weight

**NOT:**
- ❌ "By Weight" with 500g (5 × 100g)
- ❌ This would imply you sell soap by weight, not as bundles

---

## Summary

| Scenario | Product Type | Example |
|----------|-------------|---------|
| **Bundle only** | Per Piece | 6-pack soda, 10-pen bundle |
| **Individual only** | Per Piece | Single can, single pen |
| **Both individual & bundle** | Create 2 products (both Per Piece) | Single can + 6-pack |
| **Bundle with weight/volume** | Still Per Piece | 5-pack soap (even if each is 100g) |

---

## Key Takeaway

**Bundles = Per Piece**

Even though a bundle contains multiple items, you're selling the **bundle as one piece**. The customer buys whole bundles, not individual items from the bundle.

