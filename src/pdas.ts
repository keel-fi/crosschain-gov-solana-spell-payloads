// We need to redefine our pda functions here because the original ones use the deprecated @keel-fi/svm-alm-controller package.
// The @keel-fi/svm-alm-controller package uses an old program id to derive PDAs.

import {
  Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";

export const deriveControllerAuthorityPda = async (
  controller: Address<string>,
  controllerProgramId: Address<string>
) => {
  const addressEncoder = getAddressEncoder();
  const controllerSeed = addressEncoder.encode(controller);
  const [controllerAuthority] = await getProgramDerivedAddress({
    programAddress: controllerProgramId,
    seeds: [Buffer.from("controller_authority"), controllerSeed],
  });
  return controllerAuthority;
};

export const derivePermissionPda = async (
  controller: Address<string>,
  authority: Address<string>,
  controllerProgramId: Address<string>
) => {
  const addressEncoder = getAddressEncoder();
  const controllerSeed = addressEncoder.encode(controller);
  const authoritySeed = addressEncoder.encode(authority);
  const [permissionPda] = await getProgramDerivedAddress({
    programAddress: controllerProgramId,
    seeds: [Buffer.from("permission"), controllerSeed, authoritySeed],
  });
  return permissionPda;
};
