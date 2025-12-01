const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'config.env') });

const categories = [
    // Grocery Store
    { name: 'Fresh Produce', business_type: 'Grocery Store' },
    { name: 'Meat & Poultry', business_type: 'Grocery Store' },
    { name: 'Seafood', business_type: 'Grocery Store' },
    { name: 'Dairy & Eggs', business_type: 'Grocery Store' },
    { name: 'Bread & Bakery', business_type: 'Grocery Store' },
    { name: 'Snacks & Chips', business_type: 'Grocery Store' },
    { name: 'Beverages', business_type: 'Grocery Store' },
    { name: 'Canned & Packaged Goods', business_type: 'Grocery Store' },
    { name: 'Frozen Food', business_type: 'Grocery Store' },
    { name: 'Rice, Pasta & Grains', business_type: 'Grocery Store' },
    { name: 'Condiments & Spices', business_type: 'Grocery Store' },
    { name: 'Cleaning Supplies', business_type: 'Grocery Store' },
    { name: 'Household Essentials', business_type: 'Grocery Store' },
    { name: 'Baby Products', business_type: 'Grocery Store' },
    { name: 'Pet Supplies', business_type: 'Grocery Store' },

    // Pharmacy
    { name: 'Prescription Medicines', business_type: 'Pharmacy' },
    { name: 'OTC Medicines', business_type: 'Pharmacy' },
    { name: 'Vitamins & Supplements', business_type: 'Pharmacy' },
    { name: 'First Aid Supplies', business_type: 'Pharmacy' },
    { name: 'Medical Devices', business_type: 'Pharmacy' },
    { name: 'Personal Care', business_type: 'Pharmacy' },
    { name: 'Hygiene Products', business_type: 'Pharmacy' },
    { name: 'Beauty & Cosmetics', business_type: 'Pharmacy' },
    { name: 'Baby Care', business_type: 'Pharmacy' },
    { name: 'Adult Care', business_type: 'Pharmacy' },
    { name: 'PPE & Sanitizers', business_type: 'Pharmacy' },

    // Clothing Store
    { name: 'Men’s Clothing', business_type: 'Clothing Store' },
    { name: 'Women’s Clothing', business_type: 'Clothing Store' },
    { name: 'Kids’ Clothing', business_type: 'Clothing Store' },
    { name: 'Baby Clothing', business_type: 'Clothing Store' },
    { name: 'Footwear', business_type: 'Clothing Store' },
    { name: 'Bags & Accessories', business_type: 'Clothing Store' },
    { name: 'Underwear & Socks', business_type: 'Clothing Store' },

    // Electronics Store
    { name: 'Mobile Devices', business_type: 'Electronics Store' },
    { name: 'Computers & Laptops', business_type: 'Electronics Store' },
    { name: 'Computer Accessories', business_type: 'Electronics Store' },
    { name: 'Phone Accessories', business_type: 'Electronics Store' },
    { name: 'Audio Devices', business_type: 'Electronics Store' },
    { name: 'Cameras & Photography', business_type: 'Electronics Store' },
    { name: 'Home Appliances', business_type: 'Electronics Store' },
    { name: 'Personal Appliances', business_type: 'Electronics Store' },
    { name: 'Gaming Consoles & Accessories', business_type: 'Electronics Store' },
    { name: 'Cables, Adapters & Chargers', business_type: 'Electronics Store' },

    // Hardware Store
    { name: 'Hand Tools', business_type: 'Hardware Store' },
    { name: 'Power Tools', business_type: 'Hardware Store' },
    { name: 'Construction Materials', business_type: 'Hardware Store' },
    { name: 'Electrical Supplies', business_type: 'Hardware Store' },
    { name: 'Plumbing Supplies', business_type: 'Hardware Store' },
    { name: 'Paint & Painting Supplies', business_type: 'Hardware Store' },
    { name: 'Gardening Tools', business_type: 'Hardware Store' },
    { name: 'Fasteners (Nails, Screws, Bolts)', business_type: 'Hardware Store' },
    { name: 'Safety Gear', business_type: 'Hardware Store' },

    // Bookstore
    { name: 'Fiction Books', business_type: 'Bookstore' },
    { name: 'Non-Fiction Books', business_type: 'Bookstore' },
    { name: 'Educational Books', business_type: 'Bookstore' },
    { name: 'Children’s Books', business_type: 'Bookstore' },
    { name: 'Comics & Manga', business_type: 'Bookstore' },
    { name: 'School Supplies', business_type: 'Bookstore' },
    { name: 'Art Materials', business_type: 'Bookstore' },
    { name: 'Office Supplies', business_type: 'Bookstore' },
    { name: 'Stationery & Gifts', business_type: 'Bookstore' },

    // Convenience Store
    { name: 'Snacks', business_type: 'Convenience Store' },
    { name: 'Beverages', business_type: 'Convenience Store' },
    { name: 'Ready-to-Eat Food', business_type: 'Convenience Store' },
    { name: 'Instant Noodles / Cup Meals', business_type: 'Convenience Store' },
    { name: 'Frozen Food', business_type: 'Convenience Store' },
    { name: 'Basic Grocery Items', business_type: 'Convenience Store' },
    { name: 'Toiletries', business_type: 'Convenience Store' },
    { name: 'Basic OTC Medicines', business_type: 'Convenience Store' },
    { name: 'Household Essentials', business_type: 'Convenience Store' },
    { name: 'Phone Load', business_type: 'Convenience Store' },
    { name: 'Ice Cream & Desserts', business_type: 'Convenience Store' },
    { name: 'Tobacco & Lighters', business_type: 'Convenience Store' },

    // Others
    { name: 'General', business_type: 'Others' }
];

const seedCategories = async () => {
    const dbConfig = {
        connectionString: process.env.DATABASE_URL,
    };

    if (process.env.NODE_ENV === 'development') {
        dbConfig.ssl = {
            rejectUnauthorized: false
        };
    }

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to the database.');

        for (const category of categories) {
            const { name, business_type } = category;
            const res = await client.query('SELECT * FROM categories WHERE name = $1 AND business_type = $2', [name, business_type]);
            if (res.rows.length === 0) {
                await client.query('INSERT INTO categories (name, business_type, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())', [name, business_type]);
                console.log(`Inserted category: ${name} for ${business_type}`);
            } else {
                console.log(`Category already exists: ${name} for ${business_type}`);
            }
        }

        console.log('Finished seeding categories.');
    } catch (err) {
        console.error('Error seeding categories:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
};

seedCategories();
