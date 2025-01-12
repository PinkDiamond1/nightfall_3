import gen from 'general-number';
import config from 'config';
import logger from 'common-files/utils/logger.mjs';
import { randValueLT } from 'common-files/utils/crypto/crypto-random.mjs';
import Nullifier from '../classes/nullifier.mjs';
import {
  clearPending,
  findUsableCommitmentsMutex,
  getSiblingInfo,
} from '../services/commitment-storage.mjs';
import Commitment from '../classes/commitment.mjs';
import { ZkpKeys } from '../services/keys.mjs';

const { GN, generalise } = gen;

const { BN128_GROUP_ORDER } = config;

// eslint-disable-next-line import/prefer-default-export
export const getCommitmentInfo = async txInfo => {
  const {
    totalValueToSend,
    fee = 0n,
    recipientZkpPublicKeysArray = [],
    ercAddress,
    maticAddress,
    tokenId = generalise(0),
    rootKey,
  } = txInfo;

  const { zkpPublicKey, compressedZkpPublicKey, nullifierKey } = new ZkpKeys(rootKey);

  const valuesArray = recipientZkpPublicKeysArray.map(() => totalValueToSend);

  const ercAddressArray = recipientZkpPublicKeysArray.map(() => ercAddress);

  const tokenIdArray = recipientZkpPublicKeysArray.map(() => tokenId);

  const addedFee =
    maticAddress.hex(32).toLowerCase() === ercAddress.hex(32).toLowerCase() ? fee.bigInt : 0n;

  logger.debug(`Fee will be added as part of the transaction commitments: ${addedFee > 0n}`);

  const value = totalValueToSend + addedFee;
  const feeValue = fee.bigInt - addedFee;

  const commitments = await findUsableCommitmentsMutex(
    compressedZkpPublicKey,
    ercAddress,
    tokenId,
    maticAddress,
    value,
    feeValue,
  );

  if (!commitments) throw new Error('Not available commitments has been found');

  const { oldCommitments, oldCommitmentsFee } = commitments;

  logger.debug(
    `Found commitments ${addedFee > 0n ? 'including fee' : ''} ${JSON.stringify(
      oldCommitments,
      null,
      2,
    )}`,
  );

  if (feeValue > 0n) {
    logger.debug(`Found commitments fee ${JSON.stringify(oldCommitmentsFee, null, 2)}`);
  }

  const spentCommitments = [...oldCommitments, ...oldCommitmentsFee];

  try {
    // Compute the nullifiers
    const nullifiers = spentCommitments.map(commitment => new Nullifier(commitment, nullifierKey));

    // then the new output commitment(s)
    const totalInputCommitmentValue = oldCommitments.reduce(
      (acc, commitment) => acc + commitment.preimage.value.bigInt,
      0n,
    );

    // we may need to return change to the recipient
    const change = totalInputCommitmentValue - value;

    // if so, add an output commitment to do that
    if (change !== 0n) {
      valuesArray.push(new GN(change));
      recipientZkpPublicKeysArray.push(zkpPublicKey);
      ercAddressArray.push(ercAddress);
      tokenIdArray.push(tokenId);
    }

    // then the new output commitment(s) fee
    const totalInputCommitmentFeeValue = oldCommitmentsFee.reduce(
      (acc, commitment) => acc + commitment.preimage.value.bigInt,
      0n,
    );

    // we may need to return change to the recipient
    const changeFee = totalInputCommitmentFeeValue - feeValue;

    // if so, add an output commitment to do that
    if (changeFee !== 0n) {
      valuesArray.push(new GN(changeFee));
      recipientZkpPublicKeysArray.push(zkpPublicKey);
      ercAddressArray.push(maticAddress);
      tokenIdArray.push(generalise(0));
    }

    const salts = await Promise.all(
      recipientZkpPublicKeysArray.map(async () => randValueLT(BN128_GROUP_ORDER)),
    );

    const newCommitments = recipientZkpPublicKeysArray.map(
      (recipientKey, i) =>
        new Commitment({
          ercAddress: ercAddressArray[i],
          tokenId: tokenIdArray[i],
          value: valuesArray[i],
          zkpPublicKey: recipientKey,
          salt: salts[i].bigInt,
        }),
    );

    // Commitment Tree Information
    const commitmentTreeInfo = await Promise.all(spentCommitments.map(c => getSiblingInfo(c)));
    const localSiblingPaths = commitmentTreeInfo.map(l => {
      const path = l.siblingPath.path.map(p => p.value);
      return generalise([l.root].concat(path.reverse()));
    });
    const leafIndices = commitmentTreeInfo.map(l => l.leafIndex);
    const blockNumberL2s = commitmentTreeInfo.map(l => l.isOnChain);
    const roots = commitmentTreeInfo.map(l => l.root);
    logger.info(
      `Constructing transaction with blockNumberL2s ${blockNumberL2s} and roots ${roots}`,
    );

    return {
      oldCommitments: spentCommitments,
      nullifiers,
      newCommitments,
      localSiblingPaths,
      leafIndices,
      blockNumberL2s,
      roots,
      salts,
    };
  } catch (err) {
    logger.error('Error', err);
    await Promise.all(spentCommitments.map(o => clearPending(o)));
    throw err;
  }
};
