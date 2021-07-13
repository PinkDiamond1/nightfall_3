import logger from './utils/logger.mjs';
import app from './app.mjs';
import {
  subscribeToBlockProposedEvent,
  blockProposedEventHandler,
  subscribeToNewCurrentProposer,
  newCurrentProposerEventHandler,
  subscribeToTransactionSubmitted,
  transactionSubmittedEventHandler,
  subscribeToBlockAssembledWebSocketConnection,
  subscribeToRollbackEventHandler,
  subscribeToChallengeWebSocketConnection,
  rollbackEventHandler,
  subscribeTocommittedToChallengeEventHandler,
  committedToChallengeEventHandler,
} from './event-handlers/index.mjs';
import Proposer from './classes/proposer.mjs';
import {
  conditionalMakeBlock,
  setBlockAssembledWebSocketConnection,
} from './services/block-assembler.mjs';
import { setChallengeWebSocketConnection } from './services/challenges.mjs';
import { initialBlockSync } from './services/state-sync.mjs';

const main = async ivk => {
  try {
    const proposer = new Proposer();
    // subscribe to WebSocket events first
    await subscribeToBlockAssembledWebSocketConnection(setBlockAssembledWebSocketConnection);
    await subscribeToChallengeWebSocketConnection(setChallengeWebSocketConnection);
    // try to sync any missing blockchain state
    // only then start making blocks and listening to new proposers
    initialBlockSync(proposer).then(() => {
      subscribeToNewCurrentProposer(newCurrentProposerEventHandler, proposer);
      conditionalMakeBlock(proposer);
    });
    // we do not wait for the initial block sync for these event handlers
    // as we want to still listen to incoming events (just not make blocks)
    // subscribe to blockchain events
    subscribeToBlockProposedEvent(blockProposedEventHandler, ivk);
    subscribeToTransactionSubmitted(transactionSubmittedEventHandler);
    subscribeToRollbackEventHandler(rollbackEventHandler);
    subscribeTocommittedToChallengeEventHandler(committedToChallengeEventHandler);
    app.listen(80);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

const args = process.argv.slice(2);

main(args[0]);
