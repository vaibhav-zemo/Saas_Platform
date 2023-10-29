const Community = require('../models/community');
const Member = require('../models/member');

const { isValidToCreate } = require('../validators/memberValidator');
const { Snowflake } = require("@theinternetfolks/snowflake");

exports.create = async (req, res) => {
    const { error } = isValidToCreate.validate(req.body);

    if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
    }

    const { community, user, role } = req.body;

    try {
        // Verify if the user making the request is a Community Admin for the specified community
        const communityInfo = await Community.findOne({ id: community, owner: req.user.id });

        if (!communityInfo) {
            return res.status(403).json({ status: false, message: 'NOT_ALLOWED_ACCESS' });
        }

        // Create a new member
        const member = new Member({
            id: Snowflake.generate(),
            community,
            user,
            role,
        });

        // Save the new member
        const savedMember = await member.save();

        // Prepare the response
        const response = {
            status: true,
            content: {
                data: {
                    id: savedMember.id,
                    community: savedMember.community,
                    user: savedMember.user,
                    role: savedMember.role,
                    created_at: savedMember.created_at,
                },
            },
        };

        return res.status(201).json(response);
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

exports.remove = async (req, res) => {
    const memberId = req.params.id;

    try {
        // Fetch the member by ID
        const member = await Member.findById(memberId);

        if (!member) {
            return res.status(404).json({ status: false, message: 'Member not found' });
        }

        // populate community manually
        const community = await Community.findById(member.community);

        // Verify if the user making the request is a Community Admin
        if (req.user.id !== member.community.owner) {
            return res.status(403).json({ status: false, message: 'NOT_ALLOWED_ACCESS' });
        }

        // Remove the member
        await Member.findByIdAndRemove(memberId);

        return res.status(200).json({ status: true });
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
}