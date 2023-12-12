const { RoleModel } = require("../model/roleModel");
const { SessionModel } = require("../model/sessionModel");
const AdminConfig = require("../config/admin.json");

exports.verifyAdminToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      const session = await SessionModel.findOne({ accessToken }).populate("userId");

      if (session && session.userId && session.userId.status) {
        const role = await RoleModel.findById(session.userId.role_id);
        if (role.role === AdminConfig.roles.admin.role) {
          next();
        } else {
          return res.status(403).json({ error: "Fobidden Access" });
        }
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
  } catch (error) {
    console.log("error in admin auth middleware :>> ", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
