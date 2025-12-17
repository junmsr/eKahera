# When to Use Each Product Unit Type

## Quick Decision Guide

### Use "Per Piece" when:
✅ **Selling individual items** (whole units)
✅ **Fixed size/weight per item**
✅ **Customer buys by count** (1, 2, 3 pieces)
✅ **Each item has a barcode/SKU**

### Use "By Weight" when:
✅ **Selling bulk items by weight**
✅ **Customer can buy any amount** (100g, 250g, 1kg, etc.)
✅ **Items are weighed at point of sale**
✅ **No fixed package size**

### Use "By Volume" when:
✅ **Selling liquids by volume**
✅ **Customer can buy any amount** (100mL, 500mL, 1L, etc.)
✅ **Items are measured at point of sale**
✅ **No fixed bottle/container size**

---

## Detailed Examples

### ✅ "Per Piece" - Examples

**Canned Goods:**
- Canned sardines (130g can) → "Per Piece" (selling whole can)
- Canned tuna (185g can) → "Per Piece" (selling whole can)
- Canned corned beef → "Per Piece" (selling whole can)

**Packaged Items:**
- Instant noodles (pack of 1) → "Per Piece"
- Chips (individual bag) → "Per Piece"
- Candy bar → "Per Piece"
- Bottled water (500mL bottle) → "Per Piece" (selling whole bottle)

**Why?** Customer buys 1 can, 2 cans, 3 cans - they're buying whole items.

---

### ✅ "By Weight" - Examples

**Bulk Grains:**
- Rice (sold by the kilo) → "By Weight"
  - Customer can buy: 1kg, 2.5kg, 5kg, etc.
  - You weigh it at checkout
  - Unit: 1kg (or 100g if you want more precision)

**Bulk Produce:**
- Sugar (sold by the kilo) → "By Weight"
  - Customer buys: 500g, 1kg, 2kg, etc.
  - You weigh it from bulk container
  - Unit: 1kg

**Meat/Fish:**
- Ground beef (sold by weight) → "By Weight"
  - Customer buys: 250g, 500g, 1kg, etc.
  - You weigh it at the counter
  - Unit: 1kg

**Loose Items:**
- Nuts (sold by weight) → "By Weight"
  - Customer buys: 100g, 200g, 500g, etc.
  - You weigh it from bulk bin
  - Unit: 100g or 1kg

**Why?** Customer can buy any amount - you measure/weigh it for them.

---

### ✅ "By Volume" - Examples

**Bulk Liquids:**
- Cooking oil (from bulk container) → "By Volume"
  - Customer buys: 250mL, 500mL, 1L, etc.
  - You measure it into their container
  - Unit: 1L

**Gasoline/Fuel:**
- Gasoline (pumped) → "By Volume"
  - Customer buys: 5L, 10L, 20L, etc.
  - Pump measures the volume
  - Unit: 1L

**Liquid Detergents:**
- Liquid soap (from bulk) → "By Volume"
  - Customer buys: 100mL, 250mL, 500mL, etc.
  - You measure it for them
  - Unit: 500mL or 1L

**Why?** Customer can buy any amount - you measure the volume for them.

---

## Common Confusion: When NOT to Use Each Type

### ❌ Don't Use "By Weight" for:

**Packaged Items:**
- ❌ Canned sardines → Use "Per Piece" (it's a whole can)
- ❌ Packaged rice (1kg bag) → Use "Per Piece" (selling whole bag)
- ❌ Bottled drinks → Use "Per Piece" (selling whole bottle)

**Why?** Even though they have weight, you're selling the whole package, not by weight.

### ❌ Don't Use "By Volume" for:

**Bottled/Canned Liquids:**
- ❌ Bottled water (500mL) → Use "Per Piece" (selling whole bottle)
- ❌ Canned juice → Use "Per Piece" (selling whole can)
- ❌ Packaged milk (1L carton) → Use "Per Piece" (selling whole carton)

**Why?** Even though they contain liquid, you're selling the whole container, not by volume.

### ❌ Don't Use "Per Piece" for:

**Bulk Items:**
- ❌ Loose rice from sack → Use "By Weight" (customer buys any amount)
- ❌ Bulk sugar → Use "By Weight" (customer buys any amount)
- ❌ Gasoline from pump → Use "By Volume" (customer buys any amount)

**Why?** Customer can buy any amount - you measure/weigh it for them.

---

## Real-World Scenarios

### Scenario 1: Rice

**Option A: Packaged Rice (1kg bag)**
- Type: **Per Piece**
- Name: "Rice 1kg"
- Stock: 50 bags
- Customer buys: 1 bag, 2 bags, etc.

**Option B: Bulk Rice (from sack)**
- Type: **By Weight**
- Name: "Rice (Bulk)"
- Unit Size: 1kg
- Stock: 100kg (stored as 100kg in database)
- Customer buys: 500g, 1kg, 2.5kg, etc. (you weigh it)

### Scenario 2: Cooking Oil

**Option A: Bottled Oil (500mL bottle)**
- Type: **Per Piece**
- Name: "Cooking Oil 500mL"
- Stock: 30 bottles
- Customer buys: 1 bottle, 2 bottles, etc.

**Option B: Bulk Oil (from container)**
- Type: **By Volume**
- Name: "Cooking Oil (Bulk)"
- Unit Size: 1L
- Stock: 50L (stored as 50L in database)
- Customer buys: 250mL, 500mL, 1L, etc. (you measure it)

### Scenario 3: Sardines

**Option A: Canned Sardines (130g can)**
- Type: **Per Piece**
- Name: "Canned Sardines 130g"
- Stock: 50 cans
- Customer buys: 1 can, 2 cans, etc.

**Option B: Fresh Sardines (from fish market)**
- Type: **By Weight**
- Name: "Fresh Sardines"
- Unit Size: 1kg
- Stock: 10kg (stored as 10kg in database)
- Customer buys: 250g, 500g, 1kg, etc. (you weigh it)

---

## Key Questions to Ask Yourself

1. **Does the customer buy whole items?**
   - Yes → Use "Per Piece"
   - No → Continue to question 2

2. **Do you measure/weigh it for the customer?**
   - Yes → Continue to question 3
   - No → Use "Per Piece"

3. **Is it a liquid?**
   - Yes → Use "By Volume"
   - No → Use "By Weight"

---

## Summary Table

| Product Type | Customer Buys | You Do | Example |
|-------------|---------------|--------|---------|
| **Per Piece** | Whole items (1, 2, 3...) | Scan/Sell as-is | Canned goods, bottled drinks, packaged snacks |
| **By Weight** | Any weight amount | Weigh it for them | Bulk rice, sugar, meat, produce |
| **By Volume** | Any volume amount | Measure it for them | Bulk oil, gasoline, liquid detergents |

---

## Remember:

- **"Per Piece"** = Selling whole items (even if they have weight/volume)
- **"By Weight"** = Selling bulk items where you weigh any amount
- **"By Volume"** = Selling liquids where you measure any amount

The key is: **Can the customer buy any amount, or do they buy whole items?**

