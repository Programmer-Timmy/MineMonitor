
async function getMinecraftUUID(username) {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
}

module.exports = {
    getMinecraftUUID
}
