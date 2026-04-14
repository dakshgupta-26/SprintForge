"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wikiController_1 = require("../controllers/wikiController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.route('/').get(wikiController_1.getWikis).post(wikiController_1.createWiki);
router.route('/:id').get(wikiController_1.getWiki).put(wikiController_1.updateWiki).delete(wikiController_1.deleteWiki);
exports.default = router;
//# sourceMappingURL=wiki.js.map