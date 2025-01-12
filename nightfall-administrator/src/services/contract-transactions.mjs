import config from 'config';
import { waitForContract, web3 } from '../../../common-files/utils/contract.mjs';
import logger from '../../../common-files/utils/logger.mjs';
import constants from '../../../common-files/constants/index.mjs';
import { addMultiSigSignature } from './helpers.mjs';

const { RESTRICTIONS } = config;
const { SHIELD_CONTRACT_NAME } = constants;
const pausables = ['State', 'Shield'];

/**
This function sets the restriction data that the Shield contract is currently using
*/
export async function setTokenRestrictions(
  tokenName,
  depositRestriction,
  withdrawRestriction,
  signingKey,
  executorAddress,
  nonce,
) {
  const shieldContractInstance = await waitForContract(SHIELD_CONTRACT_NAME);
  for (const token of RESTRICTIONS.tokens[process.env.ETH_NETWORK]) {
    if (token.name === tokenName) {
      const data = shieldContractInstance.methods
        .setRestriction(token.address, depositRestriction, withdrawRestriction)
        .encodeABI();
      return Promise.all([
        addMultiSigSignature(
          data,
          signingKey,
          shieldContractInstance.options.address,
          executorAddress,
          nonce,
        ),
      ]);
    }
  }
  return false;
}

export async function removeTokenRestrictions(tokenName, signingKey, executorAddress, nonce) {
  const shieldContractInstance = await waitForContract(SHIELD_CONTRACT_NAME);
  for (const token of RESTRICTIONS.tokens[process.env.ETH_NETWORK]) {
    if (token.name === tokenName) {
      const data = shieldContractInstance.methods.removeRestriction(token.address).encodeABI();
      return Promise.all([
        addMultiSigSignature(
          data,
          signingKey,
          shieldContractInstance.options.address,
          executorAddress,
          nonce,
        ),
      ]);
    }
  }
  return false;
}

export function pauseContracts(signingKey, executorAddress, nonce) {
  logger.info('All pausable contracts being paused');
  return Promise.all(
    pausables.map(async (pausable, i) => {
      const contractInstance = await waitForContract(pausable);
      const data = contractInstance.methods.pause().encodeABI();
      return addMultiSigSignature(
        data,
        signingKey,
        contractInstance.options.address,
        executorAddress,
        nonce + i,
      );
    }),
  );
}

export function unpauseContracts(signingKey, executorAddress, nonce) {
  logger.info('All pausable contracts being unpaused');
  return Promise.all(
    pausables.map(async (pausable, i) => {
      const contractInstance = await waitForContract(pausable);
      const data = contractInstance.methods.unpause().encodeABI();
      return addMultiSigSignature(
        data,
        signingKey,
        contractInstance.options.address,
        executorAddress,
        nonce + i,
      );
    }),
  );
}

export function transferOwnership(newOwnerPrivateKey, signingKey, executorAddress, nonce) {
  const newOwner = web3.eth.accounts.privateKeyToAccount(newOwnerPrivateKey, true).address;
  return Promise.all(
    pausables.map(async (pausable, i) => {
      const contractInstance = await waitForContract(pausable);
      const data = contractInstance.methods.transferOwnership(newOwner).encodeABI();
      return addMultiSigSignature(
        data,
        signingKey,
        contractInstance.options.address,
        executorAddress,
        nonce + i,
      );
    }),
  );
}

export async function setBootProposer(newProposerPrivateKey, signingKey, executorAddress, nonce) {
  const newProposer = web3.eth.accounts.privateKeyToAccount(newProposerPrivateKey, true).address;
  const shieldContractInstance = await waitForContract(SHIELD_CONTRACT_NAME);
  const data = shieldContractInstance.methods.setBootProposer(newProposer).encodeABI();
  return Promise.all([
    addMultiSigSignature(
      data,
      signingKey,
      shieldContractInstance.options.address,
      executorAddress,
      nonce,
    ),
  ]);
}

export async function setBootChallenger(
  newChallengerPrivateKey,
  signingKey,
  executorAddress,
  nonce,
) {
  const newChallenger = web3.eth.accounts.privateKeyToAccount(
    newChallengerPrivateKey,
    true,
  ).address;
  console.log('BOOT CHALLENGER', newChallenger);
  const shieldContractInstance = await waitForContract(SHIELD_CONTRACT_NAME);
  const data = shieldContractInstance.methods.setBootChallenger(newChallenger).encodeABI();
  return Promise.all([
    addMultiSigSignature(
      data,
      signingKey,
      shieldContractInstance.options.address,
      executorAddress,
      nonce,
    ),
  ]);
}
