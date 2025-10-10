import { web3 } from "@coral-xyz/anchor";
const MPL_TOKEN_METADATA_ADDRESS = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
// TODO verify correct disc
const UPGRADE_DISCRIMINATOR = 50;
export const getUpgradeInstruction = (
  programAddress: web3.PublicKey,
  programDataAccount: web3.PublicKey,
  bufferAccount: web3.PublicKey,
  authority: web3.PublicKey,
  spillAccount: web3.PublicKey
) => {
  const ix = new web3.TransactionInstruction({
    keys: [
      { pubkey: programDataAccount, isWritable: true, isSigner: false },
      { pubkey: programAddress, isWritable: true, isSigner: false },
      { pubkey: bufferAccount, isWritable: true, isSigner: false },
      { pubkey: spillAccount, isWritable: true, isSigner: false },
      { pubkey: web3.SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: authority, isWritable: false, isSigner: true },
    ],
    programId: MPL_TOKEN_METADATA_ADDRESS,
    data: Buffer.from([UPGRADE_DISCRIMINATOR, 0, 0, 0]),
  });

  return ix;
};

/// Update
// {
//   name: "authority",
//   isMut: false,
//   isSigner: true,
//   docs: ["Update authority or delegate"],
// },
// {
//   name: "delegateRecord",
//   isMut: false,
//   isSigner: false,
//   isOptional: true,
//   docs: ["Delegate record PDA"],
// },
// {
//   name: "token",
//   isMut: false,
//   isSigner: false,
//   isOptional: true,
//   docs: ["Token account"],
// },
// {
//   name: "mint",
//   isMut: false,
//   isSigner: false,
//   docs: ["Mint account"],
// },
// {
//   name: "metadata",
//   isMut: true,
//   isSigner: false,
//   docs: ["Metadata account"],
// },
// {
//   name: "edition",
//   isMut: false,
//   isSigner: false,
//   isOptional: true,
//   docs: ["Edition account"],
// },
// {
//   name: "payer",
//   isMut: true,
//   isSigner: true,
//   docs: ["Payer"],
// },
// {
//   name: "systemProgram",
//   isMut: false,
//   isSigner: false,
//   docs: ["System program"],
// },
// {
//   name: "sysvarInstructions",
//   isMut: false,
//   isSigner: false,
//   docs: ["Instructions sysvar account"],
// },
// {
//   name: "authorizationRulesProgram",
//   isMut: false,
//   isSigner: false,
//   isOptional: true,
//   docs: ["Token Authorization Rules Program"],
// },
// {
//   name: "authorizationRules",
//   isMut: false,
//   isSigner: false,
//   isOptional: true,
//   docs: ["Token Authorization Rules account"],
// },

//      {
//   name: "UpdateArgs",
//   type: {
//     kind: "enum",
//     variants: [
//       {
//         name: "V1",
//         fields: [
//           {
//             name: "new_update_authority",
//             type: {
//               option: "publicKey",
//             },
//           },
//           {
//             name: "data",
//             type: {
//               option: {
//                 defined: "Data",
//               },
//             },
//           },
//           {
//             name: "primary_sale_happened",
//             type: {
//               option: "bool",
//             },
//           },
//           {
//             name: "is_mutable",
//             type: {
//               option: "bool",
//             },
//           },
//           {
//             name: "collection",
//             type: {
//               defined: "CollectionToggle",
//             },
//           },
//           {
//             name: "collection_details",
//             type: {
//               defined: "CollectionDetailsToggle",
//             },
//           },
//           {
//             name: "uses",
//             type: {
//               defined: "UsesToggle",
//             },
//           },
//           {
//             name: "rule_set",
//             type: {
//               defined: "RuleSetToggle",
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsUpdateAuthorityV2",
//         fields: [
//           {
//             name: "new_update_authority",
//             type: {
//               option: "publicKey",
//             },
//           },
//           {
//             name: "data",
//             type: {
//               option: {
//                 defined: "Data",
//               },
//             },
//           },
//           {
//             name: "primary_sale_happened",
//             type: {
//               option: "bool",
//             },
//           },
//           {
//             name: "is_mutable",
//             type: {
//               option: "bool",
//             },
//           },
//           {
//             name: "collection",
//             type: {
//               defined: "CollectionToggle",
//             },
//           },
//           {
//             name: "collection_details",
//             type: {
//               defined: "CollectionDetailsToggle",
//             },
//           },
//           {
//             name: "uses",
//             type: {
//               defined: "UsesToggle",
//             },
//           },
//           {
//             name: "rule_set",
//             type: {
//               defined: "RuleSetToggle",
//             },
//           },
//           {
//             name: "token_standard",
//             type: {
//               option: {
//                 defined: "TokenStandard",
//               },
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsAuthorityItemDelegateV2",
//         fields: [
//           {
//             name: "new_update_authority",
//             type: {
//               option: "publicKey",
//             },
//           },
//           {
//             name: "primary_sale_happened",
//             type: {
//               option: "bool",
//             },
//           },
//           {
//             name: "is_mutable",
//             type: {
//               option: "bool",
//             },
//           },
//           {
//             name: "token_standard",
//             type: {
//               option: {
//                 defined: "TokenStandard",
//               },
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsCollectionDelegateV2",
//         fields: [
//           {
//             name: "collection",
//             type: {
//               defined: "CollectionToggle",
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsDataDelegateV2",
//         fields: [
//           {
//             name: "data",
//             type: {
//               option: {
//                 defined: "Data",
//               },
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsProgrammableConfigDelegateV2",
//         fields: [
//           {
//             name: "rule_set",
//             type: {
//               defined: "RuleSetToggle",
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsDataItemDelegateV2",
//         fields: [
//           {
//             name: "data",
//             type: {
//               option: {
//                 defined: "Data",
//               },
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsCollectionItemDelegateV2",
//         fields: [
//           {
//             name: "collection",
//             type: {
//               defined: "CollectionToggle",
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//       {
//         name: "AsProgrammableConfigItemDelegateV2",
//         fields: [
//           {
//             name: "rule_set",
//             type: {
//               defined: "RuleSetToggle",
//             },
//           },
//           {
//             name: "authorization_data",
//             type: {
//               option: {
//                 defined: "AuthorizationData",
//               },
//             },
//           },
//         ],
//       },
//     ],
//   },
// },
