const Community = require('../models/community');
const Role = require('../models/role');
const Member = require('../models/member');
const User = require('../models/user');

const { isValidToCreate } = require('../validators/communityValidator');
const { Snowflake } = require("@theinternetfolks/snowflake");

exports.create = async (req, res) => {

    const { error } = isValidToCreate.validate(req.body);

    if (error) {
        return res.status(400).json({ status: false, error: error.details[0].message });
    }

    try {
        // Create a new community
        const newCommunity = new Community({
            id: Snowflake.generate(),
            name: req.body.name,
            slug: req.body.name.toLowerCase().replace(/\s+/g, '-'),
            owner: req.user.id,
        });

        // Save the community
        await newCommunity.save();

        // Create a role for Community Admin if it doesn't exist
        const communityAdminRole = await Role.findOne({ name: 'Community Admin' });
        if (!communityAdminRole) {
            const newRole = new Role({ id: Snowflake.generate(), name: 'Community Admin' });
            await newRole.save();
        }

        // Create a Member for the owner and assign the role of Community Admin
        const ownerMember = new Member({
            id: Snowflake.generate(),
            user: req.user.id,
            community: newCommunity.id,
            role: communityAdminRole.id,
        });

        await ownerMember.save();

        return res.status(201).json({
            status: true,
            content: {
                data: {
                    id: newCommunity.id,
                    name: newCommunity.name,
                    slug: newCommunity.slug,
                    owner: newCommunity.owner,
                    created_at: newCommunity.created_at,
                    updated_at: newCommunity.updated_at,
                },
            },
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

exports.getAll = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    try {
        const totalCommunities = await Community.countDocuments();
        const totalPages = Math.ceil(totalCommunities / perPage);

        const communities = await Community.find()
            .skip((page - 1) * perPage)
            .limit(perPage);

        // Manually populate the owner field with user's id and name
        const populatedCommunities = await Promise.all(
            communities.map(async (community) => {
                const user = await User.findOne({ id: community.owner }, 'id name');
                return {
                    id: community.id,
                    name: community.name,
                    slug: community.slug,
                    owner: {
                        id: user.id,
                        name: user.name,
                    },
                    created_at: community.created_at,
                    updated_at: community.updated_at,
                };
            })
        );

        return res.status(200).json({
            status: true,
            content: {
                meta: {
                    total: totalCommunities,
                    pages: totalPages,
                    page: page,
                },
                data: populatedCommunities,
            },
        });
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

exports.getAllMembers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    try {
        // Fetch the total number of community members
        const totalMembers = await Member.countDocuments({ community: req.params.id });
        const totalPages = Math.ceil(totalMembers / perPage);

        // Query the members of the specified community
        const members = await Member.find({ community: req.params.id })
            .skip((page - 1) * perPage)
            .limit(perPage);

        // Manually populate the owner field with user's id and name
        const populatedMembers = await Promise.all(
            members.map(async (member) => {
                const user = await User.findOne({ id: member.user }, 'id name');
                const role = await Role.findOne({ id: member.role }, 'id name');
                return {
                    id: member.id,
                    community: member.community,
                    user: {
                        id: user.id,
                        name: user.name,
                    },
                    role: {
                        id: role.id,
                        name: role.name,
                    },
                    created_at: member.created_at,
                };
            })
        );

        // Prepare the response
        const response = {
            status: true,
            content: {
                meta: {
                    total: totalMembers,
                    pages: totalPages,
                    page: page,
                },
                data: populatedMembers,
            },
        };

        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

exports.getMyOwnedCommunities = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    try {
        // Fetch the total number of communities owned by the currently signed-in user
        const totalCommunities = await Community.countDocuments({ owner: req.user.id });
        const totalPages = Math.ceil(totalCommunities / perPage);

        // Query the communities owned by the user
        const communities = await Community.find({ owner: req.user.id })
            .skip((page - 1) * perPage)
            .limit(perPage);

        // Prepare the response
        const response = {
            status: true,
            content: {
                meta: {
                    total: totalCommunities,
                    pages: totalPages,
                    page: page,
                },
                data: communities.map(community => ({
                    id: community.id,
                    name: community.name,
                    slug: community.slug,
                    owner: community.owner,
                    created_at: community.created_at,
                    updated_at: community.updated_at,
                })),
            },
        };

        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

exports.getMyCommunities = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    try {
        const totalCommunities = await Member.countDocuments({ user: req.user.id });
        const totalPages = Math.ceil(totalCommunities / perPage);

        // Query the communities where the user is a member
        const members = await Member.find({ user: req.user.id })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const communities = await Community.find({ id: { $in: members.map(member => member.community) } })

        // Manually populate the owner field with user's id and name
        const populatedCommunities = await Promise.all(
            communities.map(async (community) => {
                const user = await User.findOne({ id: community.owner }, 'id name');
                return {
                    id: community.id,
                    name: community.name,
                    slug: community.slug,
                    owner: {
                        id: user.id,
                        name: user.name,
                    },
                    created_at: community.created_at,
                    updated_at: community.updated_at,
                };
            })
        );

        const response = {
            status: true,
            content: {
                meta: {
                    total: totalCommunities,
                    pages: totalPages,
                    page: page,
                },
                data: populatedCommunities,
            },
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}