const formatJoinDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const initProfilePanel = ({
    openButton,
    panel,
    panelBody,
    closeButton,
    profileImage,
    getProfile
}) => {
    const renderPanel = () => {
        const profile = getProfile();
        if (!profile) return;

        profileImage.src = profile.avatar;
        panelBody.innerHTML = `
            <div class="post-head">
                <img class="avatar" src="${profile.avatar}" alt="${profile.username} avatar" />
                <div>
                    <div class="username">${profile.username}</div>
                    <div class="timestamp">Joined ${formatJoinDate(profile.joinDate)}</div>
                </div>
            </div>
            <div class="profile-stats">
                <article class="profile-stat"><strong>${profile.postsCount || 0}</strong><p>Posts</p></article>
                <article class="profile-stat"><strong>${profile.answersCount || 0}</strong><p>Answers</p></article>
                <article class="profile-stat"><strong>${profile.upvotesReceived || 0}</strong><p>Upvotes</p></article>
            </div>`;
    };

    openButton.addEventListener("click", () => {
        renderPanel();
        panel.hidden = false;
    });

    closeButton.addEventListener("click", () => {
        panel.hidden = true;
    });

    panel.addEventListener("click", (event) => {
        if (event.target === panel) panel.hidden = true;
    });

    return { renderPanel };
};
