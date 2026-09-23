function isPhotographerRole(member) {
  const roleText = `${member.assignRole || ""} ${member.role || ""}`.toLowerCase();
  return roleText.includes("photographer");
}

module.exports = { isPhotographerRole };