const Role = require('../models/role')
const { isValidToCreate } = require('../validators/roleValidator')
const { Snowflake } = require("@theinternetfolks/snowflake");

exports.create = async (req, res) => {
    const { name } = req.body

    // Validate the request body
    const { error } = isValidToCreate.validate(req.body);
    if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
    }

    try {
        // Check if a role with the same name already exists
        const existingRole = await Role.findOne({ name });

        if (existingRole) {
            return res.status(400).json({ status: false, message: 'Role with the same name already exists' });
        }

        // Create a new role
        const role = new Role({
            id: Snowflake.generate(),
            name,
        });

        // Save the new role
        const savedRole = await role.save();

        // Prepare the response
        const response = {
            status: true,
            content: {
                data: {
                    id: savedRole.id,
                    name: savedRole.name,
                    created_at: savedRole.created_at,
                    updated_at: savedRole.updated_at,
                },
            },
        };

        return res.status(201).json(response);
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    try {
        // Fetch the total number of roles
        const totalRoles = await Role.countDocuments();
        const totalPages = Math.ceil(totalRoles / perPage);

        // Query roles with pagination
        const roles = await Role.find()
            .skip((page - 1) * perPage)
            .limit(perPage);

        // Prepare the response
        const response = {
            status: true,
            content: {
                meta: {
                    total: totalRoles,
                    pages: totalPages,
                    page: page,
                },
                data: roles.map(role => ({
                    id: role.id,
                    name: role.name,
                    created_at: role.created_at,
                    updated_at: role.updated_at,
                })),
            },
        };

        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}