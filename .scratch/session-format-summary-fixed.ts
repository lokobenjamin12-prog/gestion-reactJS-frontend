        return {
            id: session.id,
            status: session.status,
            commercial: {
                id: session.commercial.id,
                firstName: session.commercial.firstName,
                lastName: session.commercial.lastName,
                profilePicture: session.commercial.profilePicture,
            },
            manager: {
                id: session.manager.id,
                firstName: session.manager.firstName,
                lastName: session.manager.lastName,
                profilePicture: session.manager.profilePicture,
            },
