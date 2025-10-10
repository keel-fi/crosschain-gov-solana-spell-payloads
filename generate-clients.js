const codama = require("codama");
const anchorIdl = require("@codama/nodes-from-anchor");
const path = require("path");
const jsRenderers = require("@codama/renderers-js");

const metaplexClientDir = path.join(
  __dirname,
  "src",
  "programs",
  "metaplex-token-metadata"
);
const metaplexIdl = require(path.join(metaplexClientDir, "idl.json"));

// MPL Token MetadataTS Client
const MetaplexCodama = codama.createFromRoot(
  anchorIdl.rootNodeFromAnchor(metaplexIdl)
);
MetaplexCodama.accept(
  jsRenderers.renderVisitor(path.join(metaplexClientDir, "generated"))
);
