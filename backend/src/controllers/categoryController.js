const Category = require('../models/Category');

const getCategoriesByBusinessType = async (req, res) => {
    try {
        const { businessType } = req.query;
        if (!businessType) {
            return res.status(400).json({ message: 'Business type is required' });
        }
        const categories = await Category.findAll({
            where: { business_type: businessType }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCategoriesByBusinessType
};
