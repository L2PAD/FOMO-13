require("dotenv").config();
const jwt = require("jsonwebtoken");
const S = process.env.JWT_SECRET_ACCESS;
const mk = (id, email, roles) =>
  jwt.sign({ _id: id, email, role: roles, isActive: true, is2FAEnabled: false, is2FAVerified: true }, S, { expiresIn: "2h" });
console.log(
  JSON.stringify({
    admin: mk("6a79fcdddac74dd8de81b1e4", "admin@fomo.local", ["admin"]),
    alice: mk("6a79fcddfab5fd10fac25d9f", "alice.fomie@fomo.local", ["user"]),
    bob: mk("6a79fcddfab5fd10fac25da0", "bob.fomie@fomo.local", ["user"]),
    walletuser: mk("6a7a04c90921ffa57f69455b", "wallet@fomo.local", ["user"]),
  }),
);
