const { Customer } = require('../../../database/models');
const { Op } = require('sequelize');

const listCustomers = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { search = '' } = req.query;
        const customers = await Customer.findAll({
            where: {
                shop_id,
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { phone: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                    { address: { [Op.iLike]: `%${search}%` } }
                ]
            },
            order: [['name', 'ASC']]
        });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { name, phone, email, address } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const customer = await Customer.create({ shop_id, name, phone, email, address });
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const shop_id = req.user.shop_id;
        const { name, phone, email, address } = req.body;
        const customer = await Customer.findOne({ where: { id, shop_id } });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        await customer.update({ name, phone, email, address });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const shop_id = req.user.shop_id;
        const customer = await Customer.findOne({ where: { id, shop_id } });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        await customer.destroy();
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};

module.exports = { listCustomers, createCustomer, updateCustomer, deleteCustomer };
