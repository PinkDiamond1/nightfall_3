/**
A nullifier class
*/
import gen from 'general-number';
import sha256 from '../utils/crypto/sha256.mjs';

const { generalise } = gen;

class Nullifier {
  preimage;

  hash;

  constructor(commitment, nsk) {
    this.preimage = generalise({
      nsk,
      commitment: commitment.hash,
    });
    this.hash = sha256([this.preimage.nsk, this.preimage.commitment]);
  }
}

export default Nullifier;
